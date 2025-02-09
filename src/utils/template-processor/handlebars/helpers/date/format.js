/**
 * @file Date formatting helpers for Handlebars with Spanish locale support
 *
 * Provides date formatting and manipulation helpers that:
 * - Support Spanish locale formatting
 * - Handle timezone configuration
 * - Process multiple date formats
 * - Support date arithmetic
 * - Handle empty/invalid dates
 *
 * Functions:
 * - formatDate: Main date formatting function
 * - addYears: Date arithmetic helper for years
 * - now: Current date/time helper
 * - extractValue: Value extraction utility
 *
 * Constants:
 * - HANDLEBARS_CONFIG: Configuration for date formats and errors
 * - LOCALE_CONFIG: Locale and timezone settings
 *
 * Flow:
 * 1. Extract and validate date input
 * 2. Configure locale and timezone
 * 3. Process date with moment.js
 * 4. Format result with proper locale
 * 5. Handle errors and empty values
 *
 * Error Handling:
 * - Handles invalid dates gracefully
 * - Provides formatted error messages
 * - Logs detailed error information
 * - Returns safe HTML for errors
 *
 * @module @/utils/template-processor/handlebars/helpers/date/format
 * @requires moment-timezone
 * @requires handlebars
 * @requires @/utils/common/logger
 * @requires @/config/locale
 * @requires @/config/handlebars-config
 */

const handlebars = require('handlebars');
const moment = require('moment-timezone');
require('moment/locale/es');
const { logger } = require('@/utils/common/logger');
const { LOCALE_CONFIG } = require('@/config/locale');
const { HANDLEBARS_CONFIG } = require('@/config/handlebars-config');
const { extractValue } = require('../value/extract');

// Configure moment with timezone and locale
moment.locale(LOCALE_CONFIG.locale);
moment.tz.setDefault(LOCALE_CONFIG.timezone);

/**
 * Format date using moment.js
 * @param {Date|string} date - The date to format
 * @param {string} format - Format string
 * @returns {string} Formatted date string
 */
function formatDate(date, format = HANDLEBARS_CONFIG.dateFormats.DEFAULT) {
  try {
    logger.debug('formatDate helper called:', {
      date,
      format,
      dateType: typeof date,
      isMoment: moment.isMoment(date),
    });

    // If it's a function, execute it
    if (typeof date === 'function') {
      date = date();
      logger.debug('formatDate: executed date function:', {
        result: date,
        resultType: typeof date,
        isMoment: moment.isMoment(date),
      });
    }

    // Extract actual value if wrapped
    date = extractValue(date);

    // Check if date is valid
    if (!date) {
      logger.debug('formatDate: no date provided');
      return new handlebars.SafeString(
        `<span class="${HANDLEBARS_CONFIG.emptyValue.class}" data-field="date">${HANDLEBARS_CONFIG.errorMessages.invalidDate}</span>`
      );
    }

    // Crear o clonar el objeto moment
    const momentDate = moment.isMoment(date) ? date.clone() : moment(date);
    momentDate.locale(LOCALE_CONFIG.locale);
    momentDate.tz(LOCALE_CONFIG.timezone);

    logger.debug('formatDate: before formatting:', {
      date: momentDate.format(),
      format,
      locale: momentDate.locale(),
      timezone: momentDate.tz(),
      isValid: momentDate.isValid(),
    });

    // Check if date is valid
    if (!momentDate.isValid()) {
      logger.debug('formatDate: invalid date');
      return new handlebars.SafeString(
        `<span class="${HANDLEBARS_CONFIG.emptyValue.class}" data-field="date">${HANDLEBARS_CONFIG.errorMessages.invalidDate}</span>`
      );
    }

    // Formatear la fecha
    const result = momentDate.format(format);

    logger.debug('formatDate: final result:', {
      result,
      format,
      locale: momentDate.locale(),
      timezone: momentDate.tz(),
    });

    return new handlebars.SafeString(
      `<span class="${HANDLEBARS_CONFIG.emptyValue.importedClass}" data-field="date">${result}</span>`
    );
  } catch (error) {
    logger.error('Error in formatDate helper:', {
      error,
      date,
      format,
    });
    return new handlebars.SafeString(
      `<span class="${HANDLEBARS_CONFIG.emptyValue.class}" data-field="date">${HANDLEBARS_CONFIG.errorMessages.invalidDate}</span>`
    );
  }
}

/**
 * Adds a specified number of years to a date
 *
 * @param {moment.Moment|string|Date} date - The date to add years to. If undefined, uses current date.
 * @param {number} years - The number of years to add
 * @returns {moment.Moment} A moment object with the years added
 */
