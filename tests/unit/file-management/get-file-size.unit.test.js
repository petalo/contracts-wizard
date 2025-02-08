/**
 * @fileoverview Unit tests for getFileSize utility
 */

const fs = require('fs/promises');
const path = require('path');
const {
  getFileSizeKB,
  SIZE_CONFIG,
} = require('@/utils/file-management/get-file-size');
const { AppError } = require('@/utils/common/errors');

// Mock fs/promises
jest.mock('fs/promises');

describe.skip('getFileSizeKB', () => {
  // Mock file sizes for testing
  const mockSizes = {
    empty: 0,
    small: 512, // 0.5 KB
    oneKB: 1024, // 1 KB
    twoKB: 2048, // 2 KB
    twoAndHalfKB: 2560, // 2.5 KB
  };

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  it('should convert bytes to KB with correct precision', async () => {
    fs.stat.mockResolvedValue({ size: mockSizes.twoAndHalfKB });
    const result = await getFileSizeKB('test.file');
    expect(result).toBe((2.5).toFixed(SIZE_CONFIG.PRECISION));
  });

  it('should handle empty files', async () => {
    fs.stat.mockResolvedValue({ size: mockSizes.empty });
    const result = await getFileSizeKB('empty.file');
    expect(result).toBe((0).toFixed(SIZE_CONFIG.PRECISION));
  });

  it('should handle exactly 1KB files', async () => {
    fs.stat.mockResolvedValue({ size: mockSizes.oneKB });
    const result = await getFileSizeKB('1kb.file');
    expect(result).toBe((1).toFixed(SIZE_CONFIG.PRECISION));
  });

  it('should retry on temporary failures', async () => {
    // Fail twice, succeed on third try
    fs.stat
      .mockRejectedValueOnce(new Error('Temporary error 1'))
      .mockRejectedValueOnce(new Error('Temporary error 2'))
      .mockResolvedValueOnce({ size: mockSizes.small });

    const result = await getFileSizeKB('retry.file');
    expect(result).toBe((0.5).toFixed(SIZE_CONFIG.PRECISION));
    expect(fs.stat).toHaveBeenCalledTimes(3);
  });

  it('should throw AppError after max retries', async () => {
    const error = new Error('File access error');
    fs.stat.mockRejectedValue(error);

    await expect(getFileSizeKB('error.file')).rejects.toThrow(AppError);
    expect(fs.stat).toHaveBeenCalledTimes(3); // Max retries
  });

  it('should normalize file paths', async () => {
    fs.stat.mockResolvedValue({ size: mockSizes.small });
    await getFileSizeKB('folder/../file.txt');

    expect(fs.stat).toHaveBeenCalledWith(path.normalize('folder/../file.txt'));
  });

  it('should maintain precision specified in SIZE_CONFIG', async () => {
    fs.stat.mockResolvedValue({ size: mockSizes.twoAndHalfKB });
    const result = await getFileSizeKB('test.file');

    // Verify the number of decimal places matches PRECISION
    const decimalPlaces = result.split('.')[1]?.length || 0;
    expect(decimalPlaces).toBe(SIZE_CONFIG.PRECISION);
  });

  it('should handle file not found error', async () => {
    const error = new Error('ENOENT: File not found');
    error.code = 'ENOENT';
    fs.stat.mockRejectedValue(error);

    await expect(getFileSizeKB('nonexistent.file')).rejects.toThrow(AppError);
  });

  it('should handle permission denied error', async () => {
    const error = new Error('EACCES: Permission denied');
    error.code = 'EACCES';
    fs.stat.mockRejectedValue(error);

    await expect(getFileSizeKB('noaccess.file')).rejects.toThrow(AppError);
  });
});
