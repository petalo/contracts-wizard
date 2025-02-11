/**
 * @file Currency Helpers Unit Tests
 *
 * Tests for currency formatting and manipulation helpers:
 * - formatCurrency
 * - currencySymbol
 * - exchangeRate
 *
 * @module tests/unit/template-processor/handlebars/helpers/currency
 */

const handlebars = require('handlebars');
const { LOCALE_CONFIG } = require('@/config/locale');
const { HANDLEBARS_CONFIG } = require('@/config/handlebars-config');
const {
  formatCurrency,
  currencySymbol,
  exchangeRate,
} = require('@/utils/template-processor/handlebars/helpers/currency');

// Register helpers for template tests
handlebars.registerHelper('formatCurrency', formatCurrency);
handlebars.registerHelper('currencySymbol', currencySymbol);
handlebars.registerHelper('exchangeRate', exchangeRate);

describe('Currency Helpers', () => {
  describe('formatCurrency', () => {
    it('should format number with default currency (EUR)', () => {
      const result = formatCurrency(1000);
      expect(result.toString()).toBe(
        '<span class="imported-value" data-field="currency">1.000,00 €</span>'
      );
    });

    it('should format number with USD currency', () => {
      const result = formatCurrency(1000, 'USD');
      expect(result.toString()).toBe(
        '<span class="imported-value" data-field="currency">$1,000.00</span>'
      );
    });

    it('should format decimal numbers correctly', () => {
      const result = formatCurrency(1000.5, 'EUR');
      expect(result.toString()).toBe(
        '<span class="imported-value" data-field="currency">1.000,50 €</span>'
      );
    });

    it('should handle string numbers', () => {
      const result = formatCurrency('1000.50', 'EUR');
      expect(result.toString()).toBe(
        '<span class="imported-value" data-field="currency">1.000,50 €</span>'
      );
    });

    it('should handle zero', () => {
      const result = formatCurrency(0, 'EUR');
      expect(result.toString()).toBe(
        '<span class="imported-value" data-field="currency">0,00 €</span>'
      );
    });

    it('should handle negative numbers', () => {
      const result = formatCurrency(-1000.5, 'EUR');
      expect(result.toString()).toBe(
        '<span class="imported-value" data-field="currency">-1.000,50 €</span>'
      );
    });

    it('should handle invalid numbers', () => {
      const result = formatCurrency('invalid', 'EUR');
      expect(result.toString()).toBe(
        `<span class="missing-value" data-field="currency">${HANDLEBARS_CONFIG.errorMessages.invalidAmount}</span>`
      );
    });

    it('should handle undefined amount', () => {
      const result = formatCurrency(undefined, 'EUR');
      expect(result.toString()).toBe(
        `<span class="missing-value" data-field="currency">${HANDLEBARS_CONFIG.errorMessages.invalidAmount}</span>`
      );
    });

    it('should handle null amount', () => {
      const result = formatCurrency(null, 'EUR');
      expect(result.toString()).toBe(
        `<span class="missing-value" data-field="currency">${HANDLEBARS_CONFIG.errorMessages.invalidAmount}</span>`
      );
    });
  });

  describe('currencySymbol', () => {
    it('should return EUR symbol', () => {
      const result = currencySymbol('EUR');
      expect(result.toString()).toBe(
        '<span class="imported-value" data-field="currency-symbol">€</span>'
      );
    });

    it('should return USD symbol', () => {
      const result = currencySymbol('USD');
      expect(result.toString()).toBe(
        '<span class="imported-value" data-field="currency-symbol">$</span>'
      );
    });

    it('should handle invalid currency code', () => {
      const result = currencySymbol('INVALID');
      expect(result.toString()).toBe(
        '<span class="imported-value" data-field="currency-symbol">INVALID</span>'
      );
    });

    it('should handle undefined currency code', () => {
      const result = currencySymbol(undefined);
      expect(result.toString()).toBe(
        `<span class="missing-value" data-field="currency">${HANDLEBARS_CONFIG.errorMessages.invalidCurrency}</span>`
      );
    });

    it('should handle null currency code', () => {
      const result = currencySymbol(null);
      expect(result.toString()).toBe(
        `<span class="missing-value" data-field="currency">${HANDLEBARS_CONFIG.errorMessages.invalidCurrency}</span>`
      );
    });
  });

  describe('exchangeRate', () => {
    it('should format converted amount in target currency', () => {
      const result = exchangeRate(1000, 'EUR', 'USD');
      expect(result.toString()).toBe(
        '<span class="imported-value" data-field="currency">$1,000.00</span>'
      );
    });

    it('should handle decimal amounts', () => {
      const result = exchangeRate(1000.5, 'EUR', 'USD');
      expect(result.toString()).toBe(
        '<span class="imported-value" data-field="currency">$1,000.50</span>'
      );
    });

    it('should handle string amounts', () => {
      const result = exchangeRate('1000.50', 'EUR', 'USD');
      expect(result.toString()).toBe(
        '<span class="imported-value" data-field="currency">$1,000.50</span>'
      );
    });

    it('should handle missing amount', () => {
      const result = exchangeRate(undefined, 'EUR', 'USD');
      expect(result.toString()).toBe(
        `<span class="missing-value" data-field="currency">${HANDLEBARS_CONFIG.errorMessages.invalidConversion}</span>`
      );
    });

    it('should handle missing source currency', () => {
      const result = exchangeRate(1000, undefined, 'USD');
      expect(result.toString()).toBe(
        `<span class="missing-value" data-field="currency">${HANDLEBARS_CONFIG.errorMessages.invalidConversion}</span>`
      );
    });

    it('should handle missing target currency', () => {
      const result = exchangeRate(1000, 'EUR', undefined);
      expect(result.toString()).toBe(
        `<span class="missing-value" data-field="currency">${HANDLEBARS_CONFIG.errorMessages.invalidConversion}</span>`
      );
    });

    it('should handle invalid amount', () => {
      const result = exchangeRate('invalid', 'EUR', 'USD');
      expect(result.toString()).toBe(
        `<span class="missing-value" data-field="currency">${HANDLEBARS_CONFIG.errorMessages.invalidAmount}</span>`
      );
    });
  });

  describe('Handlebars integration', () => {
    it('should work in template with formatCurrency', () => {
      const template = handlebars.compile('{{formatCurrency amount currency}}');
      const result = template({
        amount: 1000,
        currency: 'EUR',
      });
      expect(result).toBe(
        '<span class="imported-value" data-field="currency">1.000,00 €</span>'
      );
    });

    it('should work in template with currencySymbol', () => {
      const template = handlebars.compile('{{currencySymbol currency}}');
      const result = template({ currency: 'EUR' });
      expect(result).toBe(
        '<span class="imported-value" data-field="currency-symbol">€</span>'
      );
    });

    it('should work in template with exchangeRate', () => {
      const template = handlebars.compile(
        '{{exchangeRate amount fromCurrency toCurrency}}'
      );
      const result = template({
        amount: 1000,
        fromCurrency: 'EUR',
        toCurrency: 'USD',
      });
      expect(result).toBe(
        '<span class="imported-value" data-field="currency">$1,000.00</span>'
      );
    });

    it('should handle nested helper calls', () => {
      const template = handlebars.compile(
        '{{formatCurrency (exchangeRate amount "EUR" "USD" subexpression=true) "USD"}}'
      );
      const result = template({ amount: 1000 });
      expect(result).toBe(
        '<span class="imported-value" data-field="currency">$1,000.00</span>'
      );
    });
  });
});
