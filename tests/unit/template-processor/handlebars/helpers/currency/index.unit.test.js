/**
 * @file Currency Formatting Helper Tests
 *
 * Tests for currency formatting utilities:
 * - Basic currency formatting
 * - Currency symbol handling
 * - Edge cases and error handling
 *
 * @module tests/unit/template-processor/handlebars/helpers/currency
 */

const {
  formatCurrency,
  formatCurrencyHelper,
  getCurrencySymbol,
} = require('@/utils/template-processor/handlebars/helpers/currency');

const handlebars = require('handlebars');

describe('Currency Helpers', () => {
  describe('formatCurrency', () => {
    test('formats number with default currency (EUR)', () => {
      const result = formatCurrency(1000);
      expect(result).toBe('1.000,00 €');
    });

    test('formats number with USD currency', () => {
      const result = formatCurrency(1000, { currency: 'USD' });
      expect(result).toBe('1.000,00 $');
    });

    test('formats decimal numbers correctly', () => {
      const result = formatCurrency(1000.5);
      expect(result).toBe('1.000,50 €');
    });

    test('handles string numbers', () => {
      const result = formatCurrency('1000.50');
      expect(result).toBe('1.000,50 €');
    });

    test('handles zero', () => {
      const result = formatCurrency(0);
      expect(result).toBe('0,00 €');
    });

    test('handles negative numbers', () => {
      const result = formatCurrency(-1000.5);
      expect(result).toBe('-1.000,50 €');
    });

    test('handles invalid numbers', () => {
      const result = formatCurrency('invalid');
      expect(result).toBe('invalid');
    });

    test('handles undefined amount', () => {
      const result = formatCurrency(undefined);
      expect(result).toBe('');
    });

    test('handles null amount', () => {
      const result = formatCurrency(null);
      expect(result).toBe('');
    });
  });

  describe('getCurrencySymbol', () => {
    test('returns EUR symbol', () => {
      expect(getCurrencySymbol('EUR')).toBe('€');
    });

    test('returns USD symbol', () => {
      expect(getCurrencySymbol('USD')).toBe('$');
    });

    test('returns GBP symbol', () => {
      expect(getCurrencySymbol('GBP')).toBe('£');
    });

    test('returns currency code for unknown currencies', () => {
      expect(getCurrencySymbol('XYZ')).toBe('XYZ');
    });

    test('returns EUR symbol by default', () => {
      expect(getCurrencySymbol()).toBe('€');
    });
  });

  describe('formatCurrencyHelper', () => {
    test('wraps formatted currency in HTML span', () => {
      const result = formatCurrencyHelper(1000);
      const htmlString = result.toString();

      // Verify HTML structure
      expect(htmlString).toContain('class="imported-value"');
      expect(htmlString).toContain('data-field="currency"');

      // Verify currency content
      expect(htmlString).toContain('1.000,00 €');
    });

    test('handles different currencies', () => {
      const result = formatCurrencyHelper(1000, { hash: { currency: 'USD' } });
      const htmlString = result.toString();

      expect(htmlString).toContain('1.000,00 $');
    });

    test('handles invalid values gracefully', () => {
      const result = formatCurrencyHelper(null);
      const htmlString = result.toString();

      expect(htmlString).toContain('class="imported-value"');
      expect(htmlString).toContain('data-field="currency"');
      expect(htmlString).toContain('></span>'); // Empty content
    });
  });

  describe('Handlebars integration', () => {
    beforeAll(() => {
      // Register the helper for template tests
      handlebars.registerHelper('formatCurrency', formatCurrencyHelper);
    });

    test('works in template with formatCurrency', () => {
      const template = handlebars.compile('{{formatCurrency amount}}');
      const result = template({ amount: 1000 });

      expect(result).toContain('1.000,00 €');
      expect(result).toContain('class="imported-value"');
      expect(result).toContain('data-field="currency"');
    });

    test('works with different currencies in template', () => {
      const template = handlebars.compile(
        '{{formatCurrency amount currency="USD"}}'
      );
      const result = template({ amount: 1000 });

      expect(result).toContain('1.000,00 $');
    });

    test('handles missing values in template', () => {
      const template = handlebars.compile('{{formatCurrency}}');
      const result = template({});

      expect(result).toContain('class="imported-value"');
      expect(result).toContain('data-field="currency"');
      expect(result).toContain('></span>'); // Empty content
    });
  });
});
