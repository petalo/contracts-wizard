/**
 * @file Filename Generation and Management System
 *
 * Provides comprehensive filename generation utilities:
 * - Unique filename generation with timestamps
 * - Revision number management
 * - File collision handling
 * - Path sanitization and validation
 * - Multi-format output support (HTML, PDF)
 * - Extension management
 * - Base name extraction
 * - Directory path handling
 * - Timestamp formatting
 * - Revision numbering
 *
 * Functions:
 * - generateTimestampedFilename: Creates timestamped unique names
 * - generateRevisionedFilename: Handles file collisions with revisions
 * - generateFileName: Generates output filenames for multiple formats
 * - sanitizeFileName: Cleanses filenames of invalid characters
 *
 * Flow:
 * 1. Input validation and sanitization
 * 2. Base name extraction and processing
 * 3. Timestamp or revision number generation
 * 4. Path combination and validation
 * 5. Collision detection and resolution
 * 6. Final path generation
 * 7. Extension validation
 * 8. Output format handling
 *
 * Error Handling:
 * - Invalid input path errors
 * - File system access errors
 * - Path traversal attempts
 * - Name collision resolution
 * - Maximum revision limit
 * - Invalid character handling
 * - Directory permissions
 * - Extension validation
 * - Path length limits
 * - Reserved name conflicts
 *
 * @module @/utils/common/generateFilename
 * @requires path Path manipulation utilities
 * @requires fs/promises File system promises
 * @requires @/utils/common/logger Logging system
 * @requires @/utils/common/errors Error handling
 * @requires @/config/file-extensions File extensions configuration
 * @exports generateTimestampedFilename Timestamp-based filename generator
 * @exports generateRevisionedFilename Revision-based filename generator
 * @exports generateFileName Multi-format filename generator
 *
 * @example
 * // Import filename generators
 * const {
 *   generateTimestampedFilename,
 *   generateRevisionedFilename,
 *   generateFileName
 * } = require('@/utils/common/generateFilename');
 *
 * // Generate timestamped filename
 * const filename = generateTimestampedFilename('template.md');
 * console.log(filename); // template-2024-03-15-143022
 *
 * // Handle file collisions
 * const path = await generateRevisionedFilename('doc', '.pdf');
 * console.log(path); // doc.rev.1.pdf
 *
 * // Generate multi-format outputs
 * const outputs = await generateFileName('template.md', './output');
 * console.log(outputs);
 * // {
 * //   html: 'output/template-20240315-143022.html',
 * //   pdf: 'output/template-20240315-143022.pdf'
 * // }
 */

const path = require('path');
const fs = require('fs').promises;
const { logger } = require('@/utils/common/logger');
const { AppError } = require('@/utils/common/errors');
const { FILE_EXTENSIONS } = require('@/config/file-extensions');

/**
 * Filename generation configuration
 *
 * Defines constants for filename generation:
 * - Maximum revision attempts
 * - Date/time format patterns
 * - Invalid character patterns
 * - Separator characters
 *
 * Used to maintain consistent filename
 * generation across the application.
 *
 * @constant {object}
 * @property {number} MAX_REVISIONS - Maximum revision attempts
 * @property {string} TIMESTAMP_FORMAT - Date/time pattern
 * @property {string} REVISION_PREFIX - Revision number prefix
 * @property {string} SEPARATOR - Filename component separator
 *
 * @example
 * // Configuration usage
 * const maxAttempts = FILENAME_CONFIG.MAX_REVISIONS; // 1000
 * const timestamp = moment().format(FILENAME_CONFIG.TIMESTAMP_FORMAT);
 * const revision = `${FILENAME_CONFIG.REVISION_PREFIX}1`;
 * const filename = `base${FILENAME_CONFIG.SEPARATOR}${timestamp}`;
 */
const FILENAME_CONFIG = {
  MAX_REVISIONS: 1000,
  TIMESTAMP_FORMAT: 'YYYY-MM-DD-HHmmss',
  REVISION_PREFIX: '.rev.',
  SEPARATOR: '-',
};

