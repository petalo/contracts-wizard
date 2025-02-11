/**
 * @file Currency Formatting Helpers for Handlebars
 *
 * Provides currency formatting and manipulation helpers:
 * - formatCurrency: Format numbers as currency with locale support
 * - currencySymbol: Get currency symbol for a given currency code
 * - exchangeRate: Convert between currencies (if exchange rates are provided)
 *
 * All helpers wrap their output in spans with appropriate classes
 * for tracking imported vs missing values.
 *
 * @module @/utils/template-processor/handlebars/helpers/currency
 * @requires handlebars
 * @requires @/utils/common/logger
 * @requires @/config/locale
 */

const handlebars = require('handlebars');
const { logger } = require('@/utils/common/logger');
const { LOCALE_CONFIG } = require('@/config/locale');
const { HANDLEBARS_CONFIG } = require('@/config/handlebars-config');
const { extractValue } = require('../value/extract-handlebars-values');

/**
 * Format a number as currency with locale support
 * @param {number|string|handlebars.SafeString} amount - The amount to format
 * @param {string} [currency="EUR"] - The currency code (e.g., EUR, USD)
 * @returns {handlebars.SafeString} Formatted currency wrapped in HTML span
 */
function formatCurrency(amount, currency = 'EUR') {
  logger.debug('formatCurrency helper called:', {
    amount,
    currency,
    context: '[template]',
    operation: 'format-currency',
  });

  try {
    if (amount === undefined || amount === null) {
      return new handlebars.SafeString(
        `<span class="missing-value" data-field="currency">${HANDLEBARS_CONFIG.errorMessages.invalidAmount}</span>`
      );
    }

    // Extract values and handle SafeString
    const amountValue =
      amount instanceof handlebars.SafeString
        ? /* eslint-disable */
          amount
            .toString()
            .replace(/<[^>]*>/g, '')
            .trim()
        : extractValue(amount);
    /* eslint-enable */
    const currencyValue = extractValue(currency);

    // Parse amount to number
    const numericAmount =
      typeof amountValue === 'string' ? parseFloat(amountValue) : amountValue;

    if (isNaN(numericAmount)) {
      return new handlebars.SafeString(
        `<span class="missing-value" data-field="currency">${HANDLEBARS_CONFIG.errorMessages.invalidAmount}</span>`
      );
    }

    // Get currency configuration
    const currencyConfig = HANDLEBARS_CONFIG.numberFormat.currencies[
      currencyValue
    ] || {
      symbol: currencyValue,
      position: 'suffix',
      spacing: true,
    };

    // Format the number part
    const formatter = new Intl.NumberFormat(
      currencyValue === 'USD' ? 'en-US' : LOCALE_CONFIG.fullLocale,
      {
        style: 'decimal',
        minimumFractionDigits:
          HANDLEBARS_CONFIG.numberFormat.defaults.minimumFractionDigits,
        maximumFractionDigits:
          HANDLEBARS_CONFIG.numberFormat.defaults.maximumFractionDigits,
        useGrouping: HANDLEBARS_CONFIG.numberFormat.defaults.useGrouping,
      }
    );

    const formattedNumber = formatter.format(numericAmount);
    const formattedCurrency =
      currencyConfig.position === 'prefix'
        ? `${currencyConfig.symbol}${currencyConfig.spacing ? ' ' : ''}${formattedNumber}`
        : `${formattedNumber}${currencyConfig.spacing ? ' ' : ''}${currencyConfig.symbol}`;

    return new handlebars.SafeString(
      `<span class="imported-value" data-field="currency">${formattedCurrency}</span>`
    );
  } catch (error) {
    logger.error('Error in formatCurrency helper:', {
      error: error.message,
      context: '[template]',
      operation: 'format-currency',
    });
    return new handlebars.SafeString(
      `<span class="missing-value" data-field="currency">[[Error formatting currency]]</span>`
    );
  }
}

/**
 * Get currency symbol for a given currency code
 * @param {string} currencyCode - The currency code (e.g., EUR, USD)
 * @returns {handlebars.SafeString} Currency symbol wrapped in HTML span
 */
