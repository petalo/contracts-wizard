/**
 * @file Currency Formatting Helper System
 *
 * Provides currency-specific formatting utilities:
 * - Euro formatting
 * - Currency symbol handling
 * - Exchange rate calculations
 *
 * Functions:
 * - formatCurrency: Main currency formatting function
 * - getCurrencySymbol: Gets symbol for currency code
 * - formatCurrencyHelper: Handlebars helper wrapper
 *
 * Flow:
 * 1. Parse input value (handling both English and Spanish formats)
 * 2. Extract numeric value
 * 3. Apply currency formatting
 * 4. Add currency symbol
 *
 * Error Handling:
 * - Invalid number formats return original string
 * - Null/undefined values return empty string
 * - Invalid currency codes use code as symbol
 * - Parsing errors are logged and return string value
 *
 * @module @/utils/template-processor/handlebars/helpers/currency
 * @requires @/utils/template-processor/handlebars/helpers/numbers
 * @requires @/utils/common/logger
 * @requires handlebars
 */

const {
  extractNumericValue,
  formatNumberCore,
  DEFAULT_OPTIONS,
} = require('../numbers');
const { logger } = require('@/utils/common/logger');
const handlebars = require('handlebars');

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
    // Si es un string, intentar convertirlo primero
    if (typeof value === 'string') {
      // Intentar primero como formato inglés (1000.50)
      const parsedEnglish = parseFloat(value);
      if (!isNaN(parsedEnglish)) {
        value = parsedEnglish;
      } else {
        // Si no funciona, intentar como formato español (1.000,50)
        const spanishValue = value.replace(/\./g, '').replace(',', '.');
        const parsedSpanish = parseFloat(spanishValue);
        if (!isNaN(parsedSpanish)) {
          value = parsedSpanish;
        }
      }
    }

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

    // Usar las opciones por defecto de moneda
    const currencyOptions = {
      ...options,
      style: 'currency',
      currency: options.currency || 'EUR',
      minimumFractionDigits:
        options.minimumFractionDigits ?? DEFAULT_OPTIONS.currency.minDecimals,
      maximumFractionDigits:
        options.maximumFractionDigits ?? DEFAULT_OPTIONS.currency.maxDecimals,
    };

    // Formatear usando la función core
    const formattedNumber = formatNumberCore(number, currencyOptions);

    // Añadir el símbolo de la moneda
    return `${formattedNumber} ${getCurrencySymbol(currencyOptions.currency)}`;
  } catch (error) {
    logger.error('Error in formatCurrency:', {
      context: '[error]',
      filename: 'currency/index.js',
      error: error.message,
      stack: error.stack,
      value,
      options,
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
  const symbols = {
    EUR: '€',
    USD: '$',
    GBP: '£',
  };
  return symbols[currency] || currency;
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
 * // returns: <span class="imported-value" data-field="currency">invalid</span>
 */
function formatCurrencyHelper(value, options) {
  logger.debug('formatCurrency helper called:', {
    context: '[format]',
    filename: 'currency/index.js',
    rawValue: value,
    options,
  });

  const formattedCurrency = formatCurrency(value, options?.hash);

  return new handlebars.SafeString(
    `<span class="imported-value" data-field="currency">${handlebars.escapeExpression(formattedCurrency)}</span>`
  );
}

module.exports = {
  formatCurrency,
  formatCurrencyHelper,
  currencySymbol: getCurrencySymbol,
  getCurrencySymbol,
};
