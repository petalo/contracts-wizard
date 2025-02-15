/**
 * @file Date Formatting Helpers for Handlebars
 *
 * Provides date formatting and manipulation helpers for templates with proper
 * locale support, timezone handling, and error management.
 *
 * Functions:
 * - formatDate: Format dates with locale support and timezone
 * - addYears: Add years to a date maintaining locale
 * - now: Get current date in specified format, with test mode support
 * - convertToLuxonFormat: Convert date format string to Luxon format
 *
 * Flow:
 * 1. Input validation and type checking
 * 2. Date parsing and timezone configuration
 * 3. Format application with locale support
 * 4. Error handling and fallback values
 * 5. HTML wrapping for template integration
 * 6. Test mode date handling
 *
 * Error Handling:
 * - Invalid dates return error spans
 * - Timezone mismatches are corrected
 * - Parsing errors show descriptive messages
 * - All errors are properly logged with debug context
 * - Test mode uses fixed date (2024-01-29)
 * - Subexpressions return empty string on error
 * - Missing values show error message in span
 *
 * @module @/utils/template-processor/handlebars/helpers/date
 * @requires luxon - Date manipulation with timezone support
 * @requires handlebars - Template system
 * @requires @/utils/common/logger - Logging system
 * @requires @/config/locale - Locale configuration
 * @requires @/config/handlebars-config - Handlebars configuration
 * @requires @/utils/template-processor/handlebars/helpers/value/extract-handlebars-values - Value extraction
 */

const { DateTime } = require('luxon');
const handlebars = require('handlebars');
const { logger } = require('@/utils/common/logger');
const { LOCALE_CONFIG } = require('@/config/locale');
const { HANDLEBARS_CONFIG } = require('@/config/handlebars-config');
const { extractValue } = require('../value/extract-handlebars-values');

logger.debug('Date helpers initialization:', {
  filename: 'date/index.js',
  context: 'helper',
});

// Configure default timezone and locale
const defaultLocale = LOCALE_CONFIG.lang || 'es';
const defaultTimezone = LOCALE_CONFIG.timezone || 'Europe/Madrid';

try {
  // Verify locale and timezone are valid
  if (!DateTime.local().setLocale(defaultLocale).isValid) {
    throw new Error(`Invalid locale: ${defaultLocale}`);
  }
  if (!DateTime.local().setZone(defaultTimezone).isValid) {
    throw new Error(`Invalid timezone: ${defaultTimezone}`);
  }

  logger.debug('Luxon configuration complete:', {
    filename: 'date/index.js',
    context: '[system]',
    operation: 'init',
    technical: {
      currentLocale: defaultLocale,
      defaultTimezone: defaultTimezone,
      isLocaleValid: DateTime.local().setLocale(defaultLocale).isValid,
      availableFeatures: DateTime.FEATURES,
    },
  });
} catch (error) {
  logger.error('Error configuring Luxon:', {
    filename: 'date/index.js',
    context: '[system]',
    operation: 'init',
    error: {
      message: error.message,
      stack: error.stack,
      type: error.name,
    },
    technical: {
      locale: defaultLocale,
      timezone: defaultTimezone,
    },
    impact: 'Date formatting may not work correctly',
  });
}

/**
 * Converts a date format string to Luxon format
 *
 * Handles conversion of various date format tokens to their Luxon equivalents
 * and manages literal text in the format string.
 *
 * @param {string} format - The format string to convert
 * @returns {string} The Luxon-compatible format string
 *
 * @example
 * // Convert basic format
 * convertToLuxonFormat('YYYY-MM-DD')
 * // returns: 'yyyy-LL-dd'
 *
 * // Convert format with literals
 * convertToLuxonFormat('d "de" MMMM "de" YYYY')
 * // returns: "d 'de' LLLL 'de' yyyy"
 */
function convertToLuxonFormat(format) {
  return format
    .replace(/"([^"]+)"/g, "'$1'") // Convert double quotes to single quotes for literals
    .replace(/YYYY/g, 'yyyy') // 4-digit year (2024)
    .replace(/YY/g, 'yy') // 2-digit year (24)
    .replace(/DD/g, 'dd') // 2-digit day with leading zero (01-31)
    .replace(/D/g, 'd') // Day without leading zero (1-31)
    .replace(/MMMM/g, 'LLLL') // Full month name (January, February, etc)
    .replace(/MMM/g, 'LLL') // Abbreviated month name (Jan, Feb, etc)
    .replace(/MM/g, 'LL') // 2-digit month with leading zero (01-12)
    .replace(/M/g, 'L'); // Month without leading zero (1-12)
}

