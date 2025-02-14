/**
 * @file Unit tests for filename generation functionality
 *
 * Tests cover:
 * - Basic filename generation
 * - Revision handling
 * - Suffix functionality
 * - Error cases
 * - Edge cases
 * - Suffix sanitization
 *
 * @module tests/unit/common/generate-filename.unit.test
 */

const fs = require('fs').promises;
const path = require('path');
const {
  generateFileName,
  sanitizeSuffix,
} = require('@/utils/common/generate-filename');

describe('Filename Generation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Use spyOn instead of direct mock assignment
    jest.spyOn(fs, 'access');
    jest.spyOn(fs, 'mkdir').mockResolvedValue(undefined);
  });

  describe('Basic Functionality', () => {
    test('should generate basic filenames without suffix', async () => {
      // Arrange
      const sourcePath = 'test.md';
      const outputDir = 'output';

      // Mock fs.access to simulate files don't exist
      fs.access.mockImplementation(() =>
        Promise.reject(new Error('File not found'))
      );

      // Act
      const result = await generateFileName(sourcePath, outputDir);

      // Assert
      expect(result.html).toBe(path.join(outputDir, 'test.html'));
      expect(result.pdf).toBe(path.join(outputDir, 'test.pdf'));
      expect(result.md).toBe(path.join(outputDir, 'test.md'));
    });

    test('should handle absolute paths', async () => {
      // Arrange
      const sourcePath = path.resolve('/absolute/path/test.md');
      const outputDir = path.resolve('/absolute/output');

      // Mock fs.access to simulate files don't exist
      fs.access.mockImplementation(() =>
        Promise.reject(new Error('File not found'))
      );

      // Act
      const result = await generateFileName(sourcePath, outputDir);

      // Assert
      expect(result.html).toBe(path.join(outputDir, 'test.html'));
      expect(result.pdf).toBe(path.join(outputDir, 'test.pdf'));
      expect(result.md).toBe(path.join(outputDir, 'test.md'));
    });
  });

  describe('Revision Handling', () => {
    test('should add revision number when files exist', async () => {
      // Arrange
      const sourcePath = 'test.md';
      const outputDir = 'output';

      // Mock fs.access to simulate base files exist but revision 1 doesn't
      let callCount = 0;
      fs.access.mockImplementation(() => {
        callCount++;
        // First 3 calls (base files) return success
        if (callCount <= 3) return Promise.resolve();
        // Next 3 calls (rev.1 files) return failure
        return Promise.reject(new Error('File not found'));
      });

      // Act
      const result = await generateFileName(sourcePath, outputDir);

      // Assert
      expect(result.html).toBe(path.join(outputDir, 'test.rev.1.html'));
      expect(result.pdf).toBe(path.join(outputDir, 'test.rev.1.pdf'));
      expect(result.md).toBe(path.join(outputDir, 'test.rev.1.md'));
    });

    test('should increment revision number until available', async () => {
      // Arrange
      const sourcePath = 'test.md';
      const outputDir = 'output';

      // Mock fs.access to simulate revisions 1 and 2 exist, but 3 doesn't
      let callCount = 0;
      fs.access.mockImplementation(() => {
        callCount++;
        // First 9 calls (base files + rev.1 + rev.2) return success
        if (callCount <= 9) return Promise.resolve();
        // Next calls (rev.3 files) return failure
        return Promise.reject(new Error('File not found'));
      });

      // Act
      const result = await generateFileName(sourcePath, outputDir);

      // Assert
      expect(result.html).toBe(path.join(outputDir, 'test.rev.3.html'));
      expect(result.pdf).toBe(path.join(outputDir, 'test.rev.3.pdf'));
      expect(result.md).toBe(path.join(outputDir, 'test.rev.3.md'));
    });
  });

  describe('Suffix Handling', () => {
    test('should add suffix to filenames when provided', async () => {
      // Arrange
      const sourcePath = 'test.md';
      const outputDir = 'output';
      const options = { suffix: 'client' };

      // Mock fs.access to simulate files don't exist
      fs.access.mockImplementation(() =>
        Promise.reject(new Error('File not found'))
      );

      // Act
      const result = await generateFileName(sourcePath, outputDir, options);

      // Assert
      expect(result.html).toBe(path.join(outputDir, 'test.client.html'));
      expect(result.pdf).toBe(path.join(outputDir, 'test.client.pdf'));
      expect(result.md).toBe(path.join(outputDir, 'test.client.md'));
    });

    test('should handle revisions with suffix correctly', async () => {
      // Arrange
      const sourcePath = 'test.md';
      const outputDir = 'output';
      const options = { suffix: 'client' };

      // Mock fs.access to simulate base files exist but revision 1 doesn't
      let callCount = 0;
      fs.access.mockImplementation(() => {
        callCount++;
        // First 3 calls (base files) return success
        if (callCount <= 3) return Promise.resolve();
        // Next calls (rev.1 files) return failure
        return Promise.reject(new Error('File not found'));
      });

      // Act
      const result = await generateFileName(sourcePath, outputDir, options);

      // Assert
      expect(result.html).toBe(path.join(outputDir, 'test.rev.1.client.html'));
      expect(result.pdf).toBe(path.join(outputDir, 'test.rev.1.client.pdf'));
      expect(result.md).toBe(path.join(outputDir, 'test.rev.1.client.md'));
    });

    test('should handle empty or invalid suffixes', async () => {
      // Arrange
      const sourcePath = 'test.md';
      const outputDir = 'output';
      const testCases = [
        { suffix: '' },
        { suffix: null },
        { suffix: undefined },
      ];

      // Mock fs.access to simulate files don't exist
      fs.access.mockImplementation(() =>
        Promise.reject(new Error('File not found'))
      );

      for (const options of testCases) {
        // Act
        const result = await generateFileName(sourcePath, outputDir, options);

        // Assert
        expect(result.html).toBe(path.join(outputDir, 'test.html'));
        expect(result.pdf).toBe(path.join(outputDir, 'test.pdf'));
        expect(result.md).toBe(path.join(outputDir, 'test.md'));
      }
    });
  });

  describe('Error Handling', () => {
    test('should throw error for invalid source path', async () => {
      // Arrange
      const invalidCases = [null, undefined, '', false, 0];

      for (const sourcePath of invalidCases) {
        // Act & Assert
        await expect(generateFileName(sourcePath, 'output')).rejects.toThrow(
          'Failed to generate filenames'
        );
      }
    });

    test('should throw error for invalid output directory', async () => {
      // Arrange
      const invalidCases = [null, undefined, '', false, 0];

      for (const outputDir of invalidCases) {
        // Act & Assert
        await expect(generateFileName('test.md', outputDir)).rejects.toThrow(
          'Failed to generate filenames'
        );
      }
    });

    test('should handle file system errors gracefully', async () => {
      // Arrange
      const sourcePath = 'test.md';
      const outputDir = 'output';

      // Mock fs.access to throw unexpected error
      fs.access.mockImplementation(() =>
        Promise.reject(new Error('Unexpected file system error'))
      );

      // Act & Assert
      await expect(generateFileName(sourcePath, outputDir)).rejects.toThrow(
        'Failed to generate filenames'
      );
    });
  });
});

