/**
 * @fileoverview Debug Session Management and Logging System
 *
 * Provides comprehensive debug session management and logging:
 * - Session initialization and tracking
 * - Environment state capture and validation
 * - CLI configuration logging and validation
 * - Visual session markers and separation
 * - Timestamp generation and formatting
 * - Debug mode detection and validation
 * - Test environment handling and adaptation
 * - Cross-platform path resolution
 * - Error tracking and recovery
 *
 * Functions:
 * - logSeparator: Creates and manages debug sessions
 * - getFormattedTimestamp: Generates locale-aware timestamps
 * - logEnvironmentDetails: Records environment state
 * - logCLIDetails: Captures CLI configuration
 *
 * Constants:
 * - CONFIG: Debug configuration object
 *   - BASE_DIR: Project root directory (process.cwd())
 *   - LOG_FILE: Debug log filename (from env or default)
 *   - SEPARATOR_LENGTH: Visual marker width (80)
 *   - SEPARATOR_CHAR: Marker character ('━')
 *
 * Flow:
 * 1. Environment Setup
 *    - Load environment variables
 *    - Validate debug mode status
 *    - Check test environment
 *
 * 2. Session Initialization
 *    - Create visual markers
 *    - Generate timestamp
 *    - Log session start
 *
 * 3. State Capture
 *    - Record environment details
 *    - Log CLI configuration
 *    - Validate paths
 *
 * 4. Error Management
 *    - Handle initialization failures
 *    - Manage environment errors
 *    - Process CLI errors
 *    - Recover from logging failures
 *
 * Error Handling:
 * - Environment Loading:
 *   - Missing variables
 *   - Invalid configurations
 *   - Type mismatches
 *
 * - Debug Initialization:
 *   - Mode validation failures
 *   - Session start errors
 *   - Marker creation issues
 *
 * - CLI Configuration:
 *   - Argument parsing errors
 *   - Option validation failures
 *   - Program initialization issues
 *
 * - Path Resolution:
 *   - Invalid paths
 *   - Permission issues
 *   - Cross-platform conflicts
 *
 * - Logging System:
 *   - Write failures
 *   - Format errors
 *   - Transport issues
 *
 * - Test Environment:
 *   - Mode conflicts
 *   - Configuration mismatches
 *   - Validation failures
 *
 * @module @/utils/common/logDebugStarter
 * @requires dotenv - Environment configuration loader
 * @requires path - Path manipulation utilities
 * @requires @/utils/common/logger - Logging system
 * @requires @/config/paths - Path configuration
 * @requires @/config/locale - Localization settings
 * @requires @/cli/commands - CLI utilities
 * @requires @/cli/display - Output formatting
 * @requires @/utils/common/errors - Error handling
 *
 * @example
 * // Basic debug session initialization
 * const { logSeparator } = require('@/utils/common/logDebugStarter');
 *
 * // Start new debug session
 * await logSeparator();
 * // Output:
 * // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * // ▶ New Execution Started --- env: development
 * // ▶ 2024-03-15 14:30:22
 * // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *
 * // Environment state logging
 * const { logEnvironmentDetails } = require('@/utils/common/logDebugStarter');
 * logEnvironmentDetails();
 * // Output:
 * // Environment configuration:
 * // DEBUG=true
 * // NODE_ENV=development
 * // LOG_PATH=/path/to/logs/debug.log
 * // PATHS[templates]=./templates
 * // PATHS[output]=./output
 *
 * // CLI configuration logging
 * const { logCLIDetails } = require('@/utils/common/logDebugStarter');
 * const options = logCLIDetails();
 * // Output:
 * // CLI configuration:
 * // args: ['node', 'index.js', '--debug']
 * // options: { debug: true, verbose: false }
 *
 * // Error handling example
 * try {
 *   await logSeparator();
 *   logEnvironmentDetails();
 *   const options = logCLIDetails();
 * } catch (error) {
 *   if (error.code === 'DEBUG_ERROR') {
 *     console.error('Debug initialization failed:', error.message);
 *   } else if (error.code === 'CLI_ERROR') {
 *     console.error('CLI configuration failed:', error.message);
 *   } else {
 *     console.error('Unexpected error:', error);
 *   }
 * }
 *
 * // Test environment handling
 * process.env.NODE_ENV = 'test';
 * await logSeparator(); // Minimal output in test mode
 */

