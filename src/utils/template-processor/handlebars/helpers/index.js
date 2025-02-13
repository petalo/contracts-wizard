/**
 * @file Main export file for all Handlebars helpers
 *
 * Provides a centralized registration point for all Handlebars helpers:
 * - Logic helpers (if, eq, and, not)
 * - Date helpers (formatDate, addYears, now)
 * - Currency helpers (formatCurrency, currencySymbol)
 * - Number helpers (formatNumber)
 * - Value helpers (emptyValue)
 *
 * Functions:
 * - registerHelpers: Registers all helpers with Handlebars
 * - helperMissing: Handles missing values
 * - blockHelperMissing: Handles missing block helpers
 * - with: Context management helper
 * - each: Array/object iteration helper
 * - log: Debug logging helper
 * - and/not: Logical operation helpers
 *
 * Flow:
 * 1. Register core Handlebars helpers
 * 2. Register custom helpers
 * 3. Configure helper options
 * 4. Set up error handling
 *
 * Error Handling:
 * - Missing values return placeholders
 * - Invalid paths return error spans
 * - Helper errors are logged
 * - Context errors show debug info
 *
 * @module @/utils/template-processor/handlebars/helpers
 * @requires handlebars
 * @requires handlebars-helpers
 * @requires @/utils/common/logger
 */

const handlebars = require('handlebars');
const helpers = require('handlebars-helpers')();
const numeral = require('numeral');
const { extractValue } = require('./value/extract-handlebars-values');
const { logger } = require('@/utils/common/logger');
const { HANDLEBARS_CONFIG } = require('@/config/handlebars-config');

// Import custom helpers
const { formatEmail } = require('./value/format-email');
const { and } = require('./logic/and');
const { not } = require('./logic/not');
const { formatNumberHelper } = require('./numbers');
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
  // exchangeRate, // Not implemented yet
} = require('./currency');

// Import explicitly the Spanish locale for numeric value extraction
require('numeral/locales/es');
numeral.locale('es');

/**
 * Creates a SafeString for an empty value, using the path as key
 *
 * @param {string} path - The complete field path (e.g., "user.name")
 * @returns {handlebars.SafeString} The HTML placeholder
 *
 * @example
 * createMissingValueSpan("user.name")
 * // returns: <span class="missing-value" data-field="user.name">[[user.name]]</span>
 */
function createMissingValueSpan(path) {
  return wrapMissingValue(path, `[[${path}]]`);
}

/**
 * Creates a SafeString for a missing value with custom text
 *
 * @param {string} path - The complete field path
 * @param {string} text - The text to display
 * @returns {handlebars.SafeString} The HTML placeholder
 */
function wrapMissingValue(path, text) {
  return new handlebars.SafeString(
    `<span class="missing-value" data-field="${path}">${text}</span>`
  );
}

// Configure undefined variables to use helperMissing
handlebars.registerHelper('helperMissing', function (/* dynamic arguments */) {
  const args = Array.prototype.slice.call(arguments);
  const options = args.pop();

  // Build the complete path by traversing the context chain
  let path = options.name;
  let currentContext = options.data;
  const pathParts = [];

  // Traverse up the context chain to build the full path
  while (currentContext) {
    if (currentContext._parent) {
      pathParts.unshift(currentContext._parent);
    }
    currentContext = currentContext._parent ? currentContext.parent : null;
  }

  // Combine all parts to form the full path
  if (pathParts.length > 0) {
    path = [...pathParts, path].join('.');
  }

  logger.debug('Helper missing called:', {
    path,
    originalName: options.name,
    pathParts,
    context: options.data,
    parentContexts: pathParts,
    args: args,
    type: 'undefined',
  });

  return createMissingValueSpan(path);
});

// Configure undefined block helpers to use blockHelperMissing
handlebars.registerHelper('blockHelperMissing', function (context, options) {
  const path = options.name;

  logger.debug('Block helper not found:', {
    path,
    context,
    type: 'undefined_block',
  });

  return createMissingValueSpan(path);
});

// Register with helper for context management
handlebars.registerHelper('with', function (context, options) {
  // Get the current path from parent context if it exists
  const parentPath = options.data.root._currentPath || '';
  const currentPath = options.hash.as || this._currentKey || '';
  const fullPath = parentPath ? `${parentPath}.${currentPath}` : currentPath;

  // Save current path in root context
  options.data.root._currentPath = fullPath;

  if (!context) {
    const result = wrapMissingValue(fullPath, '[[missing]]');
    // Restore parent path
    options.data.root._currentPath = parentPath;
    return result;
  }

  // Create a new context that includes both the current context and parent context
  const newContext = Object.create(this);
  Object.assign(newContext, context);
  newContext._parent = this;
  newContext._currentPath = fullPath;

  const result = options.fn(newContext);

  // Restore parent path
  options.data.root._currentPath = parentPath;

  return result;
});