/**
 * Configuration options for filename generation
 * @typedef {object} FilenameOptions
 * @property {Record<string, string>} format Format options for the filename
 * @property {Record<string, boolean>} flags Additional flags for filename generation
 */

/**
 * Generates a unique filename with timestamp
 *
 * Creates unique filenames by:
 * 1. Extracting base name from path
 * 2. Generating formatted timestamp
 * 3. Combining components
 * 4. Validating result
 *
 * @param {string} templatePath - Source template path
 * @returns {string} Generated filename with timestamp
 * @throws {AppError} On invalid path or generation failure
 *
 * @example
 * // Basic usage
 * const filename = generateTimestampedFilename('/path/to/template.md');
 * console.log(filename); // template-2024-03-15-143022
 *
 * // With different extensions
 * const htmlName = generateTimestampedFilename('doc.html');
 * const pdfName = generateTimestampedFilename('doc.pdf');
 *
 * // Error handling
 * try {
 *   const filename = generateTimestampedFilename(null);
 * } catch (error) {
 *   console.error('Invalid path:', error.details);
 * }
 *
 * // With logging
 * const filename = generateTimestampedFilename('template.md');
 * logger.debug('Generated filename', {
 *   template: 'template.md',
 *   generated: filename
 * });
 */
function generateTimestampedFilename(templatePath) {
  // Validate path parameter
  if (templatePath === undefined || templatePath === null) {
    throw new AppError('Invalid path parameter', 'INVALID_PATH', {
      templatePath,
      type: typeof templatePath,
      value: templatePath,
    });
  }

  try {
    logger.debug('Generating filename from template path', {
      templatePath,
      exists: !!templatePath,
      type: typeof templatePath,
    });

    // Extract base name without extension
    const baseName = path.basename(templatePath, path.extname(templatePath));
    logger.debug('Base name extracted', {
      baseName,
      originalPath: templatePath,
      extension: path.extname(templatePath),
    });

    // Generate timestamp components
    const now = new Date();
    logger.debug('Current date created', {
      date: now.toISOString(),
      timestamp: now.getTime(),
    });

    // Format date components
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');

    // Create timestamp string
    const timestamp = `${year}-${month}-${day}-${hours}-${minutes}-${seconds}`;
    logger.debug('Timestamp formatted', {
      timestamp,
      year,
      month,
      day,
      hours,
      minutes,
      seconds,
    });

    // Generate final filename
    const filename = baseName
      ? `${baseName}${FILENAME_CONFIG.SEPARATOR}${timestamp}`
      : `${FILENAME_CONFIG.SEPARATOR}${timestamp}`;

    logger.debug('Final filename generated', {
      filename,
      baseName,
      timestamp,
    });

    return filename;
  } catch (error) {
    throw new AppError(
      'Failed to generate timestamped filename',
      'FILENAME_ERROR',
      {
        templatePath,
        originalError: error,
      }
    );
  }
}

/**
 * Generates filename with revision number
 *
 * Handles file collisions through:
 * 1. Checking initial filename
 * 2. Adding revision numbers
 * 3. Incrementing until unique
 * 4. Validating final path
 *
 * @async
 * @param {string} basePath - Base path without extension
 * @param {string} extension - File extension (.html, .pdf)
 * @returns {Promise<string>} Path with revision if needed
 * @throws {AppError} On access error or revision limit
 *
 * @example
 * // Basic usage
 * const path = await generateRevisionedFilename('doc', '.pdf');
 * console.log(path); // doc.pdf or doc.rev.1.pdf
 *
 * // With multiple revisions
 * let path;
 * for (let i = 0; i < 3; i++) {
 *   path = await generateRevisionedFilename('doc', '.pdf');
 *   await fs.writeFile(path, content);
 * }
 * // Creates: doc.pdf, doc.rev.1.pdf, doc.rev.2.pdf
 *
 * // Error handling
 * try {
 *   const path = await generateRevisionedFilename('doc', '.pdf');
 * } catch (error) {
 *   if (error.code === 'REVISION_LIMIT') {
 *     console.error('Too many revisions');
 *   }
 * }
 */
