/**
 * @file Logical NOT helper for Handlebars
 *
 * Provides a logical NOT operation helper that:
 * - Handles boolean negation
 * - Supports type coercion
 * - Processes HTML-wrapped content
 * - Handles null/undefined values
 *
 * Functions:
 * - not: Main logical NOT function
 *
 * Constants:
 * - HANDLEBARS_CONFIG: Configuration for error messages and styling
 *
 * Flow:
 * 1. Extract value from argument
 * 2. Convert value to boolean
 * 3. Perform NOT operation
 * 4. Return result with proper Handlebars formatting
 *
 * Error Handling:
 * - Handles missing argument gracefully
 * - Provides formatted error messages
 * - Logs detailed error information
 * - Returns safe HTML string for errors
 *
 * @module @/utils/template-processor/handlebars/helpers/logic/not
 * @requires handlebars
 * @requires @/utils/common/logger
 * @requires @/config/handlebars-config
 */

const handlebars = require('handlebars');
const { logger } = require('@/utils/common/logger');
const { HANDLEBARS_CONFIG } = require('@/config/handlebars-config');
const { extractValue } = require('../value/extract');

/**
 * Performs a logical NOT operation on the provided argument
 *
 * @param {*} value - Value to negate
 * @returns {boolean} True if the value is falsy, false if truthy
 */
function not(value, options) {
  try {
    logger.debug('not helper - raw value:', {
      value,
      type: typeof value,
      options: options ? 'has options' : 'no options',
      fn: options?.fn ? 'has fn' : 'no fn',
      inverse: options?.inverse ? 'has inverse' : 'no inverse',
    });

    const extracted = extractValue(value);
    logger.debug('not helper - extracted value:', {
      original: value,
      extracted,
      type: typeof extracted,
    });

    const result = !extracted;

    logger.debug('not helper - result:', {
      result,
    });

    // If used as a block helper
    if (options && typeof options.fn === 'function') {
      return result ? options.fn(this) : options.inverse(this);
    }

    return result;
  } catch (error) {
    logger.error('Error in not helper:', {
      error,
      value,
      stack: error.stack,
    });
    return new handlebars.SafeString(
      `<span class="${HANDLEBARS_CONFIG.emptyValue.class}" data-field="not">${HANDLEBARS_CONFIG.errorMessages.processingError.replace('{type}', 'not')}</span>`
    );
  }
}

module.exports = not;
