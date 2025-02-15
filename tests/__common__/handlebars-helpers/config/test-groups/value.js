/**
 * @file Value Extraction Test Cases
 *
 * Tests for value extraction:
 * - Null/undefined handling
 * - String handling
 * - Number handling
 * - Boolean handling
 * - SafeString handling
 * - Error handling
 *
 * @module tests/common/handlebars-helpers/config/test-groups/value
 */

const VALUE_TESTS = [
  // Null and undefined handling
  {
    name: 'extractValue(null)',
    source: 'Direct',
    input: null,
    template: '{{value}}',
    context: { value: null },
    expected: '',
  },
  {
    name: 'extractValue(undefined)',
    source: 'Direct',
    input: undefined,
    template: '{{value}}',
    context: { value: undefined },
    expected: '',
  },
  {
    name: 'extractValue("null")',
    source: 'Direct',
    input: 'null',
    template: '{{value}}',
    context: { value: 'null' },
    expected: '',
  },

  // String handling
  {
    name: 'extractValue("")',
    source: 'Direct',
    input: '',
    template: '{{value}}',
    context: { value: '' },
    expected: '',
  },
  {
    name: 'extractValue("  test  ")',
    source: 'Direct',
    input: '  test  ',
    template: '{{value}}',
    context: { value: '  test  ' },
    expected: '  test  ',
  },
  {
    name: 'extractValue("!@#$%^&*()")',
    source: 'Direct',
    input: '!@#$%^&*()',
    template: '{{value}}',
    context: { value: '!@#$%^&*()' },
    expected: '!@#$%^&*()',
  },

  // Number handling
  {
    name: 'extractValue(0)',
    source: 'Direct',
    input: 0,
    template: '{{value}}',
    context: { value: 0 },
    expected: '0',
  },
  {
    name: 'extractValue(42)',
    source: 'Direct',
    input: 42,
    template: '{{value}}',
    context: { value: 42 },
    expected: '42',
  },
  {
    name: 'extractValue(-42)',
    source: 'Direct',
    input: -42,
    template: '{{value}}',
    context: { value: -42 },
    expected: '-42',
  },
  {
    name: 'extractValue("42")',
    source: 'Direct',
    input: '42',
    template: '{{value}}',
    context: { value: '42' },
    expected: '42',
  },

  // Boolean handling
  {
    name: 'extractValue(true)',
    source: 'Direct',
    input: true,
    template: '{{value}}',
    context: { value: true },
    expected: 'true',
  },
  {
    name: 'extractValue(false)',
    source: 'Direct',
    input: false,
    template: '{{value}}',
    context: { value: false },
    expected: 'false',
  },
  {
    name: 'extractValue("true")',
    source: 'Direct',
    input: 'true',
    template: '{{value}}',
    context: { value: 'true' },
    expected: 'true',
  },
  {
    name: 'extractValue("false")',
    source: 'Direct',
    input: 'false',
    template: '{{value}}',
    context: { value: 'false' },
    expected: 'false',
  },

  // SafeString handling
  {
    name: 'extractValue(SafeString)',
    source: 'Direct',
    input: '<span>test</span>',
    template: '{{{value}}}',
    context: { value: '<span>test</span>' },
    expected: 'test',
  },
  {
    name: 'extractValue(missing-value)',
    source: 'Direct',
    input: '<span class="missing-value">[[test]]</span>',
    template: '{{{value}}}',
    context: { value: '<span class="missing-value">[[test]]</span>' },
    expected: '',
  },
  {
    name: 'extractValue(imported-value)',
    source: 'Direct',
    input: '<span class="imported-value" data-field="test">value</span>',
    template: '{{{value}}}',
    context: {
      value: '<span class="imported-value" data-field="test">value</span>',
    },
    expected: 'value',
  },
  {
    name: 'extractValue(imported-value with spaces)',
    source: 'Direct',
    input:
      '<span class="imported-value" data-field="test">  spaced value  </span>',
    template: '{{{value}}}',
    context: {
      value:
        '<span class="imported-value" data-field="test">  spaced value  </span>',
    },
    expected: '  spaced value  ',
  },
];

module.exports = VALUE_TESTS;