/**
 * Formats a date according to the specified format
 *
 * @param {string|object} date - The date to format
 * @param {string} [format] - The format to use (optional)
 * @param {object} [options] - Additional options
 * @returns {handlebars.SafeString} The formatted date wrapped in HTML span
 *
 * @example
 * // Format current date
 * formatDate('now', 'd "de" MMMM "de" yyyy')
 * // returns: <span class="imported-value" data-field="date">8 de marzo de 2024</span>
 *
 * // Format specific date
 * formatDate('2024-03-08', 'dd/MM/yyyy')
 * // returns: <span class="imported-value" data-field="date">08/03/2024</span>
 *
 * // Format with Luxon object
 * formatDate(DateTime.fromISO('2024-03-08'), 'dddd, D [de] MMMM')
 * // returns: <span class="imported-value" data-field="date">viernes, 8 de marzo</span>
 *
 * // Handle invalid date
 * formatDate('invalid', 'DD/MM/YYYY')
 * // returns: <span class="missing-value" data-field="date">[[Invalid date]]</span>
 */
function formatDate(date, format, options = {}) {
  try {
    logger.debug('formatDate input:', {
      date: date?.toString?.() || date,
      format: format?.toString?.() || format,
      isSubexpression: options?.data?.isSubexpression,
      isRaw: options?.hash?.raw,
    });

    // Handle undefined/null date
    if (date === undefined || date === null) {
      if (options?.data?.isSubexpression || options.hash?.raw) {
        return '';
      }
      return new handlebars.SafeString(
        '<span class="missing-value" data-field="date">[[Invalid date]]</span>'
      );
    }

    const dateValue = extractValue(date);
    let dateTime;

    // Handle DateTime objects directly (from now helper)
    if (dateValue instanceof DateTime) {
      dateTime = dateValue;
    } else if (dateValue === 'now') {
      // For tests, use a fixed date when 'now' is used
      if (process.env.NODE_ENV === 'test') {
        dateTime = DateTime.fromISO('2024-01-29T12:00:00.000Z', {
          zone: defaultTimezone,
        });
      } else {
        dateTime = DateTime.now().setZone(defaultTimezone);
      }
    } else if (dateValue instanceof handlebars.SafeString) {
      // Handle SafeString input (from other helpers)
      const match = dateValue.string.match(/data-field="date">([^<]+)</);
      const cleanDate = match
        ? match[1].trim()
        : dateValue.string.replace(/<[^>]*>/g, '').trim();

      // Try parsing with ISO format first (for subexpressions)
      dateTime = DateTime.fromISO(cleanDate, { zone: defaultTimezone });

      if (!dateTime.isValid) {
        // Try with default format
        dateTime = DateTime.fromFormat(
          cleanDate,
          HANDLEBARS_CONFIG.dateFormats.DEFAULT,
          {
            zone: defaultTimezone,
            locale: defaultLocale,
          }
        );
      }
    } else {
      // Handle raw string input (from subexpressions or direct input)
      const cleanDate =
        typeof dateValue === 'string'
          ? dateValue.replace(/<[^>]*>/g, '').trim()
          : dateValue;

      // Try parsing as ISO first (for subexpressions)
      dateTime = DateTime.fromISO(cleanDate, { zone: defaultTimezone });

      if (!dateTime.isValid) {
        // Try with specific formats
        const formats = [
          HANDLEBARS_CONFIG.dateFormats.DEFAULT,
          HANDLEBARS_CONFIG.dateFormats.FULL,
          HANDLEBARS_CONFIG.dateFormats.SHORT,
        ];

        for (const fmt of formats) {
          dateTime = DateTime.fromFormat(cleanDate, fmt, {
            zone: defaultTimezone,
            locale: defaultLocale,
          });
          if (dateTime.isValid) break;
        }
      }
    }

    if (!dateTime?.isValid) {
      if (options?.data?.isSubexpression || options.hash?.raw) {
        return '';
      }
      return new handlebars.SafeString(
        '<span class="missing-value" data-field="date">[[Invalid date]]</span>'
      );
    }

    // Handle format parameter
    let dateFormat;
    if (format instanceof handlebars.SafeString) {
      // If the format is a date from another helper, use DEFAULT format
      // and ignore the date value as format
      dateFormat = HANDLEBARS_CONFIG.dateFormats.DEFAULT;
    } else if (typeof format === 'object' && format.hash) {
      // Format passed as options
      options = format;
      dateFormat =
        options.hash?.format || HANDLEBARS_CONFIG.dateFormats.DEFAULT;
    } else if (format) {
      // Handle format string
      dateFormat =
        typeof format === 'string'
          ? format.replace(/<[^>]*>/g, '').trim()
          : format;
    } else {
      dateFormat =
        options.hash?.format || HANDLEBARS_CONFIG.dateFormats.DEFAULT;
    }

    // Handle predefined formats
    if (HANDLEBARS_CONFIG?.dateFormats?.[dateFormat]) {
      dateFormat = HANDLEBARS_CONFIG.dateFormats[dateFormat];
    }

    // Format using Luxon with proper locale
    dateTime = dateTime.setLocale(defaultLocale);

    // Return raw format if used as subexpression or raw option is set
    if (options?.data?.isSubexpression || options.hash?.raw) {
      // Always use DEFAULT format unless explicitly specified
      const format =
        options.hash?.format || HANDLEBARS_CONFIG.dateFormats.DEFAULT;
      const luxonFormat = convertToLuxonFormat(format);

      logger.debug('formatDate subexpression output:', {
        format,
        luxonFormat,
        result: dateTime.setLocale(defaultLocale).toFormat(luxonFormat),
      });

      return dateTime.setLocale(defaultLocale).toFormat(luxonFormat);
    }

    // Format the date
    const luxonFormat = convertToLuxonFormat(dateFormat);
    const formattedDate = dateTime.toFormat(luxonFormat, {
      locale: defaultLocale,
    });

    return new handlebars.SafeString(
      `<span class="imported-value" data-field="date">${formattedDate}</span>`
    );
  } catch (error) {
    logger.error('Error in formatDate:', {
      filename: 'date/index.js',
      context: 'helper',
      error: error.message,
      stack: error.stack,
      date,
      format,
      options,
    });
    if (options?.data?.isSubexpression || options.hash?.raw) {
      return '';
    }
    return new handlebars.SafeString(
      '<span class="missing-value" data-field="date">[[Error formatting date]]</span>'
    );
  }
}