function currencySymbol(currencyCode) {
  logger.debug('currencySymbol helper called:', {
    currencyCode,
    context: '[template]',
    operation: 'get-currency-symbol',
  });

  try {
    if (!currencyCode) {
      return new handlebars.SafeString(
        `<span class="missing-value" data-field="currency">${HANDLEBARS_CONFIG.errorMessages.invalidCurrency}</span>`
      );
    }

    const code = extractValue(currencyCode);
    const currencyConfig = HANDLEBARS_CONFIG.numberFormat.currencies[code];

    return new handlebars.SafeString(
      `<span class="imported-value" data-field="currency-symbol">${currencyConfig ? currencyConfig.symbol : code}</span>`
    );
  } catch (error) {
    logger.error('Error in currencySymbol helper:', {
      error: error.message,
      context: '[template]',
      operation: 'get-currency-symbol',
    });
    return new handlebars.SafeString(
      `<span class="missing-value" data-field="currency-symbol">[[Error getting currency symbol]]</span>`
    );
  }
}

/**
 * Convert amount between currencies using exchange rates
 * @param {number|string} amount - The amount to convert
 * @param {string} fromCurrency - Source currency code
 * @param {string} toCurrency - Target currency code
 * @param {object} [hash] - Handlebars hash parameter
 * @returns {handlebars.SafeString|number} Converted amount, wrapped in HTML span if not used as a subexpression
 */
function exchangeRate(amount, fromCurrency, toCurrency, hash) {
  logger.debug('exchangeRate helper called:', {
    amount,
    fromCurrency,
    toCurrency,
    context: '[template]',
    operation: 'convert-currency',
  });

  try {
    if (!amount || !fromCurrency || !toCurrency) {
      return new handlebars.SafeString(
        `<span class="missing-value" data-field="currency">${HANDLEBARS_CONFIG.errorMessages.invalidConversion}</span>`
      );
    }

    // Extract values
    const amountValue = extractValue(amount);
    const toCurrencyValue = extractValue(toCurrency);

    // Parse amount to number
    const numericAmount =
      typeof amountValue === 'string' ? parseFloat(amountValue) : amountValue;

    if (isNaN(numericAmount)) {
      return new handlebars.SafeString(
        `<span class="missing-value" data-field="currency">${HANDLEBARS_CONFIG.errorMessages.invalidAmount}</span>`
      );
    }

    // TODO: Implement actual exchange rate logic
    // For now, just return the same amount
    const convertedAmount = numericAmount;

    // If this is a subexpression (used inside another helper), return the raw number
    if (hash && hash.hash && hash.hash.subexpression) {
      return convertedAmount;
    }

    // Get currency configuration
    const currencyConfig = HANDLEBARS_CONFIG.numberFormat.currencies[
      toCurrencyValue
    ] || {
      symbol: toCurrencyValue,
      position: 'suffix',
      spacing: true,
    };

    // Format the number part
    const formatter = new Intl.NumberFormat(
      toCurrencyValue === 'USD' ? 'en-US' : LOCALE_CONFIG.fullLocale,
      {
        style: 'decimal',
        minimumFractionDigits:
          HANDLEBARS_CONFIG.numberFormat.defaults.minimumFractionDigits,
        maximumFractionDigits:
          HANDLEBARS_CONFIG.numberFormat.defaults.maximumFractionDigits,
        useGrouping: HANDLEBARS_CONFIG.numberFormat.defaults.useGrouping,
      }
    );

    const formattedNumber = formatter.format(convertedAmount);
    const formattedCurrency =
      currencyConfig.position === 'prefix'
        ? `${currencyConfig.symbol}${currencyConfig.spacing ? ' ' : ''}${formattedNumber}`
        : `${formattedNumber}${currencyConfig.spacing ? ' ' : ''}${currencyConfig.symbol}`;

    return new handlebars.SafeString(
      `<span class="imported-value" data-field="currency">${formattedCurrency}</span>`
    );
  } catch (error) {
    logger.error('Error in exchangeRate helper:', {
      error: error.message,
      context: '[template]',
      operation: 'convert-currency',
    });
    return new handlebars.SafeString(
      `<span class="missing-value" data-field="currency">[[Error converting currency]]</span>`
    );
  }
}

module.exports = {
  formatCurrency,
  currencySymbol,
  exchangeRate,
};
