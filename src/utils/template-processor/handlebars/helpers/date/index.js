/**
 * @file Date Formatting Helpers for Handlebars
 *
 * Provides date formatting and manipulation helpers for templates with proper
 * locale support, timezone handling, and error management.
 *
 * Functions:
 * - formatDate: Format dates with locale support and timezone
 * - addYears: Add years to a date maintaining locale
 * - now: Get current date in specified format
 *
 * Flow:
 * 1. Input validation and type checking
 * 2. Date parsing and timezone configuration
 * 3. Format application with locale support
 * 4. Error handling and fallback values
 * 5. HTML wrapping for template integration
 *
 * Error Handling:
 * - Invalid dates return error spans
 * - Timezone mismatches are corrected
 * - Parsing errors show descriptive messages
 * - All errors are properly logged
 *
 * @module @/utils/template-processor/handlebars/helpers/date
 * @requires moment-timezone - Date manipulation with timezone support
 * @requires handlebars - Template system
 * @requires @/utils/common/logger - Logging system
 * @requires @/config/locale - Locale configuration
 */

const moment = require('moment-timezone');
const handlebars = require('handlebars');
const { logger } = require('@/utils/common/logger');
const { LOCALE_CONFIG } = require('@/config/locale');
const { HANDLEBARS_CONFIG } = require('@/config/handlebars-config');
const { extractValue } = require('../value/extract-handlebars-values');

// Configure moment with default timezone and locale
moment.locale(LOCALE_CONFIG.lang);
moment.tz.setDefault(LOCALE_CONFIG.timezone || 'Europe/Madrid');

/**
 * Format a date with locale support
 *
 * Formats a date using the configured locale and timezone.
 * Handles various input types and provides consistent output.
 *
 * @param {string|Date|handlebars.SafeString|moment.Moment} date - Date to format
 * @param {string} format - Format string (moment.js format)
 * @returns {handlebars.SafeString} Formatted date wrapped in HTML span
 *
 * @example
 * // Format current date
 * formatDate('now', 'DD/MM/YYYY')
 * // returns: <span class="imported-value" data-field="date">13/02/2024</span>
 *
 * // Format with Spanish locale
 * formatDate('2024-02-13', 'D [de] MMMM [de] YYYY')
 * // returns: <span class="imported-value" data-field="date">13 de febrero de 2024</span>
 *
 * // Handle invalid date
 * formatDate('invalid')
 * // returns: <span class="missing-value" data-field="date">[[Invalid date]]</span>
 */
function formatDate(date, format) {
  logger.debug('formatDate helper called:', {
    filename: 'date/index.js',
    date,
    format,
    context: '[helper]',
    operation: 'format-date',
  });

  try {
    if (!date) {
      logger.warn('Empty date provided to formatDate:', {
        filename: 'date/index.js',
        context: '[helper]',
        operation: 'format-date',
        date,
      });
      return new handlebars.SafeString(
        `<span class="missing-value" data-field="date">${
          HANDLEBARS_CONFIG.errorMessages.invalidDate
        }</span>`
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
      filename: 'date/index.js',
      error: error.message,
      stack: error.stack,
      context: '[helper]',
      operation: 'format-date',
      date,
      format,
    });
    return new handlebars.SafeString(
      `<span class="missing-value" data-field="date">[[Error formatting date]]</span>`
    );
  }
}

/**
 * Add years to a date
 *
 * Adds a specified number of years to a date, maintaining locale and timezone.
 * Handles various input formats and validates both date and years.
 *
 * @param {string|Date|moment.Moment} date - The base date
 * @param {number} years - Number of years to add
 * @param {object} options - Handlebars options
 * @returns {handlebars.SafeString|moment.Moment} Date with added years
 *
 * @example
 * // Add years to specific date
 * addYears('2024-02-13', 1)
 * // returns: <span class="imported-value" data-field="date">13 de febrero de 2025</span>
 *
 * // Add years to current date
 * addYears('now', 1)
 * // returns: <span class="imported-value" data-field="date">13 de febrero de 2025</span>
 *
 * // Handle invalid input
 * addYears('invalid', 1)
 * // returns: <span class="missing-value" data-field="date">[[Invalid date]]</span>
 */
