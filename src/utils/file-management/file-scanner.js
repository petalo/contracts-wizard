/**
 * @file File System Scanner and Management
 *
 * Provides utilities for scanning and managing files in the system:
 * - Directory traversal and file discovery
 * - File pattern matching and filtering
 * - Path resolution and validation
 * - File metadata collection
 *
 * Functions:
 * - scanDirectory: Scans directory for matching files
 * - filterFiles: Filters files by pattern or criteria
 * - validatePath: Validates file path existence
 *
 * Constants:
 * - DEFAULT_PATTERNS: Default file patterns
 * - IGNORE_PATTERNS: Patterns to ignore
 *
 * Flow:
 * 1. Validate input directory
 * 2. Traverse directory structure
 * 3. Apply file filters
 * 4. Collect file metadata
 * 5. Return filtered results
 *
 * Error Handling:
 * - Invalid directory paths
 * - Permission issues
 * - Pattern matching errors
 * - File access failures
 *
 * @module @/utils/file-management/file-scanner
 * @requires fs - File system operations
 * @requires path - Path manipulation
 * @requires glob - Pattern matching
 * @requires @/utils/common/errors - Error handling
 * @exports scanDirectory - Directory scanning function
 * @exports filterFiles - File filtering function
 * @exports validatePath - Path validation function
 *
 * @example
 * // Scan directory for markdown files
 * const { scanDirectory } = require('@/utils/file-management/file-scanner');
 *
 * const files = await scanDirectory('templates', '*.md');
 * console.log('Found files:', files);
 */

const fs = require('fs').promises;
const path = require('path');
const { logger } = require('@/utils/common/logger');
const { FILE_EXTENSIONS } = require('@/config/file-extensions');
const { AppError } = require('@/utils/common/errors');
const { TYPE_TO_PATH_MAP } = require('@/config/paths');

/**
 * Lists files in directory with extension filtering
 *
 * Scans directory contents through:
 * 1. Directory Access
 *    - Verify directory exists
 *    - Check read permissions
 *    - Handle access errors
 *
 * 2. Content Enumeration
 *    - Read directory entries
 *    - Filter by file type
 *    - Handle read errors
 *
 * 3. Extension Filtering
 *    - Match file extensions
 *    - Handle pattern matching
 *    - Skip non-matching files
 *
 * 4. Path Processing
 *    - Convert to relative paths
 *    - Normalize separators
 *    - Format output paths
 *
 * @async
 * @param {string} dirPath - Target directory path
 * @param {string[]} extensions - File extensions to include
 * @param {boolean} [recursive=true] - Enable recursive scanning
 * @returns {Promise<string[]>} Matching file paths
 * @throws {AppError} On access or read failures
 *
 * @example
 * // List markdown files recursively
 * const mdFiles = await listFilesInPath(
 *   './docs',
 *   ['.md', '.markdown'],
 *   true
 * );
 *
 * // List CSS files in current directory only
 * const cssFiles = await listFilesInPath(
 *   './styles',
 *   ['.css'],
 *   false
 * );
 *
 * // List all files recursively
 * const allFiles = await listFilesInPath(
 *   './project',
 *   [],
 *   true
 * );
 */
async function listFilesInPath(dirPath, extensions = [], recursive = true) {
  try {
    logger.debug('Scanning directory', {
      dirPath,
      extensions,
      recursive,
    });

    // Make sure the path is absolute
    const absoluteDirPath = path.resolve(dirPath);

    // Use scanFiles for recursive search if enabled
    if (recursive) {
      const results = await scanFiles(absoluteDirPath, extensions, true);
      logger.debug('Recursive scan complete', {
        dirPath: absoluteDirPath,
        matchCount: results.length,
        paths: results,
      });
      return results;
    }

    // Non-recursive search for backward compatibility
    const files = await fs.readdir(absoluteDirPath);
    const matchingFiles = files
      .filter((file) => {
        if (extensions.length === 0) return true;
        return extensions.some((ext) => file.endsWith(ext));
      })
      .map((file) => path.join(absoluteDirPath, file));

    logger.debug('Directory scan complete', {
      dirPath: absoluteDirPath,
      matchCount: matchingFiles.length,
      extensions,
      recursive,
      paths: matchingFiles,
    });

    return matchingFiles;
  } catch (error) {
    logger.error('File scan failed', {
      error,
      dirPath,
      recursive,
    });
    throw new AppError('Failed to scan directory', 'FILE_SCAN_ERROR', {
      directory: dirPath,
      extensions,
      recursive,
      originalError: error,
    });
  }
}

