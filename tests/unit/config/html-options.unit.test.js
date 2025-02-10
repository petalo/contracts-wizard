/* @file Unit tests for HTML generation options
 *
 * Tests the HTML configuration object and its components:
 * - Prettier configuration
 * - Metadata settings
 * - Template structure
 * - Markdown options
 */

const { HTML_CONFIG } = require('@/config/html-options');
const { HANDLEBARS_CONFIG } = require('@/config/handlebars-config');

describe('HTML Options Configuration', () => {
  test('should have valid prettier configuration', () => {
    expect(HTML_CONFIG.prettier).toBeDefined();
    expect(HTML_CONFIG.prettier.parser).toBe('html');
  });

  test('should have valid metadata configuration', () => {
    expect(HTML_CONFIG.meta).toBeDefined();
    expect(HTML_CONFIG.meta.basic).toBeInstanceOf(Array);
    expect(HTML_CONFIG.meta.custom).toBeInstanceOf(Array);
    expect(HTML_CONFIG.meta.extra).toBeInstanceOf(Array);

    // Test basic metadata
    const basicMeta = HTML_CONFIG.meta.basic;
    expect(basicMeta).toContainEqual({ charset: 'UTF-8' });
    expect(basicMeta).toContainEqual({
      name: 'viewport',
      content: 'width=device-width, initial-scale=1.0',
    });

    // Test custom metadata
    const customMeta = HTML_CONFIG.meta.custom;
    expect(customMeta).toContainEqual({
      name: 'generator',
      content: 'Contracts Wizard',
    });
    expect(customMeta).toContainEqual({
      name: 'application-name',
      content: 'petalo',
    });
  });

  test('should have valid templates configuration', () => {
    expect(HTML_CONFIG.templates).toBeDefined();
    expect(HTML_CONFIG.templates.base).toBeDefined();
    expect(typeof HTML_CONFIG.templates.base).toBe('function');

    // Test base template generation
    const html = HTML_CONFIG.templates.base({
      lang: 'en',
      meta: ['<meta charset="UTF-8">'],
      style: 'body { color: black; }',
      content: '<h1>Test</h1>',
    });

    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('<html lang="en">');
    expect(html).toContain('<meta charset="UTF-8">');
    expect(html).toContain('body { color: black; }');
    expect(html).toContain('<h1>Test</h1>');
  });

  test('should have valid markdown-it configuration', () => {
    expect(HTML_CONFIG.markdownit).toBeDefined();
    expect(HTML_CONFIG.markdownit.html).toBe(true);
    expect(HTML_CONFIG.markdownit.breaks).toBe(true);
    expect(HTML_CONFIG.markdownit.linkify).toBe(true);
    expect(HTML_CONFIG.markdownit.typographer).toBe(true);
    expect(HTML_CONFIG.markdownit.xhtml).toBe(true);
  });

  test('should have valid empty value configuration', () => {
    expect(HTML_CONFIG.emptyValue).toBeDefined();
    expect(HTML_CONFIG.emptyValue).toBe(HANDLEBARS_CONFIG.emptyValue);
  });

  test('should be immutable at top level', () => {
    expect(() => {
      HTML_CONFIG.newProperty = 'test';
    }).toThrow();

    expect(() => {
      HTML_CONFIG.prettier = {};
    }).toThrow();

    expect(() => {
      HTML_CONFIG.meta = {};
    }).toThrow();

    expect(() => {
      HTML_CONFIG.templates = {};
    }).toThrow();

    expect(() => {
      HTML_CONFIG.markdownit = {};
    }).toThrow();
  });

  test('should be immutable at first level', () => {
    expect(() => {
      HTML_CONFIG.meta.newProperty = 'test';
    }).toThrow();

    expect(() => {
      HTML_CONFIG.templates.newProperty = 'test';
    }).toThrow();

    expect(() => {
      HTML_CONFIG.markdownit.newProperty = 'test';
    }).toThrow();
  });
});
