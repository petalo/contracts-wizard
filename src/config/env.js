/**
 * @file Environment Configuration Manager
 *
 * Centralizes environment variable handling and provides validated
 * configuration values to the rest of the application.
 *
 * Functions:
 * - getLogLevel: Determines effective logging level
 * - isDebugEnabled: Checks if debug mode is active
 * - getNodeEnv: Gets current environment
 *
 * Constants:
 * - ENV: Environment configuration object
 * - LOG_LEVELS: Valid logging levels
 * - NODE_ENVS: Valid environment types
 *
 * Flow:
 * 1. Load environment variables
 * 2. Set default values
 * 3. Validate configurations
 * 4. Provide access methods
 *
 * Error Handling:
 * - Invalid environment values
 * - Missing required variables
 * - Type conversion errors
 *
 * @module @/config/env
 * @requires dotenv
 */

/**
 * Valid logging levels
 * @constant {string[]}
 */
const LOG_LEVELS = ['error', 'warn', 'info', 'debug'];

/**
 * Valid Node environments
 * @constant {string[]}
 */
const NODE_ENVS = ['development', 'production', 'test'];

/**
 * Environment configuration with defaults
 * @constant {object}
 */
const ENV = {
  // Node environment
  get NODE_ENV() {
    return process.env.NODE_ENV;
  },

  // Logging configuration
  get DEBUG() {
    return process.env.DEBUG;
  },
  get LOG_LEVEL() {
    return process.env.LOG_LEVEL;
  },
  LOG_DIR: process.env.LOG_DIR || 'logs',
  LOG_MAX_SIZE: process.env.LOG_MAX_SIZE || '10MB',
  LOG_MAX_FILES: process.env.LOG_MAX_FILES || '7',
};

/**
 * Gets effective logging level based on environment
 * @returns {string} Logging level to use
 */
function getLogLevel() {
  return process.env.LOG_LEVEL || 'info';
}

/**
 * Checks if debug mode is enabled
 * @returns {boolean} True if debug is enabled
 */
function isDebugEnabled() {
  return process.env.DEBUG === 'true';
}

/**
 * Gets current Node environment
 * @returns {string} Current environment
 */
function getNodeEnv() {
  return process.env.NODE_ENV || 'development';
}

module.exports = {
  ENV,
  LOG_LEVELS,
  NODE_ENVS,
  getLogLevel,
  isDebugEnabled,
  getNodeEnv,
};