/**
 * Adds years to a date
 *
 * @param {string|object} date - The date to add years to
 * @param {number|string} years - Number of years to add
 * @param {object} options - Handlebars options object
 * @returns {handlebars.SafeString} The resulting date wrapped in HTML span
 *
 * @example
 * // Add 1 year to current date
 * addYears('now', 1)
 * // returns: <span class="imported-value" data-field="date">8 de marzo de 2025</span>
 *
 * // Add decimal years (rounds down)
 * addYears('2024-03-08', 1.5)
 * // returns: <span class="imported-value" data-field="date">8 de marzo de 2025</span>
 */
function addYears(date, years, options = {}) {
  try {
    logger.debug('addYears input:', {
      date: date?.toString?.() || date,
      dateType: date?.constructor?.name || typeof date,
      years: years?.toString?.() || years,
      isSubexpression: options?.data?.isSubexpression,
      isRaw: options?.hash?.raw,
    });

    // Handle undefined/null date
    if (date === undefined || date === null) {
      if (options?.data?.isSubexpression) {
        return '';
      }
      return new handlebars.SafeString(
        '<span class="missing-value" data-field="date">[[Invalid date]]</span>'
      );
    }

    // Handle undefined/null years
    if (years === undefined || years === null) {
      if (options?.data?.isSubexpression) {
        return '';
      }
      return new handlebars.SafeString(
        '<span class="missing-value" data-field="date">[[Invalid date]]</span>'
      );
    }

    let dateTime;

    if (date?._isDateTime && date.value instanceof DateTime) {
      // Handle wrapped DateTime objects
      dateTime = date.value;
      logger.debug('Using wrapped DateTime object:', {
        date: dateTime.toISO(),
        timezone: dateTime.zoneName,
      });
    } else if (date instanceof DateTime) {
      // Handle DateTime objects directly
      dateTime = date;
      logger.debug('Using DateTime object directly:', {
        date: dateTime.toISO(),
        timezone: dateTime.zoneName,
      });
    } else {
      const dateValue = extractValue(date);
      logger.debug('Extracted date value:', {
        value: dateValue?.toString?.() || dateValue,
        type: dateValue?.constructor?.name || typeof dateValue,
      });

      if (dateValue === 'now') {
        // Use current date (or fixed date in test mode)
        if (process.env.NODE_ENV === 'test') {
          dateTime = DateTime.fromISO('2024-01-29T12:00:00.000Z', {
            zone: defaultTimezone,
          });
        } else {
          dateTime = DateTime.now().setZone(defaultTimezone);
        }
      } else if (dateValue instanceof DateTime) {
        dateTime = dateValue;
      } else if (dateValue instanceof handlebars.SafeString) {
        // Handle SafeString input (from other helpers)
        const match = dateValue.string.match(/data-field="date">([^<]+)</);
        const cleanDate = match
          ? match[1].trim()
          : dateValue.string.replace(/<[^>]*>/g, '').trim();

        // Try parsing with ISO format first (for subexpressions)
        dateTime = DateTime.fromISO(cleanDate, { zone: defaultTimezone });

        if (!dateTime.isValid) {
          // Try with default format
          dateTime = DateTime.fromFormat(
            cleanDate,
            HANDLEBARS_CONFIG.dateFormats.DEFAULT,
            {
              zone: defaultTimezone,
              locale: defaultLocale,
            }
          );
        }
      } else {
        // Handle raw string input
        const cleanDate =
          typeof dateValue === 'string'
            ? dateValue.replace(/<[^>]*>/g, '').trim()
            : dateValue;

        // Try parsing as ISO first
        dateTime = DateTime.fromISO(cleanDate, { zone: defaultTimezone });

        if (!dateTime.isValid) {
          // Try with specific formats
          const formats = [
            HANDLEBARS_CONFIG.dateFormats.DEFAULT,
            HANDLEBARS_CONFIG.dateFormats.FULL,
            HANDLEBARS_CONFIG.dateFormats.SHORT,
          ];

          for (const fmt of formats) {
            dateTime = DateTime.fromFormat(cleanDate, fmt, {
              zone: defaultTimezone,
              locale: defaultLocale,
            });
            if (dateTime.isValid) break;
          }
        }
      }
    }

    if (!dateTime?.isValid) {
      if (options?.data?.isSubexpression) {
        return '';
      }
      return new handlebars.SafeString(
        '<span class="missing-value" data-field="date">[[Invalid date]]</span>'
      );
    }

    // Handle years value
    const yearsValue = extractValue(years);
    const cleanYears =
      typeof yearsValue === 'string'
        ? yearsValue.replace(/<[^>]*>/g, '').trim()
        : yearsValue;

    const numYears = Math.floor(parseFloat(cleanYears)); // Round down decimal years
    if (isNaN(numYears)) {
      if (options?.data?.isSubexpression) {
        return '';
      }
      return new handlebars.SafeString(
        '<span class="missing-value" data-field="date">[[Invalid date]]</span>'
      );
    }

    logger.debug('addYears calculation:', {
      originalDate: dateTime.toISO(),
      years: numYears,
    });

    // Add years using Luxon
    dateTime = dateTime.plus({ years: numYears });

    logger.debug('addYears result:', {
      resultDate: dateTime.toISO(),
    });

    // Return raw format if used as subexpression or raw option is set
    if (options?.data?.isSubexpression || options.hash?.raw) {
      const format =
        options.hash?.format || HANDLEBARS_CONFIG.dateFormats.DEFAULT;
      const luxonFormat = convertToLuxonFormat(format);

      logger.debug('addYears subexpression output:', {
        format,
        luxonFormat,
        result: dateTime.setLocale(defaultLocale).toFormat(luxonFormat),
      });

      return dateTime.setLocale(defaultLocale).toFormat(luxonFormat);
    }

    // Format the date with default format unless explicitly specified
    const format =
      options.hash?.format || HANDLEBARS_CONFIG.dateFormats.DEFAULT;
    const luxonFormat = convertToLuxonFormat(format);
    const formattedDate = dateTime
      .setLocale(defaultLocale)
      .toFormat(luxonFormat);

    return new handlebars.SafeString(
      `<span class="imported-value" data-field="date">${formattedDate}</span>`
    );
  } catch (error) {
    logger.error('Error in addYears:', {
      filename: 'date/index.js',
      context: 'helper',
      error: error.message,
      stack: error.stack,
      date,
      years,
      options,
    });
    if (options?.data?.isSubexpression) {
      return '';
    }
    return new handlebars.SafeString(
      '<span class="missing-value" data-field="date">[[Error adding years to date]]</span>'
    );
  }
}

