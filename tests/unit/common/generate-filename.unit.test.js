/**
 * @file Unit tests for filename generation utility
 *
 * Tests cover:
 * 1. Basic filename generation
 * 2. Path handling
 * 3. Locale formatting
 * 4. Error handling
 * 5. Special characters
 * 6. Revision handling
 * 7. Timestamp formatting
 *
 * @module tests/unit/common/generate-filename
 * @requires fs
 * @requires path
 */

const fs = require('fs').promises;
const path = require('path');
const {
  getRelativePath,
} = require('@/utils/file-management/get-relative-path');
const {
  generateTimestampedFilename,
  generateRevisionedFilename,
  generateFileName,
  FILENAME_CONFIG,
} = require('@/utils/common/generate-filename');
const { AppError } = require('@/utils/common/errors');
const moment = require('moment-timezone');

// Mock fs/promises
jest.mock('fs/promises');

// Mock logger
jest.mock('@/utils/common/logger', () => ({
  logger: {
    debug: jest.fn().mockImplementation(() => {}),
    info: jest.fn().mockImplementation(() => {}),
    warn: jest.fn().mockImplementation(() => {}),
    error: jest.fn().mockImplementation(() => {}),
  },
}));

// Mock locale configuration to use UTC
jest.mock('@/config/locale', () => ({
  LOCALE_CONFIG: {
    timezone: 'UTC',
    lang: 'en',
    country: 'US',
    fullLocale: 'en-US',
  },
}));

// Mock moment-timezone to ensure consistent timezone behavior
jest.mock('moment-timezone', () => {
  const moment = jest.requireActual('moment-timezone');
  moment.tz.setDefault('UTC');
  return moment;
});

describe('Filename Generation', () => {
  let originalTZ;
  let originalEnv;
  let mockDate;

  beforeEach(() => {
    // Store original environment
    originalTZ = process.env.TZ;
    originalEnv = { ...process.env };

    // Set timezone and other environment variables
    process.env = {
      ...process.env,
      TZ: 'UTC', // Force UTC
      NODE_ENV: 'test',
    };

    // Reset all mocks
    jest.clearAllMocks();
    jest.resetAllMocks();

    // Mock Date to return a fixed value
    mockDate = new Date('2024-01-01T15:00:00.000Z');
    jest.spyOn(global, 'Date').mockImplementation(() => mockDate);

    // Setup fs mocks
    fs.access = jest.fn();
    fs.mkdir = jest.fn().mockResolvedValue(undefined);
  });

  afterEach(() => {
    // Restore original settings
    process.env = originalEnv;
    jest.restoreAllMocks();
  });

  describe('Basic Filename Generation', () => {
    test('should generate basic filename with timestamp', () => {
      const templatePath = 'test.md';
      const filename = generateTimestampedFilename(templatePath);
      expect(filename).toBe('test-2024-01-01-150000');
    });

    test('should handle file paths with directories', () => {
      const templatePath = 'templates/subfolder/test.md';
      const filename = generateTimestampedFilename(templatePath);
      expect(filename).toBe('test-2024-01-01-150000');
    });

    test('should handle empty input', () => {
      expect(() => generateTimestampedFilename(undefined)).toThrow(
        'Invalid path parameter'
      );
      expect(() => generateTimestampedFilename(null)).toThrow(
        'Invalid path parameter'
      );
      expect(() => generateTimestampedFilename('')).toThrow(
        'Invalid path parameter'
      );
    });
  });

  describe('Multi-format Filename Generation', () => {
    test('should generate HTML, PDF and Markdown paths', async () => {
      // Mock fs.access to simulate no existing files
      fs.access.mockRejectedValue(new Error('ENOENT'));

      const sourcePath = 'test.md';
      const outputDir = 'output';
      const result = await generateFileName(sourcePath, outputDir);

      // Use getRelativePath to normalize paths for comparison
      const expected = {
        html: getRelativePath(path.join(process.cwd(), outputDir, 'test.html')),
        pdf: getRelativePath(path.join(process.cwd(), outputDir, 'test.pdf')),
        md: getRelativePath(path.join(process.cwd(), outputDir, 'test.md')),
      };

      // Compare normalized paths
      expect({
        html: getRelativePath(result.html),
        pdf: getRelativePath(result.pdf),
        md: getRelativePath(result.md),
      }).toEqual(expected);
    });

    test('should handle file collisions with revisions', async () => {
      // Mock fs.access to simulate existing files for first revision
      fs.access
        .mockResolvedValueOnce() // Base files exist
        .mockResolvedValueOnce()
        .mockResolvedValueOnce()
        .mockResolvedValueOnce() // Rev 1 exists
        .mockResolvedValueOnce()
        .mockResolvedValueOnce()
        .mockRejectedValue(new Error('ENOENT')); // Rev 2 doesn't exist

      const sourcePath = 'test.md';
      const outputDir = 'output';
      const result = await generateFileName(sourcePath, outputDir);

      // Use getRelativePath to normalize paths for comparison
      const expected = {
        html: getRelativePath(
          path.join(
            process.cwd(),
            outputDir,
            `test${FILENAME_CONFIG.REVISION_PREFIX}2.html`
          )
        ),
        pdf: getRelativePath(
          path.join(
            process.cwd(),
            outputDir,
            `test${FILENAME_CONFIG.REVISION_PREFIX}2.pdf`
          )
        ),
        md: getRelativePath(
          path.join(
            process.cwd(),
            outputDir,
            `test${FILENAME_CONFIG.REVISION_PREFIX}2.md`
          )
        ),
      };

      // Compare normalized paths
      expect({
        html: getRelativePath(result.html),
        pdf: getRelativePath(result.pdf),
        md: getRelativePath(result.md),
      }).toEqual(expected);
    });
  });

  describe('Error Handling', () => {
    test('should handle missing source path', async () => {
      await expect(generateFileName(null, 'output')).rejects.toThrow(
        'Failed to generate output filenames'
      );
    });

    test('should handle missing output directory', async () => {
      await expect(generateFileName('test.md', null)).rejects.toThrow(
        'Failed to generate output filenames'
      );
    });

    test('should handle directory creation failure', async () => {
      fs.mkdir.mockRejectedValue(new Error('Permission denied'));

      await expect(generateFileName('test.md', 'output')).rejects.toThrow(
        'Failed to generate output filenames'
      );
    });
  });

  describe('Special Characters', () => {
    test('should handle spaces in filenames', () => {
      const filename = generateTimestampedFilename('my document.md');
      expect(filename).toBe('my document-2024-01-01-150000');
    });

    test('should handle special characters in filenames', () => {
      const templates = ['doc-1.md', 'doc_2.md', 'doc(3).md', 'doc[4].md'];
      templates.forEach((template) => {
        const baseName = template.split('.')[0];
        const filename = generateTimestampedFilename(template);
        expect(filename).toBe(`${baseName}-2024-01-01-150000`);
      });
    });

    test('should handle unicode characters in filenames', () => {
      const templates = ['文档.md', 'документ.md', 'αρχείο.md'];
      templates.forEach((template) => {
        const baseName = template.split('.')[0];
        const filename = generateTimestampedFilename(template);
        expect(filename).toBe(`${baseName}-2024-01-01-150000`);
      });
    });
  });
});
