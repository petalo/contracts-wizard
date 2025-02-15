/**
 * @file Date Manipulation Test Cases
 *
 * Tests for date manipulation helpers:
 * - addYears helper
 * - now helper
 * - Nested helper combinations
 * - Leap year handling
 *
 * @module tests/common/handlebars-helpers/config/test-groups/date-manipulation
 */

const DATE_MANIPULATION_TESTS = [
  // addYears helper
  {
    name: 'addYears("2024-01-29", 1)',
    source: 'Direct',
    input: '2024-01-29',
    template: '{{addYears value 1}}',
    context: { value: '2024-01-29' },
    expected:
      '<span class="imported-value" data-field="date">29/01/2025</span>',
  },
  {
    name: 'addYears("2024-01-29", 1) from CSV',
    source: 'CSV',
    input: 'date_current',
    template: '{{addYears date_current 1}}',
    context: { date_current: '2024-01-29' },
    expected:
      '<span class="imported-value" data-field="date">29/01/2025</span>',
  },
  {
    name: 'addYears("2024-02-29", 1) - Leap year',
    source: 'Direct',
    input: '2024-02-29',
    template: '{{addYears value 1}}',
    context: { value: '2024-02-29' },
    expected:
      '<span class="imported-value" data-field="date">28/02/2025</span>',
  },
  {
    name: 'addYears("2024-02-29", 1) from CSV - Leap year',
    source: 'CSV',
    input: 'date_leap_year',
    template: '{{addYears date_leap_year 1}}',
    context: { date_leap_year: '2024-02-29' },
    expected:
      '<span class="imported-value" data-field="date">28/02/2025</span>',
  },
  {
    name: 'addYears("2024-02-29", 4) - Leap to leap',
    source: 'Direct',
    input: '2024-02-29',
    template: '{{addYears value 4}}',
    context: { value: '2024-02-29' },
    expected:
      '<span class="imported-value" data-field="date">29/02/2028</span>',
  },
  {
    name: 'addYears("2024-02-29", 4) from CSV - Leap to leap',
    source: 'CSV',
    input: 'date_leap_year',
    template: '{{addYears date_leap_year 4}}',
    context: { date_leap_year: '2024-02-29' },
    expected:
      '<span class="imported-value" data-field="date">29/02/2028</span>',
  },

  // now helper
  {
    name: 'now() - Default format',
    source: 'Direct',
    input: 'now',
    template: '{{now}}',
    context: {},
    expected:
      '<span class="imported-value" data-field="date">29/01/2024</span>',
  },
  {
    name: 'now("ISO") - ISO format',
    source: 'Direct',
    input: 'now',
    template: '{{now "ISO"}}',
    context: {},
    expected:
      '<span class="imported-value" data-field="date">2024-01-29</span>',
  },
  {
    name: 'now("FULL") - Full format',
    source: 'Direct',
    input: 'now',
    template: '{{now "FULL"}}',
    context: {},
    expected:
      '<span class="imported-value" data-field="date">29 de enero de 2024</span>',
  },

  // Nested helpers
  {
    name: 'formatDate(addYears(now, 1))',
    source: 'Direct',
    input: 'now',
    template: '{{formatDate (addYears (now raw=true) 1)}}',
    context: {},
    expected:
      '<span class="imported-value" data-field="date">29/01/2025</span>',
  },
  {
    name: 'formatDate(addYears("2024-01-29", 1))',
    source: 'Direct',
    input: '2024-01-29',
    template: '{{formatDate (addYears value 1)}}',
    context: { value: '2024-01-29' },
    expected:
      '<span class="imported-value" data-field="date">29/01/2025</span>',
  },
  {
    name: 'formatDate(addYears("2024-01-29", 1)) from CSV',
    source: 'CSV',
    input: 'date_current',
    template: '{{formatDate (addYears date_current 1)}}',
    context: { date_current: '2024-01-29' },
    expected:
      '<span class="imported-value" data-field="date">29/01/2025</span>',
  },

  // Edge cases
  {
    name: 'addYears(null, 1)',
    source: 'Direct',
    input: 'null',
    template: '{{addYears value 1}}',
    context: { value: null },
    expected:
      '<span class="missing-value" data-field="date">[[Invalid date]]</span>',
  },
  {
    name: 'addYears(null, 1) from CSV',
    source: 'CSV',
    input: 'date_null',
    template: '{{addYears date_null 1}}',
    context: { date_null: null },
    expected:
      '<span class="missing-value" data-field="date">[[Invalid date]]</span>',
  },
  {
    name: 'addYears("2024-01-29", null)',
    source: 'Direct',
    input: '2024-01-29',
    template: '{{addYears value null}}',
    context: { value: '2024-01-29' },
    expected:
      '<span class="missing-value" data-field="date">[[Invalid date]]</span>',
  },
  {
    name: 'addYears("invalid-date", 1)',
    source: 'Direct',
    input: 'invalid-date',
    template: '{{addYears value 1}}',
    context: { value: 'invalid-date' },
    expected:
      '<span class="missing-value" data-field="date">[[Invalid date]]</span>',
  },
  {
    name: 'addYears("invalid-date", 1) from CSV',
    source: 'CSV',
    input: 'date_invalid',
    template: '{{addYears date_invalid 1}}',
    context: { date_invalid: 'not a date' },
    expected:
      '<span class="missing-value" data-field="date">[[Invalid date]]</span>',
  },
];

module.exports = DATE_MANIPULATION_TESTS;
