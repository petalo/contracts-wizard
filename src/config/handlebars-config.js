/**
 * @file Handlebars Configuration System
 *
 * Manages Handlebars template engine configuration:
 * - Helper settings and defaults
 * - Date formatting patterns
 * - Currency formatting options
 * - Empty value handling
 * - Array processing rules
 * - Error message templates
 *
 * Constants:
 * - HANDLEBARS_CONFIG: Main configuration object
 *   - dateFormats: Standard date patterns
 *   - numberFormat: Currency and number formatting
 *   - emptyValue: Empty value handling
 *   - arrayConfig: Array processing settings
 *   - errorMessages: Standard error templates
 *
 * Flow:
 * 1. Define date format patterns
 * 2. Configure number/currency formatting
 * 3. Configure empty value handling
 * 4. Set array processing rules
 * 5. Define error message templates
 * 6. Freeze configuration
 *
 * Error Handling:
 * - Invalid format validation
 * - Empty value detection
 * - Array depth limits
 * - Error message templating
 *
 * @module @/config/handlebarsConfig
 * @requires @/config/locale
 *
 * @example
 * // Import configuration
 * const { HANDLEBARS_CONFIG } = require('@/config/handlebarsConfig');
 *
 * // Use date formats
 * const formatted = moment().format(HANDLEBARS_CONFIG.dateFormats.DEFAULT);
 *
 * // Handle empty values
 * const empty = HANDLEBARS_CONFIG.emptyValue.template.replace('{key}', 'field');
 */

/**
 * Handlebars configuration object
 *
 * Defines comprehensive settings for Handlebars:
 * - Date format patterns
 * - Currency format options
 * - Empty value templates
 * - Array processing rules
 * - Error message formats
 *
 * @constant {object}
 * @property {object} dateFormats - Date format patterns
 * @property {object} numberFormat - Currency and number formatting
 * @property {object} emptyValue - Empty value handling
 * @property {object} arrayConfig - Array processing rules
 * @property {object} errorMessages - Error message templates
 */
const HANDLEBARS_CONFIG = {
  dateFormats: {
    DEFAULT: 'dd/LL/yyyy', // Default format: day/month/year with leading zeros (e.g. 01/03/2024)
    ISO: 'yyyy-LL-dd', // ISO format: year-month-day (e.g. 2024-03-01)
    ISO8601: 'yyyy-LL-dd HH:mm:ss', // ISO8601 format with time: year-month-day hours:minutes:seconds (e.g. 2024-03-01 13:45:30)
    FULL: "d 'de' LLLL 'de' yyyy", // Full text format in Spanish: day 'de' month 'de' year (e.g. 1 de marzo de 2024)
    SHORT: 'dd/LL/yyyy', // Short format: same as DEFAULT - day/month/year with leading zeros (e.g. 01/03/2024)
    TIME: 'HH:mm:ss', // Time only format: 24h hours:minutes:seconds (e.g. 13:45:30)
  },
  numberFormat: {
    defaults: {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      useGrouping: true,
    },
    currencies: {
      EUR: {
        symbol: '€',
        position: 'suffix',
        spacing: true,
      },
      USD: {
        symbol: '$',
        position: 'prefix',
        spacing: false,
      },
    },
  },
  emptyValue: {
    template: '<span class="missing-value" data-field="{key}">[[{key}]]</span>',
    class: 'missing-value',
    importedClass: 'imported-value',
  },
  arrayConfig: {
    maxDepth: 10,
    // Remove empty/null/undefined values when processing arrays
    trimEmpty: true, // When true, filters out empty values from arrays before processing them
  },
  errorMessages: {
    invalidDate: '[[Invalid date]]',
    invalidAmount: '[[Invalid amount]]',
    invalidCurrency: '[[Invalid currency]]',
    invalidConversion: '[[Invalid currency conversion]]',
    missingValue: '(Empty value)',
    processingError: '[Error processing {type}]',
  },
};

// Prevent runtime modifications
Object.freeze(HANDLEBARS_CONFIG);
Object.freeze(HANDLEBARS_CONFIG.dateFormats);
Object.freeze(HANDLEBARS_CONFIG.numberFormat);
Object.freeze(HANDLEBARS_CONFIG.numberFormat.defaults);
Object.freeze(HANDLEBARS_CONFIG.numberFormat.currencies);
Object.freeze(HANDLEBARS_CONFIG.emptyValue);
Object.freeze(HANDLEBARS_CONFIG.arrayConfig);
Object.freeze(HANDLEBARS_CONFIG.errorMessages);

module.exports = {
  HANDLEBARS_CONFIG,
};
