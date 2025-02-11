/**
 * @file Handlebars Configuration System
 *
 * Manages Handlebars template engine configuration:
 * - Helper settings and defaults
 * - Date formatting patterns
 * - Empty value handling
 * - Array processing rules
 * - Error message templates
 *
 * Constants:
 * - HANDLEBARS_CONFIG: Main configuration object
 *   - dateFormats: Standard date patterns
 *   - emptyValue: Empty value handling
 *   - arrayConfig: Array processing settings
 *   - errorMessages: Standard error templates
 *
 * Flow:
 * 1. Define date format patterns
 * 2. Configure empty value handling
 * 3. Set array processing rules
 * 4. Define error message templates
 * 5. Freeze configuration
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

const { LOCALE_CONFIG } = require('@/config/locale');

/**
 * Handlebars configuration object
 *
 * Defines comprehensive settings for Handlebars:
 * - Date format patterns
 * - Empty value templates
 * - Array processing rules
 * - Error message formats
 *
 * @constant {object}
 * @property {object} dateFormats - Date format patterns
 * @property {object} emptyValue - Empty value handling
 * @property {object} arrayConfig - Array processing rules
 * @property {object} errorMessages - Error message templates
 */
const HANDLEBARS_CONFIG = {
  dateFormats: {
    DEFAULT: 'D [de] MMMM [de] YYYY',
    ISO: 'YYYY-MM-DD',
    ISO8601: 'YYYY-MM-DD HH:mm:ss',
    FULL: 'D [de] MMMM [de] YYYY',
    SHORT: 'DD/MM/YYYY',
    TIME: 'HH:mm:ss',
  },
  emptyValue: {
    template: '<span class="missing-value" data-field="{key}">[[{key}]]</span>',
    class: 'missing-value',
    importedClass: 'imported-value',
  },
  arrayConfig: {
    maxDepth: 10,
    trimEmpty: true,
  },
  numberFormat: {
    locale: LOCALE_CONFIG.fullLocale,
    currency: 'EUR',
    defaults: {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
      useGrouping: true,
    },
  },
  errorMessages: {
    invalidDate: '[[Invalid date]]',
    missingValue: '(Empty value)',
    processingError: '[Error processing {type}]',
  },
};

// Prevent runtime modifications
Object.freeze(HANDLEBARS_CONFIG);
Object.freeze(HANDLEBARS_CONFIG.dateFormats);
Object.freeze(HANDLEBARS_CONFIG.emptyValue);
Object.freeze(HANDLEBARS_CONFIG.arrayConfig);
Object.freeze(HANDLEBARS_CONFIG.numberFormat);
Object.freeze(HANDLEBARS_CONFIG.errorMessages);

module.exports = {
  HANDLEBARS_CONFIG,
};
