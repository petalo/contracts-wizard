#!/usr/bin/env node

/**
 * @file Documentation Update Script
 *
 * Automatically updates JSDoc documentation in JavaScript files to meet project standards.
 *
 * Functions:
 * - updateFileHeader: Updates file header documentation
 * - updateTypeAnnotations: Updates type annotations to match standards
 * - processFile: Processes a single file
 * - main: Main script execution
 *
 * Flow:
 * 1. Scan for JavaScript files
 * 2. Process each file
 * 3. Update documentation
 * 4. Save changes
 *
 * Error Handling:
 * - File read/write errors
 * - Invalid file formats
 * - Processing failures
 *
 * @module scripts/update-docs
 * @requires fs/promises
 * @requires glob
 */

const fs = require('fs').promises;
const glob = require('glob');

/**
 * Updates file header documentation
 *
 * @param {string} content - File content
 * @returns {string} Updated content
 */
function updateFileHeader(content) {
  // Replace @fileoverview with @file
  content = content.replace(/@fileoverview/g, '@file');

  // Add missing file header if none exists
  if (!content.includes('@file')) {
    const header = `/**
 * @file [Add file description]
 *
 * Functions:
 * - [List functions]
 *
 * Constants:
 * - [List constants]
 *
 * Flow:
 * 1. [Describe flow]
 *
 * Error Handling:
 * - [Describe error handling]
 */\n\n`;
    content = header + content;
  }

  return content;
}

/**
 * Updates type annotations to match standards
 *
 * @param {string} content - File content
 * @returns {string} Updated content
 */
function updateTypeAnnotations(content) {
  // Replace Object with object
  content = content.replace(/@param {Object}/g, '@param {object}');
  content = content.replace(/@returns {Object}/g, '@returns {object}');
  content = content.replace(/@constant {Object}/g, '@constant {object}');
  content = content.replace(/@property {Object}/g, '@property {object}');

  // Replace {Function} with function name
  content = content.replace(/@exports {Function} ([^-]+)/g, '@exports $1');

  // Replace @extends with @augments
  content = content.replace(/@extends/g, '@augments');

  // Replace @return with @returns
  content = content.replace(/@return\b/g, '@returns');

  return content;
}

/**
 * Processes a single file
 *
 * @param {string} filePath - Path to file
 * @returns {Promise<void>}
 */
async function processFile(filePath) {
  try {
    // eslint-disable-next-line no-console
    console.log(`Processing ${filePath}`);
    let content = await fs.readFile(filePath, 'utf8');

    // Update documentation
    content = updateFileHeader(content);
    content = updateTypeAnnotations(content);

    // Write updated content
    await fs.writeFile(filePath, content, 'utf8');
    // eslint-disable-next-line no-console
    console.log(`Updated ${filePath}`);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(`Failed to process ${filePath}:`, error);
  }
}

/**
 * Main script execution
 *
 * @returns {Promise<void>}
 */
async function main() {
  try {
    // Find all JavaScript files in src directory
    const files = glob.sync('src/**/*.js');

    // Process all files in parallel
    await Promise.all(files.map(processFile));
    // eslint-disable-next-line no-console
    console.log('Documentation update complete');
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Documentation update failed:', error);
    process.exit(1);
  }
}

// Run script
main();
