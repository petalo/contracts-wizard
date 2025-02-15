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

    test('handles very large numbers', () => {
      const result = formatCurrency(1000000000);
      expect(result).toBe('1.000.000.000,00 €');
    });

    test('handles very small decimals', () => {
      const result = formatCurrency(0.001);
      expect(result).toBe('0,00 €');
    });

    test('handles scientific notation', () => {
      const result = formatCurrency(1e7);
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
      expect(getCurrencySymbol('XYZ')).toBe('XYZ');
    });

    test('returns EUR symbol by default', () => {
      expect(getCurrencySymbol()).toBe('€');
    });

    test('handles lowercase currency codes', () => {
      expect(getCurrencySymbol('eur')).toBe('€');
      expect(getCurrencySymbol('usd')).toBe('$');
    });

    test('handles currency codes with whitespace', () => {
      expect(getCurrencySymbol(' EUR ')).toBe('€');
      expect(getCurrencySymbol(' USD ')).toBe('$');
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
      const result = formatCurrencyHelper('invalid');
      const htmlString = result.toString();

      expect(htmlString).toContain('class="missing-value"');
      expect(htmlString).toContain('data-field="currency"');
      expect(htmlString).toContain('[[Error formatting currency]]');
    });

    test('handles null values', () => {
      const result = formatCurrencyHelper(null);
      const htmlString = result.toString();

      expect(htmlString).toContain('class="missing-value"');
      expect(htmlString).toContain('data-field="currency"');
      expect(htmlString).toContain('[[Error formatting currency]]');
    });

    test('handles undefined values', () => {
      const result = formatCurrencyHelper(undefined);
      const htmlString = result.toString();

      expect(htmlString).toContain('class="missing-value"');
      expect(htmlString).toContain('data-field="currency"');
      expect(htmlString).toContain('[[Error formatting currency]]');
    });

    test('handles HTML in input values', () => {
      const result = formatCurrencyHelper('<span>1000</span>');
      const htmlString = result.toString();
      expect(htmlString).toContain('class="missing-value"');
    });

    test('handles objects with toString', () => {
      const obj = { toString: () => '1000' };
      const result = formatCurrencyHelper(obj);
      const htmlString = result.toString();
      expect(htmlString).toContain('1.000,00 €');
    });

    test('handles array values', () => {
      const result = formatCurrencyHelper([1000]);
      const htmlString = result.toString();
      expect(htmlString).toContain('class="missing-value"');
    });

    test('handles boolean values', () => {
      const result = formatCurrencyHelper(true);
      const htmlString = result.toString();
      expect(htmlString).toContain('class="missing-value"');
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
      expect(result).toContain('class="imported-value"');
      expect(result).toContain('data-field="currency"');
    });

    it('should work with different currencies', () => {
      const template = handlebars.compile(
        '{{formatCurrency amount currency="USD"}}'
      );
      const result = template({ amount: 1000 });

      expect(result).toContain('1.000,00 $');
    });

    it('should handle missing values in template', () => {
      const template = handlebars.compile('{{formatCurrency}}');
      const result = template({});

      expect(result).toContain('class="missing-value"');
      expect(result).toContain('data-field="currency"');
      expect(result).toContain('[[Error formatting currency]]');
    });

    it('should handle invalid values in template', () => {
      const template = handlebars.compile('{{formatCurrency amount}}');
      const result = template({ amount: 'invalid' });

      expect(result).toContain('class="missing-value"');
      expect(result).toContain('data-field="currency"');
      expect(result).toContain('[[Error formatting currency]]');
    });

    it('should work with subexpressions', () => {
      handlebars.registerHelper('getCurrency', (isEuro) =>
        isEuro ? 'EUR' : 'USD'
      );

      const template = handlebars.compile(
        '{{formatCurrency value currency=(getCurrency isEuro)}}'
      );
      const result = template({
        value: 1000.5,
        isEuro: true,
      });
      expect(result).toContain('1.000,50 €');

      const result2 = template({
        value: 1000.5,
        isEuro: false,
      });
      expect(result2).toContain('1.000,50 $');

      handlebars.unregisterHelper('getCurrency');
    });

    it('should preserve context in block helpers', () => {
      const template = handlebars.compile(
        '{{#each amounts}}{{formatCurrency this currency=../currency}}{{/each}}'
      );
      const data = {
        currency: 'USD',
        amounts: [1000, 2000],
      };
      const result = template(data);
      expect(result).toContain('1.000,00 $');
      expect(result).toContain('2.000,00 $');
    });

    it('should handle dynamic currency selection', () => {
      const template = handlebars.compile(
        '{{formatCurrency amount currency=selectedCurrency}}'
      );
      const result = template({
        amount: 1000,
        selectedCurrency: 'GBP',
      });
      expect(result).toContain('1.000,00 £');
    });
  });
});
