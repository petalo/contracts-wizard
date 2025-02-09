/**
 * @file Main export file for all Handlebars helpers
 *
 * This file exports all available Handlebars helpers organized by category:
 * - Array helpers (each, eachWithGaps)
 * - Comparison helpers (from handlebars-helpers)
 * - Date helpers (from handlebars-helpers)
 * - Value helpers (from handlebars-helpers)
 * - Custom helpers (formatEmail, and, not)
 *
 * @module @/utils/template-processor/handlebars/helpers
 */

const handlebars = require('handlebars');
const helpers = require('handlebars-helpers')();
const { extractValue } = require('./value/extract');
const moment = require('moment-timezone');
const { logger } = require('@/utils/common/logger');

// Import custom helpers
const { formatEmail } = require('./value/format-email');
const { and } = require('./logic/and');
const { not } = require('./logic/not');

// Register eq helper with proper block and subexpression support
handlebars.registerHelper('eq', function (a, b, options) {
  // If used as a block helper with only one argument
  if (arguments.length === 2) {
    options = b;
    b = a;
    a = this;
  }

  // Extract values and handle special cases
  const left = extractValue(a);
  const right = extractValue(b);

  // Convert to strings for comparison if they're not numbers
  const leftValue = typeof left === 'number' ? left : String(left || '');
  const rightValue = typeof right === 'number' ? right : String(right || '');

  // Compare values
  const result = leftValue === rightValue;

  // If used as a block helper
  if (options && typeof options.fn === 'function') {
    return result ? options.fn(this) : options.inverse(this);
  }

  // If used as a subexpression
  return result;
});

// Register date and number formatting helpers with logging
logger.debug('Registering date and number formatting helpers');

handlebars.registerHelper('formatDate', function (date, format) {
  logger.debug('formatDate helper called:', {
    date,
    format,
  });
  try {
    if (!date) {
      return new handlebars.SafeString(
        `<span class="missing-value" data-field="date">[[Invalid date]]</span>`
      );
    }

    // Extract date value from HTML if needed
    let dateValue = date;
    let isAlreadyWrapped = false;
    if (
      typeof date === 'object' &&
      date.string &&
      typeof date.string === 'string'
    ) {
      // Try to extract date from HTML content
      const match = date.string.match(/data-field="date">([^<]+)<\/span>/);
      if (match) {
        dateValue = match[1];
        isAlreadyWrapped = true;
      }
    }

    // Format the date using moment directly
    const momentDate = moment(dateValue);
    if (!momentDate.isValid()) {
      return new handlebars.SafeString(
        `<span class="missing-value" data-field="date">[[Invalid date]]</span>`
      );
    }

    const formattedDate = momentDate.format(format);

    // If the date was already wrapped, return just the formatted value
    if (isAlreadyWrapped) {
      return formattedDate;
    }

    // For unwrapped dates, wrap in span
    return new handlebars.SafeString(
      `<span class="imported-value" data-field="date">${handlebars.escapeExpression(formattedDate)}</span>`
    );
  } catch (error) {
    logger.error('Error in formatDate helper:', {
      error,
      date,
      format,
    });
    return new handlebars.SafeString(
      `<span class="missing-value" data-field="date">[[Error formatting date: ${date}]]</span>`
    );
  }
});

handlebars.registerHelper('now', function (format) {
  logger.debug('now helper called:', {
    format,
  });
  try {
    const currentDate = moment().format(format);
    return new handlebars.SafeString(
      `<span class="imported-value" data-field="date">${handlebars.escapeExpression(currentDate)}</span>`
    );
  } catch (error) {
    logger.error('Error in now helper:', {
      error,
      format,
    });
    return new handlebars.SafeString(
      `<span class="missing-value" data-field="date">[[Error getting current date]]</span>`
    );
  }
});

handlebars.registerHelper('formatNumber', function (number, options) {
  logger.debug('formatNumber helper called:', {
    number,
    options,
  });
  try {
    if (options && options.hash && options.hash.style === 'percent') {
      const formatted = new Intl.NumberFormat('es-ES', {
        style: 'percent',
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }).format(number / 100);
      return new handlebars.SafeString(
        `<span class="imported-value" data-field="number">${handlebars.escapeExpression(formatted)}</span>`
      );
    }
    const formatted = new Intl.NumberFormat('es-ES', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(number);
    return new handlebars.SafeString(
      `<span class="imported-value" data-field="number">${handlebars.escapeExpression(formatted)}</span>`
    );
  } catch (error) {
    logger.error('Error in formatNumber helper:', {
      error,
      number,
      options,
    });
    return new handlebars.SafeString(
      `<span class="missing-value" data-field="number">[[Error formatting number: ${number}]]</span>`
    );
  }
});

// Add addYears helper
handlebars.registerHelper('addYears', function (date, years) {
  logger.debug('addYears helper called:', {
    date,
    years,
  });
  try {
    if (!date || years === undefined) {
      return new handlebars.SafeString(
        `<span class="missing-value" data-field="date">[[Invalid date]]</span>`
      );
    }
    const resultDate = moment(date).add(years, 'years');
    if (!resultDate.isValid()) {
      return new handlebars.SafeString(
        `<span class="missing-value" data-field="date">[[Invalid date]]</span>`
      );
    }
    return resultDate.toDate(); // Return the date object for further processing
  } catch (error) {
    logger.error('Error in addYears helper:', {
      error,
      date,
      years,
    });
    return new handlebars.SafeString(
      `<span class="missing-value" data-field="date">[[Error adding years to date]]</span>`
    );
  }
});

// Register other helpers from handlebars-helpers with logging
logger.debug('Registering other handlebars-helpers');
Object.entries(helpers).forEach(([name, helper]) => {
  if (!['eq', 'formatDate', 'now', 'number'].includes(name)) {
    try {
      handlebars.registerHelper(name, helper);
      logger.debug('Registered helper:', {
        name,
      });
    } catch (error) {
      logger.error('Error registering helper:', {
        name,
        error,
      });
    }
  }
});

// Register custom helpers
logger.debug('Registering custom helpers');
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
  // Re-export handlebars-helpers for convenience
  helpers,
};
