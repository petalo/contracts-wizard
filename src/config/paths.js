/**
 * @file Path Configuration and Management System
 *
 * Centralizes path configuration and management for the application:
 * - Project root and directory structure
 * - Template file locations
 * - Output file destinations
 * - Resource file paths
 *
 * Functions:
 * - getProjectRoot: Determines project root directory
 * - resolveProjectPath: Resolves paths relative to root
 * - validatePath: Ensures path exists and is accessible
 * - createDirectoryIfNotExists: Creates directory structure
 *
 * Constants:
 * - PATHS: Core path configuration object
 * - TEMPLATES: Template directory paths
 * - OUTPUT: Output directory paths
 * - RESOURCES: Resource file paths
 *
 * Flow:
 * 1. Initialize root path detection
 * 2. Configure directory structure
 * 3. Validate critical paths
 * 4. Create missing directories
 * 5. Export path utilities
 *
 * Error Handling:
 * - Invalid root directory detection
 * - Missing required directories
 * - Path resolution failures
 * - Permission issues
 * - Directory creation errors
 *
 * @module @/config/paths
 * @requires path - Node.js path module
 * @requires fs - File system operations
 * @requires @/utils/common/errors - Error handling utilities
 *
 * @example
 * // Import path configuration
 * const { PATHS, validateDirectory } = require('@/config/paths');
 *
 * // Access environment-aware paths
 * const outputDir = PATHS.output;
 * const templatesDir = PATHS.templates;
 *
 * // Validate and create directory
 * await validateDirectory(PATHS.output, true);
 *
 * // Resolve file type directory
 * const templateDir = TYPE_TO_PATH_MAP[FILE_EXTENSIONS.types.TEMPLATE];
 *
 * // Create nested directory structure
 * await validateDirectory(path.join(PATHS.output, 'nested/path'), true);
 */

const path = require('path');
const fs = require('fs');
const fsPromises = require('fs').promises;
const dotenv = require('dotenv');
const { FILE_EXTENSIONS } = require('@/config/file-extensions');
const { logger } = require('@/utils/common/logger');

// Base directory is current working directory
const BASE_DIR = process.cwd();

// Load environment configuration based on NODE_ENV
if (process.env.NODE_ENV === 'test') {
  const envTestPath = path.resolve(process.cwd(), '.env.test');
  try {
    // Use synchronous stat instead of existsSync
    fs.statSync(envTestPath);
    dotenv.config({ path: envTestPath });
    logger.debug('Environment configuration', {
      filename: 'paths.js',
      context: 'config',
      message: 'Loaded test environment configuration',
      params: `env=test • path=${envTestPath}`,
    });
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new Error('.env.test file is required for running tests');
    }
    throw error;
  }
} else {
  dotenv.config();
  logger.debug('Environment configuration', {
    filename: 'paths.js',
    context: 'config',
    message: 'Loaded default environment configuration',
    params: `env=${process.env.NODE_ENV || 'development'}`,
  });
}

/**
 * Default paths configuration object
 *
 * Defines the default directory structure for the application
 * when no environment overrides are provided. These paths are
 * relative to the application base directory.
 *
 * Directory Structure:
 * - output_files/: Generated documents
 * - templates/markdown/: Markdown templates
 * - templates/css/: CSS stylesheets
 * - data-csv/: CSV data files
 * - templates/images/: Image assets
 * - logs/: Application logs
 *   - latest.log: Most recent log file
 *   - history.log: Historical log archive
 *
 * @constant {object}
 * @property {string} output - Output files directory
 * @property {string} templates - Markdown templates directory
 * @property {string} css - CSS styles directory
 * @property {string} csv - CSV data files directory
 * @property {string} images - Template images directory
 * @property {object} logs - Logging directory configuration
 */
const DEFAULT_PATHS = {
  output: 'output_files',
  templates: path.join('templates', 'markdown'),
  css: path.join('templates', 'css'),
  csv: 'data-csv',
  images: path.join('templates', 'images'),
  logs: {
    dir: 'logs',
    latest: path.join('logs', 'latest.log'),
    history: path.join('logs', 'history.log'),
  },
};

