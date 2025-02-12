/**
 * @file PapaParse Configuration
 *
 * Defines configuration settings for CSV parsing using PapaParse:
 * - Default parsing options
 * - Type conversion settings
 * - Error handling configuration
 *
 * @module @/config/papaparse
 */

/**
 * Default configuration for PapaParse in Node.js environment
 * @type {object}
 */
const PAPAPARSE_CONFIG = {
  // Basic parsing options
  header: true,
  skipEmptyLines: true,
  delimiter: ',',
  comments: '#',

  // Type handling
  dynamicTyping: true,

  // Header handling
  transformHeader: (header) => header.trim(),

  // Error handling
  keepEmptyRows: false,
};

/**
 * Configuration for CSV generation
 * @type {object}
 */
const UNPARSE_CONFIG = {
  quotes: true,
  quoteChar: '"',
  escapeChar: '"',
  delimiter: ',',
  header: true,
  newline: '\r\n',
};

// Prevent runtime modifications
Object.freeze(PAPAPARSE_CONFIG);
Object.freeze(UNPARSE_CONFIG);

module.exports = {
  PAPAPARSE_CONFIG,
  UNPARSE_CONFIG,
};
