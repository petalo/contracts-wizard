/**
 * @fileoverview Test utilities for file scanning
 */

const fs = require('fs/promises');
const path = require('path');

/**
 * Validates and normalizes file patterns
 * @param {string|string[]} pattern - File pattern(s) to match
 * @returns {string[]} Normalized patterns
 */
function normalizePattern(pattern) {
  if (!pattern) {
    return [];
  }

  if (typeof pattern === 'string') {
    return [pattern];
  }

  if (Array.isArray(pattern)) {
    return pattern;
  }

  throw new Error('Invalid pattern type');
}

/**
 * Checks if a file matches any of the patterns
 * @param {string} filename - File name to check
 * @param {string[]} patterns - Patterns to match against
 * @returns {boolean} Whether the file matches
 */
function matchesPattern(filename, patterns) {
  if (patterns.length === 0) {
    return true;
  }
  return patterns.some((pattern) => {
    if (pattern.includes('*')) {
      const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
      return regex.test(filename);
    }
    return filename.endsWith(pattern);
  });
}

/**
 * Scans directory for files matching pattern
 * @param {string} dirPath - Directory to scan
 * @param {string|string[]|null} pattern - File pattern(s) to match
 * @returns {Promise<string[]>} Matching file paths
 */
async function scanFiles(dirPath, pattern) {
  if (!dirPath) {
    throw new Error('Directory path is required');
  }

  const patterns = normalizePattern(pattern);
  const results = [];

  const entries = await fs.readdir(dirPath);

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry);
    const stats = await fs.stat(fullPath);

    if (stats.isFile()) {
      if (matchesPattern(entry, patterns)) {
        results.push(entry);
      }
    }
  }

  return results;
}

module.exports = {
  scanFiles,
  normalizePattern,
  matchesPattern,
};
