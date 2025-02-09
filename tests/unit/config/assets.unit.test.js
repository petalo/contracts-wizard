/**
 * @file Unit tests for assets configuration
 */

const { ASSETS_CONFIG } = require('@/config/assets');
const path = require('path');

describe('Assets Configuration', () => {
  test('should have valid logo configuration', () => {
    expect(ASSETS_CONFIG.logo).toBeDefined();
    expect(ASSETS_CONFIG.logo.path).toBeDefined();
    expect(typeof ASSETS_CONFIG.logo.path).toBe('string');
    expect(ASSETS_CONFIG.logo.maxSize).toBeDefined();
    expect(typeof ASSETS_CONFIG.logo.maxSize).toBe('number');
  });

  test('should have valid templates configuration', () => {
    expect(ASSETS_CONFIG.templates).toBeDefined();
    expect(ASSETS_CONFIG.templates.path).toBeDefined();
    expect(typeof ASSETS_CONFIG.templates.path).toBe('string');
    expect(ASSETS_CONFIG.templates.extensions).toBeDefined();
    expect(Array.isArray(ASSETS_CONFIG.templates.extensions)).toBe(true);
  });

  test('should have valid CSS configuration', () => {
    expect(ASSETS_CONFIG.css).toBeDefined();
    expect(ASSETS_CONFIG.css.path).toBeDefined();
    expect(typeof ASSETS_CONFIG.css.path).toBe('string');
    expect(ASSETS_CONFIG.css.extensions).toBeDefined();
    expect(Array.isArray(ASSETS_CONFIG.css.extensions)).toBe(true);
  });

  test('should have valid data configuration', () => {
    expect(ASSETS_CONFIG.data).toBeDefined();
    expect(ASSETS_CONFIG.data.path).toBeDefined();
    expect(typeof ASSETS_CONFIG.data.path).toBe('string');
    expect(ASSETS_CONFIG.data.extensions).toBeDefined();
    expect(Array.isArray(ASSETS_CONFIG.data.extensions)).toBe(true);
  });

  test('should have valid output configuration', () => {
    expect(ASSETS_CONFIG.output).toBeDefined();
    expect(ASSETS_CONFIG.output.path).toBeDefined();
    expect(typeof ASSETS_CONFIG.output.path).toBe('string');
  });
});
