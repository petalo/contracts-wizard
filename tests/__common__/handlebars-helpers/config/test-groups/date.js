/**
 * @file Date Test Cases
 *
 * Tests for date formatting:
 * - Different formats (DEFAULT, ISO, FULL)
 * - Date manipulation (addYears)
 * - Leap year handling
 * - Locale-specific formatting
 * - Edge cases and error handling
 * - Time handling
 *
 * @module tests/common/handlebars-helpers/config/test-groups/date
 */

const DATE_TESTS = [
  // Basic date formatting
  {
    name: 'formatDate("2024-01-29", "DEFAULT")',
    source: 'Direct',
    input: '2024-01-29',
    template: '{{formatDate value "DEFAULT"}}',
    context: { value: '2024-01-29' },
    expected:
      '<span class="imported-value" data-field="date">29/01/2024</span>',
  },
  {
    name: 'formatDate("2024-01-29", "DEFAULT") from CSV',
    source: 'CSV',
    input: 'date_current',
    template: '{{formatDate date_current "DEFAULT"}}',
    context: { date_current: '2024-01-29' },
    expected:
      '<span class="imported-value" data-field="date">29/01/2024</span>',
  },
  {
    name: 'formatDate("2024-01-29", "ISO")',
    source: 'Direct',
    input: '2024-01-29',
    template: '{{formatDate value "ISO"}}',
    context: { value: '2024-01-29' },
    expected:
      '<span class="imported-value" data-field="date">2024-01-29</span>',
  },
  {
    name: 'formatDate("2024-01-29", "FULL")',
    source: 'Direct',
    input: '2024-01-29',
    template: '{{formatDate value "FULL"}}',
    context: { value: '2024-01-29' },
    expected:
      '<span class="imported-value" data-field="date">29 de enero de 2024</span>',
  },

  // Different input formats
  {
    name: 'formatDate("29/01/2024", "ISO") - European format',
    source: 'Direct',
    input: '29/01/2024',
    template: '{{formatDate value "ISO"}}',
    context: { value: '29/01/2024' },
    expected:
      '<span class="imported-value" data-field="date">2024-01-29</span>',
  },
  {
    name: 'formatDate("29/01/2024", "ISO") from CSV - European format',
    source: 'CSV',
    input: 'date_european',
    template: '{{formatDate date_european "ISO"}}',
    context: { date_european: '29/01/2024' },
    expected:
      '<span class="imported-value" data-field="date">2024-01-29</span>',
  },
  {
    name: 'formatDate("01/29/2024", "ISO") - American format',
    source: 'Direct',
    input: '01/29/2024',
    template: '{{formatDate value "ISO"}}',
    context: { value: '01/29/2024' },
    expected:
      '<span class="imported-value" data-field="date">2024-01-29</span>',
  },
  {
    name: 'formatDate("01/29/2024", "ISO") from CSV - American format',
    source: 'CSV',
    input: 'date_american',
    template: '{{formatDate date_american "ISO"}}',
    context: { date_american: '01/29/2024' },
    expected:
      '<span class="imported-value" data-field="date">2024-01-29</span>',
  },
  {
    name: 'formatDate("29 de enero de 2024", "ISO") - Text format',
    source: 'Direct',
    input: '29 de enero de 2024',
    template: '{{formatDate value "ISO"}}',
    context: { value: '29 de enero de 2024' },
    expected:
      '<span class="imported-value" data-field="date">2024-01-29</span>',
  },
  {
    name: 'formatDate("29 de enero de 2024", "ISO") from CSV - Text format',
    source: 'CSV',
    input: 'date_text',
    template: '{{formatDate date_text "ISO"}}',
    context: { date_text: '29 de enero de 2024' },
    expected:
      '<span class="imported-value" data-field="date">2024-01-29</span>',
  },

  // Leap year handling
  {
    name: 'formatDate("2024-02-29") - Valid leap year',
    source: 'Direct',
    input: '2024-02-29',
    template: '{{formatDate value}}',
    context: { value: '2024-02-29' },
    expected:
      '<span class="imported-value" data-field="date">29/02/2024</span>',
  },
  {
    name: 'formatDate("2024-02-29") from CSV - Valid leap year',
    source: 'CSV',
    input: 'date_leap_year',
    template: '{{formatDate date_leap_year}}',
    context: { date_leap_year: '2024-02-29' },
    expected:
      '<span class="imported-value" data-field="date">29/02/2024</span>',
  },
  {
    name: 'formatDate("2024-02-30") - Invalid leap year',
    source: 'Direct',
    input: '2024-02-30',
    template: '{{formatDate value}}',
    context: { value: '2024-02-30' },
    expected:
      '<span class="missing-value" data-field="date">[[Invalid date]]</span>',
  },
  {
    name: 'formatDate("2024-02-30") from CSV - Invalid leap year',
    source: 'CSV',
    input: 'date_invalid_leap',
    template: '{{formatDate date_invalid_leap}}',
    context: { date_invalid_leap: '2024-02-30' },
    expected:
      '<span class="missing-value" data-field="date">[[Invalid date]]</span>',
  },

  // Time handling
  {
    name: 'formatDate("2024-01-29T12:00:00") - With time',
    source: 'Direct',
    input: '2024-01-29T12:00:00',
    template: '{{formatDate value "ISO8601"}}',
    context: { value: '2024-01-29T12:00:00' },
    expected:
      '<span class="imported-value" data-field="date">2024-01-29 12:00:00</span>',
  },
  {
    name: 'formatDate("2024-01-29T12:00:00") from CSV - With time',
    source: 'CSV',
    input: 'date_with_time',
    template: '{{formatDate date_with_time "ISO8601"}}',
    context: { date_with_time: '2024-01-29T12:00:00' },
    expected:
      '<span class="imported-value" data-field="date">2024-01-29 12:00:00</span>',
  },
  {
    name: 'formatDate("2024-01-29T12:00:00", "TIME")',
    source: 'Direct',
    input: '2024-01-29T12:00:00',
    template: '{{formatDate value "TIME"}}',
    context: { value: '2024-01-29T12:00:00' },
    expected: '<span class="imported-value" data-field="date">12:00:00</span>',
  },

  // Edge cases
  {
    name: 'formatDate(null)',
    source: 'Direct',
    input: 'null',
    template: '{{formatDate value}}',
    context: { value: null },
    expected:
      '<span class="missing-value" data-field="date">[[Invalid date]]</span>',
  },
  {
    name: 'formatDate(null) from CSV',
    source: 'CSV',
    input: 'date_null',
    template: '{{formatDate date_null}}',
    context: { date_null: null },
    expected:
      '<span class="missing-value" data-field="date">[[Invalid date]]</span>',
  },
  {
    name: 'formatDate(undefined)',
    source: 'Direct',
    input: 'undefined',
    template: '{{formatDate value}}',
    context: { value: undefined },
    expected:
      '<span class="missing-value" data-field="date">[[Invalid date]]</span>',
  },
  {
    name: 'formatDate(undefined) from CSV',
    source: 'CSV',
    input: 'date_undefined',
    template: '{{formatDate date_undefined}}',
    context: { date_undefined: undefined },
    expected:
      '<span class="missing-value" data-field="date">[[Invalid date]]</span>',
  },
  {
    name: 'formatDate("") - Empty string',
    source: 'Direct',
    input: '""',
    template: '{{formatDate value}}',
    context: { value: '' },
    expected:
      '<span class="missing-value" data-field="date">[[Invalid date]]</span>',
  },
  {
    name: 'formatDate("") from CSV - Empty string',
    source: 'CSV',
    input: 'date_empty',
    template: '{{formatDate date_empty}}',
    context: { date_empty: '' },
    expected:
      '<span class="missing-value" data-field="date">[[Invalid date]]</span>',
  },
  {
    name: 'formatDate("invalid-date")',
    source: 'Direct',
    input: '"invalid-date"',
    template: '{{formatDate value}}',
    context: { value: 'invalid-date' },
    expected:
      '<span class="missing-value" data-field="date">[[Invalid date]]</span>',
  },
  {
    name: 'formatDate("invalid-date") from CSV',
    source: 'CSV',
    input: 'date_invalid',
    template: '{{formatDate date_invalid}}',
    context: { date_invalid: 'not a date' },
    expected:
      '<span class="missing-value" data-field="date">[[Invalid date]]</span>',
  },
  {
    name: 'formatDate("2024-13-01") - Invalid month',
    source: 'Direct',
    input: '2024-13-01',
    template: '{{formatDate value}}',
    context: { value: '2024-13-01' },
    expected:
      '<span class="missing-value" data-field="date">[[Invalid date]]</span>',
  },
  {
    name: 'formatDate("2024-13-01") from CSV - Invalid month',
    source: 'CSV',
    input: 'date_invalid_month',
    template: '{{formatDate date_invalid_month}}',
    context: { date_invalid_month: '2024-13-01' },
    expected:
      '<span class="missing-value" data-field="date">[[Invalid date]]</span>',
  },
  {
    name: 'formatDate("2024-01-32") - Invalid day',
    source: 'Direct',
    input: '2024-01-32',
    template: '{{formatDate value}}',
    context: { value: '2024-01-32' },
    expected:
      '<span class="missing-value" data-field="date">[[Invalid date]]</span>',
  },
  {
    name: 'formatDate("2024-01-32") from CSV - Invalid day',
    source: 'CSV',
    input: 'date_invalid_day',
    template: '{{formatDate date_invalid_day}}',
    context: { date_invalid_day: '2024-01-32' },
    expected:
      '<span class="missing-value" data-field="date">[[Invalid date]]</span>',
  },
];

module.exports = DATE_TESTS;