/**
 * Helper function to handle paths that might be absolute or relative
 * @param {string} basePath - Base directory path
 * @param {string} targetPath - Target path that might be absolute or relative
 * @param {string} defaultPath - Default relative path
 * @returns {string} - Resolved path
 */
function resolvePath(basePath, targetPath, defaultPath) {
  // If no target path is provided, use default
  if (!targetPath) {
    const resolvedPath = path.join(basePath, defaultPath);
    logger.debug('Resolving default path', {
      filename: 'paths.js',
      context: 'file',
      message: 'Using default path for resolution',
      params: `base=${basePath} • default=${defaultPath} • resolved=${resolvedPath}`,
    });
    return resolvedPath;
  }

  // If target path is absolute, use it directly
  if (path.isAbsolute(targetPath)) {
    logger.debug('Using absolute path', {
      filename: 'paths.js',
      context: 'file',
      message: 'Path is absolute, using directly',
      params: `path=${targetPath}`,
    });
    return targetPath;
  }

  // For relative paths, join with base path
  const resolvedPath = path.join(basePath, targetPath);
  logger.debug('Resolving relative path', {
    filename: 'paths.js',
    context: 'file',
    message: 'Joining relative path with base',
    params: `base=${basePath} • target=${targetPath} • resolved=${resolvedPath}`,
  });
  return resolvedPath;
}

/**
 * Environment-aware application path configuration
 *
 * Combines default paths with environment-specific overrides
 * to create the final path configuration used by the application.
 *
 * @constant {object}
 * @property {string} base - Application base directory
 * @property {string} output - Output files directory
 * @property {string} templates - Templates directory
 * @property {string} css - CSS files directory
 * @property {string} csv - CSV data directory
 * @property {string} images - Images directory
 * @property {object} logs - Log file paths
 */
const PATHS = {
  // Base application paths
  base: BASE_DIR,

  // Output directory - can be overridden by DIR_OUTPUT env var
  output: (() => {
    const envPath = process.env.DIR_OUTPUT;
    if (envPath && path.isAbsolute(envPath)) {
      logger.debug('Output directory configuration', {
        filename: 'paths.js',
        context: 'config',
        message: 'Using absolute output path from environment',
        params: `path=${envPath}`,
      });
      return envPath;
    }
    return resolvePath(BASE_DIR, envPath, DEFAULT_PATHS.output);
  })(),

  // Templates directory - can be overridden by DIR_TEMPLATES env var
  templates: (() => {
    const envPath = process.env.DIR_TEMPLATES;
    if (envPath && path.isAbsolute(envPath)) {
      logger.debug('Templates directory configuration', {
        filename: 'paths.js',
        context: 'config',
        message: 'Using absolute templates path from environment',
        params: `path=${envPath}`,
      });
      return envPath;
    }
    return resolvePath(BASE_DIR, envPath, DEFAULT_PATHS.templates);
  })(),

  // CSS directory - can be overridden by DIR_CSS env var
  css: (() => {
    const envPath = process.env.DIR_CSS;
    if (envPath && path.isAbsolute(envPath)) {
      logger.debug('CSS directory configuration', {
        filename: 'paths.js',
        context: 'config',
        message: 'Using absolute CSS path from environment',
        params: `path=${envPath}`,
      });
      return envPath;
    }
    return resolvePath(BASE_DIR, envPath, DEFAULT_PATHS.css);
  })(),

  // CSV directory - can be overridden by DIR_CSV env var
  csv: (() => {
    const envPath = process.env.DIR_CSV;
    if (envPath && path.isAbsolute(envPath)) {
      logger.debug('CSV directory configuration', {
        filename: 'paths.js',
        context: 'config',
        message: 'Using absolute CSV path from environment',
        params: `path=${envPath}`,
      });
      return envPath;
    }
    return resolvePath(BASE_DIR, envPath, DEFAULT_PATHS.csv);
  })(),

  // Images directory - can be overridden by DIR_IMAGES env var
  images: (() => {
    const envPath = process.env.DIR_IMAGES;
    if (envPath && path.isAbsolute(envPath)) {
      logger.debug('Images directory configuration', {
        filename: 'paths.js',
        context: 'config',
        message: 'Using absolute images path from environment',
        params: `path=${envPath}`,
      });
      return envPath;
    }
    return resolvePath(BASE_DIR, envPath, DEFAULT_PATHS.images);
  })(),

  // Logging paths
  logs: {
    dir: path.join(BASE_DIR, DEFAULT_PATHS.logs.dir),
    latest: resolvePath(
      BASE_DIR,
      process.env.LATEST_LOG_PATH,
      DEFAULT_PATHS.logs.latest
    ),
    history: resolvePath(
      BASE_DIR,
      process.env.FULL_LOG_PATH,
      DEFAULT_PATHS.logs.history
    ),
  },
};

