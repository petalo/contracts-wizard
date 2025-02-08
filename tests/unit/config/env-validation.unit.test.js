/**
 * @fileoverview Unit tests for environment validation
 */

const { validateEnv } = require('@/config/envValidation');

describe.skip('Environment Validation', () => {
  let originalEnv;

  beforeEach(() => {
    originalEnv = { ...process.env };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  test('should validate required environment variables', () => {
    process.env.NODE_ENV = 'test';
    process.env.APP_NAME = 'test-app';
    process.env.APP_VERSION = '1.0.0';

    expect(() => validateEnv()).not.toThrow();
  });

  test('should throw error for missing required variables', () => {
    delete process.env.NODE_ENV;
    delete process.env.APP_NAME;
    delete process.env.APP_VERSION;

    expect(() => validateEnv()).toThrow();
  });

  test('should validate NODE_ENV values', () => {
    process.env.NODE_ENV = 'invalid';
    process.env.APP_NAME = 'test-app';
    process.env.APP_VERSION = '1.0.0';

    expect(() => validateEnv()).toThrow();
  });

  test('should validate version format', () => {
    process.env.NODE_ENV = 'test';
    process.env.APP_NAME = 'test-app';
    process.env.APP_VERSION = 'invalid';

    expect(() => validateEnv()).toThrow();
  });

  test('should handle optional environment variables', () => {
    process.env.NODE_ENV = 'test';
    process.env.APP_NAME = 'test-app';
    process.env.APP_VERSION = '1.0.0';
    process.env.OPTIONAL_VAR = 'value';

    expect(() => validateEnv()).not.toThrow();
  });
});
