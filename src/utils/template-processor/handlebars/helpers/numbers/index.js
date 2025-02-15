/**
 * @file Number Formatting Helper System
 *
 * Provides core number formatting utilities that can be used by other formatters:
 * - Base number formatting
 * - Number parsing and extraction
 * - Format options validation
 * - Locale-aware number handling
 *
 * Functions:
 * - extractNumericValue: Extracts numeric value from input
 * - formatNumber: Formats numbers with locale support
 * - validateFormatOptions: Validates formatting options
 *
 * Constants:
 * - DEFAULT_OPTIONS: Default formatting options by style
 *
 * Flow:
 * 1. Configure locale settings
 * 2. Extract numeric value from input
 * 3. Apply style-specific formatting options
 * 4. Format number according to locale
 *
 * Error Handling:
 * - Invalid numbers return original string
 * - Null/undefined return empty string
 * - Objects are searched for numeric properties
 * - Parsing errors return original value
 * - Locale mismatches are handled gracefully
 *
 * @module @/utils/template-processor/handlebars/helpers/numbers
 * @requires @/config/locale - Locale configuration
 * @requires @/utils/common/logger - Logging system
 * @requires handlebars - Template system
 * @requires numeral - Number formatting library
 * @requires @/utils/template-processor/handlebars/helpers/value/extract-handlebars-values - Value extraction
 */

const { logger } = require('@/utils/common/logger');
const handlebars = require('handlebars');
const numbro = require('numbro');
const { LOCALE_CONFIG } = require('@/config/locale');
const { extractValue } = require('../value/extract-handlebars-values');

// Configurar los locales que necesitamos
numbro.registerLanguage({
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
    symbol: '€',
    position: 'postfix',
    code: 'EUR',
  },
});

numbro.registerLanguage({
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
    symbol: '$',
    position: 'prefix',
    code: 'USD',
  },
});

// Configurar el locale por defecto
numbro.setLanguage(LOCALE_CONFIG?.fullLocale || 'es-ES');

/**
 * Default formatting options by style
 * @constant {object}
 */
const DEFAULT_OPTIONS = {
  decimal: {
    minDecimals: null,
    maxDecimals: null,
  },
  percent: {
    minDecimals: 0,
    maxDecimals: 2,
  },
  currency: {
    minDecimals: 2,
    maxDecimals: 2,
  },
};

/**
 * Extracts numeric value from various input types
 *
 * Attempts to extract a numeric value from:
 * - Direct numbers
 * - String representations (both English and Spanish formats)
 * - Objects with numeric properties
 *
 * @param {*} value - Input value to process
 * @returns {number|null} Extracted number or null if invalid
 *
 * @example
 * // Direct number
 * extractNumericValue(123.45)
 * // returns: 123.45
 *
 * // Spanish format string
 * extractNumericValue("1.234,56")
 * // returns: 1234.56
 *
 * // Object with numeric property
 * extractNumericValue({ numero: 123.45 })
 * // returns: 123.45
 *
 * // Invalid input
 * extractNumericValue("invalid")
 * // returns: null
 */
