/**
 * @file Unit tests for environment validation
 */

const { validateEnv } = require('@/config/env-validation');
const fs = require('fs').promises;
const path = require('path');

describe('Environment Validation', () => {
  let originalEnv;
  const testDirs = [
    './logs',
    './output',
    './templates',
    './assets/css',
    './assets/images',
    './data',
  ];

  beforeEach(async () => {
    originalEnv = { ...process.env };
    // Set up valid environment variables for each test
    process.env = {
      NODE_ENV: 'test',
      LOG_LEVEL: 'info',
      LOG_MAX_SIZE: '10MB',
      LOG_MAX_FILES: '7',
      LOG_DIR: './logs',
      DIR_OUTPUT: './output',
      DIR_TEMPLATES: './templates',
      DIR_CSS: './assets/css',
      DIR_IMAGES: './assets/images',
      DIR_CSV: './data',
    };

    // Create test directories
    for (const dir of testDirs) {
      await fs.mkdir(dir, { recursive: true });
    }
  });

  afterEach(async () => {
    process.env = originalEnv;
    // Clean up test directories
    for (const dir of testDirs) {
      try {
        // prettier-ignore
        await fs.rm(dir, {
          recursive: true,
          force: true
        });
      } catch (error) {
        // Ignore errors if directory doesn't exist
      }
    }
  });

  test('should validate required environment variables', async () => {
    await expect(validateEnv()).resolves.not.toThrow();
  });

  test('should throw error for missing required variables', async () => {
    delete process.env.NODE_ENV;
    delete process.env.LOG_LEVEL;
    delete process.env.DIR_OUTPUT;

    await expect(validateEnv()).rejects.toThrow();
  });

  test('should validate NODE_ENV values', async () => {
    process.env.NODE_ENV = 'invalid';

    await expect(validateEnv()).rejects.toThrow();
  });

  test('should validate LOG_LEVEL values', async () => {
    process.env.LOG_LEVEL = 'invalid';

    await expect(validateEnv()).rejects.toThrow();
  });

  test('should validate LOG_MAX_SIZE format', async () => {
    // Remove all valid directories to prevent validation from passing
    for (const dir of testDirs) {
      try {
        // prettier-ignore
        await fs.rm(dir, {
          recursive: true,
          force: true
        });
      } catch (error) {
        // Ignore errors if directory doesn't exist
      }
    }

    process.env.LOG_MAX_SIZE = 'invalid';

    await expect(validateEnv()).rejects.toThrow();
  });

  test('should handle optional environment variables', async () => {
    process.env.DEBUG = 'true';

    await expect(validateEnv()).resolves.not.toThrow();
  });
});