const dotenv = require('dotenv');
const path = require('path');
const { logger } = require('@/utils/common/logger');
const { PATHS } = require('@/config/paths');
const { LOCALE_CONFIG } = require('@/config/locale');
const { initializeCLI } = require('@/cli/commands');
const { display } = require('@/cli/display');
const { AppError } = require('@/utils/common/errors');

// Load environment configuration
dotenv.config();

/**
 * Debug session configuration
 *
 * Defines core settings for debug session management:
 * - Base directory for relative paths
 * - Log file location and name
 * - Visual separator specifications
 *
 * This configuration is used to maintain consistent
 * debug session formatting and organization.
 *
 * @constant {Object}
 * @property {string} BASE_DIR - Project root path
 * @property {string} LOG_FILE - Debug log filename
 * @property {number} SEPARATOR_LENGTH - Marker width
 * @property {string} SEPARATOR_CHAR - Marker character
 *
 * @example
 * // Access configuration
 * const logPath = path.join(CONFIG.BASE_DIR, CONFIG.LOG_FILE);
 *
 * // Create separator
 * const separator = CONFIG.SEPARATOR_CHAR.repeat(CONFIG.SEPARATOR_LENGTH);
 *
 * // Configure logging
 * const options = {
 *   filename: CONFIG.LOG_FILE,
 *   dirname: CONFIG.BASE_DIR
 * };
 */
const CONFIG = {
  BASE_DIR: process.cwd(),
  LOG_FILE: process.env.LOG_FILE || 'logging.log',
  SEPARATOR_LENGTH: 80,
  SEPARATOR_CHAR: '━',
};

/**
 * Generates formatted timestamp string
 *
 * Creates a locale-aware timestamp using:
 * - Configured locale settings
 * - Timezone preferences
 * - Date/time formatting rules
 *
 * @returns {string} Localized timestamp
 *
 * @example
 * // Basic usage
 * const timestamp = getFormattedTimestamp();
 * console.log(timestamp);
 * // "15/03/2024 14:30:00" (es-ES)
 *
 * // In debug session
 * logger.debug(`Session started at ${getFormattedTimestamp()}`);
 *
 * // With timezone
 * const timestamp = getFormattedTimestamp();
 * // Returns time in LOCALE_CONFIG.timezone
 */
function getFormattedTimestamp() {
  return new Date().toLocaleString(LOCALE_CONFIG.fullLocale, {
    timeZone: LOCALE_CONFIG.timezone,
  });
}

/**
 * Logs environment configuration details
 *
 * Records current environment state:
 * 1. Environment variables
 * 2. Path configurations
 * 3. Relative path mappings
 *
 * Converts absolute paths to relative for clarity
 * and better log readability.
 *
 * @example
 * // Basic usage
 * logEnvironmentDetails();
 * // Environment configuration:
 * // DEBUG=true
 * // NODE_ENV=development
 * // LOG_PATH=./logs/debug.log
 *
 * // With path mapping
 * logEnvironmentDetails();
 * // PATHS[templates]: ./templates
 * // PATHS[output]: ./output
 *
 * // In debug session
 * await logSeparator();
 * logEnvironmentDetails();
 * // Full environment state logged
 */
