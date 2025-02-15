/**
 * @file Object Test Cases
 *
 * Tests for object handling:
 * - Property lookup
 * - Missing property handling
 * - Null object handling
 * - Error messages
 *
 * @module tests/common/handlebars-helpers/config/test-groups/object
 */

const OBJECT_TESTS = [
  {
    name: 'lookup(object, "property")',
    source: 'Direct',
    input: '{ property: "value" }',
    template: '{{lookup value "property"}}',
    context: {
      value: {
        property: 'value',
      },
    },
    expected: 'value',
  },
  {
    name: 'lookup(object, "missing")',
    source: 'Direct',
    input: '{ property: "value" }',
    template: '{{lookup value "missing"}}',
    context: {
      value: {
        property: 'value',
      },
    },
    expected:
      '<span class="missing-value" data-field="lookup">[[missing not found]]</span>',
  },
  {
    name: 'lookup(null, "property")',
    source: 'Direct',
    input: 'null',
    template: '{{lookup value "property"}}',
    context: {
      value: null,
    },
    expected:
      '<span class="missing-value" data-field="lookup">[[lookup value missing]]</span>',
  },
];

module.exports = OBJECT_TESTS;
