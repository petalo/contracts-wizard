/**
 * @fileoverview Environment Logger Tests
 *
 * Tests environment logging functionality:
 * - Configuration logging
 * - Path resolution
 * - Metadata handling
 *
 * Test Cases:
 * - Environment variable logging
 * - Path resolution and formatting
 * - Debug vs Info level logging
 * - Metadata object structure
 *
 * @module tests/config/env-logger
 * @requires @/config/env-logger
 */

const { logEnvironmentDetails } = require('@/config/env-logger');

describe('Environment Logger', () => {
  let mockLogger;

  beforeEach(() => {
    mockLogger = {
      info: jest.fn(),
      debug: jest.fn(),
    };
  });

  describe('configuration logging', () => {
    it('logs environment configuration', () => {
      const paths = {
        output: '/test/output',
        templates: '/test/templates',
      };

      logEnvironmentDetails(mockLogger, paths);

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Environment configuration:',
        expect.any(Object)
      );
    });

    it('includes DEBUG and NODE_ENV in log', () => {
      process.env.DEBUG = 'true';
      process.env.NODE_ENV = 'test';

      logEnvironmentDetails(mockLogger, {});

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Environment configuration:',
        expect.objectContaining({
          DEBUG: 'true',
          NODE_ENV: 'test',
        })
      );
    });
  });

  describe('path logging', () => {
    it('logs relative paths for each entry', () => {
      const paths = {
        output: '/test/output',
        templates: '/test/templates',
      };

      logEnvironmentDetails(mockLogger, paths);

      expect(mockLogger.debug).toHaveBeenCalledWith(
        'PATHS[output]:',
        expect.any(Object)
      );
      expect(mockLogger.debug).toHaveBeenCalledWith(
        'PATHS[templates]:',
        expect.any(Object)
      );
    });
  });

  // ... more tests
});
