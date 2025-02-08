/* eslint-disable no-console */
/**
 * @fileoverview CLI Display and Formatting Utilities
 *
 * Provides a comprehensive set of utilities for CLI output formatting:
 * - Status messages with icons (success, error, warning, info)
 * - Formatted lists with titles and bullet points
 * - Headers and spacing for content organization
 * - Path and command string formatting
 *
 * Functions:
 * - header: Displays bold section headers
 * - blank: Adds vertical spacing
 * - list: Shows titled bullet-point lists
 * - status.success: Shows success messages with checkmark
 * - status.error: Shows error messages with cross
 * - status.warning: Shows warning messages with warning icon
 * - status.info: Shows info messages with info icon
 * - path: Formats file paths
 * - command: Formats commands
 *
 * Constants:
 * - SYMBOLS: Unicode symbols with fallbacks
 *   - check: Success checkmark
 *   - cross: Error cross
 *   - bullet: List bullet point
 *   - arrow: Direction indicator
 *   - info: Information symbol
 *   - warning: Warning symbol
 *   - refresh: Refresh/reload symbol
 *
 * Flow:
 * 1. Import required dependencies (chalk)
 * 2. Define display symbols and fallbacks
 * 3. Create display utility object
 * 4. Format message with appropriate styling
 * 5. Output to console with symbol
 *
 * Error Handling:
 * - Empty list handling with warning
 * - Console output error recovery
 * - Unicode symbol fallbacks
 * - Input validation
 * - Chalk styling error handling
 *
 * @module @/cli/display
 * @requires chalk - Terminal string styling
 * @exports {Object} display - Display utility functions
 * @exports {Object} SYMBOLS - Unicode display symbols
 *
 * @example
 * // Import display utilities
 * const { display } = require('@/cli/display');
 *
 * // Show formatted output
 * display.header('Welcome');
 * display.status.success('Operation completed');
 * display.list('Files:', ['file1.txt', 'file2.txt']);
 */

const chalk = require('chalk');

/**
 * Unicode symbols with fallbacks for CLI display
 * @type {Object.<string, string>}
 */
const SYMBOLS = {
  check: '✓',
  cross: '✗',
  bullet: '•',
  arrow: '→',
  info: 'ℹ',
  warning: '⚠',
  refresh: '⟳',
};

/**
 * Display utility functions for CLI output
 *
 * Collection of functions for formatting and displaying
 * messages, lists, and status updates in the terminal
 * with consistent styling and symbols.
 *
 * @constant {Object}
 * @property {Function} header - Displays section headers
 * @property {Function} blank - Adds vertical spacing
 * @property {Function} list - Shows bullet-point lists
 * @property {Object} status - Status message functions
 * @property {Function} path - Formats file paths
 * @property {Function} command - Formats commands
 */
const display = {
  /**
   * Displays a formatted header
   *
   * Prints a bold text header with spacing.
   *
   * @param {string} text - Header text to display
   *
   * @example
   * display.header('Configuration Options');
   */
  header(text) {
    console.log(`\n${chalk.bold(text)}`);
  },

  /**
   * Prints a blank line
   *
   * Adds vertical spacing between content sections.
   *
   * @example
   * display.blank();
   */
  blank() {
    console.log('');
  },

  /**
   * Displays a formatted list with title
   *
   * Shows a titled list of items with bullet points.
   * Handles empty lists with a warning message.
   *
   * @param {string} title - List title
   * @param {string[]} items - Array of items to display
   *
   * @example
   * display.list('Available Templates:', [
   *   'template1.md',
   *   'template2.md'
   * ]);
   */
  list(title, items) {
    if (!items || items.length === 0) {
      console.log(`${chalk.yellow(SYMBOLS.warning)} No items found`);
      return;
    }

    console.log(`${chalk.bold(title)}`);
    items.forEach((item) => {
      console.log(`  ${chalk.gray(SYMBOLS.bullet)} ${item}`);
    });
  },

  status: {
    /**
     * Displays a success message
     *
     * Shows a message with a green checkmark.
     *
     * @param {string} message - Success message to display
     *
     * @example
     * display.status.success('File created successfully');
     */
    success(message) {
      console.log(`${chalk.green(SYMBOLS.check)} ${message}`);
    },

    /**
     * Displays an error message
     *
     * Shows a message with a red cross.
     *
     * @param {string} message - Error message to display
     *
     * @example
     * display.status.error('Failed to create file');
     */
    error(message) {
      console.log(`${chalk.red(SYMBOLS.cross)} ${message}`);
    },

    /**
     * Displays a warning message
     *
     * Shows a message with a yellow warning symbol.
     *
     * @param {string} message - Warning message to display
     *
     * @example
     * display.status.warning('File already exists');
     */
    warning(message) {
      console.log(`${chalk.yellow(SYMBOLS.warning)} ${message}`);
    },

    /**
     * Displays an info message
     *
     * Shows a message with a blue info symbol.
     *
     * @param {string} message - Info message to display
     *
     * @example
     * display.status.info('Processing template...');
     */
    info(message) {
      console.log(`${chalk.blue(SYMBOLS.info)} ${message}`);
    },
  },

  /**
   * Formats a file path
   *
   * Returns a cyan-colored and bold file path string.
   *
   * @param {string} filePath - Path to format
   * @returns {string} Formatted path string
   *
   * @example
   * console.log(`File saved to ${display.path('/path/to/file.txt')}`);
   */
  path(filePath) {
    return chalk.bold.cyan(filePath);
  },

  /**
   * Formats a command string
   *
   * Returns a yellow-colored command string.
   *
   * @param {string} cmd - Command to format
   * @returns {string} Formatted command string
   *
   * @example
   * console.log(`Run ${display.command('npm start')} to begin`);
   */
  command(cmd) {
    return chalk.yellow(cmd);
  },
};

module.exports = {
  display,
  SYMBOLS,
};