function extractNumericValue(value) {
  logger.debug('Extracting numeric value:', {
    context: '[format]',
    filename: 'numbers/index.js',
    value,
    type: typeof value,
    isObject: typeof value === 'object' && value !== null,
    isString: typeof value === 'string',
    isNumber: typeof value === 'number',
  });

  if (value === null || value === undefined) {
    return null;
  }

  // Si ya es un número, devolverlo
  if (typeof value === 'number' && isFinite(value)) {
    return value;
  }

  // Si es un objeto, buscar una propiedad numérica
  if (typeof value === 'object' && value !== null) {
    // Si es un objeto con propiedades específicas de moneda
    if (value.decimal || value.EUR || value.USD) {
      const numericValue = value.decimal || value.EUR || value.USD;
      logger.debug('Found currency value:', {
        context: '[format]',
        filename: 'numbers/index.js',
        numericValue,
        source: 'currency_object',
      });
      return extractNumericValue(numericValue);
    }
    // Si es un objeto con otras propiedades numéricas
    const numericValue =
      value.numero || value.number || value.value || value.importe_numero;
    if (numericValue !== undefined) {
      logger.debug('Found numeric property:', {
        context: '[format]',
        filename: 'numbers/index.js',
        numericValue,
        source: 'numeric_object',
      });
      return extractNumericValue(numericValue);
    }
    return null;
  }

  // Si es un string, intentar parsearlo
  if (typeof value === 'string') {
    const cleanValue = value.trim();
    if (!cleanValue) {
      return null;
    }

    try {
      // Detectar el formato del número
      const hasCommaDecimal =
        cleanValue.includes(',') && !cleanValue.includes('.');
      const hasDotDecimal =
        cleanValue.includes('.') && !cleanValue.includes(',');
      const hasSpanishFormat =
        cleanValue.includes('.') && cleanValue.includes(',');

      // Configurar numbro según el formato detectado
      if (hasSpanishFormat || hasCommaDecimal) {
        numbro.setLanguage('es-ES');
      } else if (hasDotDecimal) {
        numbro.setLanguage('en-US');
      }

      // Intentar parsear el número
      const parsed = numbro.unformat(cleanValue);

      logger.debug('Parsed number with numbro:', {
        context: '[format]',
        filename: 'numbers/index.js',
        original: value,
        format: hasSpanishFormat
          ? 'Spanish'
          : hasCommaDecimal
            ? 'Comma Decimal'
            : 'Dot Decimal',
        parsed,
      });

      // Restaurar el locale por defecto
      numbro.setLanguage(LOCALE_CONFIG?.fullLocale || 'es-ES');

      return isFinite(parsed) ? parsed : null;
    } catch (error) {
      logger.debug('Failed to parse number with numbro:', {
        context: '[format]',
        filename: 'numbers/index.js',
        original: value,
        error: error.message,
      });
      return null;
    }
  }

  logger.warn('Failed to extract numeric value:', {
    context: '[format]',
    filename: 'numbers/index.js',
    value,
    type: typeof value,
  });
  return null;
}

/**
 * Validates and normalizes number formatting options
 *
 * @param {object} options - Formatting options
 * @param {string} [options.style='decimal'] - Format style
 * @param {string} [options.currency] - Currency code
 * @param {number} [options.minimumFractionDigits] - Min decimals
 * @param {number} [options.maximumFractionDigits] - Max decimals
 * @returns {object} Validated and normalized options
 */
function validateFormatOptions(options = {}) {
  const style = (options?.style || 'decimal').toLowerCase();
  const currency = options?.currency;

  // Get default decimals based on style
  const defaults = DEFAULT_OPTIONS[style] || DEFAULT_OPTIONS.decimal;

  // Handle minimumFractionDigits
  let minimumFractionDigits = options?.minimumFractionDigits;
  if (minimumFractionDigits === undefined) {
    minimumFractionDigits = defaults.minDecimals;
  }

  // Handle maximumFractionDigits
  let maximumFractionDigits = options?.maximumFractionDigits;
  if (maximumFractionDigits === undefined) {
    maximumFractionDigits = defaults.maxDecimals;
  }

  return {
    style,
    ...(currency && { currency }),
    minimumFractionDigits,
    maximumFractionDigits,
    useGrouping: true,
    numberingSystem: 'latn',
  };
}

/**
 * Formats a number according to the specified options
 *
 * @param {*} value - Value to format
 * @param {object} options - Handlebars options object
 * @returns {handlebars.SafeString|string} Formatted number
 */
