/**
 * @file Environment Configuration Logging System
 *
 * Provides a dedicated logging system for environment configuration details,
 * designed to avoid circular dependencies with the main logger. Handles
 * path resolution, environment variable logging, and directory structure
 * reporting.
 *
 * Functions:
 * - logEnvironmentDetails: Logs environment configuration and paths
 *
 * Constants:
 * - None
 *
 * Flow:
 * 1. Receive logger instance and paths configuration
 * 2. Log environment variables state
 * 3. Process and log directory paths
 * 4. Handle path resolution and relative paths
 *
 * Error Handling:
 * - Invalid path resolution
 * - Missing environment variables
 * - Path conversion failures
 *
 * @module @/config/env-logger
 * @requires path
 */

const path = require('path');

/**
 * Logs environment configuration details
 *
 * Records the current state of environment variables and directory paths.
 * Processes paths to show them relative to project root for better
 * readability. Handles both string paths and path objects.
 *
 * @param {object} logger - Logger instance with info() and debug() methods
 * @param {object} paths - Application paths configuration
 * @param {string} paths.output - Output directory path
 * @param {string} paths.templates - Templates directory path
 * @param {string} paths.css - CSS files directory path
 * @param {string} paths.images - Image files directory path
 * @returns {void}
 *
 * @example
 * // Log environment with provided logger
 * logEnvironmentDetails(logger, {
 *   output: '/path/to/output',
 *   templates: '/path/to/templates'
 * });
 */
function logEnvironmentDetails(logger, paths) {
  logger.info('Environment configuration:', {
    DEBUG: process.env.DEBUG,
    NODE_ENV: process.env.NODE_ENV,
    LOG_PATH: path.join(process.cwd(), process.env.LOG_DIR || 'logs'),
  });

  // Log paths relative to project root
  Object.entries(paths).forEach(([key, value]) => {
    const pathValue = typeof value === 'string' ? value : value.toString();
    const relativePath = path.relative(
      process.env.PWD || process.cwd(),
      pathValue
    );
    logger.debug(`PATHS[${key}]:`, { path: relativePath });
  });
}

module.exports = { logEnvironmentDetails };
