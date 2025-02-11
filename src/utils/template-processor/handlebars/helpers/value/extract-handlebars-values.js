/**
 * @file Value extraction utilities for Handlebars helpers
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
    logger.debug('Starting value extraction', {
      context: 'helper',
      operation: 'extract',
      input: {
        type: typeof value,
        isObject: value && typeof value === 'object',
        isSafeString: value instanceof handlebars.SafeString,
        isNull: value === null,
        isUndefined: value === undefined,
        isEmpty: value === '',
      },
    });

    // Handle null and undefined explicitly
    if (value === null || value === undefined) {
      logger.debug('Handling null/undefined value', {
        context: 'helper',
        operation: 'extract',
        type: 'null/undefined',
        value: value,
      });
      return null;
    }

    // Handle string "null" as null (case insensitive)
    if (typeof value === 'string' && value.toLowerCase() === 'null') {
      logger.debug('Converting string "null" to null', {
        context: 'helper',
        operation: 'extract',
        type: 'string-null',
        originalValue: value,
      });
      return null;
    }

    // Handle empty strings (but preserve whitespace)
    if (typeof value === 'string' && value === '') {
      logger.debug('Handling empty string', {
        context: 'helper',
        operation: 'extract',
        type: 'empty-string',
      });
      return '';
    }

    // Handle boolean values and string booleans
    if (typeof value === 'boolean') {
      logger.debug('Processing boolean value', {
        context: 'helper',
        operation: 'extract',
        type: 'boolean',
        value: value,
      });
      return value;
    }

    if (typeof value === 'string') {
      const lowercaseValue = value.toLowerCase().trim();
      if (lowercaseValue === 'true') {
        logger.debug('Converting string "true" to boolean', {
          context: 'helper',
          operation: 'extract',
          type: 'string-boolean',
          originalValue: value,
        });
        return true;
      }
      if (lowercaseValue === 'false') {
        logger.debug('Converting string "false" to boolean', {
          context: 'helper',
          operation: 'extract',
          type: 'string-boolean',
          originalValue: value,
        });
        return false;
      }
    }

    // Handle numbers (including zero)
    if (typeof value === 'number' || (!isNaN(value) && value !== '')) {
      const num = Number(value);
      if (!isNaN(num)) {
        logger.debug('Converting to number', {
          context: 'helper',
          operation: 'extract',
          type: 'number',
          originalValue: value,
          result: num,
        });
        return num;
      }
    }

    // If it's a SafeString, extract its content
    if (value instanceof handlebars.SafeString) {
      const stringValue = value.toString();
      logger.debug('Processing SafeString', {
        context: 'helper',
        operation: 'extract',
        type: 'safe-string',
        value: stringValue,
        length: stringValue.length,
        spaces: (stringValue.match(/\s/g) || []).length,
      });

      // If it's a missing value placeholder, return empty string
      if (stringValue.includes('missing-value') && stringValue.includes('[[')) {
        return '';
      }
      // If it's an imported value with "null", return null
      if (
        stringValue.includes('imported-value') &&
        stringValue.toLowerCase().includes('>null<')
      ) {
        return null;
      }
      // If it's an imported value, extract the content preserving spaces
      if (stringValue.includes('imported-value')) {
        const match = stringValue.match(/data-field="[^"]*"[^>]*>([^<]*)</);
        if (match) {
          const extracted = match[1];
          logger.debug('Extracted from imported-value:', {
            extracted,
            length: extracted.length,
            spaces: (extracted.match(/\s/g) || []).length,
            encoded: encodeURIComponent(extracted),
            charCodes: Array.from(extracted).map((c) => c.charCodeAt(0)),
          });
          // Try to convert to appropriate type
          if (extracted === 'true') return true;
          if (extracted === 'false') return false;
          if (!isNaN(extracted) && extracted !== '') return Number(extracted);
          // Return the string value exactly as is
          return extracted;
        }
        return stringValue;
      }
      return stringValue;
    }

    // If it's an object with a toString method
    if (value && typeof value === 'object' && value.toString) {
      const stringValue = value.toString();
      logger.debug('Processing object with toString:', {
        stringValue,
        length: stringValue.length,
        spaces: (stringValue.match(/\s/g) || []).length,
        encoded: encodeURIComponent(stringValue),
        charCodes: Array.from(stringValue).map((c) => c.charCodeAt(0)),
      });

      // If it's a missing value placeholder, return empty string
      if (stringValue.includes('missing-value') && stringValue.includes('[[')) {
        return '';
      }
      // If it's an imported value with "null", return null
      if (
        stringValue.includes('imported-value') &&
        stringValue.toLowerCase().includes('>null<')
      ) {
        return null;
      }
      // If it's an imported value, extract the content preserving spaces
      if (stringValue.includes('imported-value')) {
        const match = stringValue.match(/data-field="[^"]*"[^>]*>([^<]*)</);
        if (match) {
          const extracted = match[1];
          logger.debug('Extracted from imported-value:', {
            extracted,
            length: extracted.length,
            spaces: (extracted.match(/\s/g) || []).length,
            encoded: encodeURIComponent(extracted),
            charCodes: Array.from(extracted).map((c) => c.charCodeAt(0)),
          });
          // Try to convert to appropriate type
          if (extracted === 'true') return true;
          if (extracted === 'false') return false;
          if (!isNaN(extracted) && extracted !== '') return Number(extracted);
          // Return the string value exactly as is
          return extracted;
        }
        return stringValue;
      }
      return stringValue;
    }

    // Handle string values (preserving whitespace)
    if (typeof value === 'string') {
      logger.debug('Processing string value', {
        context: 'helper',
        operation: 'extract',
        type: 'string',
        value: value,
        length: value.length,
        spaces: (value.match(/\s/g) || []).length,
      });
      return value;
    }

    // For any other type, convert to string
    const stringValue = String(value);
    logger.debug('Converting to string', {
      context: 'helper',
      operation: 'extract',
      type: 'other',
      originalType: typeof value,
      result: stringValue,
      length: stringValue.length,
      spaces: (stringValue.match(/\s/g) || []).length,
    });
    return stringValue;
  } catch (error) {
    logger.error('Value extraction failed', {
      context: 'error',
      operation: 'extract',
      error: {
        message: error.message,
        code: error.code,
        stack: error.stack,
      },
      input: {
        type: typeof value,
        value: value,
      },
    });
    return null;
  }
}

/**
 * Helper function to convert string values to booleans when appropriate
 * @param {string} value - The value to convert
 * @returns {boolean|string} Converted value
 */
function convertToBoolean(value) {
  if (typeof value === 'boolean') {
    return value;
  }

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
