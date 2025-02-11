/**
 * @file Date Formatting Helpers for Handlebars
 *
 * Provides date formatting and manipulation helpers:
 * - formatDate: Format dates with locale support
 * - addYears: Add years to a date
 * - now: Get current date in specified format
 *
 * All helpers wrap their output in spans with appropriate classes
 * for tracking imported vs missing values.
 *
 * @module @/utils/template-processor/handlebars/helpers/date
 * @requires moment-timezone
 * @requires handlebars
 * @requires @/utils/common/logger
 * @requires @/config/locale
 */

const moment = require('moment-timezone');
const handlebars = require('handlebars');
const { logger } = require('@/utils/common/logger');
const { LOCALE_CONFIG } = require('@/config/locale');
const { HANDLEBARS_CONFIG } = require('@/config/handlebars-config');
const { extractValue } = require('../value/extract-handlebars-values');

// Configure moment with default timezone and locale
moment.locale(LOCALE_CONFIG.locale);
moment.tz.setDefault(LOCALE_CONFIG.timezone || 'Europe/Madrid');

/**
 * Extract date from a SafeString that may contain HTML
 * @param {string|handlebars.SafeString} value - The value to extract date from
 * @returns {string|null} The extracted date or null if invalid
 */
// function extractDateFromSafeString(value) {
//   if (value instanceof handlebars.SafeString) {
//     const match = value.string.match(/data-field="date">([^<]+)<\/span>/);
//     if (match && match[1]) {
//       const dateStr = match[1];
//       // If it's an error message, return null
//       if (dateStr.startsWith('[[') && dateStr.endsWith(']]')) {
//         return null;
//       }
//       // Try to parse the date from various formats
//       const parsedDate = moment(
//         dateStr,
//         [
//           HANDLEBARS_CONFIG.dateFormats.FULL,
//           HANDLEBARS_CONFIG.dateFormats.SHORT,
//           HANDLEBARS_CONFIG.dateFormats.ISO,
//         ],
//         true
//       );
//       if (parsedDate.isValid()) {
//         return parsedDate.format(HANDLEBARS_CONFIG.dateFormats.ISO);
//       }
//     }
//   }
//   return value;
// }

/**
 * Format a date with locale support
 * @param {string|Date|handlebars.SafeString|moment.Moment} date - The date to format or "now" for current date
 * @param {string} format - The format string (moment.js format)
 * @returns {handlebars.SafeString} Formatted date wrapped in HTML span
 */
function formatDate(date, format) {
  logger.debug('formatDate helper called:', {
    date,
    format,
    context: '[template]',
    operation: 'format-date',
  });

  try {
    if (!date) {
      return new handlebars.SafeString(
        `<span class="missing-value" data-field="date">${HANDLEBARS_CONFIG.errorMessages.invalidDate}</span>`
      );
    }

    // Handle special "now" keyword
    if (date === 'now') {
      const currentDate = moment.tz(
        moment(),
        LOCALE_CONFIG.timezone || 'Europe/Madrid'
      );
      currentDate.locale(LOCALE_CONFIG.locale);

      const formatValue = format
        ? extractValue(format)
        : HANDLEBARS_CONFIG.dateFormats.SHORT;
      const finalFormat =
        HANDLEBARS_CONFIG.dateFormats[formatValue] || formatValue;

      return new handlebars.SafeString(
        `<span class="imported-value" data-field="date">${currentDate.format(finalFormat)}</span>`
      );
    }

    // If date is a moment object (from subexpression), use it directly
    if (moment.isMoment(date)) {
      const formatValue = format
        ? extractValue(format)
        : HANDLEBARS_CONFIG.dateFormats.SHORT;
      const finalFormat =
        HANDLEBARS_CONFIG.dateFormats[formatValue] || formatValue;

      return new handlebars.SafeString(
        `<span class="imported-value" data-field="date">${date.format(finalFormat)}</span>`
      );
    }

    // Extract values first to catch any extraction errors
    let dateValue = extractValue(date);
    const formatValue = format
      ? extractValue(format)
      : HANDLEBARS_CONFIG.dateFormats.SHORT;

    // Then try to extract date from SafeString if needed
    if (date instanceof handlebars.SafeString) {
      const match = date.string.match(/data-field="date">([^<]+)<\/span>/);
      if (match && match[1]) {
        const dateStr = match[1];
        // If it's an error message, return it as is
        if (dateStr.startsWith('[[') && dateStr.endsWith(']]')) {
          return date;
        }
        // Try to parse the date from various formats
        const parsedDate = moment.tz(
          dateStr,
          [
            HANDLEBARS_CONFIG.dateFormats.FULL,
            HANDLEBARS_CONFIG.dateFormats.SHORT,
            HANDLEBARS_CONFIG.dateFormats.ISO,
          ],
          true,
          LOCALE_CONFIG.timezone || 'Europe/Madrid'
        );
        if (parsedDate.isValid()) {
          dateValue = parsedDate.format(HANDLEBARS_CONFIG.dateFormats.ISO);
        }
      }
    }

    // Check if format is a predefined format
    const finalFormat =
      HANDLEBARS_CONFIG.dateFormats[formatValue] || formatValue;

    // Parse the date in the local timezone
    const momentDate = moment.tz(
      dateValue,
      HANDLEBARS_CONFIG.dateFormats.ISO,
      true,
      LOCALE_CONFIG.timezone || 'Europe/Madrid'
    );
    momentDate.locale(LOCALE_CONFIG.locale);

    if (!momentDate.isValid()) {
      return new handlebars.SafeString(
        `<span class="missing-value" data-field="date">${HANDLEBARS_CONFIG.errorMessages.invalidDate}</span>`
      );
    }

    return new handlebars.SafeString(
      `<span class="imported-value" data-field="date">${momentDate.format(finalFormat)}</span>`
    );
  } catch (error) {
    logger.error('Error in formatDate helper:', {
      error: error.message,
      context: '[template]',
      operation: 'format-date',
    });
    return new handlebars.SafeString(
      `<span class="missing-value" data-field="date">[[Error formatting date]]</span>`
    );
  }
}