function addYears(date, years) {
  try {
    logger.debug('addYears helper called with:', {
      date,
      years,
      dateType: typeof date,
      isMoment: moment.isMoment(date),
      isFunction: typeof date === 'function',
    });

    if (!date || years === undefined) {
      logger.debug('addYears: missing required parameters');
      return new handlebars.SafeString(
        `<span class="${HANDLEBARS_CONFIG.emptyValue.class}" data-field="date">${HANDLEBARS_CONFIG.errorMessages.invalidDate}</span>`
      );
    }

    // If it's a function (like now), execute it
    if (typeof date === 'function') {
      logger.debug('addYears: executing date function');
      date = date();
    }

    // Extract actual value if wrapped
    date = extractValue(date);

    // Crear o clonar el objeto moment
    const momentDate = moment.isMoment(date) ? date.clone() : moment(date);
    momentDate.locale(LOCALE_CONFIG.locale);
    momentDate.tz(LOCALE_CONFIG.timezone);

    logger.debug('addYears: moment object prepared:', {
      isValid: momentDate.isValid(),
      originalDate: date,
      locale: momentDate.locale(),
      timezone: momentDate.tz(),
      currentValue: momentDate.format(),
    });

    if (!momentDate.isValid()) {
      logger.error('addYears: invalid date:', {
        originalDate: date,
        momentDate: momentDate,
        reason: 'moment validation failed',
      });
      return new handlebars.SafeString(
        `<span class="${HANDLEBARS_CONFIG.emptyValue.class}" data-field="date">${HANDLEBARS_CONFIG.errorMessages.invalidDate}</span>`
      );
    }

    // Add years
    momentDate.add(years, 'years');

    logger.debug('addYears: final result:', {
      result: momentDate.format(),
      isMoment: moment.isMoment(momentDate),
      locale: momentDate.locale(),
      timezone: momentDate.tz(),
      yearsAdded: years,
    });

    return new handlebars.SafeString(
      `<span class="${HANDLEBARS_CONFIG.emptyValue.importedClass}" data-field="date">${momentDate.format(HANDLEBARS_CONFIG.dateFormats.FULL)}</span>`
    );
  } catch (error) {
    logger.error('Error in addYears helper:', {
      error,
      date,
      years,
    });
    return new handlebars.SafeString(
      `<span class="${HANDLEBARS_CONFIG.emptyValue.class}" data-field="date">${HANDLEBARS_CONFIG.errorMessages.invalidDate}</span>`
    );
  }
}

/**
 * Returns the current date/time, optionally formatted
 *
 * @param {string|object} format - Optional format string or Handlebars options object
 * @returns {string|moment.Moment} Formatted date string or moment object if chained
 */
function now(format) {
  try {
    logger.debug('now helper called:', {
      format,
      context: this,
      isChained: this && this.name === 'now',
    });

    const momentNow = moment();
    momentNow.locale(LOCALE_CONFIG.locale);
    momentNow.tz(LOCALE_CONFIG.timezone);

    logger.debug('now: created moment object:', {
      date: momentNow.format(),
      locale: momentNow.locale(),
      timezone: momentNow.tz(),
    });

    // If it's a function (like now), execute it
    if (this && this.name === 'now') {
      logger.debug('now: returning moment for chaining');
      return momentNow;
    }

    // Extract format string if it's a Handlebars options object
    let formatStr = format;
    if (format && typeof format === 'object' && format.name === 'now') {
      formatStr = format.hash && format.hash.format;
    }

    // Handle ISO format specifically
    if (formatStr === 'ISO') {
      formatStr = HANDLEBARS_CONFIG.dateFormats.ISO;
    }

    // If there's a format, format the date
    if (formatStr && typeof formatStr === 'string') {
      const formatted = momentNow.format(formatStr);
      logger.debug('now: formatted result:', { formatted });
      return new handlebars.SafeString(
        `<span class="${HANDLEBARS_CONFIG.emptyValue.importedClass}" data-field="date">${formatted}</span>`
      );
    }

    // Without format, use default format
    const formatted = momentNow.format(HANDLEBARS_CONFIG.dateFormats.DEFAULT);
    return new handlebars.SafeString(
      `<span class="${HANDLEBARS_CONFIG.emptyValue.importedClass}" data-field="date">${formatted}</span>`
    );
  } catch (error) {
    logger.error('Error in now helper:', {
      error,
      format,
    });
    return new handlebars.SafeString(
      `<span class="${HANDLEBARS_CONFIG.emptyValue.class}" data-field="date">${HANDLEBARS_CONFIG.errorMessages.invalidDate}</span>`
    );
  }
}

module.exports = {
  formatDate,
  addYears,
  now,
};
