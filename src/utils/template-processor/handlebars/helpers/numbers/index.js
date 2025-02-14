/**
 * @file Number Formatting Helper System
 *
 * Provides core number formatting utilities that can be used by other formatters:
 * - Base number formatting
 * - Number parsing and extraction
 * - Format options validation
 *
 * Functions:
 * - formatNumber: Main number formatting function
 * - formatNumberHelper: Handlebars helper wrapper
 * - extractNumericValue: Extracts numeric value from input
 * - validateFormatOptions: Validates formatting options
 * - formatNumberCore: Core formatting logic
 *
 * Flow:
 * 1. Extract numeric value from input
 * 2. Validate formatting options
 * 3. Apply core formatting logic
 * 4. Add style-specific symbols
 *
 * Error Handling:
 * - Invalid numbers return original string
 * - Null/undefined return empty string
 * - Objects are searched for numeric properties
 * - Parsing errors return original value
 *
 * @module @/utils/template-processor/handlebars/helpers/numbers
 * @requires @/config/locale
 * @requires @/utils/common/logger
 * @requires handlebars
 * @requires numeral
 */

const { logger } = require('@/utils/common/logger');
const handlebars = require('handlebars');
const numeral = require('numeral');
const { LOCALE_CONFIG } = require('@/config/locale');

// Explicitly import Spanish locale for extractNumericValue
require('numeral/locales/es');
numeral.locale('es');

/**
 * Default formatting options by style
 * @constant {object}
 */
const DEFAULT_OPTIONS = {
  decimal: {
    minDecimals: null, // Use original decimals
    maxDecimals: null, // Use original decimals
  },
  percent: {
    minDecimals: 0,
    maxDecimals: 0,
  },
  currency: {
    minDecimals: 2,
    maxDecimals: 2,
  },
};

/**
 * Extracts numeric value from various input types
 *
 * Attempts to extract a numeric value from:
 * - Direct numbers
 * - String representations (both English and Spanish formats)
 * - Objects with numeric properties
 *
 * @param {*} value - Input value to process
 * @returns {number|null} Extracted number or null if invalid
 *
 * @example
 * // Direct number
 * extractNumericValue(123.45)
 * // returns: 123.45
 *
 * // Spanish format string
 * extractNumericValue("1.234,56")
 * // returns: 1234.56
 *
 * // Object with numeric property
 * extractNumericValue({ numero: 123.45 })
 * // returns: 123.45
 *
 * // Invalid input
 * extractNumericValue("invalid")
 * // returns: null
 */
function extractNumericValue(value) {
  logger.debug('Extracting numeric value:', {
    context: '[format]',
    filename: 'numbers/index.js',
    value,
    type: typeof value,
    isObject: typeof value === 'object' && value !== null,
    isString: typeof value === 'string',
    isNumber: typeof value === 'number',
  });

  if (value === null || value === undefined) {
    return null;
  }

  // If it's already a number, return it
  if (typeof value === 'number' && isFinite(value)) {
    return value;
  }

  // If it's an object, try to find a numeric property
  if (typeof value === 'object' && value !== null) {
    // If it's an object with specific currency properties
    if (value.decimal || value.EUR || value.USD) {
      const numericValue = value.decimal || value.EUR || value.USD;
      logger.debug('Found currency value:', {
        context: '[format]',
        filename: 'numbers/index.js',
        numericValue,
        source: 'currency_object',
      });
      return extractNumericValue(numericValue);
    }
    // If it's an object with other numeric properties
    const numericValue =
      value.numero || value.number || value.value || value.importe_numero;
    if (numericValue !== undefined) {
      logger.debug('Found numeric property:', {
        context: '[format]',
        filename: 'numbers/index.js',
        numericValue,
        source: 'numeric_object',
      });
      return extractNumericValue(numericValue);
    }
    return null;
  }

  // If it's a string, try to convert it
  if (typeof value === 'string') {
    // Clean string from spaces and non-numeric characters
    const cleanValue = value.trim();

    // If empty after cleaning, return null
    if (!cleanValue) {
      return null;
    }

    // Try Spanish format (1.234,56)
    if (cleanValue.includes(',')) {
      const spanishValue = cleanValue.replace(/\./g, '').replace(',', '.');
      const parsedSpanish = parseFloat(spanishValue);
      if (!isNaN(parsedSpanish)) {
        logger.debug('Parsed as Spanish format:', {
          context: '[format]',
          filename: 'numbers/index.js',
          original: value,
          cleaned: spanishValue,
          parsed: parsedSpanish,
        });
        return parsedSpanish;
      }
    }

    // Try English format (1234.56)
    const parsedEnglish = parseFloat(cleanValue);
    if (!isNaN(parsedEnglish)) {
      logger.debug('Parsed as English format:', {
        context: '[format]',
        filename: 'numbers/index.js',
        original: value,
        parsed: parsedEnglish,
      });
      return parsedEnglish;
    }
  }

  logger.warn('Failed to extract numeric value:', {
    context: '[format]',
    filename: 'numbers/index.js',
    value,
    type: typeof value,
  });
  return null;
}

