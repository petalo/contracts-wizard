/**
 * @file Currency Formatting Helper System
 *
 * Provides currency-specific formatting utilities for handling monetary values
 * in different currencies, with focus on EUR, USD and GBP.
 *
 * Functions:
 * - formatCurrency: Main currency formatting function that handles numeric values
 * - getCurrencySymbol: Gets symbol for currency code (€, $, £)
 * - formatCurrencyHelper: Handlebars helper that wraps formatted currency in HTML
 *
 * Flow:
 * 1. Extract and validate input value
 * 2. Format number according to locale settings
 * 3. Add appropriate currency symbol
 * 4. Wrap in HTML span with data attributes (helper only)
 *
 * Error Handling:
 * - Invalid values return error message in HTML span
 * - Null/undefined/empty values show missing value message
 * - Unsupported currencies use currency code as symbol
 * - All errors are logged with debug context
 *
 * @module @/utils/template-processor/handlebars/helpers/currency
 * @requires @/utils/template-processor/handlebars/helpers/numbers
 * @requires @/utils/common/logger
 * @requires handlebars
 * @requires @/config/locale
 */

const { extractNumericValue, DEFAULT_OPTIONS } = require('../numbers');
const { logger } = require('@/utils/common/logger');
const handlebars = require('handlebars');
const { LOCALE_CONFIG } = require('@/config/locale');

/**
 * Formats a number as currency
 *
 * Handles both English (1000.50) and Spanish (1.000,50) number formats.
 * Defaults to EUR currency if not specified.
 * Always uses Spanish locale for output formatting.
 *
 * @param {*} value - Value to format
 * @param {object} [options] - Formatting options
 * @param {string} [options.currency='EUR'] - Currency code
 * @param {number} [options.minimumFractionDigits] - Minimum fraction digits
 * @param {number} [options.maximumFractionDigits] - Maximum fraction digits
 * @returns {string} Formatted currency
 * @throws {Error} If formatting fails
 *
 * @example
 * // Format number
 * formatCurrency(1000.5)
 * // returns: "1.000,50 €"
 *
 * // Format string in English format
 * formatCurrency("1000.50")
 * // returns: "1.000,50 €"
 *
 * // Format string in Spanish format
 * formatCurrency("1.000,50")
 * // returns: "1.000,50 €"
 *
 * // Format with USD currency
 * formatCurrency(1000.5, { currency: 'USD' })
 * // returns: "1.000,50 $"
 *
 * // Handle invalid input
 * formatCurrency("invalid")
 * // returns: "invalid"
 *
 * // Handle null
 * formatCurrency(null)
 * // returns: ""
 */
function formatCurrency(value, options = {}) {
  try {
    const number = extractNumericValue(value);

    if (number === null) {
      logger.debug('formatCurrency: null value detected', {
        context: '[format]',
        filename: 'currency/index.js',
        value,
        type: typeof value,
      });
      return typeof value === 'string' ? value : '';
    }

    // Get currency code with fallback to EUR
    const currencyCode = (
      typeof options === 'string' ? options : options.currency || 'EUR'
    ).toUpperCase();

    // Get decimal options
    const minDecimals =
      options.minimumFractionDigits ??
      options.minDecimals ??
      DEFAULT_OPTIONS.currency.minDecimals;
    const maxDecimals =
      options.maximumFractionDigits ??
      options.maxDecimals ??
      DEFAULT_OPTIONS.currency.maxDecimals;

    logger.debug('Currency formatting options:', {
      context: '[format]',
      filename: 'currency/index.js',
      currencyCode,
      minDecimals,
      maxDecimals,
      value,
      options,
    });

    // Define fallback locales in order of preference
    const fallbackLocales = [
      LOCALE_CONFIG?.fullLocale,
      'es-ES',
      'es',
      'es-419',
      'es-AR',
      'en-US',
    ].filter(Boolean);

    // Try each locale until one works
    let formatter = null;
    for (const locale of fallbackLocales) {
      try {
        formatter = new Intl.NumberFormat(locale, {
          style: 'decimal',
          minimumFractionDigits: minDecimals,
          maximumFractionDigits: maxDecimals,
          useGrouping: true,
          numberingSystem: 'latn',
        });
        // Test if the formatter works
        formatter.format(1234.56);
        break;
      } catch (e) {
        logger.debug(`Locale ${locale} not available, trying next fallback`, {
          context: '[format]',
          filename: 'currency/index.js',
          error: e.message,
        });
        continue;
      }
    }

    if (!formatter) {
      throw new Error('No valid locale found for currency formatting');
    }

    // Format number and add currency symbol
    const formattedNumber = formatter.format(number);
    const symbol = getCurrencySymbol(currencyCode);

    return `${formattedNumber} ${symbol}`;
  } catch (error) {
    logger.error('Error in formatCurrency:', {
      context: '[error]',
      filename: 'currency/index.js',
      error: error.message,
      stack: error.stack,
      value,
      options,
      locale: LOCALE_CONFIG?.fullLocale || 'es-ES',
    });
    return String(value);
  }
}