/**
 * Gets the current date in the specified format
 *
 * @param {string} [format] - The format to use (optional)
 * @param {object} [options] - Handlebars options object
 * @returns {handlebars.SafeString} The current date wrapped in HTML span
 *
 * @example
 * // Get current date in default format
 * now()
 * // returns: <span class="imported-value" data-field="date">08/03/2024</span>
 *
 * // Get current date in specific format
 * now('d "de" MMMM "de" yyyy')
 * // returns: <span class="imported-value" data-field="date">8 de marzo de 2024</span>
 */
function now(format, options = {}) {
  try {
    // If no format is passed (or first parameter is options object),
    // reassign so options is the only parameter
    if (!format || (typeof format === 'object' && format.hash)) {
      options = format || {};
      format = undefined;
    }

    // If raw=true is passed, return DateTime object directly without formatting
    if (options.hash?.raw) {
      const dt =
        // prettier-ignore
        process.env.NODE_ENV === 'test'
          ? DateTime.fromISO('2024-01-29T12:00:00.000Z', {
            zone: defaultTimezone,
          })
          : DateTime.now().setZone(defaultTimezone);
      logger.debug('Using test date in now helper with raw=true:', {
        date: dt.toISO(),
        timezone: defaultTimezone,
      });
      return dt;
    }

    // Define default format with fallback
    let dateFormat = HANDLEBARS_CONFIG.dateFormats.DEFAULT;

    if (format) {
      if (typeof format === 'object' && format.hash) {
        // Format passed as options
        options = format;
        if (options.hash?.format) {
          dateFormat = options.hash.format;
        }
      } else if (format instanceof handlebars.SafeString) {
        // Handle SafeString input (from other helpers)
        const match = format.string.match(/data-field="date">([^<]+)</);
        dateFormat = match
          ? match[1].trim()
          : format.string.replace(/<[^>]*>/g, '').trim();
      } else {
        // Handle HTML-wrapped format
        const formatValue = extractValue(format);
        if (typeof formatValue === 'string') {
          dateFormat = formatValue.replace(/<[^>]*>/g, '');
        } else if (formatValue) {
          dateFormat = formatValue;
        }
      }
    }

    // Handle predefined formats
    if (HANDLEBARS_CONFIG?.dateFormats?.[dateFormat]) {
      dateFormat = HANDLEBARS_CONFIG.dateFormats[dateFormat];
    }

    // Create DateTime using the current date (or fixed date in test mode)
    let dateTime;
    if (process.env.NODE_ENV === 'test') {
      dateTime = DateTime.fromISO('2024-01-29T12:00:00.000Z', {
        zone: defaultTimezone,
      });
      logger.debug('Using test date in now helper:', {
        date: dateTime.toISO(),
        timezone: defaultTimezone,
      });
    } else {
      dateTime = DateTime.now().setZone(defaultTimezone);
    }

    if (!dateTime.isValid) {
      if (options?.data?.isSubexpression || options.hash?.raw) {
        return '';
      }
      return new handlebars.SafeString(
        '<span class="missing-value" data-field="date">[[Invalid date]]</span>'
      );
    }

    // Format using Luxon with proper locale
    dateTime = dateTime.setLocale(defaultLocale);

    // Prepare format for Luxon
    const luxonFormat = convertToLuxonFormat(dateFormat);

    // Format the date using the prepared format
    const formattedDate = dateTime.toFormat(luxonFormat, {
      locale: defaultLocale,
    });

    // Return raw result if used as subexpression
    if (options?.data?.isSubexpression) {
      return formattedDate;
    }

    return new handlebars.SafeString(
      `<span class="imported-value" data-field="date">${formattedDate}</span>`
    );
  } catch (error) {
    logger.error('Error in now helper:', {
      context: '[error]',
      filename: 'date/index.js',
      error: error.message,
      stack: error.stack,
      format,
      options,
      technical: {
        originalFormat: format,
        processedFormat: format,
      },
    });
    if (options?.data?.isSubexpression || options.hash?.raw) {
      return '';
    }
    return new handlebars.SafeString(
      '<span class="missing-value" data-field="date">[[Error getting current date]]</span>'
    );
  }
}

// Register helpers
handlebars.registerHelper('formatDate', formatDate);
handlebars.registerHelper('addYears', addYears);
handlebars.registerHelper('now', now);

module.exports = {
  formatDate,
  addYears,
  now,
};
