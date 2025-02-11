/**
 * @file Unit tests for the handlebars helpers
 */
const handlebars = require('handlebars');
const {
  extractValue,
  convertToBoolean,
} = require('@/utils/template-processor/handlebars/helpers/value/extract-handlebars-values');
const { logger } = require('@/utils/common/logger');
const { eq } = require('@/utils/template-processor/handlebars/helpers/index');
const {
  formatNumber,
} = require('@/utils/template-processor/handlebars/helpers/index');

// Mock dependencies
jest.mock('@/utils/common/logger');
jest.mock(
  '@/utils/template-processor/handlebars/helpers/value/extract-handlebars-values'
);

// Load helpers after mocks
require('@/utils/template-processor/handlebars/helpers');

describe('Handlebars Helpers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('eq helper', () => {
    beforeEach(() => {
      handlebars.registerHelper('eq', function (a, b, options) {
        if (eq(a, b)) {
          return options.fn(this);
        }
        return options.inverse(this);
      });
    });

    afterEach(() => {
      handlebars.unregisterHelper('eq');
    });

    it('should compare strings correctly', () => {
      // Arrange
      extractValue.mockImplementation((val) => val);
      const source = '{{#eq a "test"}}equal{{else}}not equal{{/eq}}';
      const template = handlebars.compile(source);

      // Act & Assert
      expect(template({ a: 'test' })).toBe('equal');
      expect(template({ a: 'other' })).toBe('not equal');
    });

    it('should preserve whitespace in string comparison', () => {
      // Arrange
      extractValue.mockImplementation((val) => val);
      const source = '{{#eq a "  test  "}}equal{{else}}not equal{{/eq}}';
      const template = handlebars.compile(source);

      // Act & Assert
      expect(template({ a: '  test  ' })).toBe('equal');
      expect(template({ a: 'test' })).toBe('not equal');
    });

    it('should handle null and undefined', () => {
      const template = handlebars.compile(
        '{{#eq a null}}equal{{else}}not equal{{/eq}}'
      );

      expect(template({ a: null })).toBe('equal');
      expect(template({ a: undefined })).toBe('not equal');
      expect(template({ a: 'value' })).toBe('not equal');
    });

    it('should compare numbers correctly', () => {
      // Arrange
      extractValue.mockImplementation((val) => val);
      const source = '{{#eq a 42}}equal{{else}}not equal{{/eq}}';
      const template = handlebars.compile(source);

      // Act & Assert
      expect(template({ a: 42 })).toBe('equal');
      expect(template({ a: '42' })).toBe('equal');
      expect(template({ a: 43 })).toBe('not equal');
    });

    it('should compare booleans correctly', () => {
      // Arrange
      extractValue.mockImplementation((val) => val);
      const source = '{{#eq a true}}equal{{else}}not equal{{/eq}}';
      const template = handlebars.compile(source);

      // Act & Assert
      expect(template({ a: true })).toBe('equal');
      expect(template({ a: 'true' })).toBe('equal');
      expect(template({ a: false })).toBe('not equal');
    });
  });

  describe('if helper', () => {
    it('should handle truthy values', () => {
      // Arrange
      extractValue.mockImplementation((val) => val);
      const source = '{{#if value}}true{{else}}false{{/if}}';
      const template = handlebars.compile(source);

      // Act & Assert
      expect(template({ value: true })).toBe('true');
      expect(template({ value: 1 })).toBe('true');
      expect(template({ value: 'text' })).toBe('true');
      expect(template({ value: [] })).toBe('true');
    });

    it('should handle falsy values', () => {
      // Arrange
      extractValue.mockImplementation((val) => val);
      const source = '{{#if value}}true{{else}}false{{/if}}';
      const template = handlebars.compile(source);

      // Act & Assert
      expect(template({ value: false })).toBe('false');
      expect(template({ value: 0 })).toBe('false');
      expect(template({ value: '' })).toBe('false');
      expect(template({ value: null })).toBe('false');
      expect(template({ value: undefined })).toBe('false');
    });
  });

  describe('formatDate helper', () => {
    it('should format valid dates', () => {
      // Arrange
      const source = '{{formatDate date "YYYY-MM-DD"}}';
      const template = handlebars.compile(source);
      const date = new Date('2024-01-01');

      // Act & Assert
      const result = template({ date });
      expect(result).toContain('2024-01-01');
      expect(result).toContain('imported-value');
    });

    it('should handle invalid dates', () => {
      // Arrange
      const source = '{{formatDate date "YYYY-MM-DD"}}';
      const template = handlebars.compile(source);

      // Act & Assert
      const result = template({ date: 'invalid' });
      expect(result).toContain('missing-value');
      expect(result).toContain('Invalid date');
    });
  });

  describe('Number Formatting', () => {
    describe('formatNumber helper', () => {
      it('should format numbers with Spanish locale', () => {
        const template = handlebars.compile('{{formatNumber value}}');
        const result = template({ value: 1234.56 });

        expect(result).toMatch(
          /<span class="imported-value" data-field="number">1\.234,56<\/span>/
        );
      });

      it('should format percentages', () => {
        const template = handlebars.compile(
          '{{formatNumber value style="percent"}}'
        );
        const result = template({ value: 0.42 });

        expect(result).toMatch(
          /<span class="imported-value" data-field="number">42,00\s*%<\/span>/
        );
      });

      it('should format currency', () => {
        const template = handlebars.compile(
          '{{formatNumber value style="currency" currency="EUR"}}'
        );
        const result = template({ value: 1234.56 });

        expect(result).toMatch(
          /<span class="imported-value" data-field="number">1\.234,56\s*€<\/span>/
        );
      });

      it('should handle missing values', () => {
        const template = handlebars.compile('{{formatNumber value}}');
        const result = template({});

        expect(result).toBe(
          '<span class="missing-value" data-field="number">[[Error formatting number: undefined]]</span>'
        );
      });

      it('should handle invalid values', () => {
        const template = handlebars.compile('{{formatNumber value}}');
        const result = template({ value: 'invalid' });

        expect(result).toBe(
          '<span class="missing-value" data-field="number">[[Error formatting number: invalid]]</span>'
        );
      });

      it('should handle special numeric values', () => {
        const result = formatNumber(Infinity, { hash: {} });
        expect(result.toString()).toBe(
          '<span class="missing-value" data-field="number">[[Error formatting number: Infinity]]</span>'
        );
      });

      it('should handle very large numbers', () => {
        const result = formatNumber(1e9, { hash: {} });
        expect(result.toString()).toBe(
          '<span class="imported-value" data-field="number">1.000.000.000,00</span>'
        );
      });

      it('should handle very small numbers', () => {
        const result = formatNumber(1e-6, { hash: {} });
        expect(result.toString()).toBe(
          '<span class="imported-value" data-field="number">0,000001</span>'
        );
      });
    });
  });
});