/**
 * Validates and normalizes number formatting options
 *
 * @param {object} options - Formatting options
 * @param {string} [options.style='decimal'] - Format style
 * @param {string} [options.currency] - Currency code
 * @param {number} [options.minimumFractionDigits] - Min decimals
 * @param {number} [options.maximumFractionDigits] - Max decimals
 * @returns {object} Validated and normalized options
 *
 * @example
 * // Default options
 * validateFormatOptions()
 * // returns: { style: 'decimal', minimumFractionDigits: null, ... }
 *
 * // Currency options
 * validateFormatOptions({ style: 'currency', currency: 'EUR' })
 * // returns: { style: 'currency', currency: 'EUR', minimumFractionDigits: 2, ... }
 */
function validateFormatOptions(options = {}) {
  const style = (options?.style || 'decimal').toLowerCase();
  const currency = options?.currency;

  // Get default decimals based on style
  const defaults = DEFAULT_OPTIONS[style] || DEFAULT_OPTIONS.decimal;

  const minimumFractionDigits =
    options?.minimumFractionDigits ?? defaults.minDecimals;
  const maximumFractionDigits =
    options?.maximumFractionDigits ?? minimumFractionDigits;

  return {
    style,
    ...(currency && { currency }),
    minimumFractionDigits,
    maximumFractionDigits,
    useGrouping: true,
    numberingSystem: 'latn',
  };
}

/**
 * Core number formatting function
 *
 * Used by both number and currency formatters to ensure consistent
 * number formatting across the application.
 *
 * @param {number} number - Number to format
 * @param {object} options - Formatting options
 * @returns {string} Formatted number without symbols
 *
 * @example
 * // Basic decimal formatting
 * formatNumberCore(1234.5, { style: 'decimal' })
 * // returns: "1.234,5"
 *
 * // Percentage with no decimals
 * formatNumberCore(0.75, { style: 'percent' })
 * // returns: "75"
 *
 * // Currency with fixed decimals
 * formatNumberCore(1234.5, { style: 'currency', minimumFractionDigits: 2 })
 * // returns: "1.234,50"
 */
function formatNumberCore(number, options = {}) {
  const validatedOptions = validateFormatOptions(options);

  try {
    // Adjust number for percentages
    const adjustedNumber =
      validatedOptions.style === 'percent' ? number * 100 : number;

    // Define fallback locales in order of preference
    const fallbackLocales = [
      LOCALE_CONFIG?.fullLocale,
      'es-ES',
      'es',
      'es-419', // Latin American Spanish
      'es-AR', // Argentinian Spanish (known to use same format)
      'en-US', // Last resort
    ].filter(Boolean); // Remove undefined/null values

    // Try each locale until one works
    let formatter = null;
    for (const locale of fallbackLocales) {
      try {
        formatter = new Intl.NumberFormat(locale, {
          style: 'decimal',
          minimumFractionDigits: validatedOptions.minimumFractionDigits || 0,
          maximumFractionDigits: validatedOptions.maximumFractionDigits || 20,
          useGrouping: validatedOptions.useGrouping !== false,
          numberingSystem: 'latn',
        });
        // Test if the formatter works with our number
        formatter.format(1234.56);
        break; // If we get here, the formatter works
      } catch (e) {
        logger.debug(`Locale ${locale} not available, trying next fallback`, {
          context: '[format]',
          filename: 'numbers/index.js',
          error: e.message,
        });
        continue;
      }
    }

    if (!formatter) {
      throw new Error('No valid locale found for number formatting');
    }

    return formatter.format(adjustedNumber);
  } catch (error) {
    logger.error('Error formatting number:', {
      context: '[error]',
      filename: 'numbers/index.js',
      error: error.message,
      stack: error.stack,
      number,
      options: validatedOptions,
      locale: LOCALE_CONFIG?.fullLocale || 'es-ES',
    });
    return String(number);
  }
}

