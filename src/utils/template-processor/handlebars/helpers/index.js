/**
 * @file Main export file for all Handlebars helpers
 *
 * Provides a centralized registration point for all Handlebars helpers:
 * - Logic helpers (if, eq, and, not)
 * - Date helpers (formatDate, addYears, now)
 * - Number helpers (formatNumber)
 * - Value helpers (formatEmail, extractValue)
 *
 * Functions:
 * - formatEmail: Formats email addresses
 * - and: Logical AND operation
 * - not: Logical NOT operation
 * - formatNumber: Number formatting
 * - formatDate: Date formatting
 * - addYears: Add years to date
 * - now: Get current date
 * - extractValue: Extract values from Handlebars context
 *
 * Flow:
 * 1. Import required dependencies
 * 2. Import custom helper functions
 * 3. Load date and currency helpers
 * 4. Register helpers with Handlebars
 *
 * Error Handling:
 * - Invalid values return error spans
 * - Helper errors are logged with debug info
 * - Missing values handled gracefully
 *
 * @module @/utils/template-processor/handlebars/helpers
 * @requires handlebars
 * @requires handlebars-helpers
 * @requires @/utils/common/logger
 * @requires @/config/handlebars-config
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
const { formatNumber } = require('./numbers');

logger.debug('Loading date helpers:', {
  filename: 'helpers/index.js',
  context: '[system]',
  operation: 'init',
  technical: {
    function: 'require',
    module: './date',
  },
});

// prettier-ignore
const {
  formatDate,
  addYears,
  now,
} = require('./date');

logger.debug('Date helpers loaded:', {
  filename: 'helpers/index.js',
  context: '[system]',
  operation: 'init',
  technical: {
    helpers: {
      formatDate: !!formatDate,
      addYears: !!addYears,
      now: !!now,
    },
  },
});

logger.debug('Loading currency helpers:', {
  filename: 'helpers/index.js',
  context: '[system]',
  operation: 'init',
  technical: {
    function: 'require',
    module: './currency',
  },
});

// prettier-ignore
const {
  formatCurrency,
  currencySymbol,
  // exchangeRate, // Not implemented yet
} = require('./currency');

logger.debug('Currency helpers loaded:', {
  filename: 'helpers/index.js',
  context: '[system]',
  operation: 'init',
  technical: {
    helpers: {
      formatCurrency: !!formatCurrency,
      currencySymbol: !!currencySymbol,
    },
  },
});

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

// Register core helpers first
logger.debug('Starting core helpers registration:', {
  filename: 'helpers/index.js',
  context: '[system]',
  operation: 'init',
  technical: {
    phase: 'core-registration',
  },
});

handlebars.registerHelper({
  // Value formatting helpers
  formatEmail: function (value, options) {
    return formatEmail.call(this, value, options);
  },

  // Date helpers
  formatDate: function (date, format, options) {
    logger.debug('Registering formatDate helper:', {
      filename: 'helpers/index.js',
      context: '[system]',
      operation: 'init',
      technical: {
        helper: 'formatDate',
        hasFunction: !!formatDate,
      },
    });
    // Handle case where format is omitted
    if (format && typeof format === 'object' && !options) {
      options = format;
      format = undefined;
    }
    return formatDate.call(this, date, format, options);
  },
  addYears: function (date, years, options) {
    logger.debug('Registering addYears helper:', {
      filename: 'helpers/index.js',
      context: '[system]',
      operation: 'init',
      technical: {
        helper: 'addYears',
        hasFunction: !!addYears,
      },
    });
    return addYears.call(this, date, years, options);
  },
  now: function (format, options) {
    logger.debug('Registering now helper:', {
      filename: 'helpers/index.js',
      context: '[system]',
      operation: 'init',
      technical: {
        helper: 'now',
        hasFunction: !!now,
      },
    });
    logger.debug('now helper wrapper called:', {
      filename: 'helpers/index.js',
      context: '[helper]',
      operation: 'now-wrapper',
      technical: {
        function: 'now',
        args: {
          format,
          formatType: typeof format,
          hasOptions: !!options,
          optionsData: options?.data,
          thisContext: this ? Object.keys(this) : undefined,
        },
        state: {
          isSubexpression: options?.data?.isSubexpression,
          currentPath: options?.data?.root?._currentPath,
          parentPath: options?.data?.root?._parentPath,
        },
      },
    });

    // Handle case where format is omitted
    if (format && typeof format === 'object' && !options) {
      logger.debug('format is options object in wrapper:', {
        filename: 'helpers/index.js',
        context: '[helper]',
        operation: 'now-wrapper',
        technical: {
          originalFormat: format,
          isOptionsObject: true,
          optionsKeys: Object.keys(format),
        },
      });
      options = format;
      format = undefined;
    }

    try {
      const result = now.call(this, format, options);
      logger.debug('now helper wrapper result:', {
        filename: 'helpers/index.js',
        context: '[helper]',
        operation: 'now-wrapper',
        technical: {
          resultType: typeof result,
          isSafeString: result instanceof handlebars.SafeString,
          resultString: result?.toString(),
        },
      });
      return result;
    } catch (error) {
      logger.error('Error in now helper wrapper:', {
        filename: 'helpers/index.js',
        context: '[helper]',
        operation: 'now-wrapper',
        error: {
          code: 'NOW_WRAPPER_ERROR',
          message: error.message,
          stack: error.stack,
          type: error.name,
        },
        technical: {
          format,
          formatType: typeof format,
          hasOptions: !!options,
          thisContext: this ? Object.keys(this) : undefined,
        },
        impact: 'Unable to process date formatting in wrapper',
      });
      return new handlebars.SafeString(
        `<span class="missing-value" data-field="date">[[Error in date wrapper]]</span>`
      );
    }
  },

  // Logic helpers
  and: function () {
    return and.apply(this, arguments);
  },
  not: function (value, options) {
    return not.call(this, value, options);
  },
});

// Register handlebars-helpers
logger.debug('Registering handlebars-helpers:', {
  context: '[helper]',
  filename: 'helpers/index.js',
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
      const errorSpan = `<span class="missing-value" data-field="currency">[[Error formatting currency]]</span>`;
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
      const errorSpan = `<span class="missing-value" data-field="currency">[[Error formatting currency]]</span>`;
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
      const context = Object.create(this || {});
      context.this = formattedValue;
      context.value = formattedValue;
      return options.fn(context);
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

// Register date helpers
logger.debug('Registering date helpers', {
  filename: 'helpers/index.js',
  context: '[helper]',
  operation: 'init',
  technical: {
    phase: 'date-registration',
    helpers: ['formatDate', 'addYears', 'now'],
  },
});

// Register each date helper individually to avoid conflicts
handlebars.registerHelper('formatDate', formatDate);
handlebars.registerHelper('addYears', addYears);
handlebars.registerHelper('now', now);

// Register custom helpers
logger.debug('Registering custom helpers', {
  filename: 'helpers/index.js',
  context: '[helper]',
  operation: 'init',
  technical: {
    phase: 'custom-registration',
    helpers: ['formatEmail', 'and', 'not', 'formatNumber'],
  },
});

// Register custom helpers
handlebars.registerHelper({
  formatEmail,
  and,
  not,
});

// Export all helpers for testing and direct use
module.exports = {
  // Custom helpers
  formatEmail,
  and,
  not,
  formatNumber,
  // Date helpers
  formatDate,
  addYears,
  now,
  // Re-export handlebars-helpers for convenience
  helpers,
  formatCurrency,
  currencySymbol,
  currency: handlebars.helpers.currency,
  emptyValue: handlebars.helpers.emptyValue,
  objectToArray: handlebars.helpers.objectToArray,
  lookup: handlebars.helpers.lookup,
  HELPER_CONFIG: {
    locale: HANDLEBARS_CONFIG.locale,
    timezone: HANDLEBARS_CONFIG.timezone,
  },
};