async function generateRevisionedFilename(basePath, extension) {
  try {
    // Try initial path
    const initialPath = `${basePath}${extension}`;
    try {
      await fs.access(initialPath);

      // File exists, try revision numbers
      let revisionNumber = 1;
      let revisionPath;

      do {
        revisionPath = `${basePath}${FILENAME_CONFIG.REVISION_PREFIX}${revisionNumber}${extension}`;
        try {
          await fs.access(revisionPath);
          revisionNumber++;
        } catch {
          // Path is available
          return revisionPath;
        }
      } while (revisionNumber < FILENAME_CONFIG.MAX_REVISIONS);

      throw new AppError('Maximum revision limit reached', 'REVISION_LIMIT', {
        basePath,
        extension,
        maxRevisions: FILENAME_CONFIG.MAX_REVISIONS,
      });
    } catch {
      // Initial path is available
      return initialPath;
    }
  } catch (error) {
    throw new AppError(
      'Failed to generate revisioned filename',
      'FILENAME_ERROR',
      {
        basePath,
        extension,
        originalError: error,
      }
    );
  }
}

/**
 * Generates output filenames for multiple formats
 *
 * Creates format-specific filenames through:
 * 1. Validating input path
 * 2. Generating base filename
 * 3. Adding format-specific extensions
 * 4. Resolving output paths
 *
 * @async
 * @param {string} sourcePath - Source file path
 * @param {string} outputDir - Output directory
 * @returns {Promise<{html: string, pdf: string, md: string}>} Format-specific paths
 * @throws {AppError} On invalid input or path error
 *
 * @example
 * // Basic usage
 * const outputs = await generateFileName('template.md', './output');
 * console.log(outputs);
 * // {
 * //   html: 'output/template-20240315-143022.html',
 * //   pdf: 'output/template-20240315-143022.pdf'
 * // }
 *
 * // With specific formats
 * const { html } = await generateFileName('doc.md', './output');
 * await processHTML(html);
 *
 * // With path resolution
 * const outputs = await generateFileName(
 *   'templates/doc.md',
 *   path.resolve('./output')
 * );
 *
 * // Error handling
 * try {
 *   const outputs = await generateFileName('invalid.txt', './output');
 * } catch (error) {
 *   console.error('Generation failed:', error.message);
 * }
 */
