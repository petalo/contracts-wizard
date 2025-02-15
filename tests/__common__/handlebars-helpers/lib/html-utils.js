/**
 * @file HTML Utilities for Test Report Generation
 *
 * Provides utilities for handling HTML content in test reports:
 * - HTML cleaning and comparison
 * - Safe HTML generation
 * - Debug information formatting
 *
 * @module tests/common/handlebars-helpers/lib/html-utils
 */

const cheerio = require('cheerio');

/**
 * Clean HTML tags from a string
 * @param {string} str - String to clean
 * @returns {string} Cleaned string
 */
function cleanHtml(str) {
  if (!str) return '';

  // Use cheerio for more robust HTML parsing
  const $ = cheerio.load(str);
  return $.text().trim();
}

/**
 * Format debug information for display
 * @param {object} debug - Debug information object
 * @returns {string} Formatted debug information
 */
function formatDebugInfo(debug) {
  const lines = [];

  if (debug.template) {
    lines.push(`Template: ${debug.template}`);
  }

  if (debug.context) {
    lines.push(`Context: ${debug.context}`);
  }

  if (debug.expected) {
    lines.push(`Expected: ${debug.expected}`);
  }

  if (debug.actual) {
    lines.push(`Actual (code): ${debug.actual}`);
  }

  if (debug.diff) {
    lines.push('\nCode Diff:');
    lines.push(`- Expected length: ${debug.diff.expectedLength}`);
    lines.push(`- Actual length: ${debug.diff.actualLength}`);
    lines.push(`- Expected chars: ${debug.diff.expectedChars}`);
    lines.push(`- Actual chars: ${debug.diff.actualChars}`);
  }

  if (debug.error) {
    lines.push('\nError:');
    lines.push(debug.error);
    if (debug.stack) {
      lines.push('Stack:');
      lines.push(debug.stack);
    }
  }

  return lines.join('\n');
}

/**
 * Compare HTML content for equality
 * @param {string} expected - Expected HTML content
 * @param {string} actual - Actual HTML content
 * @returns {boolean} True if contents are equal
 */
function compareHtml(expected, actual) {
  const cleanExpected = cleanHtml(expected);
  const cleanActual = cleanHtml(actual);
  return cleanExpected === cleanActual;
}

module.exports = {
  cleanHtml,
  formatDebugInfo,
  compareHtml,
};
