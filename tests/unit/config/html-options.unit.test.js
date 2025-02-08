/**
 * @fileoverview Unit tests for HTML generation options
 */

const { HTML_CONFIG } = require('@/config/htmlOptions');

describe.skip('HTML Options Configuration', () => {
  test('should have valid template configuration', () => {
    expect(HTML_CONFIG.template).toBeDefined();
    expect(HTML_CONFIG.template.path).toBeDefined();
    expect(typeof HTML_CONFIG.template.path).toBe('string');
  });

  test('should have valid style configuration', () => {
    expect(HTML_CONFIG.style).toBeDefined();
    expect(HTML_CONFIG.style.path).toBeDefined();
    expect(typeof HTML_CONFIG.style.path).toBe('string');
  });

  test('should have valid metadata configuration', () => {
    expect(HTML_CONFIG.metadata).toBeDefined();
    expect(HTML_CONFIG.metadata.title).toBeDefined();
    expect(typeof HTML_CONFIG.metadata.title).toBe('string');
    expect(HTML_CONFIG.metadata.charset).toBeDefined();
    expect(typeof HTML_CONFIG.metadata.charset).toBe('string');
  });

  test('should have valid rendering options', () => {
    expect(HTML_CONFIG.rendering).toBeDefined();
    expect(HTML_CONFIG.rendering.minify).toBeDefined();
    expect(typeof HTML_CONFIG.rendering.minify).toBe('boolean');
    expect(HTML_CONFIG.rendering.beautify).toBeDefined();
    expect(typeof HTML_CONFIG.rendering.beautify).toBe('boolean');
  });

  test('should have valid output configuration', () => {
    expect(HTML_CONFIG.output).toBeDefined();
    expect(HTML_CONFIG.output.directory).toBeDefined();
    expect(typeof HTML_CONFIG.output.directory).toBe('string');
    expect(HTML_CONFIG.output.extension).toBeDefined();
    expect(typeof HTML_CONFIG.output.extension).toBe('string');
  });
});
