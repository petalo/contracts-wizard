/**
 * @file Main export file for all Handlebars helpers
 *
 * This file exports all available Handlebars helpers organized by category:
 * - Logic helpers (if, eq, and, not)
 * - Date helpers (formatDate, addYears, now)
 * - Currency helpers (formatCurrency, currencySymbol, exchangeRate)
 * - Value helpers (lookup, emptyValue, objectToArray)
 * - Number helpers (formatNumber)
 * - Custom helpers (formatEmail)
 *
 * The helpers provide template functionality for:
 * - Conditional logic and comparisons
 * - Date formatting and manipulation
 * - Currency formatting and conversion
 * - Value extraction and formatting
 * - Number formatting with localization
 * - Email formatting
 *
 * All helpers wrap their output in spans with appropriate classes and data attributes
 * for tracking imported vs missing values.
 *
 * @module @/utils/template-processor/handlebars/helpers
 */

const handlebars = require('handlebars');
const helpers = require('handlebars-helpers')();
const { extractValue } = require('./value/extract-handlebars-values');
const { logger } = require('@/utils/common/logger');
const { HANDLEBARS_CONFIG } = require('@/config/handlebars-config');

// Import custom helpers
const { formatEmail } = require('./value/format-email');
const { and } = require('./logic/and');
const { not } = require('./logic/not');
// prettier-ignore
const {
  formatDate,
  addYears,
  now,
} = require('./date');
// prettier-ignore
const {
  formatCurrency,
  currencySymbol,
  exchangeRate,
} = require('./currency');

// Register eq helper with proper type handling
handlebars.registerHelper('eq', function (value1, value2, options) {
  logger.debug('eq helper - extracted values:', {
    extracted1: value1,
    extracted2: value2,
    type1: typeof value1,
    type2: typeof value2,
  });

  // Extract the actual values
  const extracted1 = extractValue(value1);
  const extracted2 = extractValue(value2);

  // Handle null and undefined
  if (extracted1 === null && extracted2 === null) return true;
  if (extracted1 === undefined && extracted2 === undefined) return true;
  if (extracted1 === null || extracted2 === null) return false;
  if (extracted1 === undefined || extracted2 === undefined) return false;

  let val1 = extracted1;
  let val2 = extracted2;

  // Handle numeric values
  if (!isNaN(extracted1) && !isNaN(extracted2)) {
    val1 = Number(extracted1);
    val2 = Number(extracted2);
  }
  // Handle boolean values
  else if (
    typeof extracted1 === 'boolean' ||
    typeof extracted2 === 'boolean' ||
    (typeof extracted1 === 'string' &&
      (extracted1.toLowerCase() === 'true' ||
        extracted1.toLowerCase() === 'false')) ||
    (typeof extracted2 === 'string' &&
      (extracted2.toLowerCase() === 'true' ||
        extracted2.toLowerCase() === 'false'))
  ) {
    // Convert to actual booleans
    val1 =
      typeof extracted1 === 'boolean'
        ? extracted1
        : typeof extracted1 === 'string'
          ? extracted1.toLowerCase() === 'true'
          : !!extracted1;
    val2 =
      typeof extracted2 === 'boolean'
        ? extracted2
        : typeof extracted2 === 'string'
          ? extracted2.toLowerCase() === 'true'
          : !!extracted2;
  }
  // Handle empty strings
  else if (extracted1 === '' || extracted2 === '') {
    val1 = extracted1;
    val2 = extracted2;
  }

  logger.debug('eq helper - comparison:', {
    val1,
    val2,
    areEqual: val1 === val2,
  });

  // If used as a block helper
  if (options && options.fn) {
    return val1 === val2 ? options.fn(this) : options.inverse(this);
  }

  // If used as a subexpression
  return val1 === val2;
});

// Register if helper with proper falsy value handling
handlebars.registerHelper('if', function (value, options) {
  logger.debug('if helper called:', {
    value,
    hasOptions: !!options,
    type: typeof value,
  });

  // Extract the actual value
  const extracted = extractValue(value);

  logger.debug('if helper - extracted value:', {
    extracted,
    type: typeof extracted,
    isNull: extracted === null,
    isUndefined: extracted === undefined,
    isEmpty: extracted === '',
  });

  // Handle falsy values consistently
  const isFalsy =
    extracted === null ||
    extracted === undefined ||
    extracted === '' ||
    extracted === 0 ||
    (typeof extracted === 'boolean' && !extracted) ||
    (typeof extracted === 'object' &&
      !Array.isArray(extracted) &&
      Object.keys(extracted).length === 0);

  // Arrays (even empty ones) are considered truthy
  if (Array.isArray(extracted)) {
    return options.fn(this);
  }

  logger.debug('if helper - evaluation:', {
    isFalsy,
    willExecute: !isFalsy,
  });

  return isFalsy ? options.inverse(this) : options.fn(this);
});

// Register lookup helper
handlebars.registerHelper('lookup', function (obj, field, options) {
  logger.debug('lookup helper called:', {
    context: '[template]',
    filename: 'helpers/index.js',
    obj: typeof obj === 'object' ? '[Object]' : obj,
    field,
    hasOptions: !!options,
    type: 'lookup-start',
  });

  try {
    const object = extractValue(obj);
    const key = extractValue(field);

    if (!object || !key) {
      return undefined;
    }

    // Handle nested paths (e.g. "user.address.street")
    const parts = key.split('.');
    let value = object;

    for (const part of parts) {
      // Handle array access with numeric indices
      if (!isNaN(part) && Array.isArray(value)) {
        const index = parseInt(part, 10);
        value = value[index];
      } else {
        value = value[part];
      }

      // Break early if we hit undefined/null
      if (value === undefined || value === null) {
        break;
      }
    }

    if (value === undefined || value === null) {
      return undefined;
    }

    // Handle arrays specially
    if (Array.isArray(value)) {
      return value;
    }

    return value;
  } catch (error) {
    logger.error('Error in lookup helper:', {
      context: '[error]',
      filename: 'helpers/index.js',
      error: error.message,
      stack: error.stack,
      type: 'lookup-error',
    });
    return undefined;
  }
});