/**
 * Lists files by configured type and location
 *
 * Retrieves files through:
 * 1. Type validation
 * 2. Path resolution
 * 3. Extension mapping
 * 4. Directory scanning
 *
 * @async
 * @param {string} type - File type to list
 * @param {boolean} [recursive=true] - Enable recursive scanning
 * @returns {Promise<string[]>} Matching file paths
 * @throws {AppError} On invalid type or scan failure
 *
 * @example
 * try {
 *   // List markdown templates recursively
 *   const templates = await listFiles('markdown');
 *   console.log('Templates:', templates);
 *
 *   // List CSS files non-recursively
 *   const styles = await listFiles('css', false);
 *   console.log('Styles:', styles);
 * } catch (error) {
 *   console.error('Listing failed:', error);
 * }
 */
async function listFiles(type, recursive = true) {
  try {
    // Validate type parameter
    if (!type) {
      throw new AppError('File type is required', 'INVALID_FILE_TYPE');
    }

    // Get configured path for type
    const targetPath = TYPE_TO_PATH_MAP[type];
    if (!targetPath) {
      throw new AppError(`Invalid file type: ${type}`, 'INVALID_FILE_TYPE');
    }

    // Get extensions for type
    const extensions = FILE_EXTENSIONS[type] || [];
    logger.debug('Listing files', {
      type,
      path: targetPath,
      extensions,
      recursive,
    });

    // Scan directory with type extensions
    const files = await listFilesInPath(targetPath, extensions, recursive);

    // Remove the root directory from paths while preserving root files
    const cleanedFiles = files
      .map((file) => {
        // Get the relative path from the target directory
        const relativePath = path.relative(path.basename(targetPath), file);
        // If the path starts with "..", it means it's a root file
        return relativePath.startsWith('..') ? file : relativePath;
      })
      .map((file) => {
        // Remove the root directory name if present
        const parts = file.split(path.sep);
        return parts[0] === path.basename(targetPath)
          ? parts.slice(1).join(path.sep)
          : file;
      });

    logger.debug('File listing complete', {
      type,
      count: cleanedFiles.length,
      path: targetPath,
      recursive,
      originalPaths: files,
      cleanedPaths: cleanedFiles,
    });

    return cleanedFiles;
  } catch (error) {
    logger.error('File listing failed', {
      error,
      type,
      recursive,
    });
    throw new AppError('Failed to list files', 'LIST_ERROR', {
      type,
      recursive,
      originalError: error,
    });
  }
}

/**
 * Recursively scans directories with pattern matching
 *
 * Traverses directory tree through:
 * 1. Path validation
 * 2. Content enumeration
 * 3. Pattern matching
 * 4. Recursive traversal
 * 5. Result aggregation
 *
 * @async
 * @param {string} dirPath - Starting directory path
 * @param {string|string[]} pattern - File patterns to match
 * @param {boolean} [recursive=true] - Enable recursive scan
 * @returns {Promise<string[]>} Matching file paths
 * @throws {AppError} On scan or pattern failures
 *
 * @example
 * try {
 *   // Scan for PDFs recursively
 *   const pdfs = await scanFiles('./docs', FILE_EXTENSIONS.output.pdf);
 *   console.log('Found PDFs:', pdfs);
 *
 *   // Scan for multiple types non-recursively
 *   const docs = await scanFiles('./data', ['.doc', '.docx'], false);
 *   console.log('Found documents:', docs);
 * } catch (error) {
 *   console.error('Scan failed:', error);
 * }
 */
async function scanFiles(dirPath, pattern, recursive = true) {
  try {
    // Make sure the path is absolute
    const absoluteDirPath = path.resolve(dirPath);

    // Validate directory exists
    const stats = await fs.stat(absoluteDirPath);
    if (!stats.isDirectory()) {
      throw new AppError('Path is not a directory', 'INVALID_PATH', {
        dirPath: absoluteDirPath,
      });
    }

    // Read directory contents
    const entries = await fs.readdir(absoluteDirPath, { withFileTypes: true });
    let results = [];

    // Process each entry
    for (const entry of entries) {
      const fullPath = path.join(absoluteDirPath, entry.name);

      if (entry.isDirectory() && recursive) {
        // Recursively scan subdirectories
        const subResults = await scanFiles(fullPath, pattern, recursive);
        results = results.concat(subResults);
      } else if (entry.isFile()) {
        // Check if file matches pattern
        const patterns = Array.isArray(pattern) ? pattern : [pattern];
        if (
          patterns.some((p) => {
            if (typeof p === 'string') {
              return entry.name.endsWith(p);
            }
            return p.test(entry.name);
          })
        ) {
          results.push(fullPath);
        }
      }
    }

    logger.debug('Directory scan complete', {
      dirPath: absoluteDirPath,
      matchCount: results.length,
      recursive,
      paths: results,
    });

    return results;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    logger.error('Directory scan failed', {
      error,
      dirPath,
      pattern,
      recursive,
    });

    throw new AppError('Failed to scan directory', 'SCAN_ERROR', {
      directory: dirPath,
      pattern,
      recursive,
      originalError: error,
    });
  }
}

module.exports = {
  listFiles,
  listFilesInPath,
  scanFiles,
};
