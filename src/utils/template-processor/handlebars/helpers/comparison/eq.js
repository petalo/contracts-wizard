/**
 * @file Equality comparison helper for Handlebars
 *
 * Provides a comprehensive equality comparison helper that can handle:
 * - String values (case-insensitive)
 * - HTML-wrapped content
 * - Numeric values with type coercion
 * - Boolean values and their string representations
 * - Null/undefined values
 *
 * Functions:
 * - eq: Main comparison function for equality checks
 *
 * Constants:
 * - HANDLEBARS_CONFIG: Configuration for error messages and styling
 *
 * Flow:
 * 1. Extract values from HTML or objects
 * 2. Handle null/undefined values
 * 3. Convert string booleans to actual booleans
 * 4. Perform type-specific comparisons
 * 5. Return result with proper Handlebars formatting
 *
 * Error Handling:
 * - Handles undefined/null values gracefully
 * - Provides formatted error messages for processing failures
 * - Logs detailed error information for debugging
 * - Returns safe HTML string for error display
 *
 * @module @/utils/template-processor/handlebars/helpers/comparison/eq
 * @requires handlebars
 * @requires @/utils/common/logger
 * @requires @/config/handlebars-config
 */

const handlebars = require('handlebars');
const { logger } = require('@/utils/common/logger');
const { HANDLEBARS_CONFIG } = require('@/config/handlebars-config');
const { extractValue } = require('../value/extract');

/**
 * Compares two values for equality with type coercion and HTML content extraction
 *
 * @param {*} value1 - First value to compare
 * @param {*} value2 - Second value to compare
 * @param {object} options - Handlebars options object
 * @returns {boolean|string} True if values are equal, false otherwise
 * @example
 * // Basic string comparison
 * eq("hello", "HELLO") // returns true
 *
 * // HTML content comparison
 * eq('<span>value</span>', 'value') // returns true
 *
 * // Type coercion
 * eq("42", 42) // returns true
 *
 * // Boolean comparison
 * eq("true", true) // returns true
 * eq("false", false) // returns true
 */
function eq(value1, value2, options) {
  try {
    logger.debug('eq helper comparison - raw values:', {
      value1,
      value2,
      value1Type: typeof value1,
      value2Type: typeof value2,
      value1IsHtml: typeof value1 === 'string' && value1.includes('<span'),
      value2IsHtml: typeof value2 === 'string' && value2.includes('<span'),
      options: options ? 'has options' : 'no options',
      fn: options?.fn ? 'has fn' : 'no fn',
      inverse: options?.inverse ? 'has inverse' : 'no inverse',
      this: this,
      context: this?.data?.root,
      currentItem: this?.data?.root?.items?.[this?.data?.index],
    });

    // Extract values from HTML content or objects
    let extracted1 = extractValue(value1);
    let extracted2 = extractValue(value2);

    logger.debug('eq helper comparison - after extraction:', {
      extracted1,
      extracted2,
      extracted1Type: typeof extracted1,
      extracted2Type: typeof extracted2,
    });

    // Si alguno de los valores es undefined o null, retornar false
    if (
      extracted1 === undefined ||
      extracted1 === null ||
      extracted2 === undefined ||
      extracted2 === null
    ) {
      logger.debug('eq helper comparison - undefined/null values:', {
        extracted1,
        extracted2,
        result: false,
      });
      return options && typeof options.fn === 'function'
        ? options.inverse(this)
        : false;
    }

    // Handle string "true"/"false" conversion to boolean
    if (
      typeof extracted1 === 'string' &&
      (extracted1.toLowerCase() === 'true' ||
        extracted1.toLowerCase() === 'false')
    ) {
      extracted1 = extracted1.toLowerCase() === 'true';
    }
    if (
      typeof extracted2 === 'string' &&
      (extracted2.toLowerCase() === 'true' ||
        extracted2.toLowerCase() === 'false')
    ) {
      extracted2 = extracted2.toLowerCase() === 'true';
    }

    // If either value is a boolean, convert both to boolean for comparison
    if (typeof extracted1 === 'boolean' || typeof extracted2 === 'boolean') {
      const bool1 = Boolean(extracted1);
      const bool2 = Boolean(extracted2);
      const result = bool1 === bool2;

      logger.debug('eq helper comparison - boolean result:', {
        bool1,
        bool2,
        result,
      });

      return options && typeof options.fn === 'function'
        ? result
          ? options.fn(this)
          : options.inverse(this)
        : result;
    }

    // For non-boolean values, convert to strings for case-insensitive comparison
    const str1 = String(extracted1).toLowerCase();
    const str2 = String(extracted2).toLowerCase();
    const result = str1 === str2;

    logger.debug('eq helper comparison - string result:', {
      str1,
      str2,
      result,
    });

    return options && typeof options.fn === 'function'
      ? result
        ? options.fn(this)
        : options.inverse(this)
      : result;
  } catch (error) {
    logger.error('Error in eq helper:', {
      error,
      value1,
      value2,
      stack: error.stack,
    });
    return new handlebars.SafeString(
      `<span class="${HANDLEBARS_CONFIG.emptyValue.class}" data-field="comparison">${HANDLEBARS_CONFIG.errorMessages.processingError.replace('{type}', 'comparison')}</span>`
    );
  }
}

module.exports = eq;
