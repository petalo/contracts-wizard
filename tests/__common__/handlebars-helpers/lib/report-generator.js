/**
 * @file Report Generator for Handlebars Helper Tests
 *
 * Generates HTML/Markdown reports from test results:
 * - HTML report generation
 * - Markdown report generation
 * - Debug information formatting
 *
 * @module tests/common/handlebars-helpers/lib/report-generator
 */

const fs = require('fs/promises');
const path = require('path');
const { formatDebugInfo } = require('./html-utils');

/**
 * Read external resources (CSS/JS)
 * @returns {Promise<{css: string, js: string}>} Object containing CSS and JS content
 */
async function loadResources() {
  const cssPath = path.join(__dirname, '../config/styles.css');
  const jsPath = path.join(__dirname, '../config/scripts.js');

  const [css, js] = await Promise.all([
    fs.readFile(cssPath, 'utf8'),
    fs.readFile(jsPath, 'utf8'),
  ]);

  return {
    css,
    js,
  };
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
    const statusCode = test.result.passed ? '✅ PASS' : '❌ FAIL';
    const statusCodeClass = test.result.passed ? 'status-pass' : 'status-fail';

    rows += `<tr>
<td>${test.name}</td>
<td>${test.source}</td>
<td><code>${test.input}</code></td>
<td><code>${test.expected}</code></td>
<td><code>${test.result.actual}</code></td>
<td>${test.template}</td>
<td class="${statusCodeClass}">${statusCode}</td>
<td class="status-pending">⏳ PENDING</td>
</tr>
`;

    // Add debug info if test failed
    if (!test.result.passed) {
      rows += `<tr>
<td colspan="8">
<div class="debug-info">
${formatDebugInfo(test.result.debug)}
</div>
</td>
</tr>
`;
    }
  }

  return rows;
}

/**
 * Generate complete HTML report
 * @param {object} testResults - Test results by group
 * @param {object} resources - CSS and JS content
 * @returns {string} Complete HTML report
 */
function generateReport(testResults, resources) {
  let report = `<!-- markdownlint-disable -->
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Test Results</title>
  <style>${resources.css}</style>
</head>
<body>
  <div class="test-report">
    <div class="controls">
      <button class="toggle-debug" onclick="toggleDebug()">🔍 Show Debug Info</button>
    </div>

    <table class="test-table">
      <thead>
        <tr>
          <th>Test Case</th>
          <th>Source</th>
          <th>Input</th>
          <th>Expected</th>
          <th>Actual (code)</th>
          <th>Actual (md)</th>
          <th>Status (code)</th>
          <th>Status (md)</th>
        </tr>
      </thead>
      <tbody>`;

  // Add test results
  for (const [groupName, tests] of Object.entries(testResults)) {
    report += generateTableRows(groupName, tests);
  }

  report += `
      </tbody>
    </table>
  </div>

  <script>
    // Ensure functions are available in window scope
    window.updateMdStatus = ${resources.js.match(/function updateMdStatus\(\) \{[\s\S]*?\}/)[0]};
    window.toggleDebug = ${resources.js.match(/function toggleDebug\(\) \{[\s\S]*?\}/)[0]};
    window.exportFailures = ${resources.js.match(/function exportFailures\(\) \{[\s\S]*?\}/)[0]};
    window.cleanHtml = ${resources.js.match(/function cleanHtml\([\s\S]*?\) \{[\s\S]*?\}/)[0]};
    window.createExportButton = ${resources.js.match(/function createExportButton\(\) \{[\s\S]*?\}/)[0]};
    window.updateExportButton = ${resources.js.match(/function updateExportButton\(\) \{[\s\S]*?\}/)[0]};

    // Initialize variables
    window.testFailures = [];
    window.debugMode = false;

    // Run initialization when DOM is ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        console.log('🔄 DOMContentLoaded fired, running updateMdStatus...');
        window.updateMdStatus();
      });
    } else {
      console.log('🔄 Document ready, running updateMdStatus...');
      window.updateMdStatus();
    }
  </script>
</body>
</html>`;

  return report;
}

/**
 * Save report to file
 * @param {string} report - Generated report content
 * @param {string} outputPath - Path to save the report
 * @returns {Promise<void>}
 */
async function saveReport(report, outputPath) {
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, report, 'utf8');
  console.log(`Report generated at ${outputPath}`);
}

module.exports = {
  loadResources,
  generateReport,
  saveReport,
};
