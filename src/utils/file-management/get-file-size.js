/**
 * @fileoverview File Size Management System
 *
 * Provides utilities for file size calculation and formatting:
 * - Asynchronous file size retrieval
 * - Size unit conversion (B, KB, MB, GB)
 * - Human-readable formatting
 * - Error handling for file access
 *
 * Functions:
 * - getFileSizeKB: Retrieves file size in kilobytes
 * - formatFileSize: Formats size with appropriate units
 * - calculateUnitSize: Converts between size units
 * - determineUnit: Selects appropriate size unit
 *
 * Flow:
 * 1. Validate file path
 * 2. Access file metadata
 * 3. Calculate raw size
 * 4. Convert to target unit
 * 5. Format result
 *
 * Error Handling:
 * - Invalid file path errors
 * - File access permission errors
 * - File not found errors
 * - Size calculation errors
 * - Unit conversion errors
 *
 * @module @/utils/common/getFileSize
 * @requires fs/promises - File system promises
 * @requires path - Path manipulation
 * @requires @/utils/common/errors - Error handling
 * @exports {Function} getFileSizeKB - Size retrieval in KB
 * @exports {Function} formatFileSize - Human-readable formatter
 *
 * @example
 * // Get file size in KB
 * const { getFileSizeKB } = require('@/utils/common/getFileSize');
 *
 * try {
 *   const size = await getFileSizeKB('document.pdf');
 *   console.log(`File size: ${size} KB`);
 * } catch (error) {
 *   console.error('Size calculation failed:', error);
 * }
 */

const fs = require('fs/promises');
const path = require('path');
const { AppError } = require('@/utils/common/errors');

/**
 * Size units configuration
 *
 * Defines size units and conversion factors for consistent
 * file size calculations and formatting across the application.
 *
 * Configuration values:
 * - KB_FACTOR: 1024 (binary kilobyte)
 *   Used for converting bytes to kilobytes
 *   Following the binary prefix standard (2^10)
 *
 * - PRECISION: 2 (decimal places)
 *   Controls the number of decimal places in formatted sizes
 *   Balances accuracy with readability
 *
 * Usage scenarios:
 * - File size conversion
 * - Storage capacity calculation
 * - Size limit validation
 * - Display formatting
 *
 * @constant {Object}
 * @property {number} KB_FACTOR - Kilobyte conversion factor (1024)
 * @property {number} PRECISION - Decimal places for formatting (2)
 *
 * @example
 * // Convert bytes to KB
 * const sizeKB = bytes / SIZE_CONFIG.KB_FACTOR;
 *
 * // Format with precision
 * const formatted = sizeKB.toFixed(SIZE_CONFIG.PRECISION);
 *
 * // Size limit check
 * const maxSizeKB = 1024; // 1MB in KB
 * if (sizeKB > maxSizeKB) {
 *   throw new Error('File too large');
 * }
 */
const SIZE_CONFIG = {
  KB_FACTOR: 1024,
  PRECISION: 2,
};

/**
 * Retrieves file size in kilobytes with retries
 *
 * Calculates file size through these steps:
 * 1. Validates file path
 * 2. Retrieves file stats with retries
 * 3. Converts size to KB
 * 4. Formats with precision
 *
 * @async
 * @param {string} filePath - Path to target file
 * @returns {Promise<string>} Size in KB with configured precision
 * @throws {AppError} On file access or calculation errors
 *
 * @example
 * try {
 *   const size = await getFileSizeKB('./data.csv');
 *   console.log(`Size: ${size} KB`);
 * } catch (error) {
 *   console.error('Size check failed:', error);
 * }
 */
async function getFileSizeKB(filePath) {
  const maxRetries = 3;
  const baseDelay = 100; // 100ms initial delay

  try {
    // Normalize and validate path
    const normalizedPath = path.normalize(filePath);

    let lastError;
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        // Get file stats
        const stats = await fs.stat(normalizedPath);
        // Convert to KB and format
        return (stats.size / SIZE_CONFIG.KB_FACTOR).toFixed(
          SIZE_CONFIG.PRECISION
        );
      } catch (error) {
        lastError = error;
        // Only retry if this is not the last attempt
        if (attempt < maxRetries - 1) {
          // Exponential backoff: 100ms, 200ms, 400ms
          const delay = baseDelay * Math.pow(2, attempt);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }
    throw lastError;
  } catch (error) {
    throw new AppError('Failed to get file size', 'FILE_SIZE_ERROR', {
      filePath,
      originalError: error,
    });
  }
}

module.exports = {
  getFileSizeKB,
  SIZE_CONFIG, // Exported for testing
};
