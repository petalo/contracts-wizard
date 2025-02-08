/**
 * @fileoverview Value extraction utilities for Handlebars helpers
 *
 * Provides utility functions for extracting values from:
 * - HTML-wrapped content
 * - SafeString instances
 * - Objects with string properties
 * - Various data types
 *
 * Functions:
 * - extractValue: Main value extraction function
 * - extractFromHtml: HTML content extractor
 * - extractFromObject: Object value extractor
 *
 * Constants:
 * - HTML_PATTERNS: Regular expressions for HTML parsing
 * - TYPE_HANDLERS: Value extraction handlers by type
 *
 * Flow:
 * 1. Identify value type
 * 2. Select appropriate extractor
 * 3. Process value with extractor
 * 4. Clean and format result
 * 5. Return extracted value
 *
 * Error Handling:
 * - Handles null/undefined values
 * - Manages invalid HTML content
 * - Logs extraction errors
 * - Returns safe default values
 *
 * @module @/utils/template-processor/handlebars/helpers/value/extract
 * @requires handlebars
 * @requires @/utils/common/logger
 * @requires @/config/handlebars-config
 */

const handlebars = require('handlebars');
const { logger } = require('@/utils/common/logger');

/**
 * Extracts the actual value from various types of input
 *
 * @param {*} value - The value to extract
 * @returns {*} The extracted value
 */
function extractValue(value) {
  try {
    logger.debug('extractValue called with:', {
      value,
      type: typeof value,
      isObject: value && typeof value === 'object',
      hasString:
        value && typeof value.toString === 'function' && value.toString(),
      isSafeString: value instanceof handlebars.SafeString,
    });

    // If it's a SafeString, extract its content
    if (value instanceof handlebars.SafeString) {
      const stringValue = value.toString();
      // If it's a missing value placeholder, return empty string
      if (stringValue.includes('missing-value') && stringValue.includes('[[')) {
        return '';
      }
      // If it's an imported value, extract the content
      if (stringValue.includes('imported-value')) {
        const match = stringValue.match(/>([^<]+)</);
        return match ? match[1] : stringValue;
      }
      return stringValue;
    }

    // If it's an object with a toString method
    if (value && typeof value === 'object' && value.toString) {
      const stringValue = value.toString();
      // If it's a missing value placeholder, return empty string
      if (stringValue.includes('missing-value') && stringValue.includes('[[')) {
        return '';
      }
      // If it's an imported value, extract the content
      if (stringValue.includes('imported-value')) {
        const match = stringValue.match(/>([^<]+)</);
        return match ? match[1] : stringValue;
      }
      return stringValue;
    }

    // For other values, return as is
    return value;
  } catch (error) {
    logger.error('Error in extractValue:', {
      error,
      value,
      stack: error.stack,
    });
    return '';
  }
}

/**
 * Helper function to convert string values to booleans when appropriate
 * @param {string} value - The value to convert
 * @returns {boolean|string} Converted value
 */
function convertToBoolean(value) {
  if (typeof value !== 'string') {
    return value;
  }

  const lowercaseValue = value.toLowerCase().trim();
  if (lowercaseValue === 'true') return true;
  if (lowercaseValue === 'false') return false;
  return value;
}

module.exports = {
  extractValue,
  convertToBoolean, // Exported for testing
};
