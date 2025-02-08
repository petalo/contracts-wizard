/**
 * @fileoverview Logical AND helper for Handlebars
 *
 * Provides a logical AND operation helper that:
 * - Handles multiple arguments
 * - Supports type coercion
 * - Processes HTML-wrapped content
 * - Handles null/undefined values
 *
 * Functions:
 * - and: Main logical AND function
 *
 * Constants:
 * - HANDLEBARS_CONFIG: Configuration for error messages and styling
 *
 * Flow:
 * 1. Extract values from arguments
 * 2. Convert values to booleans
 * 3. Perform AND operation
 * 4. Return result with proper Handlebars formatting
 *
 * Error Handling:
 * - Handles missing arguments gracefully
 * - Provides formatted error messages
 * - Logs detailed error information
 * - Returns safe HTML string for errors
 *
 * @module @/utils/template-processor/handlebars/helpers/logic/and
 * @requires handlebars
 * @requires @/utils/common/logger
 * @requires @/config/handlebars-config
 */

const handlebars = require('handlebars');
const { logger } = require('@/utils/common/logger');
const { HANDLEBARS_CONFIG } = require('@/config/handlebars-config');
const { extractValue } = require('../value/extract');

/**
 * Performs a logical AND operation on all provided arguments
 *
 * @param {...*} args - Arguments to evaluate
 * @returns {boolean} True if all arguments are truthy, false otherwise
 */
function and() {
  try {
    // Extract all arguments except the last one (options)
    const args = Array.prototype.slice.call(arguments, 0, -1);
    const options = arguments[arguments.length - 1];

    logger.debug('and helper - raw values:', {
      args,
      argsLength: args.length,
      options: options ? 'has options' : 'no options',
      fn: options?.fn ? 'has fn' : 'no fn',
      inverse: options?.inverse ? 'has inverse' : 'no inverse',
    });

    // Process each argument
    const results = args.map((arg) => {
      const extracted = extractValue(arg);
      logger.debug('and helper - extracted value:', {
        original: arg,
        extracted,
        type: typeof extracted,
      });
      return !!extracted;
    });

    const result = results.every(Boolean);

    logger.debug('and helper - result:', {
      results,
      finalResult: result,
    });

    // If used as a block helper
    if (options && typeof options.fn === 'function') {
      return result ? options.fn(this) : options.inverse(this);
    }

    return result;
  } catch (error) {
    logger.error('Error in and helper:', {
      error,
      args: Array.prototype.slice.call(arguments),
      stack: error.stack,
    });
    return new handlebars.SafeString(
      `<span class="${HANDLEBARS_CONFIG.emptyValue.class}" data-field="and">${HANDLEBARS_CONFIG.errorMessages.processingError.replace('{type}', 'and')}</span>`
    );
  }
}

module.exports = and;