function addYears(date, years, options) {
  logger.debug('addYears helper called:', {
    filename: 'date/index.js',
    date: moment.isMoment(date) ? date.format() : date,
    years,
    isSubexpression: options?.data?.isSubexpression,
    context: '[helper]',
    operation: 'add-years',
  });

  try {
    // Validate inputs
    if (!date || years === undefined) {
      logger.warn('Missing required parameters in addYears:', {
        filename: 'date/index.js',
        context: '[helper]',
        operation: 'add-years',
        date,
        years,
      });
      return new handlebars.SafeString(
        `<span class="missing-value" data-field="date">${
          HANDLEBARS_CONFIG.errorMessages.invalidDate
        }</span>`
      );
    }

    // Get base date
    let momentDate;
    if (moment.isMoment(date)) {
      // If it's already a moment object, clone it
      momentDate = date.clone();
    } else if (date === 'now') {
      // Handle 'now' keyword
      momentDate = moment();
    } else {
      // Try to parse the date
      momentDate = moment(date);
    }

    // Validate the date is valid
    if (!momentDate.isValid()) {
      logger.error('Invalid date in addYears:', {
        filename: 'date/index.js',
        context: '[helper]',
        operation: 'add-years',
        date,
        momentValid: momentDate.isValid(),
        momentDate: momentDate.format(),
      });
      return new handlebars.SafeString(
        `<span class="missing-value" data-field="date">${HANDLEBARS_CONFIG.errorMessages.invalidDate}</span>`
      );
    }

    // Set timezone and locale
    momentDate.tz(LOCALE_CONFIG.timezone || 'Europe/Madrid');
    momentDate.locale(LOCALE_CONFIG.lang);

    // Add years
    const yearsToAdd = Number(extractValue(years));
    if (isNaN(yearsToAdd)) {
      logger.error('Invalid years value in addYears:', {
        filename: 'date/index.js',
        context: '[helper]',
        operation: 'add-years',
        years,
        extractedValue: extractValue(years),
      });
      return new handlebars.SafeString(
        `<span class="missing-value" data-field="date">${HANDLEBARS_CONFIG.errorMessages.invalidDate}</span>`
      );
    }

    momentDate.add(yearsToAdd, 'years');

    logger.debug('Years added successfully:', {
      filename: 'date/index.js',
      context: '[helper]',
      operation: 'add-years',
      originalDate: moment.isMoment(date) ? date.format() : date,
      yearsAdded: yearsToAdd,
      resultDate: momentDate.format(),
    });

    // Return moment object if used as subexpression
    if (options?.data?.isSubexpression) {
      return momentDate;
    }

    // Otherwise return formatted string
    return new handlebars.SafeString(
      `<span class="imported-value" data-field="date">${momentDate.format(HANDLEBARS_CONFIG.dateFormats.FULL)}</span>`
    );
  } catch (error) {
    logger.error('Error in addYears helper:', {
      filename: 'date/index.js',
      error: error.message,
      stack: error.stack,
      context: '[helper]',
      operation: 'add-years',
      date: moment.isMoment(date) ? date.format() : date,
      years,
    });
    return new handlebars.SafeString(
      `<span class="missing-value" data-field="date">[[Error adding years to date]]</span>`
    );
  }
}

/**
 * Get current date in specified format
 *
 * Returns the current date formatted according to the specified format.
 * Uses configured timezone and locale settings.
 *
 * @param {string} format - The format string (moment.js format)
 * @param {object} options - Handlebars options object
 * @returns {handlebars.SafeString|moment.Moment} Formatted current date
 *
 * @example
 * // Get current date in default format
 * now()
 * // returns: <span class="imported-value" data-field="date">13/02/2024</span>
 *
 * // Get current date in Spanish format
 * now('D [de] MMMM [de] YYYY')
 * // returns: <span class="imported-value" data-field="date">13 de febrero de 2024</span>
 *
 * // Use as subexpression
 * formatDate(now(), 'DD/MM/YYYY')
 * // returns: <span class="imported-value" data-field="date">13/02/2024</span>
 */
function now(format, options) {
  logger.debug('now helper called:', {
    filename: 'date/index.js',
    format,
    isSubexpression: options?.data?.isSubexpression,
    context: '[helper]',
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
        filename: 'date/index.js',
        context: '[helper]',
        operation: 'get-now',
        date: currentDate.format(HANDLEBARS_CONFIG.dateFormats.ISO),
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
      filename: 'date/index.js',
      error: error.message,
      stack: error.stack,
      context: '[helper]',
      operation: 'get-now',
      format,
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