/**
 * Add years to a date
 * @param {string|Date} date - The base date
 * @param {number} years - Number of years to add
 * @returns {handlebars.SafeString} Resulting date wrapped in HTML span
 */
function addYears(date, years) {
  logger.debug('addYears helper called:', {
    date,
    years,
    context: '[template]',
    operation: 'add-years',
  });

  try {
    if (!date || years === undefined) {
      return new handlebars.SafeString(
        `<span class="missing-value" data-field="date">${HANDLEBARS_CONFIG.errorMessages.invalidDate}</span>`
      );
    }

    // Extract values first to catch any extraction errors
    let dateValue = extractValue(date);
    const yearsValue = extractValue(years);

    // Then try to extract date from SafeString if needed
    if (date instanceof handlebars.SafeString) {
      const match = date.string.match(/data-field="date">([^<]+)<\/span>/);
      if (match && match[1]) {
        const dateStr = match[1];
        // If it's an error message, return it as is
        if (dateStr.startsWith('[[') && dateStr.endsWith(']]')) {
          return date;
        }
        // Try to parse the date from various formats
        const parsedDate = moment(
          dateStr,
          [
            HANDLEBARS_CONFIG.dateFormats.FULL,
            HANDLEBARS_CONFIG.dateFormats.SHORT,
            HANDLEBARS_CONFIG.dateFormats.ISO,
          ],
          true
        );
        if (parsedDate.isValid()) {
          dateValue = parsedDate.format(HANDLEBARS_CONFIG.dateFormats.ISO);
        }
      }
    }

    // Ensure we have valid values
    if (!dateValue || yearsValue === undefined || yearsValue === null) {
      return new handlebars.SafeString(
        `<span class="missing-value" data-field="date">${HANDLEBARS_CONFIG.errorMessages.invalidDate}</span>`
      );
    }

    // Parse the date in the local timezone
    const resultDate = moment(
      dateValue,
      HANDLEBARS_CONFIG.dateFormats.ISO,
      true
    );
    resultDate.locale(LOCALE_CONFIG.locale);

    if (!resultDate.isValid()) {
      return new handlebars.SafeString(
        `<span class="missing-value" data-field="date">${HANDLEBARS_CONFIG.errorMessages.invalidDate}</span>`
      );
    }

    resultDate.add(yearsValue, 'years');

    return new handlebars.SafeString(
      `<span class="imported-value" data-field="date">${resultDate.format(HANDLEBARS_CONFIG.dateFormats.FULL)}</span>`
    );
  } catch (error) {
    logger.error('Error in addYears helper:', {
      error: error.message,
      context: '[template]',
      operation: 'add-years',
    });
    return new handlebars.SafeString(
      `<span class="missing-value" data-field="date">[[Error adding years to date]]</span>`
    );
  }
}

/**
 * Get current date in specified format
 * @param {string} format - The format string (moment.js format)
 * @param {object} options - Handlebars options object
 * @returns {handlebars.SafeString|moment.Moment} Current date wrapped in HTML span or moment object if used as subexpression
 */
function now(format, options) {
  logger.debug('now helper called:', {
    format,
    isSubexpression: options && options.data && options.data.isSubexpression,
    context: '[template]',
    operation: 'get-now',
  });

  try {
    // Get current date with timezone
    const currentDate = moment.tz(
      moment(),
      LOCALE_CONFIG.timezone || 'Europe/Madrid'
    );

    // Set locale
    currentDate.locale(LOCALE_CONFIG.locale);

    // If this is a subexpression (used inside another helper), return the moment object
    if (options && options.data && options.data.isSubexpression) {
      logger.debug('Returning moment object for subexpression', {
        context: '[template]',
        operation: 'get-now',
      });
      return currentDate;
    }

    // If no format is provided, use SHORT format
    if (!format) {
      return new handlebars.SafeString(
        `<span class="imported-value" data-field="date">${currentDate.format(HANDLEBARS_CONFIG.dateFormats.SHORT)}</span>`
      );
    }

    // Extract format value and handle predefined formats
    const formatValue = extractValue(format);
    const finalFormat =
      HANDLEBARS_CONFIG.dateFormats[formatValue] || formatValue;

    return new handlebars.SafeString(
      `<span class="imported-value" data-field="date">${currentDate.format(finalFormat)}</span>`
    );
  } catch (error) {
    logger.error('Error in now helper:', {
      error: error.message,
      stack: error.stack,
      context: '[error]',
      operation: 'get-now',
    });
    return new handlebars.SafeString(
      `<span class="missing-value" data-field="date">[[Error getting current date]]</span>`
    );
  }
}

module.exports = {
  formatDate,
  addYears,
  now,
};
