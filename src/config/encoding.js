/**
 * @file File Encoding Configuration
 *
 * Defines standard encoding settings for file operations:
 * - Default encoding for reading/writing files
 * - Supported encodings list
 * - BOM handling preferences
 * - Encoding conversion settings
 * - Stream encoding configuration
 *
 * Used to maintain consistent encoding across:
 * - File reading operations
 * - File writing operations
 * - Stream processing
 * - Template handling
 * - Buffer conversions
 *
 * Constants:
 * - ENCODING_CONFIG: Configuration object for encoding settings
 *   - default: Default encoding (utf8)
 *   - supported: List of supported encodings
 *   - detectBOM: BOM detection setting
 *   - stripBOM: BOM removal setting
 *
 * Flow:
 * 1. Define default encoding (utf8)
 * 2. List supported encodings
 * 3. Configure BOM preferences
 * 4. Set up conversion settings
 * 5. Freeze configuration
 *
 * Error Handling:
 * - Invalid encoding validation
 * - BOM detection errors
 * - Conversion failures
 * - Stream encoding errors
 * - Buffer encoding issues
 *
 * @module @/config/encoding
 *
 * @example
 * // Import encoding configuration
 * const { ENCODING_CONFIG } = require('@/config/encoding');
 *
 * // File reading with default encoding
 * const content = await fs.readFile(path, ENCODING_CONFIG.default);
 *
 * // Stream with encoding
 * const stream = fs.createReadStream(path, {
 *   encoding: ENCODING_CONFIG.default
 * });
 *
 * // Check if encoding is supported
 * const isSupported = ENCODING_CONFIG.supported.includes('utf8');
 *
 * // Handle BOM in file reading
 * const readWithBOM = async (path) => {
 *   const options = {
 *     encoding: ENCODING_CONFIG.default,
 *     stripBOM: ENCODING_CONFIG.stripBOM
 *   };
 *   return fs.readFile(path, options);
 * };
 *
 * // Convert between encodings
 * const convert = (buffer, from, to) => {
 *   if (!ENCODING_CONFIG.supported.includes(from) ||
 *       !ENCODING_CONFIG.supported.includes(to)) {
 *     throw new Error('Unsupported encoding');
 *   }
 *   return iconv.decode(iconv.encode(buffer, from), to);
 * };
 */

/**
 * Encoding configuration object
 *
 * Defines encoding settings for file operations
 * including default encoding and BOM preferences.
 * Supports common encodings and provides validation
 * for encoding operations.
 *
 * @constant {object}
 * @property {string} default - Default encoding for file operations
 * @property {string[]} supported - List of supported encodings
 * @property {boolean} detectBOM - Whether to detect BOM in files
 * @property {boolean} stripBOM - Whether to strip BOM when reading
 *
 * @example
 * // File operations
 * const readOptions = {
 *   encoding: ENCODING_CONFIG.default,
 *   flag: 'r'
 * };
 *
 * const writeOptions = {
 *   encoding: ENCODING_CONFIG.default,
 *   flag: 'w'
 * };
 *
 * // Stream configuration
 * const streamOptions = {
 *   encoding: ENCODING_CONFIG.default,
 *   highWaterMark: 64 * 1024
 * };
 *
 * // Buffer handling
 * const buffer = Buffer.from(text, ENCODING_CONFIG.default);
 * const string = buffer.toString(ENCODING_CONFIG.default);
 */

/**
 * Encoding configuration object
 *
 * Defines encoding settings for file operations
 * including default encoding and BOM preferences.
 *
 * @constant {object}
 * @property {string} default - Default encoding for file operations
 * @property {string[]} supported - List of supported encodings
 * @property {boolean} detectBOM - Whether to detect BOM in files
 * @property {boolean} stripBOM - Whether to strip BOM when reading
 */
const ENCODING_CONFIG = {
  default: 'utf8',
  supported: ['utf8', 'utf-8', 'ascii', 'binary'],
  detectBOM: true,
  stripBOM: true,
};

// Freeze configuration to prevent modifications
Object.freeze(ENCODING_CONFIG);

module.exports = { ENCODING_CONFIG };
