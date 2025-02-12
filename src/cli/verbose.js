/**
 * @file Verbose Mode Configuration
 *
 * Configures verbose mode output by overriding logger methods
 * to also output to console when verbose mode is enabled.
 *
 * Functions:
 * - configureVerboseMode: Sets up verbose mode logging
 *
 * Flow:
 * 1. Set environment variables for verbose mode
 * 2. Override logger methods to include console output
 * 3. Log initial verbose mode message
 *
 * Error Handling:
 * - Preserves original logger error handling
 * - Maintains logger method context
 *
 * @module @/cli/verbose
 * @requires @/utils/common/logger
 */

/**
 * Configures verbose mode logging
 *
 * @param {object} logger - The logger instance to configure
 * @returns {void}
 */
function configureVerboseMode(logger) {
  // Set environment variables for verbose mode
  process.env.DEBUG = 'true';
  process.env.LOG_LEVEL = 'debug';
  process.env.LOG_TO_CONSOLE = 'true';
  process.env.FORCE_COLOR = 'true';

  // Store original logger methods
  const originalDebug = logger.debug;
  const originalInfo = logger.info;
  const originalWarn = logger.warn;
  const originalError = logger.error;

  // Override logger methods to include console output
  logger.debug = function (message, metadata) {
    // eslint-disable-next-line no-console
    console.log('[DEBUG]', message, metadata);
    return originalDebug.apply(this, arguments);
  };

  logger.info = function (message, metadata) {
    // eslint-disable-next-line no-console
    console.log('[INFO]', message, metadata);
    return originalInfo.apply(this, arguments);
  };

  logger.warn = function (message, metadata) {
    // eslint-disable-next-line no-console
    console.warn('[WARN]', message, metadata);
    return originalWarn.apply(this, arguments);
  };

  logger.error = function (message, metadata) {
    // eslint-disable-next-line no-console
    console.error('[ERROR]', message, metadata);
    return originalError.apply(this, arguments);
  };

  // Log initial verbose mode message
  logger.debug('Verbose mode enabled', {
    context: 'system',
    filename: 'contracts-wizard.js',
    verbose: true,
    debug: process.env.DEBUG,
    argv: process.argv,
  });
}

module.exports = {
  configureVerboseMode,
};
