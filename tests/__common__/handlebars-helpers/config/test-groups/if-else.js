/**
 * @file If/Else Test Cases
 *
 * Tests for basic if/else functionality:
 * - True/false conditions
 * - Undefined/null handling
 * - Empty values
 * - Zero handling
 *
 * @module tests/common/handlebars-helpers/config/test-groups/if-else
 */

const IF_ELSE_TESTS = [
  {
    name: 'if(true)',
    input: true,
    template: '{{#if value}}true{{else}}false{{/if}}',
    context: {
      value: true,
    },
    expected: '<div class="highlight">true</div>',
  },
  {
    name: 'if(true) from CSV',
    input: 'if_true',
    template: '{{#if if_true}}true{{else}}false{{/if}}',
    context: {
      if_true: true,
    },
    expected: '<div class="highlight">true</div>',
  },
  {
    name: 'if(false)',
    input: false,
    template: '{{#if value}}true{{else}}false{{/if}}',
    context: {
      value: false,
    },
    expected: '<div class="highlight">false</div>',
  },
  {
    name: 'if(false) from CSV',
    input: 'if_false',
    template: '{{#if if_false}}true{{else}}false{{/if}}',
    context: {
      if_false: false,
    },
    expected: '<div class="highlight">false</div>',
  },
  {
    name: 'if(undefined)',
    input: undefined,
    template: '{{#if value}}true{{else}}false{{/if}}',
    context: {
      value: undefined,
    },
    expected: '<div class="highlight">false</div>',
  },
  {
    name: 'if(undefined) from CSV',
    input: 'if_undefined',
    template: '{{#if if_undefined}}true{{else}}false{{/if}}',
    context: {
      if_undefined: undefined,
    },
    expected: '<div class="highlight">false</div>',
  },
  {
    name: 'if(null)',
    input: null,
    template: '{{#if value}}true{{else}}false{{/if}}',
    context: {
      value: null,
    },
    expected: '<div class="highlight">false</div>',
  },
  {
    name: 'if(null) from CSV',
    input: 'if_null',
    template: '{{#if if_null}}true{{else}}false{{/if}}',
    context: {
      if_null: null,
    },
    expected: '<div class="highlight">false</div>',
  },
  {
    name: 'if(0)',
    input: 0,
    template: '{{#if value}}true{{else}}false{{/if}}',
    context: {
      value: 0,
    },
    expected: '<div class="highlight">false</div>',
  },
  {
    name: 'if(0) from CSV',
    input: 'if_zero',
    template: '{{#if if_zero}}true{{else}}false{{/if}}',
    context: {
      if_zero: 0,
    },
    expected: '<div class="highlight">false</div>',
  },
  {
    name: 'if("")',
    input: '',
    template: '{{#if value}}true{{else}}false{{/if}}',
    context: {
      value: '',
    },
    expected: '<div class="highlight">false</div>',
  },
  {
    name: 'if("") from CSV',
    input: 'if_empty',
    template: '{{#if if_empty}}true{{else}}false{{/if}}',
    context: {
      if_empty: '',
    },
    expected: '<div class="highlight">false</div>',
  },
];

module.exports = IF_ELSE_TESTS;