describe('Suffix Sanitization', () => {
  test('should convert to lowercase and replace spaces with underscores', () => {
    expect(sanitizeSuffix('My Client Name')).toBe('my_client_name');
    expect(sanitizeSuffix('TEST FILE')).toBe('test_file');
  });

  test('should remove all special characters', () => {
    expect(sanitizeSuffix('Client!@#$%^&*()')).toBe('client');
    expect(sanitizeSuffix('My.File-Name')).toBe('myfilename');
    expect(sanitizeSuffix('test--file')).toBe('testfile');
  });

  test('should handle multiple spaces and convert to single underscore', () => {
    expect(sanitizeSuffix('My   Client  Name')).toBe('my_client_name');
    expect(sanitizeSuffix('test    file')).toBe('test_file');
    expect(sanitizeSuffix(' test   file  ')).toBe('test_file');
  });

  test('should handle empty or invalid input', () => {
    expect(sanitizeSuffix('')).toBe('');
    expect(sanitizeSuffix(null)).toBe('');
    expect(sanitizeSuffix(undefined)).toBe('');
    expect(sanitizeSuffix('!@#$%')).toBe('');
  });

  test('should handle numbers correctly', () => {
    expect(sanitizeSuffix('client123')).toBe('client123');
    expect(sanitizeSuffix('test 456 file')).toBe('test_456_file');
  });

  test('should handle mixed case, spaces and special characters', () => {
    expect(sanitizeSuffix('My!Client@Name#123')).toBe('myclientname123');
    expect(sanitizeSuffix('TEST-file.NAME')).toBe('testfilename');
    expect(sanitizeSuffix('Complex!@#  Example--123')).toBe(
      'complex_example_123'
    );
  });

  test('should handle extreme cases', () => {
    expect(sanitizeSuffix('   ')).toBe('');
    expect(sanitizeSuffix('!@#$%^&*()')).toBe('');
    expect(sanitizeSuffix('a!@#b$%^c')).toBe('abc');
    expect(sanitizeSuffix('test--suffix%ˆ&*&ˆ%$#@  hi')).toBe('test_suffix_hi');
  });
});
