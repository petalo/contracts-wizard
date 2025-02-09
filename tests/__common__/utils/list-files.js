/**
 * @file Test utilities for file listing
 */

const fs = require('fs/promises');
const path = require('path');

/**
 * Lists files in a directory with optional filtering
 * @param {string} dirPath - Directory path to list files from
 * @param {object} options - Listing options
 * @param {boolean} [options.includeDirs=false] - Include directories in results
 * @param {string[]} [options.extensions] - Filter by file extensions
 * @param {boolean} [options.includeHidden=false] - Include hidden files
 * @param {boolean} [options.followSymlinks=false] - Follow symbolic links
 * @returns {Promise<string[]>} List of file names
 */
async function listFiles(dirPath, options = {}) {
  if (!dirPath) {
    throw new Error('Directory path is required');
  }

  const {
    includeDirs = false,
    extensions = [],
    includeHidden = false,
    followSymlinks = false,
  } = options;

  const entries = await fs.readdir(dirPath);
  const results = [];

  for (const entry of entries) {
    if (!includeHidden && entry.startsWith('.')) {
      continue;
    }

    const filePath = path.join(dirPath, entry);
    const stats = followSymlinks
      ? await fs.stat(filePath)
      : await fs.lstat(filePath);

    if (stats.isSymbolicLink() && !followSymlinks) {
      continue;
    }

    if (stats.isDirectory()) {
      if (includeDirs) {
        results.push(entry);
      }
    } else if (stats.isFile()) {
      if (
        extensions.length === 0 ||
        extensions.some((ext) => entry.endsWith(ext))
      ) {
        results.push(entry);
      }
    }
  }

  return results;
}

module.exports = { listFiles };