// Register and/not helpers
handlebars.registerHelper('and', and);
handlebars.registerHelper('not', not);

// Register other helpers from handlebars-helpers with logging
logger.debug('Registering handlebars-helpers:', {
  context: '[system]',
  helpers: Object.keys(helpers).filter(
    (name) =>
      !['if', 'eq', 'formatDate', 'now', 'number', 'lookup'].includes(name)
  ),
});

Object.entries(helpers).forEach(([name, helper]) => {
  if (!['if', 'eq', 'formatDate', 'now', 'number', 'lookup'].includes(name)) {
    try {
      handlebars.registerHelper(name, helper);
    } catch (error) {
      logger.error('Error registering helper:', {
        name,
        error,
      });
    }
  }
});

// Register currency helper explicitly
handlebars.registerHelper('currency', function (value, currency, options) {
  logger.debug('currency helper called:', {
    value,
    currency,
    options,
    context: '[template]',
    operation: 'format-currency',
  });

  try {
    if (!value && value !== 0) {
      return new handlebars.SafeString(
        `<span class="missing-value" data-field="currency">[[currency]]</span>`
      );
    }

    // Extract the actual value
    let extractedValue = extractValue(value);
    let extractedCurrency = extractValue(currency);

    // Handle nested currency values
    if (typeof extractedValue === 'object' && extractedValue !== null) {
      if (extractedCurrency && extractedValue[extractedCurrency]) {
        extractedValue = extractedValue[extractedCurrency];
      } else if (extractedValue.decimal) {
        extractedValue = extractedValue.decimal;
      } else if (extractedValue.EUR) {
        extractedValue = extractedValue.EUR;
        extractedCurrency = 'EUR';
      } else if (extractedValue.USD) {
        extractedValue = extractedValue.USD;
        extractedCurrency = 'USD';
      } else {
        extractedValue = Object.values(extractedValue)[0];
      }
    }

    const number = Number(extractedValue);
    if (isNaN(number)) {
      return new handlebars.SafeString(
        `<span class="missing-value" data-field="currency">[[Invalid number]]</span>`
      );
    }

    const formatter = new Intl.NumberFormat(
      HANDLEBARS_CONFIG.numberFormat.locale,
      {
        style: 'currency',
        currency: extractedCurrency || HANDLEBARS_CONFIG.numberFormat.currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
        useGrouping: true,
      }
    );

    return new handlebars.SafeString(
      `<span class="imported-value" data-field="currency">${formatter.format(number)}</span>`
    );
  } catch (error) {
    logger.error('Error in currency helper:', {
      error: error.message,
      context: '[template]',
      operation: 'format-currency',
    });
    return new handlebars.SafeString(
      `<span class="missing-value" data-field="currency">[[Error formatting currency]]</span>`
    );
  }
});

// Register currency helpers
handlebars.registerHelper('formatCurrency', formatCurrency);
handlebars.registerHelper('currencySymbol', currencySymbol);
handlebars.registerHelper('exchangeRate', exchangeRate);

// Register custom helpers
logger.debug('Registering custom helpers');
handlebars.registerHelper({
  formatEmail,
  and,
  not,
  formatNumber: formatNumberHelper,
  formatDate,
  addYears,
  now,
});

/**
 * Formats a number with optional style and currency
 * @param {*} value - The number to format
 * @param {object} options - The options object
 * @returns {string} The formatted number
 */
function formatNumberHelper(value, options) {
  if (!value && value !== 0) {
    return '';
  }

  try {
    const number = Number(value);
    if (isNaN(number)) {
      return String(value);
    }

    if (!isFinite(number)) {
      return String(number);
    }

    const style = (options?.hash?.style || 'decimal').toLowerCase();
    const currency = options?.hash?.currency;
    const minimumFractionDigits = options?.hash?.minimumFractionDigits || 2;
    const maximumFractionDigits =
      options?.hash?.maximumFractionDigits ||
      (style === 'percent' ? 2 : number < 0.01 ? 6 : minimumFractionDigits);

    const formatter = new Intl.NumberFormat('es-ES', {
      style,
      ...(currency && { currency }),
      minimumFractionDigits,
      maximumFractionDigits,
      useGrouping: true,
    });

    return formatter.format(number);
  } catch (error) {
    logger.error('Error in formatNumber helper:', error);
    return String(value);
  }
}

// Register formatNumber helper
handlebars.registerHelper('formatNumber', function (value, options) {
  const formattedNumber = formatNumberHelper(value, options);
  return new handlebars.SafeString(
    `<span class="imported-value" data-field="number">${handlebars.escapeExpression(formattedNumber)}</span>`
  );
});

// Export all helpers for testing and direct use
module.exports = {
  // Custom helpers
  formatEmail,
  and,
  not,
  formatNumber: formatNumberHelper,
  // Re-export handlebars-helpers for convenience
  helpers,
  formatDate,
  addYears,
  now,
  eq: handlebars.helpers.eq,
  lookup: handlebars.helpers.lookup,
  currency: handlebars.helpers.currency,
  emptyValue: handlebars.helpers.emptyValue,
  objectToArray: handlebars.helpers.objectToArray,
  HELPER_CONFIG: {
    locale: 'es-ES',
    timezone: 'Europe/Madrid',
  },
};
