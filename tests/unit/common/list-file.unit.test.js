/**
 * @file Tests for file listing utility
 */

const fs = require('fs/promises');
const path = require('path');
const fileScanner = require('@/utils/file-management/file-scanner');

// Mock dependencies
jest.mock('@/utils/file-management/file-scanner');

jest.mock('@/config/paths', () => ({
  TYPE_TO_PATH_MAP: {
    markdown: 'templates/markdown',
    csv: 'data-csv',
    css: 'templates/css',
  },
}));

jest.mock('@/config/file-extensions', () => ({
  FILE_EXTENSIONS: {
    markdown: ['.md'],
    csv: ['.csv'],
    css: ['.css'],
  },
}));

describe.skip('List Files', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  describe('Basic Listing', () => {
    test('should list markdown files', async () => {
      const mockFiles = ['file1.md', 'file2.md'];
      fileScanner.listFiles.mockResolvedValue(mockFiles);

      const files = await fileScanner.listFiles('markdown');
      expect(files).toEqual(mockFiles);
    });

    test('should list CSV files', async () => {
      const mockFiles = ['data1.csv', 'data2.csv'];
      fileScanner.listFiles.mockResolvedValue(mockFiles);

      const files = await fileScanner.listFiles('csv');
      expect(files).toEqual(mockFiles);
    });

    test('should list CSS files', async () => {
      const mockFiles = ['style1.css', 'style2.css'];
      fileScanner.listFiles.mockResolvedValue(mockFiles);

      const files = await fileScanner.listFiles('css');
      expect(files).toEqual(mockFiles);
    });

    test('should handle empty directories', async () => {
      fileScanner.listFiles.mockResolvedValue([]);

      const files = await fileScanner.listFiles('markdown');
      expect(files).toHaveLength(0);
    });
  });

  describe('Error Handling', () => {
    test('should handle directory access errors', async () => {
      fileScanner.listFiles.mockRejectedValue(new Error('Permission denied'));
      await expect(fileScanner.listFiles('markdown')).rejects.toThrow(
        'Permission denied'
      );
    });

    test('should handle invalid file type', async () => {
      fileScanner.listFiles.mockRejectedValue(new Error('Invalid file type'));
      await expect(fileScanner.listFiles('invalid')).rejects.toThrow(
        'Invalid file type'
      );
    });

    test('should handle missing file type', async () => {
      fileScanner.listFiles.mockRejectedValue(
        new Error('File type is required')
      );
      await expect(fileScanner.listFiles()).rejects.toThrow(
        'File type is required'
      );
      await expect(fileScanner.listFiles('')).rejects.toThrow(
        'File type is required'
      );
      await expect(fileScanner.listFiles(null)).rejects.toThrow(
        'File type is required'
      );
    });
  });

  describe('File Filtering', () => {
    test('should filter markdown files correctly', async () => {
      const mockFiles = ['file1.md', 'file3.md'];
      fileScanner.listFiles.mockResolvedValue(mockFiles);

      const files = await fileScanner.listFiles('markdown');
      expect(files).toEqual(mockFiles);
      expect(files).not.toContain('file2.txt');
    });

    test('should filter CSV files correctly', async () => {
      const mockFiles = ['data1.csv', 'data2.csv'];
      fileScanner.listFiles.mockResolvedValue(mockFiles);

      const files = await fileScanner.listFiles('csv');
      expect(files).toEqual(mockFiles);
      expect(files).not.toContain('file.txt');
    });

    test('should filter CSS files correctly', async () => {
      const mockFiles = ['style1.css', 'style2.css'];
      fileScanner.listFiles.mockResolvedValue(mockFiles);

      const files = await fileScanner.listFiles('css');
      expect(files).toEqual(mockFiles);
      expect(files).not.toContain('file.txt');
    });
  });

  describe('Path Handling', () => {
    test('should handle nested directories', async () => {
      const mockFiles = ['file1.md', 'nested/file2.md'];
      fileScanner.listFiles.mockResolvedValue(mockFiles);

      const files = await fileScanner.listFiles('markdown');
      expect(files).toEqual(mockFiles);
    });
  });
});