/**
 * Formats a number according to locale and options
 *
 * Main number formatting function that handles various input types
 * and formatting styles.
 *
 * @param {*} value - Value to format
 * @param {object} [options] - Formatting options
 * @param {string} [options.style='decimal'] - Format style
 * @param {string} [options.currency] - Currency code
 * @param {number} [options.minimumFractionDigits] - Min decimals
 * @param {number} [options.maximumFractionDigits] - Max decimals
 * @returns {string} Formatted number
 */
function formatNumber(value, options = {}) {
  try {
    logger.debug('Formatting number:', {
      context: '[format]',
      filename: 'numbers/index.js',
      value,
      type: typeof value,
      options,
    });

    const number = extractNumericValue(value);

    if (number === null) {
      logger.warn('formatNumber: null value detected', {
        context: '[format]',
        filename: 'numbers/index.js',
        value,
        type: typeof value,
      });
      // If the value is a string, return it as is
      if (typeof value === 'string') {
        return value;
      }
      // For null, undefined or other types, return empty string
      return '';
    }

    // Format base number
    let formattedNumber = formatNumberCore(number, options);

    // Add symbols based on style
    if (options.style === 'percent') {
      formattedNumber += ' %';
    } else if (options.style === 'currency' && options.currency === 'EUR') {
      formattedNumber += ' €';
    }

    logger.debug('Number formatted successfully:', {
      context: '[format]',
      filename: 'numbers/index.js',
      input: value,
      extracted: number,
      formatted: formattedNumber,
      options,
    });

    return formattedNumber;
  } catch (error) {
    logger.error('Error in formatNumber:', {
      context: '[error]',
      filename: 'numbers/index.js',
      error: error.message,
      stack: error.stack,
      value,
      options,
    });
    // En caso de error, devolver cadena vacía
    return '';
  }
}

/**
 * Handlebars helper for number formatting
 *
 * Wraps the formatted number in an HTML span with appropriate classes
 * and data attributes for styling and tracking.
 *
 * @param {*} value - Value to format
 * @param {object} options - Handlebars options
 * @returns {handlebars.SafeString} HTML-safe string
 */
function formatNumberHelper(value, options) {
  logger.debug('formatNumber helper called:', {
    context: '[format]',
    filename: 'numbers/index.js',
    rawValue: value,
    type: typeof value,
    isObject: typeof value === 'object' && value !== null,
    options: options?.hash,
  });

  try {
    // If the value is a SafeString, extract the real value
    if (value && typeof value === 'object' && value.toString) {
      const stringValue = value.toString();
      if (stringValue.includes('class="imported-value"')) {
        // Extract value from span
        const match = stringValue.match(/>([^<]+)</);
        if (match) {
          value = match[1];
          logger.debug('Extracted value from SafeString:', {
            context: '[format]',
            filename: 'numbers/index.js',
            originalString: stringValue,
            extractedValue: value,
          });
        }
      }
    }

    const formattedNumber = formatNumber(value, options?.hash);

    // If the formatted value is empty, show an error message
    if (!formattedNumber) {
      logger.warn('Invalid or empty number:', {
        context: '[format]',
        filename: 'numbers/index.js',
        value,
        type: typeof value,
        path: options?.data?.root?._currentPath,
      });
      return new handlebars.SafeString(
        `<span class="missing-value" data-field="number">[[number]]</span>`
      );
    }

    // If the formatted value equals the original value and is not a number,
    // it means it couldn't be formatted
    if (formattedNumber === value && isNaN(Number(value))) {
      return new handlebars.SafeString(
        `<span class="missing-value" data-field="number">[[Invalid number]]</span>`
      );
    }

    return new handlebars.SafeString(
      `<span class="imported-value" data-field="number">${handlebars.escapeExpression(formattedNumber)}</span>`
    );
  } catch (error) {
    logger.error('Error in formatNumberHelper:', {
      error: error.message,
      stack: error.stack,
      context: '[template]',
      operation: 'format-number',
      value,
      type: typeof value,
      path: options?.data?.root?._currentPath,
    });
    return new handlebars.SafeString(
      `<span class="missing-value" data-field="number">[[Error formatting number]]</span>`
    );
  }
}

module.exports = {
  formatNumber,
  formatNumberHelper,
  extractNumericValue,
  validateFormatOptions,
  formatNumberCore,
  DEFAULT_OPTIONS,
};
