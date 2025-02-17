/**
 * @file Currency Test Cases
 *
 * Tests for currency formatting:
 * - Different currencies (EUR, USD, GBP, JPY, etc.)
 * - Decimal handling and rounding
 * - Negative numbers
 * - String input formats (Spanish/English)
 * - Edge cases (zero, large numbers, scientific notation)
 * - Object inputs with currency info
 *
 * @module tests/common/handlebars-helpers/config/test-groups/currency
 */

const CURRENCY_TESTS = [
  // Basic currency formatting
  {
    name: 'formatCurrency(1000, "EUR")',
    source: 'Direct',
    input: 1000,
    template: '{{{formatCurrency value currency="EUR"}}}',
    context: { value: 1000 },
    expected:
      '<span class="imported-value" data-field="currency">1.000,00 €</span>',
  },
  {
    name: 'formatCurrency(1000, "EUR") from CSV',
    source: 'CSV',
    input: 'currency_eur',
    template: '{{{formatCurrency currency_eur currency="EUR"}}}',
    context: { currency_eur: 1000 },
    expected:
      '<span class="imported-value" data-field="currency">1.000,00 €</span>',
  },
  {
    name: 'formatCurrency(1000, "USD")',
    source: 'Direct',
    input: 1000,
    template: '{{{formatCurrency value currency="USD" useCode=false}}}',
    context: { value: 1000 },
    expected:
      '<span class="imported-value" data-field="currency">$1,000.00</span>',
  },
  {
    name: 'formatCurrency(1000, "USD") from CSV',
    source: 'CSV',
    input: 'currency_usd',
    template: '{{{formatCurrency currency_usd currency="USD"}}}',
    context: { currency_usd: 1000 },
    expected:
      '<span class="imported-value" data-field="currency">$1,000.00</span>',
  },
  {
    name: 'formatCurrency(1000, "GBP")',
    source: 'Direct',
    input: 1000,
    template: '{{{formatCurrency value currency="GBP" useCode=false}}}',
    context: { value: 1000 },
    expected:
      '<span class="imported-value" data-field="currency">£1,000.00</span>',
  },
  {
    name: 'formatCurrency(1000, "GBP") from CSV',
    source: 'CSV',
    input: 'currency_gbp',
    template: '{{{formatCurrency currency_gbp currency="GBP"}}}',
    context: { currency_gbp: 1000 },
    expected:
      '<span class="imported-value" data-field="currency">£1,000.00</span>',
  },

  // Decimal values
  {
    name: 'formatCurrency(1234.56, "EUR")',
    source: 'Direct',
    input: 1234.56,
    template: '{{{formatCurrency value currency="EUR"}}}',
    context: { value: 1234.56 },
    expected:
      '<span class="imported-value" data-field="currency">1.234,56 €</span>',
  },
  {
    name: 'formatCurrency(1234.56, "EUR") from CSV',
    source: 'CSV',
    input: 'currency_eur_decimal',
    template: '{{{formatCurrency currency_eur_decimal currency="EUR"}}}',
    context: { currency_eur_decimal: 1234.56 },
    expected:
      '<span class="imported-value" data-field="currency">1.234,56 €</span>',
  },

  // Negative numbers
  {
    name: 'formatCurrency(-1234.56, "EUR")',
    source: 'Direct',
    input: -1234.56,
    template: '{{{formatCurrency value currency="EUR"}}}',
    context: { value: -1234.56 },
    expected:
      '<span class="imported-value" data-field="currency">-1.234,56 €</span>',
  },
  {
    name: 'formatCurrency(-1234.56, "EUR") from CSV',
    source: 'CSV',
    input: 'currency_eur_negative',
    template: '{{{formatCurrency currency_eur_negative currency="EUR"}}}',
    context: { currency_eur_negative: -1234.56 },
    expected:
      '<span class="imported-value" data-field="currency">-1.234,56 €</span>',
  },
  {
    name: 'formatCurrency(-1234.56, "USD")',
    source: 'Direct',
    input: -1234.56,
    template: '{{{formatCurrency value currency="USD"}}}',
    context: { value: -1234.56 },
    expected:
      '<span class="imported-value" data-field="currency">-$1,234.56</span>',
  },
  {
    name: 'formatCurrency(-1234.56, "USD") from CSV',
    source: 'CSV',
    input: 'currency_usd_negative',
    template: '{{{formatCurrency currency_usd_negative currency="USD"}}}',
    context: { currency_usd_negative: -1234.56 },
    expected:
      '<span class="imported-value" data-field="currency">-$1,234.56</span>',
  },

  // String input formats
  {
    name: 'formatCurrency("1.234,56", "USD") - Spanish format',
    source: 'Direct',
    input: '1.234,56',
    template: '{{{formatCurrency value currency="USD"}}}',
    context: { value: '1.234,56' },
    expected:
      '<span class="imported-value" data-field="currency">$1,234.56</span>',
  },
  {
    name: 'formatCurrency("1.234,56", "USD") from CSV - Spanish format',
    source: 'CSV',
    input: 'currency_string_spanish',
    template: '{{{formatCurrency currency_string_spanish currency="USD"}}}',
    context: { currency_string_spanish: '1.234,56' },
    expected:
      '<span class="imported-value" data-field="currency">$1,234.56</span>',
  },
  {
    name: 'formatCurrency("1,234.56", "EUR") - English format',
    source: 'Direct',
    input: '1,234.56',
    template: '{{{formatCurrency value currency="EUR"}}}',
    context: { value: '1,234.56' },
    expected:
      '<span class="imported-value" data-field="currency">1.234,56 €</span>',
  },
  {
    name: 'formatCurrency("1,234.56", "EUR") from CSV - English format',
    source: 'CSV',
    input: 'currency_string_english',
    template: '{{{formatCurrency currency_string_english currency="EUR"}}}',
    context: { currency_string_english: '1,234.56' },
    expected:
      '<span class="imported-value" data-field="currency">1.234,56 €</span>',
  },
  {
    name: 'formatCurrency("1.234,56 EUR", "EUR") - Mixed Spanish format',
    source: 'CSV',
    input: 'currency_string_mixed_spanish',
    template:
      '{{{formatCurrency currency_string_mixed_spanish currency="EUR"}}}',
    context: { currency_string_mixed_spanish: '1.234,56 EUR' },
    expected:
      '<span class="imported-value" data-field="currency">1.234,56 €</span>',
  },
  {
    name: 'formatCurrency("$1,234.56", "USD") - Mixed English format',
    source: 'CSV',
    input: 'currency_string_mixed_english',
    template:
      '{{{formatCurrency currency_string_mixed_english currency="USD"}}}',
    context: { currency_string_mixed_english: '$1,234.56' },
    expected:
      '<span class="imported-value" data-field="currency">$1,234.56</span>',
  },

  // Decimal control
  {
    name: 'formatCurrency(1234.567, "EUR", 3 decimals)',
    source: 'CSV',
    input: 'currency_decimals_three',
    template:
      '{{{formatCurrency currency_decimals_three currency="EUR" minDecimals=3 maxDecimals=3}}}',
    context: { currency_decimals_three: 1234.567 },
    expected:
      '<span class="imported-value" data-field="currency">1.234,567 €</span>',
  },
  {
    name: 'formatCurrency(1000.50, "USD", no decimals)',
    source: 'CSV',
    input: 'currency_decimals_none',
    template:
      '{{{formatCurrency currency_decimals_none currency="USD" minDecimals=0 maxDecimals=0}}}',
    context: { currency_decimals_none: 1000.5 },
    expected:
      '<span class="imported-value" data-field="currency">$1,001</span>',
  },
  {
    name: 'formatCurrency(1234.5, "EUR", auto decimals)',
    source: 'CSV',
    input: 'currency_decimals_auto',
    template: '{{{formatCurrency currency_decimals_auto currency="EUR"}}}',
    context: { currency_decimals_auto: 1234.5 },
    expected:
      '<span class="imported-value" data-field="currency">1.234,50 €</span>',
  },

  // Edge cases
  {
    name: 'formatCurrency(0, "EUR")',
    source: 'CSV',
    input: 'currency_zero',
    template: '{{{formatCurrency currency_zero currency="EUR"}}}',
    context: { currency_zero: 0 },
    expected:
      '<span class="imported-value" data-field="currency">0,00 €</span>',
  },
  {
    name: 'formatCurrency(1234567890.12, "EUR")',
    source: 'CSV',
    input: 'currency_large',
    template: '{{{formatCurrency currency_large currency="EUR"}}}',
    context: { currency_large: 1234567890.12 },
    expected:
      '<span class="imported-value" data-field="currency">1.234.567.890,12 €</span>',
  },
  {
    name: 'formatCurrency(0.000001, "EUR")',
    source: 'CSV',
    input: 'currency_small',
    template: '{{{formatCurrency currency_small currency="EUR"}}}',
    context: { currency_small: 0.000001 },
    expected:
      '<span class="imported-value" data-field="currency">0,00 €</span>',
  },
  {
    name: 'formatCurrency("1.234e6", "EUR")',
    source: 'CSV',
    input: 'currency_scientific',
    template: '{{{formatCurrency currency_scientific currency="EUR"}}}',
    context: { currency_scientific: '1.234e6' },
    expected:
      '<span class="imported-value" data-field="currency">1.234.000,00 €</span>',
  },

  // Invalid inputs
  {
    name: 'formatCurrency(null, "EUR")',
    source: 'CSV',
    input: 'currency_null',
    template: '{{{formatCurrency currency_null currency="EUR"}}}',
    context: { currency_null: null },
    expected: '',
  },
  {
    name: 'formatCurrency(undefined, "EUR")',
    source: 'CSV',
    input: 'currency_undefined',
    template: '{{{formatCurrency currency_undefined currency="EUR"}}}',
    context: { currency_undefined: undefined },
    expected: '',
  },
  {
    name: 'formatCurrency("", "EUR")',
    source: 'CSV',
    input: 'currency_empty',
    template: '{{{formatCurrency currency_empty currency="EUR"}}}',
    context: { currency_empty: '' },
    expected: '',
  },
  {
    name: 'formatCurrency("not-a-number", "EUR")',
    source: 'CSV',
    input: 'currency_invalid',
    template: '{{{formatCurrency currency_invalid currency="EUR"}}}',
    context: { currency_invalid: 'not-a-number' },
    expected: 'not-a-number',
  },

  // Object inputs
  {
    name: 'formatCurrency({amount: 1000, currency: "EUR"})',
    source: 'CSV',
    input: 'currency_object_amount',
    template: '{{{formatCurrency currency_object_amount}}}',
    context: {
      currency_object_amount: {
        amount: 1000,
        currency: 'EUR',
      },
    },
    expected:
      '<span class="imported-value" data-field="currency">1.000,00 €</span>',
  },
  {
    name: 'formatCurrency({value: 1000})',
    source: 'CSV',
    input: 'currency_object_value',
    template: '{{{formatCurrency currency_object_value currency="EUR"}}}',
    context: {
      currency_object_value: { value: 1000 },
    },
    expected:
      '<span class="imported-value" data-field="currency">1.000,00 €</span>',
  },
  {
    name: 'formatCurrency({amount: 1000, currency: "USD", format: "code"})',
    source: 'CSV',
    input: 'currency_object_mixed',
    template: '{{{formatCurrency currency_object_mixed}}}',
    context: {
      currency_object_mixed: {
        amount: 1000,
        currency: 'USD',
        format: 'code',
      },
    },
    expected:
      '<span class="imported-value" data-field="currency">$1,000.00</span>',
  },

  // Rounding cases
  {
    name: 'formatCurrency(1234.567, "EUR") - Round up',
    source: 'CSV',
    input: 'currency_round_up',
    template: '{{{formatCurrency currency_round_up currency="EUR"}}}',
    context: { currency_round_up: 1234.567 },
    expected:
      '<span class="imported-value" data-field="currency">1.234,57 €</span>',
  },
  {
    name: 'formatCurrency(1234.562, "EUR") - Round down',
    source: 'CSV',
    input: 'currency_round_down',
    template: '{{{formatCurrency currency_round_down currency="EUR"}}}',
    context: { currency_round_down: 1234.562 },
    expected:
      '<span class="imported-value" data-field="currency">1.234,56 €</span>',
  },
  {
    name: 'formatCurrency(1234.565, "EUR") - Round half',
    source: 'CSV',
    input: 'currency_round_half',
    template: '{{{formatCurrency currency_round_half currency="EUR"}}}',
    context: { currency_round_half: 1234.565 },
    expected:
      '<span class="imported-value" data-field="currency">1.234,57 €</span>',
  },

  // Different currencies
  {
    name: 'formatCurrency(1234, "JPY")',
    source: 'CSV',
    input: 'currency_jpy',
    template: '{{{formatCurrency currency_jpy currency="JPY"}}}',
    context: { currency_jpy: 1234 },
    expected:
      '<span class="imported-value" data-field="currency">1,234.00 JPY</span>',
  },
  {
    name: 'formatCurrency(1234.56, "CHF")',
    source: 'CSV',
    input: 'currency_chf',
    template: '{{{formatCurrency currency_chf currency="CHF"}}}',
    context: { currency_chf: 1234.56 },
    expected:
      '<span class="imported-value" data-field="currency">1,234.56 CHF</span>',
  },
  {
    name: 'formatCurrency(1234.56, "CNY")',
    source: 'CSV',
    input: 'currency_cny',
    template: '{{{formatCurrency currency_cny currency="CNY"}}}',
    context: { currency_cny: 1234.56 },
    expected:
      '<span class="imported-value" data-field="currency">1,234.56 CNY</span>',
  },
];

// Log before exporting
console.log('Exporting CURRENCY_TESTS:', {
  length: CURRENCY_TESTS.length,
  names: CURRENCY_TESTS.map((test) => test.name),
  isArray: Array.isArray(CURRENCY_TESTS),
  type: typeof CURRENCY_TESTS,
});

module.exports = CURRENCY_TESTS;