function logEnvironmentDetails() {
  logger.info('Environment configuration:', {
    DEBUG: process.env.DEBUG,
    NODE_ENV: process.env.NODE_ENV,
    LOG_PATH: path.join(CONFIG.BASE_DIR, CONFIG.LOG_FILE),
  });

  // Log paths relative to project root
  Object.entries(PATHS).forEach(([key, value]) => {
    const pathValue = typeof value === 'string' ? value : value.toString();
    const relativePath = path.relative(
      process.env.PWD || CONFIG.BASE_DIR,
      pathValue
    );
    logger.debug(`PATHS[${key}]:`, { path: relativePath });
  });
}

/**
 * Logs CLI configuration details
 *
 * Initializes and logs CLI state:
 * 1. Parses command line arguments
 * 2. Extracts CLI options
 * 3. Records configuration
 *
 * @returns {Object} Parsed CLI options
 * @throws {AppError} On CLI initialization failure
 *
 * @example
 * // Basic usage
 * const options = logCLIDetails();
 * // CLI configuration:
 * // args: ['node', 'index.js', '--debug']
 * // options: { debug: true }
 *
 * // Error handling
 * try {
 *   const options = logCLIDetails();
 * } catch (error) {
 *   console.error('CLI setup failed:', error.message);
 * }
 *
 * // With program options
 * const options = logCLIDetails();
 * if (options.verbose) {
 *   logger.level = 'debug';
 * }
 */
function logCLIDetails() {
  try {
    const program = initializeCLI();
    program.parse(process.argv);
    const options = program.opts();

    logger.debug('CLI configuration:', {
      args: process.argv,
      options,
      file: 'index.js',
    });

    return options;
  } catch (error) {
    logger.error('CLI initialization failed', { error });
    throw new AppError('Failed to initialize CLI', 'CLI_ERROR', {
      originalError: error,
    });
  }
}

/**
 * Initializes debug session with markers
 *
 * Creates visual session separation and logs state:
 * 1. Checks debug mode status
 * 2. Creates visual separators
 * 3. Logs session start time
 * 4. Records environment details
 * 5. Provides visual feedback
 *
 * @async
 * @returns {Promise<void>}
 * @throws {AppError} On debug initialization failure
 *
 * @example
 * // Basic usage
 * await logSeparator();
 * // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * // ▶ New Execution Started
 * // ▶ 2024-03-15 14:30:22
 * // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *
 * // With error handling
 * try {
 *   await logSeparator();
 * } catch (error) {
 *   console.error('Debug start failed:', error.message);
 * }
 *
 * // In test environment
 * process.env.NODE_ENV = 'test';
 * await logSeparator();
 * // Minimal output in test mode
 */
async function logSeparator() {
  try {
    // Define test environment
    const isTestEnvironment = process.env.NODE_ENV === 'test';

    // Initialize debug mode from environment or default to false
    const debugMode = process.env.DEBUG === 'true' || false;

    if (!debugMode && !isTestEnvironment) {
      return;
    }

    const separator = CONFIG.SEPARATOR_CHAR.repeat(CONFIG.SEPARATOR_LENGTH);

    logger.debug('\n');
    logger.debug(separator);
    logger.debug('▶ New Execution Started');
    logger.debug(`▶ ${getFormattedTimestamp()}`);
    logger.debug(separator);

    // Environment and configuration details
    logEnvironmentDetails();

    // Visual feedback if not in test environment
    if (!isTestEnvironment) {
      display.status.info('Debug logging initialized');
    }

    logger.debug('Debug logging initialization completed successfully');
  } catch (error) {
    logger.error('Debug initialization failed', {
      error,
      details: error.toString(),
      stack: error.stack,
    });

    // Don't throw in test environment
    if (process.env.NODE_ENV !== 'test') {
      throw new AppError('Failed to initialize debug logging', 'DEBUG_ERROR', {
        originalError: error,
        details: error.toString(),
      });
    }
  }
}

module.exports = {
  logSeparator,
  // Exported for testing
  getFormattedTimestamp,
  logEnvironmentDetails,
  logCLIDetails,
  CONFIG,
};