// Register the 'each' helper for iterating over arrays and objects
handlebars.registerHelper('each', function (context, options) {
  if (!context || !context.length) {
    return options.inverse(this);
  }

  let ret = '';
  const parentPath = options.data?.parentPath || '';
  const currentPath = options.hash.as || options.data.key || '';
  const basePath = parentPath
    ? currentPath
      ? `${parentPath}.${currentPath}`
      : parentPath
    : currentPath;

  for (let i = 0; i < context.length; i++) {
    const data = {
      ...options.data,
      index: i,
      first: i === 0,
      last: i === context.length - 1,
      length: context.length,
      parentPath: basePath,
      key: `${i}`,
    };

    let item = context[i];
    // Handle objects with numeric keys as arrays
    if (item && typeof item === 'object' && !Array.isArray(item)) {
      const numericKeys = Object.keys(item).filter((key) => !isNaN(key));
      if (numericKeys.length > 0) {
        const arr = [];
        numericKeys
          .sort((a, b) => parseInt(a) - parseInt(b))
          .forEach((key) => {
            arr[parseInt(key)] = item[key];
          });
        item = arr;
      }
    }

    ret = ret + options.fn(item, { data });
  }
  return ret;
});

// Register the 'log' helper for debugging
handlebars.registerHelper('log', function (context) {
  logger.debug('Template log:', {
    context: '[template]',
    value: context,
  });
});

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

// Register other helpers from handlebars-helpers with logging
logger.debug('Registering handlebars-helpers:', {
  context: '[system]',
  helpers: Object.keys(helpers).filter(
    (name) => !['if', 'eq', 'formatDate', 'now', 'number'].includes(name)
  ),
});

Object.entries(helpers).forEach(([name, helper]) => {
  if (!['if', 'eq', 'formatDate', 'now', 'number'].includes(name)) {
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
  // If called as a subexpression, currency will be options
  if (arguments.length === 2 && typeof currency === 'object') {
    options = currency;
    currency = 'EUR';
  }

  logger.debug('currency helper called:', {
    value,
    currency,
    options,
    context: '[template]',
    operation: 'format-currency',
  });

  try {
    if (!value && value !== 0) {
      const errorSpan = `<span class="missing-value" data-field="currency">[[currency]]</span>`;
      return options?.fn
        ? options.inverse(this)
        : new handlebars.SafeString(errorSpan);
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
      const errorSpan = `<span class="missing-value" data-field="currency">[[Invalid number]]</span>`;
      return options?.fn
        ? options.inverse(this)
        : new handlebars.SafeString(errorSpan);
    }

    // Format number using Spanish locale
    const formatter = new Intl.NumberFormat('es-ES', {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      useGrouping: true,
      numberingSystem: 'latn',
    });

    const formattedNumber = formatter.format(number);
    // Simple symbol lookup
    const symbols = {
      EUR: '€',
      USD: '$',
      GBP: '£',
    };
    const symbol =
      symbols[extractedCurrency || currency] || extractedCurrency || currency;
    const formattedValue = `${formattedNumber} ${symbol}`;

    // If used as a block helper, pass the formatted value as context
    if (options?.fn) {
      return options.fn({ value: formattedValue });
    }

    // If used as a simple helper, return the span
    return new handlebars.SafeString(
      `<span class="imported-value" data-field="currency">${formattedValue}</span>`
    );
  } catch (error) {
    logger.error('Error in currency helper:', {
      error: error.message,
      context: '[template]',
      operation: 'format-currency',
    });
    const errorSpan = `<span class="missing-value" data-field="currency">[[Error formatting currency]]</span>`;
    return options?.fn
      ? options.inverse(this)
      : new handlebars.SafeString(errorSpan);
  }
});

// Register currency helpers
handlebars.registerHelper('formatCurrency', formatCurrency);
handlebars.registerHelper('currencySymbol', currencySymbol);
// handlebars.registerHelper('exchangeRate', exchangeRate); // Not implemented yet

// Register lookup helper explicitly
handlebars.registerHelper('lookup', function (obj, prop) {
  if (obj === null || obj === undefined) {
    return new handlebars.SafeString(
      `<span class="missing-value" data-field="lookup">[[lookup value missing]]</span>`
    );
  }
  const value = obj[prop];
  if (value === undefined) {
    return new handlebars.SafeString(
      `<span class="missing-value" data-field="lookup">[[${prop} not found]]</span>`
    );
  }
  return value;
});

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
  currency: handlebars.helpers.currency,
  emptyValue: handlebars.helpers.emptyValue,
  objectToArray: handlebars.helpers.objectToArray,
  lookup: handlebars.helpers.lookup,
  HELPER_CONFIG: {
    locale: HANDLEBARS_CONFIG.locale,
    timezone: HANDLEBARS_CONFIG.timezone,
  },
};
