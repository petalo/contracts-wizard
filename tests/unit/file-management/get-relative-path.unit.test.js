/**
 * @fileoverview Unit tests for getRelativePath utility
 */

const path = require('path');
const {
  getRelativePath,
} = require('@/utils/file-management/get-relative-path');

describe('getRelativePath', () => {
  const originalCwd = process.cwd;
  const mockProjectRoot = '/mock/project/root';

  beforeEach(() => {
    // Mock process.cwd() to return a consistent path for testing
    process.cwd = jest.fn().mockReturnValue(mockProjectRoot);
  });

  afterEach(() => {
    // Restore original process.cwd
    process.cwd = originalCwd;
  });

  it('should return empty string for null or undefined input', () => {
    expect(getRelativePath(null)).toBe('');
    expect(getRelativePath(undefined)).toBe('');
    expect(getRelativePath('')).toBe('');
  });

  it('should convert absolute path to project-relative path', () => {
    const absolutePath = path.join(mockProjectRoot, 'src', 'file.js');
    expect(getRelativePath(absolutePath)).toBe('src/file.js');
  });

  it('should handle nested paths correctly', () => {
    const absolutePath = path.join(
      mockProjectRoot,
      'src',
      'utils',
      'deep',
      'file.js'
    );
    expect(getRelativePath(absolutePath)).toBe('src/utils/deep/file.js');
  });

  it('should return original path if not under project root', () => {
    const outsidePath = '/different/path/file.js';
    expect(getRelativePath(outsidePath)).toBe(outsidePath);
  });

  it('should normalize Windows-style paths to forward slashes', () => {
    const windowsPath = 'C:\\mock\\project\\root\\src\\file.js';
    process.cwd = jest.fn().mockReturnValue('C:\\mock\\project\\root');
    expect(getRelativePath(windowsPath)).toBe('src/file.js');
  });

  it('should handle paths at project root level', () => {
    const rootLevelPath = path.join(mockProjectRoot, 'file.js');
    expect(getRelativePath(rootLevelPath)).toBe('file.js');
  });
});
