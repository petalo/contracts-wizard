/**
 * @file Main Configuration Exports
 *
 * Centralizes and exports all application configuration:
 * - File and path configurations
 * - Application settings and metadata
 * - Document generation options
 * - Formatting and transformation rules
 * - Locale settings
 * - Version information
 * - Assets configuration
 *
 * Functions:
 * - validateDirectory: Validates and creates directories
 * - createPdfOptions: Creates PDF generation options
 * - validateEnv: Validates environment variables
 * - configureAliases: Configures module aliases
 *
 * Configuration Groups:
 * 1. File System:
 *    - FILE_EXTENSIONS: File type definitions
 *    - PATHS: Directory structure
 *    - validateDirectory: Path validation
 *
 * 2. Document Generation:
 *    - PDF_CONFIG: PDF generation settings
 *    - HTML_CONFIG: HTML generation settings
 *    - createPdfOptions: PDF options factory
 *
 * 3. Application Settings:
 *    - APP_CONFIG: Runtime configuration
 *    - APP_METADATA: Application information
 *    - VERSION_INFO: Version details
 *    - ASSETS: Static resources
 *
 * 4. Formatting Rules:
 *    - PRETTIER_OPTIONS: Code formatting
 *    - CHEERIO_RULES: HTML parsing
 *    - ENCODING_CONFIG: File encoding
 *
 * Flow:
 * 1. Import all configuration modules
 * 2. Combine related settings
 * 3. Create APP_CONFIG object
 * 4. Export unified configuration
 *
 * Error Handling:
 * - Configuration validation
 * - Environment fallbacks
 * - Missing config warnings
 * - Type validation
 * - Required field checks
 *
 * @module @/config/index
 *
 * @example
 * // Import all configuration
 * const config = require('@/config');
 *
 * // Use file system configuration
 * const { PATHS, FILE_EXTENSIONS } = config;
 * await config.validateDirectory(PATHS.output);
 *
 * // Configure document generation
 * const pdfOptions = await config.createPdfOptions();
 * const { HTML_CONFIG, PRETTIER_OPTIONS } = config;
 *
 * // Access application settings
 * const { APP_CONFIG, VERSION_INFO } = config;
 * console.log(`Version: ${VERSION_INFO.current}`);
 *
 * // Use formatting rules
 * const formatted = prettier.format(code, PRETTIER_OPTIONS);
 *
 * // Environment validation
 * await config.validateEnv();
 *
 * // Module resolution
 * config.configureAliases();
 */

const { PATHS, validateDirectory } = require('@/config/paths');
const { FILE_EXTENSIONS } = require('@/config/fileExtensions');
const { PDF_CONFIG, createPdfOptions } = require('@/config/pdfOptions');
const { HTML_CONFIG } = require('@/config/htmlOptions');
const { DEFAULT_PRETTIER_OPTIONS } = require('@/config/prettierRules');
const { LOCALE_CONFIG } = require('@/config/locale');
const { CHEERIO_RULES } = require('@/config/cheerioRules');
const { APP_METADATA } = require('@/config/appMetadata');
const { ASSETS } = require('@/config/assets');
const { VERSION_INFO } = require('@/config/version');
const { validateEnv } = require('@/config/envValidation');
const { configureAliases } = require('@/config/aliases');
const { ENCODING_CONFIG } = require('@/config/encoding');
const { HANDLEBARS_CONFIG } = require('@/config/handlebarsConfig');

/**
 * Application configuration object
 *
 * Centralizes runtime configuration settings
 * with environment variable overrides and
 * default fallback values.
 *
 * Configuration Categories:
 * - Debug settings
 * - Logging configuration
 * - Output directory
 * - File size limits
 *
 * @constant {object}
 * @property {boolean} debug - Debug mode flag
 * @property {string} logLevel - Logging verbosity
 * @property {string} outputDir - Output directory
 * @property {string} maxFileSize - File size limit
 *
 * @example
 * // Environment overrides
 * {
 *   debug: process.env.DEBUG === 'true',
 *   logLevel: process.env.LOG_LEVEL || 'info',
 *   outputDir: process.env.OUTPUT_DIR || './output',
 *   maxFileSize: process.env.MAX_FILE_SIZE || '5mb'
 * }
 *
 * // Usage in application
 * if (APP_CONFIG.debug) {
 *   logger.level = 'debug';
 * }
 *
 * // File size validation
 * const isValidSize = (size) =>
 *   size <= bytes.parse(APP_CONFIG.maxFileSize);
 */
const APP_CONFIG = {
  debug: process.env.DEBUG === 'true',
  logLevel: process.env.LOG_LEVEL || 'info',
  outputDir: process.env.OUTPUT_DIR || './output',
  maxFileSize: process.env.MAX_FILE_SIZE || '5mb',
};

module.exports = {
  // File and path configurations
  FILE_EXTENSIONS,
  PATHS,
  validateDirectory,

  // Application configuration and metadata
  APP_CONFIG,
  APP_METADATA,
  VERSION_INFO,
  ASSETS,

  // Document generation configurations
  PDF_CONFIG,
  HTML_CONFIG,
  createPdfOptions,
  HANDLEBARS_CONFIG,

  // Formatting and transformation rules
  PRETTIER_OPTIONS: DEFAULT_PRETTIER_OPTIONS,
  CHEERIO_RULES,

  // Environment and module configuration
  validateEnv,
  configureAliases,

  // Locale settings
  LOCALE_CONFIG,

  // Encoding settings
  ENCODING_CONFIG,
};
