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
 * - Suffix sanitization
 *
 * Functions:
 * - generateTimestampedFilename: Creates timestamped unique names
 * - generateRevisionedFilename: Handles file collisions with revisions
 * - generateFileName: Generates output filenames for multiple formats
 * - sanitizeFileName: Cleanses filenames of invalid characters
 * - sanitizeSuffix: Cleanses suffix of invalid characters
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
 * @requires @/config/locale Locale configuration
 * @requires moment-timezone Moment.js timezone plugin
 * @exports generateTimestampedFilename Timestamp-based filename generator
 * @exports generateRevisionedFilename Revision-based filename generator
 * @exports generateFileName Multi-format filename generator
 * @exports sanitizeSuffix Suffix sanitization utility
 *
 * @example
 * // Import filename generators
 * const {
 *   generateTimestampedFilename,
 *   generateRevisionedFilename,
 *   generateFileName,
 *   sanitizeSuffix
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
 *
 * // Sanitize suffix
 * const suffix = sanitizeSuffix('My Client Name!');
 * console.log(suffix); // my-client-name
 */

const path = require('path');
const fs = require('fs').promises;
const { logger } = require('@/utils/common/logger');
const { AppError } = require('@/utils/common/errors');
const { FILE_EXTENSIONS } = require('@/config/file-extensions');
const { LOCALE_CONFIG } = require('@/config/locale');
const moment = require('moment-timezone');

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
  if (
    templatePath === undefined ||
    templatePath === null ||
    templatePath === ''
  ) {
    throw new AppError('Invalid path parameter', 'INVALID_PATH', {
      templatePath,
      type: typeof templatePath,
      value: templatePath,
    });
  }

  try {
    logger.debug('Processing template path', {
      filename: 'generate-filename.js',
      context: 'file',
      message: 'Processing template path for filename generation',
      params: `path=${templatePath} • type=${typeof templatePath}`,
    });

    // Extract base name without extension
    const baseName = path.basename(templatePath, path.extname(templatePath));
    logger.debug('Base name extraction', {
      filename: 'generate-filename.js',
      context: 'file',
      message: 'Base name extracted from template path',
      params: `base=${baseName} • ext=${path.extname(templatePath)} • path=${templatePath}`,
    });

    // Generate timestamp using configured timezone or UTC as fallback
    const now = LOCALE_CONFIG?.timezone
      ? moment().tz(LOCALE_CONFIG.timezone)
      : moment.utc();

    // Format timestamp according to configuration
    const timestamp = now.format(FILENAME_CONFIG.TIMESTAMP_FORMAT);

    // Generate final filename
    const filename = baseName
      ? `${baseName}${FILENAME_CONFIG.SEPARATOR}${timestamp}`
      : `${FILENAME_CONFIG.SEPARATOR}${timestamp}`;

    logger.debug('Filename generation', {
      filename: 'generate-filename.js',
      context: 'file',
      message: 'Generated filename with timestamp',
      params: `name=${filename} • base=${baseName} • time=${timestamp} • template=${templatePath}`,
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
 * @param {object} options - Additional options for filename generation
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
async function generateFileName(sourcePath, outputDir, options = {}) {
  try {
    // Validate input parameters
    if (!sourcePath) {
      throw new AppError('Failed to generate filenames', 'FILENAME_ERROR', {
        reason: 'Source path is required',
      });
    }
    if (!outputDir) {
      throw new AppError('Failed to generate filenames', 'FILENAME_ERROR', {
        reason: 'Output directory is required',
      });
    }

    // Keep outputDir as relative path if it's relative
    const workingOutputDir = outputDir;

    // Ensure output directory exists (using absolute path internally)
    const absoluteOutputDir = path.isAbsolute(outputDir)
      ? outputDir
      : path.join(process.cwd(), outputDir);

    try {
      await fs.mkdir(absoluteOutputDir, { recursive: true });
    } catch (error) {
      throw new AppError('Failed to generate filenames', 'FILENAME_ERROR', {
        reason: 'Failed to create output directory',
        outputDir: absoluteOutputDir,
        originalError: error,
      });
    }

    // Extract base name from source path, removing any extension
    const baseName = path.basename(sourcePath, path.extname(sourcePath));
    const basePath = path.join(workingOutputDir, baseName);

    logger.debug('Multi-format filename generation', {
      filename: 'generate-filename.js',
      context: 'file',
      message: 'Starting filename generation process',
      params: `source=${sourcePath} • output=${outputDir} • abs_output=${absoluteOutputDir} • base=${baseName} • base_path=${basePath}`,
    });

    // Find the highest existing revision for either file
    let highestRevision = 0;
    let foundExisting = false;

    // Get and sanitize only the suffix argument value, not the whole suffix structure
    const suffixValue = options.suffix ? sanitizeSuffix(options.suffix) : '';
    const suffix = suffixValue ? `.${suffixValue}` : '';
    const highlightSuffix = options.highlight ? '.HIGHLIGHTED' : '';

    // Check base files first
    const baseHtmlPath = `${basePath}${suffix}${highlightSuffix}${FILE_EXTENSIONS.output.html}`;
    const basePdfPath = `${basePath}${suffix}${highlightSuffix}${FILE_EXTENSIONS.output.pdf}`;
    const baseMdPath = `${basePath}${suffix}${highlightSuffix}${FILE_EXTENSIONS.output.markdown}`;

    // Helper function to check if a file exists
    const checkFileExists = async (filePath) => {
      try {
        await fs.access(filePath);
        return true;
      } catch (error) {
        if (error.code === 'ENOENT' || error.message === 'File not found') {
          return false;
        }
        throw error;
      }
    };

    try {
      // Check if any of the base files exist
      const baseFilesExist = await Promise.all([
        checkFileExists(baseHtmlPath),
        checkFileExists(basePdfPath),
        checkFileExists(baseMdPath),
      ]);

      foundExisting = baseFilesExist.some((exists) => exists);

      if (!foundExisting) {
        // If no files exist, return base paths
        logger.debug('Base paths generation', {
          filename: 'generate-filename.js',
          context: 'file',
          message: 'Using base paths for new files',
          params: `html=${baseHtmlPath} • pdf=${basePdfPath} • md=${baseMdPath}`,
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
        const htmlRevPath = `${basePath}${FILENAME_CONFIG.REVISION_PREFIX}${currentRevision}${suffix}${highlightSuffix}${FILE_EXTENSIONS.output.html}`;
        const pdfRevPath = `${basePath}${FILENAME_CONFIG.REVISION_PREFIX}${currentRevision}${suffix}${highlightSuffix}${FILE_EXTENSIONS.output.pdf}`;
        const mdRevPath = `${basePath}${FILENAME_CONFIG.REVISION_PREFIX}${currentRevision}${suffix}${highlightSuffix}${FILE_EXTENSIONS.output.markdown}`;

        const revisionExists = await Promise.all([
          checkFileExists(htmlRevPath),
          checkFileExists(pdfRevPath),
          checkFileExists(mdRevPath),
        ]);

        if (!revisionExists.some((exists) => exists)) {
          // Found an available revision number
          logger.debug('Revision number generation', {
            filename: 'generate-filename.js',
            context: 'file',
            message: 'Found available revision for files',
            params: `rev=${currentRevision} • html=${htmlRevPath} • pdf=${pdfRevPath} • md=${mdRevPath}`,
          });

          return {
            html: htmlRevPath,
            pdf: pdfRevPath,
            md: mdRevPath,
          };
        }

        highestRevision = currentRevision;
      }

      throw new AppError('Failed to generate filenames', 'FILENAME_ERROR', {
        reason: 'Maximum revision limit reached',
        basePath,
        maxRevisions: FILENAME_CONFIG.MAX_REVISIONS,
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to generate filenames', 'FILENAME_ERROR', {
        reason: 'File system error',
        sourcePath,
        outputDir,
        originalError: error,
      });
    }
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Failed to generate filenames', 'FILENAME_ERROR', {
      sourcePath,
      outputDir,
      originalError: error,
    });
  }
}

/**
 * Generate unique filename with format and revision handling
 * @param {object} options - Filename generation options
 * @returns {string} Generated filename
 */
function generateFilename(options) {
  // prettier-ignore
  const {
    baseName,
    format,
    outputDir,
    revision = 1,
  } = options;

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

/**
 * Sanitizes a suffix for use in filenames
 *
 * Processes a suffix string to ensure it's safe for use in filenames by:
 * 1. Converting to lowercase
 * 2. Removing all special characters (including hyphens)
 * 3. Converting spaces to single underscores
 * 4. Removing leading/trailing underscores
 *
 * @param {string} suffix - The suffix to sanitize
 * @returns {string} Sanitized suffix safe for use in filenames
 * @throws {AppError} If suffix is invalid after sanitization
 */
function sanitizeSuffix(suffix) {
  if (!suffix) return '';

  // Convert to string if not already
  const str = String(suffix);

  // Log original input with detailed character analysis
  logger.debug('Suffix sanitization - Original input:', {
    filename: 'generate-filename.js',
    context: 'file',
    message: 'Original input string analysis',
    params: {
      original: str,
      length: str.length,
      charDetails: Array.from(str).map((c, i) => ({
        index: i,
        char: c,
        code: c.charCodeAt(0),
        hex: `0x${c.charCodeAt(0).toString(16)}`,
      })),
    },
  });

  // Process in steps for better control and log each step
  let step1 = str.toLowerCase(); // Convert to lowercase

  logger.debug('Suffix sanitization - Step 1 (lowercase):', {
    filename: 'generate-filename.js',
    context: 'file',
    message: 'After converting to lowercase',
    params: {
      step1,
      length: step1.length,
      charDetails: Array.from(step1).map((c, i) => ({
        index: i,
        char: c,
        code: c.charCodeAt(0),
        hex: `0x${c.charCodeAt(0).toString(16)}`,
      })),
    },
  });

  // Check if there are actual spaces in the input
  const hasSpaces = str.includes(' ');

  // Handle special characters differently based on whether there are spaces
  let step2;
  if (hasSpaces) {
    // If there are spaces, treat hyphens as spaces
    step2 = step1.replace(/[-\s]+/g, ' ').trim();
  } else {
    // If no spaces, remove all special characters without creating spaces
    step2 = step1.replace(/[^a-z0-9]/g, '');
  }

  // Then remove remaining special characters if we're handling spaces
  if (hasSpaces) {
    step2 = step2.replace(/[^a-z0-9\s]/g, '');
  }

  logger.debug('Suffix sanitization - Step 2 (remove special chars):', {
    filename: 'generate-filename.js',
    context: 'file',
    message: 'After removing special characters',
    params: {
      step1,
      step2,
      length: step2.length,
      charDetails: Array.from(step2).map((c, i) => ({
        index: i,
        char: c,
        code: c.charCodeAt(0),
        hex: `0x${c.charCodeAt(0).toString(16)}`,
      })),
    },
  });

  let step3 = step2.trim(); // Remove any leading/trailing spaces

  logger.debug('Suffix sanitization - Step 3 (trim):', {
    filename: 'generate-filename.js',
    context: 'file',
    message: 'After trimming spaces',
    params: {
      step2,
      step3,
      length: step3.length,
      charDetails: Array.from(step3).map((c, i) => ({
        index: i,
        char: c,
        code: c.charCodeAt(0),
        hex: `0x${c.charCodeAt(0).toString(16)}`,
      })),
    },
  });

  // Convert spaces to underscores only if we had spaces in the input
  let step4 = hasSpaces ? step3.replace(/\s+/g, '_') : step3;

  logger.debug('Suffix sanitization - Step 4 (finalize):', {
    filename: 'generate-filename.js',
    context: 'file',
    message: 'Final result after processing',
    params: {
      step3,
      step4,
      length: step4.length,
      charDetails: Array.from(step4).map((c, i) => ({
        index: i,
        char: c,
        code: c.charCodeAt(0),
        hex: `0x${c.charCodeAt(0).toString(16)}`,
      })),
    },
  });

  return step4;
}

module.exports = {
  generateFileName,
  generateTimestampedFilename,
  generateRevisionedFilename,
  FILENAME_CONFIG, // Exported for testing
  generateFilename,
  sanitizeSuffix,
};
