/**
 * @file Equality Test Cases
 *
 * Tests for equality comparison:
 * - String equality
 * - Number equality
 * - Boolean equality
 * - Type coercion
 *
 * @module tests/common/handlebars-helpers/config/test-groups/equality
 */

const EQUALITY_TESTS = [
  {
    name: 'eq("hello", "hello")',
    input: 'hello',
    template: '{{#eq value1 value2}}true{{else}}false{{/eq}}',
    context: {
      value1: 'hello',
      value2: 'hello',
    },
    expected: 'true',
  },
  {
    name: 'eq("hello", "hello") from CSV',
    input: 'eq_string_hello',
    template: '{{#eq eq_string_hello eq_string_hello}}true{{else}}false{{/eq}}',
    context: {
      eq_string_hello: 'hello',
    },
    expected: 'true',
  },
  {
    name: 'eq(42, 42)',
    input: 42,
    template: '{{#eq value1 value2}}true{{else}}false{{/eq}}',
    context: {
      value1: 42,
      value2: 42,
    },
    expected: 'true',
  },
  {
    name: 'eq(42, 42) from CSV',
    input: 'eq_number_42',
    template: '{{#eq eq_number_42 eq_number_42}}true{{else}}false{{/eq}}',
    context: {
      eq_number_42: 42,
    },
    expected: 'true',
  },
  {
    name: 'eq(true, true)',
    input: true,
    template: '{{#eq value1 value2}}true{{else}}false{{/eq}}',
    context: {
      value1: true,
      value2: true,
    },
    expected: 'true',
  },
  {
    name: 'eq(true, true) from CSV',
    input: 'eq_boolean_true',
    template: '{{#eq eq_boolean_true eq_boolean_true}}true{{else}}false{{/eq}}',
    context: {
      eq_boolean_true: true,
    },
    expected: 'true',
  },
  {
    name: 'eq("42", 42)',
    input: '42',
    template: '{{#eq value1 value2}}true{{else}}false{{/eq}}',
    context: {
      value1: '42',
      value2: 42,
    },
    expected: 'false',
  },
  {
    name: 'eq("42", 42) from CSV',
    input: 'eq_string_42',
    template: '{{#eq eq_string_42 eq_number_42}}true{{else}}false{{/eq}}',
    context: {
      eq_string_42: '42',
      eq_number_42: 42,
    },
    expected: 'false',
  },
];

module.exports = EQUALITY_TESTS;
