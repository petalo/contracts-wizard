/**
 * @fileoverview Unit tests for application metadata configuration
 */

const { APP_METADATA } = require('@/config/appMetadata');

describe.skip('App Metadata', () => {
  test('should have valid application name', () => {
    expect(APP_METADATA.name).toBeDefined();
    expect(typeof APP_METADATA.name).toBe('string');
  });

  test('should have valid version', () => {
    expect(APP_METADATA.version).toBeDefined();
    expect(typeof APP_METADATA.version).toBe('string');
  });

  test('should have valid description', () => {
    expect(APP_METADATA.description).toBeDefined();
    expect(typeof APP_METADATA.description).toBe('string');
  });

  test('should have valid author', () => {
    expect(APP_METADATA.author).toBeDefined();
    expect(typeof APP_METADATA.author).toBe('string');
  });

  test('should have valid license', () => {
    expect(APP_METADATA.license).toBeDefined();
    expect(typeof APP_METADATA.license).toBe('string');
  });
});