function formatNumber(value, options = {}) {
  try {
    // Extract the number value if it's wrapped in HTML
    const extractedValue = extractValue(value);

    // Handle null/undefined
    if (extractedValue == null) {
      if (options?.data?.isSubexpression || options?.hash?.raw) {
        return '';
      }
      return new handlebars.SafeString(
        '<span class="missing-value" data-field="number">[[Error formatting number]]</span>'
      );
    }

    // Handle objects with toString method
    let processedValue = extractedValue;
    if (
      processedValue &&
      typeof processedValue === 'object' &&
      typeof processedValue.toString === 'function'
    ) {
      processedValue = processedValue.toString();
    }

    // Handle HTML-wrapped input
    if (typeof processedValue === 'string') {
      const match = processedValue.match(/data-field="[^"]+">([^<]+)</);
      if (match) {
        processedValue = match[1];
      }
    }

    // Parse the number
    const num = parseFloat(processedValue);
    if (isNaN(num)) {
      if (options?.data?.isSubexpression || options?.hash?.raw) {
        return processedValue;
      }
      return new handlebars.SafeString(
        '<span class="missing-value" data-field="number">[[Invalid number]]</span>'
      );
    }

    // Get formatting options, handling block helpers context
    const formatOptions = validateFormatOptions({
      ...options?.hash,
      // If we're in a block helper, check parent context for style
      style:
        options?.hash?.style ||
        (typeof options === 'string' ? options : undefined),
    });

    // Define fallback locales in order of preference
    const fallbackLocales = [
      LOCALE_CONFIG?.fullLocale,
      'es-ES',
      'es',
      'es-419',
      'es-AR',
      'en-US',
    ].filter(Boolean);

    // Calcular fracciones: mínimo y máximo (asegurando que máximo >= mínimo)
    const minFraction = formatOptions.minimumFractionDigits ?? 0;
    const autoMaxFraction = Math.max(
      (String(Math.abs(num)).split('.')[1] || '').length,
      String(num).includes('e-') ? parseInt(String(num).split('e-')[1]) : 0
    );
    const maxFraction =
      formatOptions.maximumFractionDigits != null
        ? formatOptions.maximumFractionDigits
        : Math.max(autoMaxFraction, minFraction);

    // Configurar Intl.NumberFormat según el estilo
    let nfStyle;
    const nfOptions = {
      minimumFractionDigits: minFraction,
      maximumFractionDigits: maxFraction,
      useGrouping: formatOptions.useGrouping,
      numberingSystem: formatOptions.numberingSystem,
    };

    if (formatOptions.style === 'percent') {
      nfStyle = 'percent';
    } else if (formatOptions.style === 'currency') {
      nfStyle = 'currency';
      nfOptions.currency = formatOptions.currency || 'EUR';
    } else {
      nfStyle = 'decimal';
    }

    let formatter = null;
    for (const locale of fallbackLocales) {
      try {
        formatter = new Intl.NumberFormat(locale, {
          style: nfStyle,
          ...nfOptions,
        });
        // Test if the formatter works
        formatter.format(1234.56);
        break;
      } catch (e) {
        continue;
      }
    }

    if (!formatter) {
      throw new Error('No valid locale found for number formatting');
    }

    let result = formatter.format(num);
    // Reemplazar NBSP por espacios normales
    result = result.replace(/\u00A0/g, ' ');
    if (nfStyle === 'percent') {
      result = result.replace(/\s?%/, '%');
    }

    // If used as a subexpression or raw option is true, return primitive value
    if (options?.data?.isSubexpression || options?.hash?.raw) {
      return result;
    }

    // Return SafeString with proper data-field
    return new handlebars.SafeString(
      `<span class="imported-value" data-field="number">${result}</span>`
    );
  } catch (error) {
    logger.error('Error in number helper:', {
      filename: 'numbers/index.js',
      context: 'helper',
      error: error.message,
      stack: error.stack,
      value,
      options,
    });
    if (options?.data?.isSubexpression || options?.hash?.raw) {
      return '';
    }
    return new handlebars.SafeString(
      '<span class="missing-value" data-field="number">[[Error formatting number]]</span>'
    );
  }
}

// Register helper
handlebars.registerHelper('formatNumber', formatNumber);

module.exports = {
  formatNumber,
  extractNumericValue,
  validateFormatOptions,
  DEFAULT_OPTIONS,
};
