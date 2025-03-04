/**
 * @file String formatting helpers
 *
 * Provides string formatting utilities including:
 * - Capitalization
 * - Case conversion
 * - Text transformation
 *
 * @module @/utils/template-processor/handlebars/helpers/string-helpers
 * @requires @/utils/common/logger - Structured logging
 */

const { logger } = require('@/utils/common/logger');

/**
 * Extracts text content from HTML string
 *
 * @param {string} htmlString - HTML string to process
 * @returns {string} Extracted text content
 */
function extractTextContent(htmlString) {
  if (typeof htmlString !== 'string') {
    return String(htmlString || '');
  }

  // Check if the string appears to be HTML
  if (htmlString.includes('<span') && htmlString.includes('</span>')) {
    // Extract content between > and <
    const match = htmlString.match(/>([^<]*)</);
    if (match && match[1]) {
      return match[1];
    }
  }

  // Return the original string if no match
  return htmlString;
}

/**
 * Extracts data-field attribute from HTML string
 *
 * @param {string} htmlString - HTML string to process
 * @returns {string} Extracted data-field value or empty string
 */
function extractDataField(htmlString) {
  if (typeof htmlString !== 'string') {
    return '';
  }

  // Extract data-field attribute
  const match = htmlString.match(/data-field="([^"]+)"/);
  if (match && match[1]) {
    return match[1];
  }

  return '';
}

/**
 * Formats a string with various transformations
 *
 * @param {string} value - String to format
 * @param {object} options - Handlebars options object
 * @returns {string} Formatted string
 */
function formatString(value, options) {
  try {
    logger.debug('formatString helper called', {
      context: '[helper]',
      filename: 'format-string.js',
      value,
      options: options.hash,
    });

    // Handle null or undefined value - return missing value indicator
    if (value === null || value === undefined) {
      const dataField = options.hash.field || 'formatString';
      const result = `<span class="missing-value" data-field="${dataField}">[[${dataField}]]</span>`;

      logger.debug('formatString handling null/undefined value', {
        context: '[helper]',
        filename: 'format-string.js',
        value,
        result,
      });

      return result;
    }

    // Handle complex object structure
    let inputStr = '';
    let dataField = '';

    // Check if value is an object with a string property
    if (value && typeof value === 'object' && value.string) {
      inputStr = value.string;

      // Extract data-field from the HTML string in value.string
      dataField = extractDataField(inputStr);

      logger.debug('formatString parsing object', {
        context: '[helper]',
        filename: 'format-string.js',
        inputStr,
        dataField,
      });
    } else {
      // Use value directly
      inputStr = String(value || '');
      dataField = extractDataField(inputStr);
    }

    // Extract the actual text content
    let str = extractTextContent(inputStr);

    // Handle empty string case
    if (!str) {
      dataField = dataField || options.hash.field || 'string';
      return `<span class="missing-value" data-field="${dataField}">[[${dataField}]]</span>`;
    }

    // Apply transformations
    if (options.hash.capitalize) {
      str = str.charAt(0).toUpperCase() + str.slice(1);
    }

    if (options.hash.upper) {
      str = str.toUpperCase();
    }

    if (options.hash.lower) {
      str = str.toLowerCase();
    }

    // We'll add other transformations as needed

    if (!dataField) {
      dataField = options.hash.field || 'string';
    }

    // Create the formatted output with the original data-field
    const result = `<span class="imported-value" data-field="${dataField}">${str}</span>`;

    logger.debug('formatString result', {
      context: '[helper]',
      filename: 'format-string.js',
      dataField,
      str,
      result,
    });

    return result;
  } catch (error) {
    logger.error('Error in formatString helper', {
      context: '[helper]',
      error: error.message,
      stack: error.stack,
    });

    return '[[Error formatting text]]';
  }
}

module.exports = {
  formatString,
  extractDataField,
  extractTextContent,
};
