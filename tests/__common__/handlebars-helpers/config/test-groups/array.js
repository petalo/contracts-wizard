/**
 * @file Array Test Cases
 *
 * Tests for array handling:
 * - Basic array iteration
 * - Empty array handling
 * - Index access
 * - Last item detection
 * - Nested arrays
 * - Arrays of objects
 *
 * @module tests/common/handlebars-helpers/config/test-groups/array
 */

const ARRAY_TESTS = [
  // Basic array iteration
  {
    name: 'each([1, 2, 3])',
    input: [1, 2, 3],
    template: '{{#each array}}{{this}}{{#unless @last}},{{/unless}}{{/each}}',
    context: { array: [1, 2, 3] },
    expected: '1,2,3',
  },
  {
    name: 'each([1, 2, 3]) from CSV',
    input: 'array_numbers',
    template:
      '{{#each array_numbers}}{{this}}{{#unless @last}},{{/unless}}{{/each}}',
    context: { array_numbers: [1, 2, 3] },
    expected: '1,2,3',
  },
  {
    name: 'each(["a", "b", "c"])',
    input: ['a', 'b', 'c'],
    template: '{{#each array}}{{this}}{{#unless @last}},{{/unless}}{{/each}}',
    context: { array: ['a', 'b', 'c'] },
    expected: 'a,b,c',
  },
  {
    name: 'each(["a", "b", "c"]) from CSV',
    input: 'array_strings',
    template:
      '{{#each array_strings}}{{this}}{{#unless @last}},{{/unless}}{{/each}}',
    context: { array_strings: ['a', 'b', 'c'] },
    expected: 'a,b,c',
  },

  // Empty array handling
  {
    name: 'each([]) (empty array)',
    input: [],
    template: '{{#each array}}{{this}}{{else}}empty{{/each}}',
    context: { array: [] },
    expected: 'empty',
  },
  {
    name: 'each([]) (empty array) from CSV',
    input: 'array_empty',
    template: '{{#each array_empty}}{{this}}{{else}}empty{{/each}}',
    context: { array_empty: [] },
    expected: 'empty',
  },

  // Index access
  {
    name: 'each with @index',
    input: [1, 2, 3],
    template:
      '{{#each array}}{{@index}}:{{this}}{{#unless @last}},{{/unless}}{{/each}}',
    context: { array: [1, 2, 3] },
    expected: '0:1,1:2,2:3',
  },
  {
    name: 'each with @index from CSV',
    input: 'array_numbers',
    template:
      '{{#each array_numbers}}{{@index}}:{{this}}{{#unless @last}},{{/unless}}{{/each}}',
    context: { array_numbers: [1, 2, 3] },
    expected: '0:1,1:2,2:3',
  },

  // Mixed type arrays
  {
    name: 'each([1, "two", true])',
    input: [1, 'two', true],
    template: '{{#each array}}{{this}}{{#unless @last}},{{/unless}}{{/each}}',
    context: { array: [1, 'two', true] },
    expected: '1,two,true',
  },
  {
    name: 'each([1, "two", true]) from CSV',
    input: 'array_mixed',
    template:
      '{{#each array_mixed}}{{this}}{{#unless @last}},{{/unless}}{{/each}}',
    context: { array_mixed: [1, 'two', true] },
    expected: '1,two,true',
  },

  // Nested arrays
  {
    name: 'each([[1,2], [3,4]])',
    input: [
      [1, 2],
      [3, 4],
    ],
    template:
      '{{#each array}}[{{#each this}}{{this}}{{#unless @last}},{{/unless}}{{/each}}]{{#unless @last}},{{/unless}}{{/each}}',
    context: {
      array: [
        [1, 2],
        [3, 4],
      ],
    },
    expected: '[1,2],[3,4]',
  },
  {
    name: 'each([[1,2], [3,4]]) from CSV',
    input: 'array_nested',
    template:
      '{{#each array_nested}}[{{#each this}}{{this}}{{#unless @last}},{{/unless}}{{/each}}]{{#unless @last}},{{/unless}}{{/each}}',
    context: {
      array_nested: [
        [1, 2],
        [3, 4],
      ],
    },
    expected: '[1,2],[3,4]',
  },

  // Arrays of objects
  {
    name: 'each([{id:1}, {id:2}])',
    input: [{ id: 1 }, { id: 2 }],
    template: '{{#each array}}{{id}}{{#unless @last}},{{/unless}}{{/each}}',
    context: { array: [{ id: 1 }, { id: 2 }] },
    expected: '1,2',
  },
  {
    name: 'each([{id:1}, {id:2}]) from CSV',
    input: 'array_objects',
    template:
      '{{#each array_objects}}{{id}}{{#unless @last}},{{/unless}}{{/each}}',
    context: { array_objects: [{ id: 1 }, { id: 2 }] },
    expected: '1,2',
  },

  // Invalid inputs
  {
    name: 'each(null)',
    input: null,
    template: '{{#each array}}{{this}}{{else}}empty{{/each}}',
    context: { array: null },
    expected: 'empty',
  },
  {
    name: 'each(null) from CSV',
    input: 'array_null',
    template: '{{#each array_null}}{{this}}{{else}}empty{{/each}}',
    context: { array_null: null },
    expected: 'empty',
  },
  {
    name: 'each(undefined)',
    input: undefined,
    template: '{{#each array}}{{this}}{{else}}empty{{/each}}',
    context: { array: undefined },
    expected: 'empty',
  },
  {
    name: 'each(undefined) from CSV',
    input: 'array_undefined',
    template: '{{#each array_undefined}}{{this}}{{else}}empty{{/each}}',
    context: { array_undefined: undefined },
    expected: 'empty',
  },
  {
    name: 'each("not an array")',
    input: 'not an array',
    template: '{{#each array}}{{this}}{{else}}empty{{/each}}',
    context: { array: 'not an array' },
    expected: 'empty',
  },
  {
    name: 'each("not an array") from CSV',
    input: 'array_invalid',
    template: '{{#each array_invalid}}{{this}}{{else}}empty{{/each}}',
    context: { array_invalid: 'not an array' },
    expected: 'empty',
  },
];

module.exports = ARRAY_TESTS;
