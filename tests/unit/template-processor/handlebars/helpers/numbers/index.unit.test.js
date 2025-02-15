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
} = require('@/utils/template-processor/handlebars/helpers/numbers');

const handlebars = require('handlebars');
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

describe('Number Helpers', () => {
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
    describe('Basic Formatting', () => {
      it('should format integer numbers', () => {
        const result = formatNumber(1000);
        expect(result.toString()).toBe(
          '<span class="imported-value" data-field="number">1.000</span>'
        );
      });

      it('should format decimal numbers', () => {
        const result = formatNumber(1000.5);
        expect(result.toString()).toBe(
          '<span class="imported-value" data-field="number">1.000,5</span>'
        );
      });

      it('should format negative numbers', () => {
        const result = formatNumber(-1000.5);
        expect(result.toString()).toBe(
          '<span class="imported-value" data-field="number">-1.000,5</span>'
        );
      });

      it('should format zero', () => {
        const result = formatNumber(0);
        expect(result.toString()).toBe(
          '<span class="imported-value" data-field="number">0</span>'
        );
      });

      it('should format string numbers', () => {
        const result = formatNumber('1000.5');
        expect(result.toString()).toBe(
          '<span class="imported-value" data-field="number">1.000,5</span>'
        );
      });
    });

    describe('Style Options', () => {
      it('should format as decimal', () => {
        const result = formatNumber(1000.5, { hash: { style: 'decimal' } });
        expect(result.toString()).toBe(
          '<span class="imported-value" data-field="number">1.000,5</span>'
        );
      });

      it('should format as percent', () => {
        const result = formatNumber(0.5, { hash: { style: 'percent' } });
        expect(result.toString()).toBe(
          '<span class="imported-value" data-field="number">50%</span>'
        );
      });

      it('should handle invalid style option', () => {
        const result = formatNumber(1000, { hash: { style: 'invalid' } });
        expect(result.toString()).toBe(
          '<span class="imported-value" data-field="number">1.000</span>'
        );
      });
    });

    describe('Precision Control', () => {
      it('should respect minimumFractionDigits', () => {
        const result = formatNumber(1000, {
          hash: { minimumFractionDigits: 2 },
        });
        expect(result.toString()).toBe(
          '<span class="imported-value" data-field="number">1.000,00</span>'
        );
      });

      it('should respect maximumFractionDigits', () => {
        const result = formatNumber(1000.5678, {
          hash: { maximumFractionDigits: 2 },
        });
        expect(result.toString()).toBe(
          '<span class="imported-value" data-field="number">1.000,57</span>'
        );
      });

      it('should handle both min and max fraction digits', () => {
        const result = formatNumber(1000.5, {
          hash: {
            minimumFractionDigits: 2,
            maximumFractionDigits: 4,
          },
        });
        expect(result.toString()).toBe(
          '<span class="imported-value" data-field="number">1.000,50</span>'
        );
      });
    });

    describe('Special Cases', () => {
      it('should handle very large numbers', () => {
        const result = formatNumber(1e9);
        expect(result.toString()).toBe(
          '<span class="imported-value" data-field="number">1.000.000.000</span>'
        );
      });

      it('should handle very small decimals', () => {
        const result = formatNumber(0.0000001);
        expect(result.toString()).toBe(
          '<span class="imported-value" data-field="number">0,0000001</span>'
        );
      });

      it('should handle scientific notation', () => {
        const result = formatNumber(1e-7);
        expect(result.toString()).toBe(
          '<span class="imported-value" data-field="number">0,0000001</span>'
        );
      });

      it('should handle HTML-wrapped input', () => {
        const input =
          '<span class="imported-value" data-field="number">1000.5</span>';
        const result = formatNumber(input);
        expect(result.toString()).toBe(
          '<span class="imported-value" data-field="number">1.000,5</span>'
        );
      });

      it('should handle objects with toString', () => {
        const obj = { toString: () => '1000.5' };
        const result = formatNumber(obj);
        expect(result.toString()).toBe(
          '<span class="imported-value" data-field="number">1.000,5</span>'
        );
      });
    });

    describe('Raw Option', () => {
      it('should return raw value when raw option is true', () => {
        const result = formatNumber(1000.5, { hash: { raw: true } });
        expect(result).toBe('1.000,5');
      });

      it('should return raw value for percent style', () => {
        const result = formatNumber(0.5, {
          hash: {
            style: 'percent',
            raw: true,
          },
        });
        expect(result).toBe('50%');
      });
    });

    describe('Error Handling', () => {
      it('should handle null values', () => {
        const result = formatNumber(null);
        expect(result.toString()).toBe(
          '<span class="missing-value" data-field="number">[[Error formatting number]]</span>'
        );
      });

      it('should handle undefined values', () => {
        const result = formatNumber(undefined);
        expect(result.toString()).toBe(
          '<span class="missing-value" data-field="number">[[Error formatting number]]</span>'
        );
      });

      it('should handle invalid input', () => {
        const result = formatNumber('invalid');
        expect(result.toString()).toBe(
          '<span class="missing-value" data-field="number">[[Invalid number]]</span>'
        );
      });
    });
  });

  describe('Handlebars Integration', () => {
    beforeAll(() => {
      handlebars.registerHelper('formatNumber', formatNumber);
    });

    it('should work in basic template', () => {
      const template = handlebars.compile('{{formatNumber value}}');
      const result = template({ value: 1000.5 });
      expect(result).toContain('1.000,5');
    });

    it('should work with style option', () => {
      const template = handlebars.compile(
        '{{formatNumber value style="percent"}}'
      );
      const result = template({ value: 0.5 });
      expect(result).toContain('50%');
    });

    it('should work with precision options', () => {
      const template = handlebars.compile(
        '{{formatNumber value minimumFractionDigits=2 maximumFractionDigits=2}}'
      );
      const result = template({ value: 1000.5 });
      expect(result).toContain('1.000,50');
    });

    it('should preserve context in block helpers', () => {
      const template = handlebars.compile(
        '{{#each numbers}}{{formatNumber this ../style}}{{/each}}'
      );
      const data = {
        style: 'percent',
        numbers: [0.5, 0.75],
      };
      const result = template(data);
      expect(result).toContain('50%');
      expect(result).toContain('75%');
    });

    it('should handle subexpressions', () => {
      handlebars.registerHelper('getStyle', (isPercent) =>
        isPercent ? 'percent' : 'decimal'
      );

      const template = handlebars.compile(
        '{{formatNumber value style=(getStyle isPercent)}}'
      );
      const result = template({
        value: 0.5,
        isPercent: true,
      });
      expect(result).toContain('50%');

      const result2 = template({
        value: 0.5,
        isPercent: false,
      });
      expect(result2).toContain('0,5');

      handlebars.unregisterHelper('getStyle');
    });
  });
});
