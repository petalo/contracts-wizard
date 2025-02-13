/**
 * @file Number Formatting Helper Tests
 *
 * Tests for number formatting utilities:
 * - Basic number formatting
 * - Percentage formatting
 * - Currency formatting
 * - Edge cases and error handling
 *
 * @module tests/unit/template-processor/handlebars/helpers/numbers
 */

const {
  formatNumber,
  extractNumericValue,
  validateFormatOptions,
  formatNumberHelper,
} = require('@/utils/template-processor/handlebars/helpers/numbers');

const numeral = require('numeral');

// Ensure we're using Spanish locale for tests
numeral.locale('es');

/**
 * Helper function to extract text content from HTML string
 * @param {string} html - HTML string
 * @returns {string} Text content
 */
function getTextContent(html) {
  return html.replace(/<[^>]*>/g, '');
}

describe('Number Formatting', () => {
  describe('extractNumericValue', () => {
    test('handles null and undefined', () => {
      expect(extractNumericValue(null)).toBeNull();
      expect(extractNumericValue(undefined)).toBeNull();
    });

    test('handles numbers directly', () => {
      expect(extractNumericValue(123)).toBe(123);
      expect(extractNumericValue(123.45)).toBe(123.45);
    });

    test('handles string numbers', () => {
      // Para números en formato español (1.234,56), el valor debe ser 1234.56
      expect(extractNumericValue('123')).toBe(123);
      expect(extractNumericValue('123,45')).toBe(123.45);
      expect(extractNumericValue('1.234,56')).toBe(1234.56);
      expect(extractNumericValue('1.234.567,89')).toBe(1234567.89);
    });

    test('handles objects with numeric properties', () => {
      expect(extractNumericValue({ numero: 123 })).toBe(123);
      expect(extractNumericValue({ number: 123 })).toBe(123);
      expect(extractNumericValue({ value: 123 })).toBe(123);
      expect(extractNumericValue({ importe_numero: 123 })).toBe(123);
    });

    test('returns null for invalid values', () => {
      expect(extractNumericValue('abc')).toBeNull();
      expect(extractNumericValue({})).toBeNull();
      expect(extractNumericValue([])).toBeNull();
    });
  });

  describe('validateFormatOptions', () => {
    test('provides default options', () => {
      const options = validateFormatOptions();
      expect(options).toEqual({
        style: 'decimal',
        minimumFractionDigits: null,
        maximumFractionDigits: null,
        useGrouping: true,
        numberingSystem: 'latn',
      });
    });

    test('handles percent style', () => {
      const options = validateFormatOptions({ style: 'percent' });
      expect(options.style).toBe('percent');
    });

    test('handles currency style', () => {
      const options = validateFormatOptions({
        style: 'currency',
        currency: 'EUR',
      });
      expect(options.style).toBe('currency');
      expect(options.currency).toBe('EUR');
    });

    test('respects fraction digits settings', () => {
      const options = validateFormatOptions({
        minimumFractionDigits: 2,
        maximumFractionDigits: 4,
      });
      expect(options.minimumFractionDigits).toBe(2);
      expect(options.maximumFractionDigits).toBe(4);
    });
  });

  describe('formatNumber', () => {
    test('formats basic numbers', () => {
      // Verificar que los números se formatean correctamente en español
      expect(formatNumber(1234.5)).toBe('1.234,5');
      expect(formatNumber(1000000)).toBe('1.000.000');
    });

    test('preserves original decimals when not specified', () => {
      expect(formatNumber(1234.567)).toBe('1.234,567');
      expect(formatNumber(1234.5)).toBe('1.234,5');
      expect(formatNumber(1234.0)).toBe('1.234');
    });

    test('formats percentages', () => {
      expect(formatNumber(0.75, { style: 'percent' })).toBe('75 %');
      expect(formatNumber(1, { style: 'percent' })).toBe('100 %');
    });

    test('formats currency', () => {
      expect(
        formatNumber(1234.5, {
          style: 'currency',
          currency: 'EUR',
          minimumFractionDigits: 2,
        })
      ).toBe('1.234,50 €');
    });

    test('handles invalid values', () => {
      expect(formatNumber(null)).toBe('');
      expect(formatNumber(undefined)).toBe('');
      expect(formatNumber('invalid')).toBe('invalid');
    });

    test('respects fraction digits', () => {
      expect(
        formatNumber(1234, {
          minimumFractionDigits: 2,
        })
      ).toBe('1.234,00');
    });
  });

  describe('formatNumberHelper', () => {
    test('wraps formatted number in HTML span', () => {
      const result = formatNumberHelper(1234.5);
      const htmlString = result.toString();

      // Verify HTML structure
      expect(htmlString).toContain('class="imported-value"');
      expect(htmlString).toContain('data-field="number"');

      // Verify number content using text extraction
      const textContent = getTextContent(htmlString);
      expect(textContent).toBe('1.234,5');
    });

    test('handles invalid values gracefully', () => {
      const result = formatNumberHelper(null);
      const htmlString = result.toString();

      // Verify HTML structure
      expect(htmlString).toContain('class="missing-value"');
      expect(htmlString).toContain('data-field="number"');
      expect(htmlString).toContain('[[number]]');

      // Verify empty content using text extraction
      const textContent = getTextContent(htmlString);
      expect(textContent).toBe('[[number]]');
    });
  });
});