/**
 * Gets the symbol for a currency code
 *
 * Returns the appropriate currency symbol for supported currencies.
 * For unsupported currencies, returns the currency code itself.
 *
 * @param {string} currency - Currency code
 * @returns {string} Currency symbol
 *
 * @example
 * // Get EUR symbol
 * getCurrencySymbol('EUR')
 * // returns: "€"
 *
 * // Get USD symbol
 * getCurrencySymbol('USD')
 * // returns: "$"
 *
 * // Get symbol for unsupported currency
 * getCurrencySymbol('JPY')
 * // returns: "JPY"
 *
 * // Default to EUR
 * getCurrencySymbol()
 * // returns: "€"
 */
function getCurrencySymbol(currency = 'EUR') {
  if (!currency) return '€';

  const normalizedCurrency = currency.toString().trim().toUpperCase();
  const symbols = {
    EUR: '€',
    USD: '$',
    GBP: '£',
  };
  return symbols[normalizedCurrency] || normalizedCurrency;
}

/**
 * Handlebars helper for currency formatting
 *
 * Wraps the formatted currency in an HTML span with appropriate classes
 * and data attributes for styling and tracking.
 *
 * @param {*} value - Value to format
 * @param {object} options - Handlebars options object
 * @returns {handlebars.SafeString} HTML-safe string with formatted currency
 *
 * @example
 * // Basic usage in template
 * {{formatCurrency 1000.50}}
 * // returns: <span class="imported-value" data-field="currency">1.000,50 €</span>
 *
 * // With USD currency in template
 * {{formatCurrency 1000.50 currency="USD"}}
 * // returns: <span class="imported-value" data-field="currency">1.000,50 $</span>
 *
 * // Handle invalid value in template
 * {{formatCurrency "invalid"}}
 * // returns: <span class="missing-value" data-field="currency">[[Error formatting currency]]</span>
 */
function formatCurrencyHelper(value, options) {
  logger.debug('formatCurrency helper called:', {
    context: '[format]',
    filename: 'currency/index.js',
    rawValue: value,
    options,
    template: {
      path: options?.data?.root?._currentPath,
      line: options?.data?.loc?.start?.line,
      column: options?.data?.loc?.start?.column,
      context: options?.data?.root?._currentContext,
    },
  });

  try {
    // Handle objects with toString method
    if (
      value &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      typeof value.toString === 'function'
    ) {
      value = value.toString();
    }

    // Handle array values, null, undefined, or empty values
    if (Array.isArray(value) || value == null || value === '') {
      return new handlebars.SafeString(
        '<span class="missing-value" data-field="currency">[[Error formatting currency]]</span>'
      );
    }

    // Handle subexpressions
    if (value instanceof handlebars.SafeString) {
      const match = value.string.match(/data-field="[^"]+">([^<]+)</);
      if (match) {
        value = match[1];
      }
    }

    const result = formatCurrency(value, options?.hash || {});

    // If result is empty or the original invalid value, return error
    if (!result || (typeof value === 'string' && result === value)) {
      return new handlebars.SafeString(
        '<span class="missing-value" data-field="currency">[[Error formatting currency]]</span>'
      );
    }

    // If used as a subexpression or raw option is true, return primitive value
    if (options?.data?.isSubexpression || options?.hash?.raw) {
      return result;
    }

    // Return SafeString with proper data-field
    return new handlebars.SafeString(
      `<span class="imported-value" data-field="currency">${handlebars.escapeExpression(result)}</span>`
    );
  } catch (error) {
    logger.error('Error in currency helper:', {
      filename: 'currency/index.js',
      context: 'helper',
      error: error.message,
      stack: error.stack,
      value,
      options,
    });
    return new handlebars.SafeString(
      '<span class="missing-value" data-field="currency">[[Error formatting currency]]</span>'
    );
  }
}

// Register helper
handlebars.registerHelper('formatCurrency', formatCurrencyHelper);

module.exports = {
  formatCurrency,
  getCurrencySymbol,
  formatCurrencyHelper,
};
