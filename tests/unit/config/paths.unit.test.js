/**
 * @fileoverview Path Configuration Unit Tests
 *
 * Tests the path resolution and configuration functionality:
 * - Path resolution for absolute and relative paths
 * - Environment-based path configuration
 * - File type to directory mapping
 *
 * Functions:
 * - Mock setup for fs.promises
 * - Test suites for path resolution
 * - Test suites for path configuration
 * - Test suites for file type mapping
 *
 * Constants:
 * - Mock implementations for fs.access and fs.mkdir
 *
 * Flow:
 * 1. Setup environment and mocks
 * 2. Test path resolution logic
 * 3. Test path configuration
 * 4. Test file type mapping
 * 5. Cleanup environment
 *
 * Error Handling:
 * - Mock fs operations to prevent filesystem access
 * - Environment variable backup and restoration
 * - Module cache clearing between tests
 */

const path = require('path');

// Mock fs.promises to prevent actual filesystem operations
jest.mock('fs/promises', () => ({
  access: jest.fn().mockResolvedValue(undefined),
  mkdir: jest.fn().mockResolvedValue(undefined),
}));

describe('Path Configuration', () => {
  let originalEnv;

  beforeEach(() => {
    // Store original environment variables for restoration
    originalEnv = { ...process.env };

    // Force test environment to prevent directory creation
    process.env.NODE_ENV = 'test';

    // Clear module cache to ensure clean environment for each test
    jest.resetModules();

    // Reset mock call history
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Restore original environment variables
    process.env = originalEnv;
  });

  describe('resolvePath function', () => {
    it('should use default path when target path is not provided', () => {
      process.env.DIR_TEMPLATES = '';
      const { PATHS } = require('@/config/paths');

      expect(PATHS.templates).toBe(
        path.join(process.cwd(), 'templates', 'markdown')
      );
    });

    it('should use absolute path when provided', () => {
      const absolutePath = '/absolute/path/to/templates';
      process.env.DIR_TEMPLATES = absolutePath;
      const { PATHS } = require('@/config/paths');

      expect(PATHS.templates).toBe(absolutePath);
    });

    it('should join relative path with base dir', () => {
      const relativePath = 'relative/path/templates';
      process.env.DIR_TEMPLATES = relativePath;
      const { PATHS } = require('@/config/paths');

      expect(PATHS.templates).toBe(path.join(process.cwd(), relativePath));
    });
  });

  describe('PATHS configuration', () => {
    it('should handle all paths being absolute', () => {
      // Configure all paths as absolute paths
      process.env.DIR_OUTPUT = '/abs/path/output';
      process.env.DIR_TEMPLATES = '/abs/path/templates';
      process.env.DIR_CSS = '/abs/path/css';
      process.env.DIR_CSV = '/abs/path/csv';

      const { PATHS } = require('@/config/paths');

      // Verify paths are preserved as absolute
      expect(PATHS.output).toBe('/abs/path/output');
      expect(PATHS.templates).toBe('/abs/path/templates');
      expect(PATHS.css).toBe('/abs/path/css');
      expect(PATHS.csv).toBe('/abs/path/csv');
    });

    it('should handle mixed absolute and relative paths', () => {
      // Test mixture of absolute and relative paths
      process.env.DIR_OUTPUT = '/abs/path/output';
      process.env.DIR_TEMPLATES = 'relative/templates';

      const { PATHS } = require('@/config/paths');

      // Verify absolute path is preserved and relative is joined
      expect(PATHS.output).toBe('/abs/path/output');
      expect(PATHS.templates).toBe(
        path.join(process.cwd(), 'relative/templates')
      );
    });

    it('should handle all paths being relative', () => {
      // Configure all paths as relative
      process.env.DIR_OUTPUT = 'rel/output';
      process.env.DIR_TEMPLATES = 'rel/templates';

      const { PATHS } = require('@/config/paths');

      // Verify all paths are joined with base directory
      expect(PATHS.output).toBe(path.join(process.cwd(), 'rel/output'));
      expect(PATHS.templates).toBe(path.join(process.cwd(), 'rel/templates'));
    });
  });

  describe('TYPE_TO_PATH_MAP configuration', () => {
    it('should map file types to correct paths', () => {
      // Configure paths for different file types
      process.env.DIR_TEMPLATES = '/abs/path/templates';
      process.env.DIR_CSV = '/abs/path/csv';

      const { TYPE_TO_PATH_MAP } = require('@/config/paths');
      const { FILE_EXTENSIONS } = require('@/config/file-extensions');

      // Verify correct mapping of file types to directories
      expect(TYPE_TO_PATH_MAP[FILE_EXTENSIONS.types.TEMPLATE]).toBe(
        '/abs/path/templates'
      );
      expect(TYPE_TO_PATH_MAP[FILE_EXTENSIONS.types.CSV]).toBe('/abs/path/csv');
    });
  });
});
