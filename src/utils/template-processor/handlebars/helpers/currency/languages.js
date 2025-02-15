/**
 * @file Currency Language Definitions
 *
 * Defines the language configurations for numbro library:
 * - Delimiters (decimal and thousands separators)
 * - Currency symbols and positions
 * - Number formats and abbreviations
 *
 * Flow:
 * 1. Define language configurations
 * 2. Export configurations for registration
 *
 * @module @/utils/template-processor/handlebars/helpers/currency/languages
 * @requires numbro
 */

/**
 * Language configurations for numbro
 * @constant {object}
 */
const CURRENCY_LANGUAGES = {
  'es-ES': {
    languageTag: 'es-ES',
    delimiters: {
      thousands: '.',
      decimal: ',',
    },
    abbreviations: {
      thousand: 'k',
      million: 'M',
      billion: 'B',
      trillion: 'T',
    },
    ordinal: () => 'º',
    currency: {
      symbol: '',
      position: 'postfix',
      code: '',
    },
    formats: {
      fourDigits: {
        output: 'number',
        mantissa: 0,
        thousandSeparated: false,
        spaceSeparated: false,
        totalLength: 4,
      },
      fullWithTwoDecimals: {
        output: 'number',
        mantissa: 2,
        thousandSeparated: true,
        spaceSeparated: false,
      },
      fullWithTwoDecimalsNoCurrency: {
        output: 'number',
        mantissa: 2,
        thousandSeparated: true,
        spaceSeparated: false,
      },
      fullWithNoDecimals: {
        output: 'number',
        mantissa: 0,
        thousandSeparated: true,
        spaceSeparated: false,
      },
    },
  },

  'en-US': {
    languageTag: 'en-US',
    delimiters: {
      thousands: ',',
      decimal: '.',
    },
    abbreviations: {
      thousand: 'k',
      million: 'm',
      billion: 'b',
      trillion: 't',
    },
    ordinal: (number) => {
      const b = number % 10;
      return ~~((number % 100) / 10) === 1
        ? 'th'
        : b === 1
          ? 'st'
          : b === 2
            ? 'nd'
            : b === 3
              ? 'rd'
              : 'th';
    },
    currency: {
      symbol: '',
      position: 'prefix',
      code: '',
    },
    formats: {
      fourDigits: {
        output: 'number',
        mantissa: 0,
        thousandSeparated: false,
        spaceSeparated: false,
        totalLength: 4,
      },
      fullWithTwoDecimals: {
        output: 'number',
        mantissa: 2,
        thousandSeparated: true,
        spaceSeparated: false,
      },
      fullWithTwoDecimalsNoCurrency: {
        output: 'number',
        mantissa: 2,
        thousandSeparated: true,
        spaceSeparated: false,
      },
      fullWithNoDecimals: {
        output: 'number',
        mantissa: 0,
        thousandSeparated: true,
        spaceSeparated: false,
      },
    },
  },

  // Puedes añadir más configuraciones de idiomas aquí
  // Ejemplo:
  // 'fr-FR': { ... },
  // 'de-DE': { ... },
};

/**
 * List of supported language tags
 * @constant {string[]}
 */
const SUPPORTED_LANGUAGES = Object.keys(CURRENCY_LANGUAGES);

/**
 * Default language to use when none is specified
 * @constant {string}
 */
const DEFAULT_LANGUAGE = 'es-ES';

module.exports = {
  CURRENCY_LANGUAGES,
  SUPPORTED_LANGUAGES,
  DEFAULT_LANGUAGE,
};