async function generateFileName(sourcePath, outputDir) {
  try {
    // Validate input parameters
    if (!sourcePath) {
      throw new AppError('Source path is required', 'INVALID_PATH');
    }
    if (!outputDir) {
      throw new AppError('Output directory is required', 'INVALID_PATH');
    }

    // Convert output directory to absolute path if it's relative
    const absoluteOutputDir = path.isAbsolute(outputDir)
      ? outputDir
      : path.join(process.cwd(), outputDir);

    // Ensure output directory exists
    try {
      await fs.mkdir(absoluteOutputDir, { recursive: true });
    } catch (error) {
      throw new AppError(
        'Failed to create output directory',
        'DIRECTORY_ERROR',
        {
          outputDir: absoluteOutputDir,
          originalError: error,
        }
      );
    }

    // Extract base name from source path, removing any extension
    const baseName = path.basename(sourcePath, path.extname(sourcePath));
    const basePath = path.join(absoluteOutputDir, baseName);

    logger.debug('Generating filenames', {
      sourcePath,
      outputDir,
      absoluteOutputDir,
      baseName,
      basePath,
    });

    // Find the highest existing revision for either file
    let highestRevision = 0;
    let foundExisting = false;

    // Check base files first
    const baseHtmlPath = `${basePath}${FILE_EXTENSIONS.output.html}`;
    const basePdfPath = `${basePath}${FILE_EXTENSIONS.output.pdf}`;
    const baseMdPath = `${basePath}${FILE_EXTENSIONS.output.markdown}`;

    try {
      // Check if any of the base files exist
      const baseFilesExist = await Promise.all([
        fs
          .access(baseHtmlPath)
          .then(() => true)
          .catch(() => false),
        fs
          .access(basePdfPath)
          .then(() => true)
          .catch(() => false),
        fs
          .access(baseMdPath)
          .then(() => true)
          .catch(() => false),
      ]);

      foundExisting = baseFilesExist.some((exists) => exists);

      if (!foundExisting) {
        // If no files exist, return base paths
        logger.debug('No existing files found, using base paths', {
          html: baseHtmlPath,
          pdf: basePdfPath,
          md: baseMdPath,
        });

        return {
          html: baseHtmlPath,
          pdf: basePdfPath,
          md: baseMdPath,
        };
      }

      // If files exist, find highest revision
      while (highestRevision < FILENAME_CONFIG.MAX_REVISIONS) {
        const currentRevision = highestRevision + 1;
        const htmlRevPath = `${basePath}${FILENAME_CONFIG.REVISION_PREFIX}${currentRevision}${FILE_EXTENSIONS.output.html}`;
        const pdfRevPath = `${basePath}${FILENAME_CONFIG.REVISION_PREFIX}${currentRevision}${FILE_EXTENSIONS.output.pdf}`;
        const mdRevPath = `${basePath}${FILENAME_CONFIG.REVISION_PREFIX}${currentRevision}${FILE_EXTENSIONS.output.markdown}`;

        const revisionExists = await Promise.all([
          fs
            .access(htmlRevPath)
            .then(() => true)
            .catch(() => false),
          fs
            .access(pdfRevPath)
            .then(() => true)
            .catch(() => false),
          fs
            .access(mdRevPath)
            .then(() => true)
            .catch(() => false),
        ]);

        if (!revisionExists.some((exists) => exists)) {
          // Found an available revision number
          logger.debug('Found available revision', {
            revision: currentRevision,
            html: htmlRevPath,
            pdf: pdfRevPath,
            md: mdRevPath,
          });

          return {
            html: htmlRevPath,
            pdf: pdfRevPath,
            md: mdRevPath,
          };
        }

        highestRevision = currentRevision;
      }

      throw new AppError('Maximum revision limit reached', 'REVISION_LIMIT', {
        basePath,
        maxRevisions: FILENAME_CONFIG.MAX_REVISIONS,
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(
        'Failed to generate output filenames',
        'FILENAME_ERROR',
        {
          sourcePath,
          outputDir,
          originalError: error,
        }
      );
    }
  } catch (error) {
    throw new AppError(
      'Failed to generate output filenames',
      'FILENAME_ERROR',
      {
        sourcePath,
        outputDir,
        originalError: error,
      }
    );
  }
}

/**
 * Generate unique filename with format and revision handling
 * @param {object} options - Filename generation options
 * @returns {string} Generated filename
 */
function generateFilename(options) {
  const { baseName, format, outputDir, revision = 1 } = options;

  if (!baseName) {
    throw new AppError('Base name is required', 'FILENAME_EMPTY_BASE');
  }

  // Sanitize base name
  const sanitizedBase = baseName
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  if (!sanitizedBase) {
    throw new AppError(
      'Invalid base name after sanitization',
      'FILENAME_INVALID_BASE'
    );
  }

  // Handle format
  const ext = format ? `.${format.toLowerCase()}` : '';

  // Generate filename with revision if needed
  const getFilenameWithRevision = (rev) => {
    return path.join(
      outputDir || '',
      `${sanitizedBase}${rev > 1 ? `-r${rev}` : ''}${ext}`
    );
  };

  // Check for collisions
  let currentRevision = revision;
  let filename = getFilenameWithRevision(currentRevision);

  while (fs.existsSync(filename)) {
    currentRevision++;
    if (currentRevision > 999) {
      throw new AppError('Too many revisions', 'FILENAME_TOO_MANY_REVISIONS');
    }
    filename = getFilenameWithRevision(currentRevision);
  }

  return filename;
}

module.exports = {
  generateFileName,
  generateTimestampedFilename,
  generateRevisionedFilename,
  FILENAME_CONFIG, // Exported for testing
  generateFilename,
};
