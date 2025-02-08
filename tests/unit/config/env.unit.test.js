/**
 * @fileoverview Environment Configuration Tests
 *
 * Tests environment variable handling and configuration:
 * - Log level management
 * - Debug mode detection
 * - Environment type validation
 * - Default values
 *
 * Test Cases:
 * - getLogLevel: Default and custom values
 * - isDebugEnabled: True/false states
 * - getNodeEnv: Environment detection
 * - ENV: Default configuration
 *
 * @module tests/config/env
 * @requires @/config/env
 */

const {
  ENV,
  getLogLevel,
  isDebugEnabled,
  getNodeEnv,
} = require('@/config/env');

describe('Environment Configuration', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('getLogLevel', () => {
    describe('when LOG_LEVEL is set', () => {
      it('returns LOG_LEVEL from env if set', () => {
        process.env.LOG_LEVEL = 'debug';
        expect(getLogLevel()).toBe('debug');
      });
    });

    describe('when LOG_LEVEL is not set', () => {
      it('returns default info level if not set', () => {
        delete process.env.LOG_LEVEL;
        expect(getLogLevel()).toBe('info');
      });
    });
  });

  describe('isDebugEnabled', () => {
    it('returns true when DEBUG=true', () => {
      process.env.DEBUG = 'true';
      expect(isDebugEnabled()).toBe(true);
    });

    it('returns false when DEBUG=false', () => {
      process.env.DEBUG = 'false';
      expect(isDebugEnabled()).toBe(false);
    });
  });

  describe('getNodeEnv', () => {
    it('returns NODE_ENV value', () => {
      process.env.NODE_ENV = 'test';
      expect(getNodeEnv()).toBe('test');
    });

    it('returns development by default', () => {
      delete process.env.NODE_ENV;
      expect(getNodeEnv()).toBe('development');
    });
  });

  // ... more tests
});
