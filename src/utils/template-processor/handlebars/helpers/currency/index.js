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
 * @requires @/utils/common/logger
 * @requires handlebars
 */

const { logger } = require('@/utils/common/logger');
const handlebars = require('handlebars');

// Currency configurations with proper locales and formats
const CURRENCY_CONFIG = {
  EUR: {
    locale: 'es-ES',
    format: {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      useGrouping: true,
      currencyDisplay: 'symbol',
    },
  },
  USD: {
    locale: 'en-US',
    format: {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      useGrouping: true,
      currencyDisplay: 'symbol',
    },
  },
  GBP: {
    locale: 'en-GB',
    format: {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      useGrouping: true,
      currencyDisplay: 'symbol',
    },
  },
};

/**
 * Get the currency symbol for a given currency code
 *
 * @param {string} [currencyCode='EUR'] - The currency code (e.g. 'EUR', 'USD', 'GBP')
 * @returns {string} The currency symbol (e.g. '€', '$', '£')
 */
function getCurrencySymbol(currencyCode = 'EUR') {
  if (!currencyCode) return '€';

  const code = currencyCode.trim().toUpperCase();
  switch (code) {
    case 'EUR':
      return '€';
    case 'USD':
      return '$';
    case 'GBP':
      return '£';
    default:
      return code;
  }
}

/**
 * Format a number as currency with proper locale and symbol
 *
 * @param {number|string} value - The number to format
 * @param {object} options - Formatting options
 * @param {string} options.currency - Currency code (e.g. 'EUR', 'USD')
 * @param {number} [options.minDecimals] - Minimum decimal places
 * @param {number} [options.maxDecimals] - Maximum decimal places
 * @param {boolean} [options.raw] - Return raw value without HTML
 * @param {boolean} [options.useCode] - Use currency code instead of symbol
 * @returns {string} Formatted currency string
 */
function formatCurrency(value, options = {}) {
  try {
    // Handle special cases
    if (value === Infinity || value === -Infinity || Number.isNaN(value)) {
      return '';
    }

    // Handle null/undefined/empty values
    if (value == null || value === '') {
      return '';
    }

    // If value is wrapped in HTML, extract the numeric value
    if (typeof value === 'string' && value.includes('data-field')) {
      const match = value.match(/data-field="[^"]+">([^<]+)</);
      if (match) {
        value = match[1];
      }
    }

    // If value is not a valid number or string, try to convert it
    if (typeof value !== 'number' && typeof value !== 'string') {
      if (typeof value === 'object' && value !== null) {
        // If it's an object with currency-specific properties
        if (value.amount && value.currency) {
          options.currency = value.currency;
          value = value.amount;
        }
        // If it's an object with a value property
        else if ('value' in value) {
          value = value.value;
        } else if ('amount' in value) {
          value = value.amount;
        } else if (typeof value.toString === 'function') {
          value = value.toString();
        }
      }
    }

    // If value is still not a number or string, return it as is
    if (typeof value !== 'number' && typeof value !== 'string') {
      return value;
    }

    // Parse the number based on current format
    let number = value;

    if (typeof number === 'string') {
      // Remove currency symbols and spaces first
      number = number.replace(/[$€£]/g, '').trim();

      // Try to detect the format and parse accordingly
      if (number.includes(',') && number.includes('.')) {
        // Format like 1.234,56 (Spanish)
        if (number.indexOf('.') < number.indexOf(',')) {
          number = parseFloat(number.replace(/\./g, '').replace(',', '.'));
        }
        // Format like 1,234.56 (English)
        else {
          number = parseFloat(number.replace(/,/g, ''));
        }
      }
      // Format like 1,23 (Spanish)
      else if (number.includes(',')) {
        number = parseFloat(number.replace(',', '.'));
      }
      // Format like 1.23 (English) or scientific notation
      else {
        number = parseFloat(number);
      }
    }

    // If parsing failed, return original value
    if (isNaN(number)) {
      return value;
    }

    // Get currency configuration
    const currencyCode = options.currency?.toUpperCase() || 'EUR';
    const config = CURRENCY_CONFIG[currencyCode] || {
      locale: 'en-US',
      format: {
        style: 'decimal',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
        useGrouping: true,
      },
    };

    // For USD without decimals, we need to round the number first
    if (currencyCode === 'USD' && options.maxDecimals === 0) {
      number = Math.round(number);
    }

    // Format the number according to locale
    const formatter = new Intl.NumberFormat(config.locale, {
      style: 'decimal',
      minimumFractionDigits:
        options.maxDecimals === 0
          ? 0
          : (options.minDecimals ?? config.format.minimumFractionDigits),
      maximumFractionDigits:
        options.maxDecimals ?? config.format.maximumFractionDigits,
      useGrouping: true,
    });

    let formattedNumber = formatter.format(number);

    // Format with currency code
    let finalFormatted = formattedNumber;

    // Add currency code or symbol based on configuration
    if (options.useCode) {
      // Always use currency code
      finalFormatted = `${formattedNumber} ${currencyCode}`;
    } else if (currencyCode === 'EUR' && config.locale === 'es-ES') {
      finalFormatted = `${formattedNumber} €`;
    } else if (currencyCode === 'USD' && config.locale === 'en-US') {
      // Handle negative numbers
      if (number < 0) {
        finalFormatted = formattedNumber.replace(/^-/, ''); // Remove existing minus
        finalFormatted = `-$${finalFormatted}`; // Add minus with symbol
      } else {
        finalFormatted = `$${formattedNumber}`;
      }
    } else if (currencyCode === 'GBP' && config.locale === 'en-GB') {
      // Handle negative numbers
      if (number < 0) {
        finalFormatted = formattedNumber.replace(/^-/, ''); // Remove existing minus
        finalFormatted = `-£${finalFormatted}`; // Add minus with symbol
      } else {
        finalFormatted = `£${formattedNumber}`;
      }
    } else {
      // For other currencies, use code
      finalFormatted = `${formattedNumber} ${currencyCode}`;
    }

    // Log final result
    logger.debug('Final currency formatting:', {
      filename: 'currency/index.js',
      context: '[format]',
      technical: {
        input: value,
        parsed: number,
        currency: currencyCode,
        locale: config.locale,
        formattedNumber,
        finalFormatted,
        options: {
          minDecimals: options.minDecimals,
          maxDecimals: options.maxDecimals,
          raw: options.raw,
          useCode: options.useCode,
        },
      },
    });

    // Return raw string if requested
    if (options.raw) {
      return finalFormatted;
    }

    // Return HTML string
    return `<span class="imported-value" data-field="currency">${finalFormatted}</span>`;
  } catch (error) {
    logger.error('Error formatting currency:', {
      filename: 'currency/index.js',
      context: '[format]',
      technical: {
        input: value,
        error: error.message,
        stack: error.stack,
      },
    });
    return value;
  }
}

