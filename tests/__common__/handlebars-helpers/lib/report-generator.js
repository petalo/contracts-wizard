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
const { formatDebugInfo, generateTableRows } = require('./html-utils');

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
  <link rel="stylesheet" href="https://cdn.datatables.net/1.13.7/css/dataTables.bootstrap5.min.css">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css">
  <style>${resources.css}</style>
</head>
<body>
  <div class="test-report">
    <div class="controls">
      <button class="toggle-debug" onclick="toggleDebug()">🔍 Show Debug Info</button>
    </div>

    <table class="test-table table" id="resultsTable">
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

  <script src="https://code.jquery.com/jquery-3.7.1.min.js"></script>
  <script src="https://cdn.datatables.net/1.13.7/js/jquery.dataTables.min.js"></script>
  <script src="https://cdn.datatables.net/1.13.7/js/dataTables.bootstrap5.min.js"></script>
  <script>
    // Initialize DataTables
    $(document).ready(function() {
      window.resultsTable = $('#resultsTable').DataTable({
        pageLength: 50,
        order: [[0, 'asc']],
        dom: '<"row"<"col-sm-12 col-md-6"l><"col-sm-12 col-md-6"f>>' +
             '<"row"<"col-sm-12"tr>>' +
             '<"row"<"col-sm-12 col-md-5"i><"col-sm-12 col-md-7"p>>',
        language: {
          search: "🔍 Filter:",
          lengthMenu: "Show _MENU_ tests per page",
          info: "Showing _START_ to _END_ of _TOTAL_ tests",
          infoEmpty: "No tests found",
          infoFiltered: "(filtered from _MAX_ total tests)",
          zeroRecords: "No matching tests found"
        }
      });
    });

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
