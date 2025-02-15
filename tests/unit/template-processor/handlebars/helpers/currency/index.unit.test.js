/**
 * @file Currency Formatting Helper Tests
 *
 * Tests for currency formatting utilities:
 * - Basic currency formatting
 * - Currency symbol handling
 * - Edge cases and error handling
 *
 * Flow:
 * 1. Test basic currency formatting
 *    - Default currency (EUR)
 *    - Different currencies (USD, GBP)
 *    - Decimal handling
 *    - Grouping separators
 *
 * 2. Test currency symbol handling
 *    - Known currency codes
 *    - Unknown currency codes
 *    - Default currency code
 *
 * 3. Test edge cases
 *    - Invalid numbers
 *    - Null values
 *    - Undefined values
 *    - String numbers
 *    - Negative numbers
 *
 * 4. Test HTML output
 *    - Proper class names
 *    - Data attributes
 *    - Error messages
 *
 * 5. Test Handlebars integration
 *    - Template compilation
 *    - Helper registration
 *    - Template execution
 *
 * Error Cases:
 * - Invalid numbers return original string
 * - Null/undefined return empty string
 * - Missing values show error message
 * - Invalid currencies use code as symbol
 *
 * @module tests/unit/template-processor/handlebars/helpers/currency
 *
 * @example
 * // Run specific test group
 * jest -t "Currency Helpers formatCurrency"
 *
 * // Run all currency tests
 * jest currency/index.unit.test.js
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
      const result = formatCurrency(1000, { raw: true });
      expect(result).toBe('1.000,00 €');
    });

    test('formats number with USD currency', () => {
      const result = formatCurrency(1000, {
        currency: 'USD',
        raw: true,
      });
      expect(result).toBe('$1,000.00');
    });

    test('formats decimal numbers correctly', () => {
      const result = formatCurrency(1000.5, { raw: true });
      expect(result).toBe('1.000,50 €');
    });

    test('handles string numbers', () => {
      const result = formatCurrency('1000.50', { raw: true });
      expect(result).toBe('1.000,50 €');
    });

    test('handles zero', () => {
      const result = formatCurrency(0, { raw: true });
      expect(result).toBe('0,00 €');
    });

    test('handles negative numbers', () => {
      const result = formatCurrency(-1000.5, { raw: true });
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

    test('handles very large numbers', () => {
      const result = formatCurrency(1000000000, { raw: true });
      expect(result).toBe('1.000.000.000,00 €');
    });

    test('handles very small decimals', () => {
      const result = formatCurrency(0.001, { raw: true });
      expect(result).toBe('0,00 €');
    });

    test('handles scientific notation', () => {
      const result = formatCurrency(1e7, { raw: true });
      expect(result).toBe('10.000.000,00 €');
    });

    test('handles Infinity', () => {
      const result = formatCurrency(Infinity);
      expect(result).toBe('');
    });

    test('handles NaN', () => {
      const result = formatCurrency(NaN);
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
      expect(getCurrencySymbol('JPY')).toBe('JPY');
    });

    test('returns EUR symbol by default', () => {
      expect(getCurrencySymbol()).toBe('€');
    });

    test('handles lowercase currency codes', () => {
      expect(getCurrencySymbol('usd')).toBe('$');
    });

    test('handles currency codes with whitespace', () => {
      expect(getCurrencySymbol(' EUR ')).toBe('€');
    });

    test('handles null currency code', () => {
      expect(getCurrencySymbol(null)).toBe('€');
    });

    test('handles undefined currency code', () => {
      expect(getCurrencySymbol(undefined)).toBe('€');
    });
  });

  describe('formatCurrencyHelper', () => {
    test('wraps formatted currency in HTML span', () => {
      const result = formatCurrencyHelper(1000, { data: { root: {} } });
      const htmlString = result.toString();

      // Verify HTML structure
      expect(htmlString).toContain('class="imported-value"');
      expect(htmlString).toContain('data-field="currency"');

      // Verify currency content
      expect(htmlString).toContain('1.000,00 €');
    });

    test('handles different currencies', () => {
      const result = formatCurrencyHelper(1000, {
        hash: { currency: 'USD' },
        data: { root: {} },
      });
      const htmlString = result.toString();

      expect(htmlString).toContain('$1,000.00');
    });

    test('handles invalid values gracefully', () => {
      const result = formatCurrencyHelper('invalid');
      expect(result).toBe('invalid');
    });

    test('handles null values', () => {
      const result = formatCurrencyHelper(null);
      expect(result).toBe('');
    });

    test('handles undefined values', () => {
      const result = formatCurrencyHelper(undefined);
      expect(result).toBe('');
    });

    test('handles HTML in input values', () => {
      const result = formatCurrencyHelper('<span>1000</span>');
      expect(result).toBe('<span>1000</span>');
    });

    test('handles objects with toString', () => {
      const result = formatCurrencyHelper(
        { toString: () => '1000' },
        { data: { root: {} } }
      );
      const htmlString = result.toString();
      expect(htmlString).toContain('1.000,00 €');
    });

    test('handles array values', () => {
      const result = formatCurrencyHelper([1000]);
      expect(result).toBe('1000');
    });

    test('handles boolean values', () => {
      const result = formatCurrencyHelper(true);
      expect(result).toBe('true');
    });
  });

  describe('Handlebars integration', () => {
    beforeAll(() => {
      // Register the helper for template tests
      handlebars.registerHelper('formatCurrency', formatCurrencyHelper);
    });

    afterAll(() => {
      // Clean up
      handlebars.unregisterHelper('formatCurrency');
    });

    it('should work in basic template', () => {
      const template = handlebars.compile('{{formatCurrency amount}}');
      const result = template({ amount: 1000 });

      expect(result).toContain('1.000,00 €');
    });

    it('should work with different currencies', () => {
      const template = handlebars.compile(
        '{{formatCurrency amount currency="USD"}}'
      );
      const result = template({ amount: 1000 });

      expect(result).toContain('$1,000.00');
    });

    it('should handle missing values in template', () => {
      const template = handlebars.compile('{{formatCurrency amount}}');
      const result = template({});

      expect(result).toBe('');
    });

    it('should handle invalid values in template', () => {
      const template = handlebars.compile('{{formatCurrency amount}}');
      const result = template({ amount: 'invalid' });

      expect(result).toBe('invalid');
    });

    it('should work with subexpressions', () => {
      // Register a helper that returns a currency code
      handlebars.registerHelper('getCurrency', (isEuro) =>
        isEuro ? 'EUR' : 'USD'
      );

      const template = handlebars.compile(
        '{{formatCurrency amount currency=(getCurrency isEuro)}}'
      );

      // Test with EUR
      const result1 = template({
        amount: 1000.5,
        isEuro: true,
      });
      expect(result1).toContain('1.000,50 €');

      // Test with USD
      const result2 = template({
        amount: 1000.5,
        isEuro: false,
      });
      expect(result2).toContain('$1,000.50');

      handlebars.unregisterHelper('getCurrency');
    });

    it('should preserve context in block helpers', () => {
      const template = handlebars.compile(
        '{{#each amounts}}{{formatCurrency this currency="USD"}}{{/each}}'
      );

      const data = {
        amounts: [1000, 2000],
      };
      const result = template(data);
      expect(result).toContain('$1,000.00');
      expect(result).toContain('$2,000.00');
    });

    it('should handle dynamic currency selection', () => {
      const template = handlebars.compile(
        '{{formatCurrency amount currency=selectedCurrency}}'
      );

      const result = template({
        amount: 1000,
        selectedCurrency: 'GBP',
      });
      expect(result).toContain('£1,000.00');
    });
  });
});
