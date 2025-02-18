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

/**
 * Generate HTML table rows for test results
 * @param {string} groupName - Name of the test group
 * @param {object[]} tests - Array of test results
 * @returns {string} HTML table rows
 */
function generateTableRows(groupName, tests) {
  let rows = `<tr class="test-group">
<td colspan="8">${groupName}</td>
</tr>
`;

  for (const test of tests) {
    const expected = test.expected;
    const actualCode = test.result?.actual;
    const actualMarkdown = test.result?.markdown || test.result?.actual; // Fallback to actual if markdown not provided
    const passedCode = compareValues(expected, actualCode);
    const passedMarkdown = compareValues(expected, actualMarkdown);
    const statusCode = passedCode ? '✅ PASS' : '❌ FAIL';
    const statusMarkdown = passedMarkdown ? '✅ PASS' : '❌ FAIL';
    const statusCodeClass = passedCode ? 'status-pass' : 'status-fail';
    const statusMarkdownClass = passedMarkdown ? 'status-pass' : 'status-fail';

    rows += `<tr>
<td>${test.name}</td>
<td>${test.source || 'Direct'}</td>
<td><span class="code">${test.input}</span></td>
<td><span class="code">${expected}</span></td>
<td><span class="code">${actualCode}</span></td>
<td><span class="code">${actualMarkdown}</span></td>
<td class="${statusCodeClass}">${statusCode}</td>
<td class="${statusMarkdownClass}">${statusMarkdown}</td>
</tr>
`;
    /* eslint-disable */
    // Add debug info row
    const debugRow = `<tr class="debug-info">
<td colspan="8">
<div class="debug-details">
<div class="debug-section">
<div class="debug-section-title">Test Details</div>
<div class="debug-section-content">
<div class="comparison">
<div class="label">Template:</div>
<div class="value">${test.template}</div>
</div>
<div class="comparison">
<div class="label">Context:</div>
<div class="value">${JSON.stringify(test.context, null, 2)}</div>
</div>${
      test.source === 'CSV'
        ? `
<div class="comparison">
<div class="label">CSV Key:</div>
<div class="value">${test.input}</div>
</div>`
        : ''
    }
<div class="comparison">
<div class="label">Expected:</div>
<div class="value expected">
${expected}
<span class="type">(${typeof test.expected})</span>
</div>
<div class="label">Expected (raw):</div>
<div class="value raw expected">${escapeHtml(expected)}</div>
</div>
<div class="comparison">
<div class="label">Code:</div>
<div class="value ${passedCode ? 'expected' : 'actual'}">
${actualCode}
<span class="type">(${typeof test.result?.actual})</span>
</div>
<div class="label">Code (raw):</div>
<div class="value raw ${passedCode ? 'expected' : 'actual'}">${escapeHtml(actualCode)}</div>
</div>
<div class="comparison">
<div class="label">Markdown:</div>
<div class="value ${passedMarkdown ? 'expected' : 'actual'}">
${actualMarkdown}
<span class="type">(${typeof test.result?.markdown})</span>
</div>
<div class="label">Markdown (raw):</div>
<div class="value raw ${passedMarkdown ? 'expected' : 'actual'}">${escapeHtml(actualMarkdown)}</div>
</div>${
      !passedCode || !passedMarkdown
        ? `
<div class="comparison">
<div class="label">Length:</div>
<div class="value">expected=${expected.length}, code=${actualCode.length}, markdown=${actualMarkdown.length}</div>
<div class="label">Expected (chars):</div>
<div class="value">${Array.from(expected)
            .map(
              (c) =>
                `<span class="char-code">'</span>${c}<span class="char-code">'(${c.charCodeAt(0)})</span>`
            )
            .join('<span class="char-code">,</span>')}</div>
<div class="label">Code (chars):</div>
<div class="value">${Array.from(actualCode)
            .map(
              (c) =>
                `<span class="char-code">'</span>${c}<span class="char-code">'(${c.charCodeAt(0)})</span>`
            )
            .join('<span class="char-code">,</span>')}</div>
<div class="label">Markdown (chars):</div>
<div class="value">${Array.from(actualMarkdown)
            .map(
              (c) =>
                `<span class="char-code">'</span>${c}<span class="char-code">'(${c.charCodeAt(0)})</span>`
            )
            .join('<span class="char-code">,</span>')}</div>
</div>`
        : ''
    }
</div>
</div>
</div>
</td>
</tr>`;

    /* eslint-enable */
    rows += debugRow;
  }

  return rows;
}

/**
 * Normalizes a test value by:
 * - Trimming whitespace
 * - Removing newlines
 * - Normalizing quotes
 * @param {string} value The value to normalize
 * @returns {string} The normalized value
 */
function normalizeValue(value) {
  if (!value) return '';
  return value
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[""]/g, '"')
    .replace(/\n/g, '');
}

/**
 * Compares two values after normalization
 * @param {string} expected The expected value
 * @param {string} actual The actual value
 * @returns {boolean} True if values are equal after normalization
 */
function compareValues(expected, actual) {
  const normalizedExpected = normalizeValue(expected);
  const normalizedActual = normalizeValue(actual);
  return normalizedExpected === normalizedActual;
}

/**
 * Escapes HTML special characters
 * @param {string} str String to escape
 * @returns {string} Escaped string
 */
function escapeHtml(str) {
  if (!str) return '';
  const htmlEscapes = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  };
  return str.replace(/[&<>"']/g, (char) => htmlEscapes[char]);
}

module.exports = {
  cleanHtml,
  formatDebugInfo,
  compareHtml,
  generateTableRows,
  compareValues,
  escapeHtml,
};
