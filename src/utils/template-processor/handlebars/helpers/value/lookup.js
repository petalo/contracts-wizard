/**
 * @file Lookup helper for accessing nested object properties
 *
 * Provides a helper for accessing nested properties that can handle:
 * - Plain objects with nested properties
 * - HTML-wrapped values in string format
 * - Numeric values embedded in HTML
 * - Special handling for string properties
 *
 * Functions:
 * - lookup: Main property lookup function
 * - extractValue: Value extraction utility
 *
 * Constants:
 * - PROPERTY_PATTERNS: Regular expressions for property access
 * - TYPE_HANDLERS: Value extraction handlers by type
 *
 * Flow:
 * 1. Validate input object
 * 2. Process property path
 * 3. Extract value if found
 * 4. Handle special cases
 * 5. Return formatted result
 *
 * Error Handling:
 * - Handles undefined objects
 * - Manages missing properties
 * - Logs lookup errors
 * - Returns undefined for invalid paths
 *
 * @module @/utils/template-processor/handlebars/helpers/value/lookup
 * @requires handlebars
 * @requires @/utils/common/logger
 */

const { logger } = require('@/utils/common/logger');
const { extractValue } = require('./extract');

/**
 * Extracts values from nested objects and HTML content
 *
 * @param {object} obj - Source object to extract value from
 * @param {string} prop - Property path to look up
 * @returns {any} Extracted value or undefined if not found
 * @throws {TypeError} When obj is not an object
 */
function lookup(obj, prop) {
  try {
    logger.debug('lookup helper input:', {
      obj,
      prop,
      type: obj ? typeof obj : null,
      hasString: obj && obj.string,
    });

    if (!obj || typeof obj !== 'object') return undefined;

    // Si el objeto tiene una propiedad string y no se especifica una propiedad
    if (!prop && obj.string) {
      logger.debug('lookup found object with string property:', {
        string: obj.string,
      });
      return extractValue(obj);
    }

    // If we are looking for a specific property and it exists
    if (prop in obj) {
      const value = obj[prop];
      logger.debug('lookup found direct property:', { value });

      // Si el valor es un objeto, intentar extraer su valor
      if (value && typeof value === 'object') {
        return extractValue(value);
      }

      return value;
    }

    return undefined;
  } catch (error) {
    logger.error('Error in lookup helper:', {
      error,
      obj,
      prop,
    });
    return undefined;
  }
}

module.exports = lookup;