/**
 * Handlebars helper for formatting currency values
 *
 * @param {number|string} value - The value to format
 * @param {object} options - Handlebars options object
 * @returns {string} Formatted currency HTML
 */
function formatCurrencyHelper(value, options = {}) {
  // Handle special cases
  if (value === null || value === undefined) {
    return '';
  }

  // If value is a SafeString, extract the actual value
  if (value instanceof handlebars.SafeString) {
    value = value.toString();
  }

  // If value is HTML, return it as is
  if (typeof value === 'string' && value.includes('<')) {
    return value;
  }

  // If value is an array or boolean, convert to string
  if (Array.isArray(value) || typeof value === 'boolean') {
    return value.toString();
  }

  // If value has toString method and is not a number, use it
  if (
    typeof value === 'object' &&
    value !== null &&
    typeof value.toString === 'function' &&
    !('amount' in value) &&
    !('value' in value)
  ) {
    const stringValue = value.toString();
    if (stringValue !== '[object Object]') {
      // Format the string value as currency
      const formattedValue = formatCurrency(stringValue, {
        currency: options.hash?.currency,
        minDecimals: options.hash?.minDecimals,
        maxDecimals: options.hash?.maxDecimals,
        useCode: false, // Use symbols for toString values
        raw: true,
      });
      return new handlebars.SafeString(
        `<span class="imported-value" data-field="currency">${formattedValue}</span>`
      );
    }
  }

  // Determine if we should use currency code
  const currency = options.hash?.currency?.toUpperCase();
  const isDynamicCurrency =
    typeof options.hash?.currency === 'string' &&
    (options.hash.currency.startsWith('{{') ||
      options.hash.currency.includes('=') ||
      options.hash.currency.includes('(') ||
      options.hash.currency.includes('.') ||
      options.data?.root?.[options.hash.currency] !== undefined);

  // Use code when:
  // 1. Explicitly requested with useCode
  // 2. Using an unknown currency
  // 3. Currency is passed as a variable or expression
  const useCode =
    options.hash?.useCode ||
    (currency && !['EUR', 'USD', 'GBP'].includes(currency)) ||
    isDynamicCurrency;

  // Format the value
  const result = formatCurrency(value, {
    currency: options.hash?.currency,
    minDecimals: options.hash?.minDecimals,
    maxDecimals: options.hash?.maxDecimals,
    useCode,
    raw: true, // Get raw string first
  });

  // If result is same as input (invalid), return it as is
  if (result === value) {
    return result;
  }

  // Return the result as SafeString
  return new handlebars.SafeString(
    `<span class="imported-value" data-field="currency">${result}</span>`
  );
}

// Register the helper with Handlebars
handlebars.registerHelper('formatCurrency', formatCurrencyHelper);

module.exports = {
  formatCurrency,
  getCurrencySymbol,
  formatCurrencyHelper,
};