// Log all resolved paths for debugging
logger.debug('Application paths configuration', {
  filename: 'paths.js',
  context: 'config',
  message: 'All application paths have been resolved',
  params: `base=${PATHS.base} • output=${PATHS.output} • templates=${PATHS.templates} • css=${PATHS.css} • csv=${PATHS.csv} • images=${PATHS.images} • logs_dir=${PATHS.logs.dir} • logs_latest=${PATHS.logs.latest} • logs_history=${PATHS.logs.history}`,
});

/**
 * Maps file types to their corresponding directories
 *
 * Used to determine the appropriate directory for each file type
 * when processing templates and generating outputs.
 *
 * @constant {object}
 * @property {string} template - Templates directory
 * @property {string} csv - CSV data directory
 * @property {string} css - CSS styles directory
 * @property {string} images - Images directory
 */
const TYPE_TO_PATH_MAP = {
  [FILE_EXTENSIONS.types.TEMPLATE]: PATHS.templates,
  [FILE_EXTENSIONS.types.CSV]: PATHS.csv,
  [FILE_EXTENSIONS.types.CSS]: PATHS.css,
  [FILE_EXTENSIONS.types.IMAGES]: PATHS.images,
};

/**
 * Validates and optionally creates a directory
 *
 * Ensures a directory exists and is accessible. Can create
 * the directory if it doesn't exist and creation is requested.
 * Handles nested directory structures through recursive creation.
 *
 * @async
 * @param {string} dirPath - Path to validate/create
 * @param {boolean} [createIfMissing=false] - Create directory if missing
 * @throws {Error} If directory validation fails or creation is not permitted
 * @example
 * // Validate existing directory
 * await validateDirectory('./templates');
 *
 * // Create directory if missing
 * await validateDirectory('./output', true);
 */
async function validateDirectory(dirPath, createIfMissing = false) {
  try {
    // Check if directory exists and is accessible
    await fsPromises.access(dirPath);
  } catch (error) {
    if (error.code === 'ENOENT' && createIfMissing) {
      // Create directory with parent directories if needed
      await fsPromises.mkdir(dirPath, { recursive: true });
    } else {
      throw error;
    }
  }
}

// Initialize required application directories
if (process.env.NODE_ENV !== 'test') {
  (async () => {
    try {
      // Create all required directories in parallel
      await Promise.all([
        validateDirectory(PATHS.output, true),
        validateDirectory(PATHS.templates, true),
        validateDirectory(PATHS.css, true),
        validateDirectory(PATHS.csv, true),
        validateDirectory(PATHS.images, true),
        validateDirectory(PATHS.logs.dir, true),
      ]);
    } catch (error) {
      logger.error('Directory initialization failed', {
        filename: 'paths.js',
        context: 'system',
        message: 'Failed to initialize required application directories',
        params: `error=${error.message} • stack=${error.stack}`,
      });
      process.exit(1);
    }
  })();
}

// Prevent runtime modifications to configurations
Object.freeze(DEFAULT_PATHS);
Object.freeze(DEFAULT_PATHS.logs);
Object.freeze(PATHS);
Object.freeze(PATHS.logs);
Object.freeze(TYPE_TO_PATH_MAP);

module.exports = {
  PATHS,
  TYPE_TO_PATH_MAP,
  validateDirectory,
};
