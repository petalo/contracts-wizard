/**
 * @fileoverview Path Configuration and Directory Management
 *
 * Manages application paths and directory structure:
 * - Defines default and environment-aware paths
 * - Handles directory validation and creation
 * - Provides path resolution utilities
 * - Maps file types to directories
 *
 * Functions:
 * - validateDirectory: Validates and creates directories
 *
 * Constants:
 * - DEFAULT_PATHS: Default directory structure
 * - PATHS: Environment-aware path configuration
 * - TYPE_TO_PATH_MAP: File type to directory mapping
 *
 * Flow:
 * 1. Load environment configuration
 * 2. Define default paths
 * 3. Create environment-aware paths
 * 4. Map file types to directories
 * 5. Initialize required directories
 * 6. Freeze configurations
 *
 * Environment Variables:
 * - DIR_OUTPUT: Output directory override
 * - DIR_TEMPLATES: Templates directory override
 * - DIR_CSS: CSS directory override
 * - DIR_CSV: CSV directory override
 * - DIR_IMAGES: Images directory override
 * - LATEST_LOG_PATH: Latest log file path
 * - FULL_LOG_PATH: Full log history path
 *
 * Error Handling:
 * - Directory access validation
 * - Missing directory creation
 * - Permission checks
 * - Environment variable validation
 *
 * @module @/config/paths
 * @requires path
 * @requires fs/promises
 * @requires dotenv
 * @requires @/config/fileExtensions
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
const fs = require('fs/promises');
const dotenv = require('dotenv');
const { FILE_EXTENSIONS } = require('@/config/file-extensions');

// Base directory is current working directory
const BASE_DIR = process.cwd();

// Load environment configuration based on NODE_ENV
if (process.env.NODE_ENV === 'test') {
  dotenv.config({ path: '.env.test' });
} else {
  dotenv.config();
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
 * @constant {Object}
 * @property {string} output - Output files directory
 * @property {string} templates - Markdown templates directory
 * @property {string} css - CSS styles directory
 * @property {string} csv - CSV data files directory
 * @property {string} images - Template images directory
 * @property {Object} logs - Logging directory configuration
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
  if (!targetPath) {
    return path.join(basePath, defaultPath);
  }
  return path.isAbsolute(targetPath)
    ? targetPath
    : path.join(basePath, targetPath);
}

/**
 * Environment-aware application path configuration
 *
 * Combines default paths with environment-specific overrides
 * to create the final path configuration used by the application.
 *
 * @constant {Object}
 * @property {string} base - Application base directory
 * @property {string} output - Output files directory
 * @property {string} templates - Templates directory
 * @property {string} css - CSS files directory
 * @property {string} csv - CSV data directory
 * @property {string} images - Images directory
 * @property {Object} logs - Log file paths
 */
const PATHS = {
  // Base application paths
  base: BASE_DIR,
  output: resolvePath(BASE_DIR, process.env.DIR_OUTPUT, DEFAULT_PATHS.output),
  templates: resolvePath(
    BASE_DIR,
    process.env.DIR_TEMPLATES,
    DEFAULT_PATHS.templates
  ),
  css: resolvePath(BASE_DIR, process.env.DIR_CSS, DEFAULT_PATHS.css),
  csv: resolvePath(BASE_DIR, process.env.DIR_CSV, DEFAULT_PATHS.csv),
  images: resolvePath(BASE_DIR, process.env.DIR_IMAGES, DEFAULT_PATHS.images),

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

/**
 * Maps file types to their corresponding directories
 *
 * Used to determine the appropriate directory for each file type
 * when processing templates and generating outputs.
 *
 * @constant {Object}
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
    await fs.access(dirPath);
  } catch (error) {
    if (error.code === 'ENOENT' && createIfMissing) {
      // Create directory with parent directories if needed
      await fs.mkdir(dirPath, { recursive: true });
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
      console.error('Failed to initialize directories:', error);
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
