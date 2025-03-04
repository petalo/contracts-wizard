/**
 * @file Unit tests for formatString helper
 *
 * Tests the string formatting capabilities including:
 * - Capitalization of first letter
 * - Case conversion (uppercase/lowercase)
 * - Text extraction from HTML wrappers
 * - Edge case handling
 *
 * @module @tests/unit/utils/template-processor/handlebars/helpers/format-string.unit.test
 * @requires handlebars - Template engine
 * @requires @/utils/template-processor/handlebars/helpers/string/format-string - Helper under test
 */

const handlebars = require('handlebars');
const {
  formatString,
  extractTextContent,
  extractDataField,
} = require('@/utils/template-processor/handlebars/helpers/string/format-string');

// Mock the logger
jest.mock('@/utils/common/logger', () => ({
  logger: {
    debug: jest.fn(),
    error: jest.fn(),
  },
}));

/**
 * Unescapes HTML entities in a string
 *
 * @param {string} str - String with HTML entities
 * @returns {string} Unescaped string
 */
function unescapeHtml(str) {
  if (typeof str !== 'string') return str;

  return str
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#x3D;/g, '=');
}

/**
 * Extracts text from a Handlebars template result
 * that may contain escaped HTML entities
 *
 * @param {string} handlebarsOutput - Output from handlebars template
 * @returns {string} Extracted text content
 */
function extractTextFromHandlebarsOutput(handlebarsOutput) {
  // First unescape HTML entities, then extract text content
  return extractTextContent(unescapeHtml(handlebarsOutput));
}

describe('formatString Helper', () => {
  beforeEach(() => {
    // Register helper before each test
    handlebars.registerHelper('formatString', formatString);
  });

  afterEach(() => {
    // Clean up after each test
    handlebars.unregisterHelper('formatString');
  });

  test('capitalizes first letter of plain string', () => {
    const template = handlebars.compile(
      '{{formatString "hello world" capitalize=true}}'
    );
    const result = template({});
    expect(extractTextFromHandlebarsOutput(result)).toBe('Hello world');
  });

  test('capitalizes first letter of value from data context', () => {
    const template = handlebars.compile(
      '{{formatString text capitalize=true}}'
    );
    const result = template({ text: 'cinco mil' });
    expect(extractTextFromHandlebarsOutput(result)).toBe('Cinco mil');
  });

  test('converts string to uppercase', () => {
    const template = handlebars.compile('{{formatString text upper=true}}');
    const result = template({ text: 'hello world' });
    expect(extractTextFromHandlebarsOutput(result)).toBe('HELLO WORLD');
  });

  test('converts string to lowercase', () => {
    const template = handlebars.compile('{{formatString text lower=true}}');
    const result = template({ text: 'HELLO WORLD' });
    expect(extractTextFromHandlebarsOutput(result)).toBe('hello world');
  });

  test('handles HTML-wrapped content by extracting and formatting text', () => {
    const template = handlebars.compile(
      '{{formatString text capitalize=true}}'
    );
    const result = template({
      text: '<span class="imported-value" data-field="text">cinco mil</span>',
    });
    expect(extractTextFromHandlebarsOutput(result)).toBe('Cinco mil');
  });

  test('handles nested path values correctly', () => {
    const template = handlebars.compile(
      '{{formatString pagos.fase_pre_compra.texto capitalize=true}}'
    );
    const data = {
      pagos: {
        fase_pre_compra: {
          texto: 'cinco mil',
        },
      },
    };
    const result = template(data);
    expect(extractTextFromHandlebarsOutput(result)).toBe('Cinco mil');
  });

  test('handles HTML-wrapped nested path values', () => {
    const template = handlebars.compile(
      '{{formatString htmlValue capitalize=true}}'
    );
    const data = {
      htmlValue:
        '<span class="imported-value" data-field="some.field">test value</span>',
    };
    const result = template(data);
    expect(extractTextFromHandlebarsOutput(result)).toBe('Test value');
  });

  test('handles objects with toString method', () => {
    const template = handlebars.compile(
      '{{formatString customObj capitalize=true}}'
    );
    const data = {
      customObj: { toString: () => 'custom object' },
    };
    const result = template(data);
    expect(extractTextFromHandlebarsOutput(result)).toBe('Custom object');
  });

  test('handles undefined values gracefully', () => {
    const template = handlebars.compile('{{formatString undefined_value}}');
    const result = template({});

    // Should have empty content after extraction
    expect(extractTextFromHandlebarsOutput(result)).toContain(
      '[[formatString]]'
    );
  });

  test('handles null values gracefully', () => {
    const template = handlebars.compile('{{formatString null_value}}');
    const result = template({ null_value: null });

    // Should have empty content after extraction
    expect(extractTextFromHandlebarsOutput(result)).toContain(
      '[[formatString]]'
    );
  });

  test('handles numeric values by converting to string', () => {
    const template = handlebars.compile('{{formatString numeric_value}}');
    const result = template({ numeric_value: 42 });
    expect(extractTextFromHandlebarsOutput(result)).toBe('42');
  });

  test('combines multiple transformations', () => {
    const template = handlebars.compile(
      '{{formatString text capitalize=true upper=true}}'
    );
    // upper should take precedence after capitalize is applied
    const result = template({ text: 'hello world' });
    expect(extractTextFromHandlebarsOutput(result)).toBe('HELLO WORLD');
  });

  test('handles errors gracefully', () => {
    // Create a value that will throw an error when toString() is called
    const badValue = {
      toString: () => {
        throw new Error('Test error');
      },
    };

    const template = handlebars.compile('{{formatString bad_value}}');
    const result = template({ bad_value: badValue });
    expect(result).toBe('[[Error formatting text]]');
  });

  test('preserves data-field attribute when formatting HTML content', () => {
    const template = handlebars.compile(
      '{{formatString text capitalize=true}}'
    );
    const result = template({
      text: '<span class="imported-value" data-field="custom.field">test value</span>',
    });

    // Should contain the original data-field (need to unescape HTML entities)
    const unescaped = unescapeHtml(result);
    expect(unescaped).toContain('data-field="custom.field"');

    // Should have capitalized content
    expect(extractTextFromHandlebarsOutput(result)).toBe('Test value');
  });
});
