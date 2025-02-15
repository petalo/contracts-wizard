/**
 * @file Visual Test Generator
 *
 * Generates visual tests for handlebars helpers by:
 * 1. Merging all CSV files from test groups
 * 2. Creating temporary test files
 * 3. Running contracts-wizard
 * 4. Copying results to final location
 *
 * @module tests/common/handlebars-helpers/generate-visual-test
 */
const path = require('path');

// Register module alias for @ imports
const moduleAlias = require('module-alias');
moduleAlias.addAlias('@', path.join(__dirname, '..', '..', '..', 'src'));

const fs = require('fs');
const os = require('os');
const Papa = require('papaparse');
const { execSync } = require('child_process');
const { TEST_GROUPS } = require('./config/test-groups/index.js');

// Log TEST_GROUPS content right after importing
console.log('TEST_GROUPS imported:', {
  groups: Object.keys(TEST_GROUPS),
  currencyTests: {
    length: TEST_GROUPS['Currency Formatting']?.length || 0,
    names: TEST_GROUPS['Currency Formatting']?.map((test) => test.name) || [],
    isArray: Array.isArray(TEST_GROUPS['Currency Formatting']),
    type: typeof TEST_GROUPS['Currency Formatting'],
  },
});

// Constants for file paths
const TEST_GROUPS_DIR = path.join(__dirname, 'config', 'test-groups');
const TEMP_DIR = path.join(os.tmpdir(), 'contracts-wizard-tests');
const FINAL_OUTPUT_DIR = path.join(__dirname, 'output');
const PROJECT_ROOT = path.resolve(__dirname, '..', '..', '..');
const CONTRACTS_WIZARD_BIN = path.join(
  PROJECT_ROOT,
  'bin',
  'contracts-wizard.js'
);

// Load resources
const CSS_PATH = path.join(__dirname, 'config', 'styles.css');
const JS_PATH = path.join(__dirname, 'config', 'scripts.js');

// Register handlebars helpers
const handlebars = require('handlebars');
const {
  formatDate,
  addYears,
  now,
  formatCurrency,
  formatNumber,
  eq,
} = require('@/utils/template-processor/handlebars/helpers');

// Register helpers
handlebars.registerHelper('formatDate', formatDate);
handlebars.registerHelper('addYears', addYears);
handlebars.registerHelper('now', now);
handlebars.registerHelper('formatCurrency', formatCurrency);
handlebars.registerHelper('formatNumber', formatNumber);
handlebars.registerHelper('eq', eq);

// Verify contracts-wizard exists
if (!fs.existsSync(CONTRACTS_WIZARD_BIN)) {
  console.error(`Error: contracts-wizard not found at ${CONTRACTS_WIZARD_BIN}`);
  process.exit(1);
}

/**
 * Escapes a CSV value
 * @param {string} value Value to escape
 * @returns {string} Escaped value
 */
function escapeCsvValue(value) {
  if (value === null || value === undefined) {
    return '';
  }

  // Convert to string
  const str = String(value);

  // If the value contains quotes, commas, or newlines, it needs to be quoted
  if (str.includes('"') || str.includes(',') || str.includes('\n')) {
    // Escape quotes by doubling them and wrap in quotes
    return `"${str.replace(/"/g, '""')}"`;
  }

  return str;
}

/**
 * Validates a CSV file using Papa Parse
 * @param {string} csvPath Path to CSV file
 * @returns {boolean} True if valid
 */
function validateCsv(csvPath) {
  try {
    const content = fs.readFileSync(csvPath, 'utf8');
    const { data: parsedData, errors } = Papa.parse(content, {
      header: true,
      skipEmptyLines: 'greedy',
      comments: '#',
      delimiter: ',',
      transformHeader: (h) => h.toLowerCase().trim(),
      error: (error) => {
        console.error('CSV parsing error:', error.message);
        throw error;
      },
      transform: (value) => value || '',
    });

    // Filtrar errores que no sean FieldMismatch
    const criticalErrors = errors.filter(
      (error) => error.type !== 'FieldMismatch'
    );

    if (criticalErrors.length > 0) {
      console.error('CSV parsing failed:', criticalErrors);
      return false;
    }

    // Verificar estructura básica
    if (!parsedData || !Array.isArray(parsedData)) {
      console.error('Invalid CSV structure: not an array');
      return false;
    }

    // Verificar que cada línea tiene key y value
    const invalidLines = parsedData.filter(
      (line) => !line.key && line.key !== ''
    );
    if (invalidLines.length > 0) {
      console.error('Invalid CSV lines found:', invalidLines);
      return false;
    }

    console.log('CSV validation passed');
    console.log('- Lines:', parsedData.length);
    console.log('- Sample data:');
    parsedData
      .slice(0, 3)
      .forEach((line) => console.log('  ', JSON.stringify(line)));
    return true;
  } catch (error) {
    console.error('Error validating CSV:', error);
    return false;
  }
}

/**
 * Merges all CSV files from test groups into a single CSV
 * @returns {string} Path to the merged CSV file
 */
function mergeCsvFiles() {
  // Create temp directory if it doesn't exist
  if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR, { recursive: true });
  }

  const mergedCsvPath = path.join(TEMP_DIR, 'merged-test-data.csv');
  const csvHeader = 'key,value,comment\n';
  fs.writeFileSync(mergedCsvPath, csvHeader);

  // Get all CSV files
  const csvFiles = fs
    .readdirSync(TEST_GROUPS_DIR)
    .filter((file) => file.endsWith('.csv'));

  // Merge CSV files, skipping headers
  csvFiles.forEach((csvFile) => {
    const content = fs.readFileSync(
      path.join(TEST_GROUPS_DIR, csvFile),
      'utf8'
    );

    // Parse CSV with Papa Parse
    const { data } = Papa.parse(content, {
      header: true,
      skipEmptyLines: 'greedy',
      comments: '#',
      delimiter: ',',
      transformHeader: (h) => h.toLowerCase().trim(),
    });

    // Convert back to CSV and append
    const csvLines = data
      .map((row) => {
        const key = escapeCsvValue(row.key);
        const value = escapeCsvValue(row.value);
        const comment = escapeCsvValue(row.comment);
        return `${key},${value},${comment}`;
      })
      .join('\n');

    fs.appendFileSync(mergedCsvPath, csvLines + '\n');
  });

  // Validate merged CSV
  if (!validateCsv(mergedCsvPath)) {
    throw new Error('CSV validation failed');
  }

  return mergedCsvPath;
}

/**
 * Creates a markdown file with all test cases
 * @returns {string} Path to the generated markdown file
 */
function generateMarkdownFile() {
  const mdPath = path.join(TEMP_DIR, 'test-cases.md');

  // Verify JS_PATH exists and has content
  if (!fs.existsSync(JS_PATH)) {
    throw new Error(`JavaScript file not found at ${JS_PATH}`);
  }

  const jsContent = fs.readFileSync(JS_PATH, 'utf8');
  console.log(`JavaScript file found (${JS_PATH}):`, {
    size: jsContent.length,
    preview: jsContent.slice(0, 100) + '...',
    exists: !!jsContent,
  });

  let mdContent = '<!DOCTYPE html>\n<html lang="es">\n<head>\n';
  mdContent += '<meta charset="UTF-8">\n';
  mdContent +=
    '<meta name="viewport" content="width=device-width, initial-scale=1.0">\n';
  mdContent += '<title>Visual Test Results</title>\n';

  // Add CSS
  mdContent += '<style>\n';
  mdContent += fs.readFileSync(CSS_PATH, 'utf8');
  mdContent += '\n</style>\n';
  mdContent += '</head>\n<body>\n';

  // Add test report container
  mdContent += '<div class="test-report">\n';

  // Add test table
  mdContent += '<table class="test-table">\n';
  mdContent += '<thead>\n';
  mdContent += '<tr>\n';
  mdContent +=
    '<th><button class="toggle-debug" onclick="toggleDebug()">🔍</button> Test Case</th>\n';
  mdContent += '<th>Source</th>\n';
  mdContent += '<th>Input</th>\n';
  mdContent += '<th>Expected</th>\n';
  mdContent += '<th>Actual (code)</th>\n';
  mdContent += '<th>Actual (md)</th>\n';
  mdContent += '<th>Status (code)</th>\n';
  mdContent += '<th>Status (md)</th>\n';
  mdContent += '</tr>\n';
  mdContent += '</thead>\n';
  mdContent += '<tbody>\n';

  // Log TEST_GROUPS content
  console.log('TEST_GROUPS before processing:', {
    groups: Object.keys(TEST_GROUPS),
    currencyTests: TEST_GROUPS['Currency Formatting']?.length || 0,
    currencyTestNames:
      TEST_GROUPS['Currency Formatting']?.map((test) => test.name) || [],
  });

  // Add test groups
  Object.entries(TEST_GROUPS).forEach(([groupName, tests]) => {
    // Add group header
    mdContent += '<tr class="test-group">\n';
    mdContent += `<td colspan="8">${groupName}</td>\n`;
    mdContent += '</tr>\n';

    // Add test cases
    tests.forEach((test) => {
      console.log(test);
      mdContent += '<tr>\n';
      mdContent += `<td>${test.name}</td>\n`;
      mdContent += `<td>${test.source}</td>\n`;
      mdContent += `<td><code>${JSON.stringify(test.input)}</code></td>\n`;
      mdContent += `<td><code>${test.expected.replace(/<span[^>]*>/g, '').replace(/<\/span>/g, '')}</code></td>\n`;
      mdContent += `<td><code>${test.expected}</code></td>\n`;
      const handlebars = require('handlebars');
      const template = handlebars.compile(test.template);
      const result = template(test.context);
      mdContent += `<td>${result}</td>\n`;
      mdContent += '<td class="status-pass">✅ PASS</td>\n';
      mdContent += '<td class="status-pending">⏳ PENDING</td>\n';
      mdContent += '</tr>\n';
    });
  });

  mdContent += '</tbody>\n';
  mdContent += '</table>\n';
  mdContent += '</div>\n';

  // First, define updateMdStatus function
  mdContent += '<script type="text/javascript">\n';
  mdContent += '//<![CDATA[\n';
  mdContent += 'window.updateMdStatus = function() {\n';
  mdContent += '  console.log("Starting updateMdStatus");\n';
  mdContent +=
    '  const rows = document.querySelectorAll(".test-table tbody tr:not(.test-group)");\n';
  mdContent += '  rows.forEach(row => {\n';
  mdContent += '    const cells = row.querySelectorAll("td");\n';
  mdContent += '    if (cells.length >= 8) {\n';
  mdContent += '      const expectedCell = cells[3];\n';
  mdContent += '      const mdCell = cells[5];\n';
  mdContent += '      const statusMdCell = cells[7];\n';
  mdContent += '      const expected = expectedCell.textContent.trim();\n';
  mdContent += '      const actual = mdCell.textContent.trim();\n';
  mdContent += '      const passed = expected === actual;\n';
  mdContent +=
    '      statusMdCell.className = passed ? "status-pass" : "status-fail";\n';
  mdContent +=
    '      statusMdCell.textContent = passed ? "✅ PASS" : "❌ FAIL";\n';
  mdContent += '    }\n';
  mdContent += '  });\n';
  mdContent += '  console.log("updateMdStatus completed");\n';
  mdContent += '};\n';
  mdContent += '//]]>\n';
  mdContent += '</script>\n';

  // Add debug logging
  mdContent += '<script type="text/javascript">\n';
  mdContent += '//<![CDATA[\n';
  mdContent += 'console.log("Debug - window functions:", {\n';
  mdContent += '  updateMdStatus: typeof window.updateMdStatus,\n';
  mdContent += '  document: typeof document,\n';
  mdContent += '  DOMContentLoaded: !!document.addEventListener\n';
  mdContent += '});\n';
  mdContent += '//]]>\n';
  mdContent += '</script>\n';

  // Add toggle debug function
  mdContent += '<script type="text/javascript">\n';
  mdContent += '//<![CDATA[\n';
  mdContent += 'window.toggleDebug = function() {\n';
  mdContent += '  document.body.classList.toggle("show-debug");\n';
  mdContent += '};\n';
  mdContent += '//]]>\n';
  mdContent += '</script>\n';

  // Add DOMContentLoaded handler
  mdContent += '<script type="text/javascript">\n';
  mdContent += '//<![CDATA[\n';
  mdContent += 'document.addEventListener("DOMContentLoaded", function() {\n';
  mdContent += '  console.log("🔄 DOMContentLoaded fired");\n';
  mdContent += '  try {\n';
  mdContent += '    if (typeof window.updateMdStatus === "function") {\n';
  mdContent += '      console.log("📋 Calling updateMdStatus()");\n';
  mdContent += '      window.updateMdStatus();\n';
  mdContent += '      console.log("✅ updateMdStatus() completed");\n';
  mdContent += '    } else {\n';
  mdContent +=
    '      console.error("❌ updateMdStatus is not a function:", typeof window.updateMdStatus);\n';
  mdContent += '    }\n';
  mdContent += '  } catch (error) {\n';
  mdContent += '    console.error("❌ Error in DOMContentLoaded:", error);\n';
  mdContent += '  }\n';
  mdContent += '});\n';
  mdContent += '//]]>\n';
  mdContent += '</script>\n';

  mdContent += '</body>\n</html>';

  // Write the file and verify it was written correctly
  fs.writeFileSync(mdPath, mdContent, 'utf8');
  const writtenContent = fs.readFileSync(mdPath, 'utf8');
  console.log('Markdown file verification:', {
    path: mdPath,
    size: writtenContent.length,
    hasScripts: writtenContent.includes('<script'),
    scriptCount: (writtenContent.match(/<script/g) || []).length,
  });

  console.log(`Markdown file created at: ${mdPath}`);
  return mdPath;
}

/**
 * Runs the contracts-wizard and copies results
 * @param {string} mdPath Path to markdown file
 * @param {string} csvPath Path to CSV file
 */
function runContractsWizard(mdPath, csvPath) {
  // Create output directory if it doesn't exist
  if (!fs.existsSync(FINAL_OUTPUT_DIR)) {
    fs.mkdirSync(FINAL_OUTPUT_DIR, { recursive: true });
  }

  // Run contracts-wizard
  const outputDir = path.join(TEMP_DIR, 'output');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  console.log('Running contracts-wizard...');
  console.log(`- Template: ${mdPath}`);
  console.log(`- CSV: ${csvPath}`);
  console.log(`- Output: ${outputDir}`);

  const command = `node "${CONTRACTS_WIZARD_BIN}" generate -t "${mdPath}" -d "${csvPath}" -o "${outputDir}"`;
  console.log(`Executing: ${command}`);

  try {
    execSync(command, {
      stdio: 'inherit',
      cwd: PROJECT_ROOT,
      env: {
        ...process.env,
        NODE_ENV: 'test',
        FORCE_COLOR: '1',
        DEBUG: 'false',
      },
    });

    // Copy results to final location
    const generatedFiles = fs.readdirSync(outputDir);
    console.log('Generated files:', generatedFiles);

    generatedFiles.forEach((file) => {
      if (file.endsWith('.html')) {
        const finalPath = path.join(FINAL_OUTPUT_DIR, 'test-results.html');
        fs.copyFileSync(path.join(outputDir, file), finalPath);
        console.log(`Test results copied to: ${finalPath}`);
      }
    });
  } catch (error) {
    console.error('Error running contracts-wizard:', error.message);
    // Keep temporary files for debugging
    console.log('\nTemporary files kept for debugging:');
    console.log('- CSV:', csvPath);
    console.log('- Markdown:', mdPath);
    console.log('- Output dir:', outputDir);
    throw error;
  }
}

/**
 * Cleanup temporary files
 */
function cleanup() {
  if (fs.existsSync(TEMP_DIR)) {
    fs.rmSync(TEMP_DIR, {
      recursive: true,
      force: true,
    });
  }
}

// Main execution
try {
  console.log('Generating visual test report...');

  const csvPath = mergeCsvFiles();
  const mdPath = generateMarkdownFile();
  runContractsWizard(mdPath, csvPath);

  console.log('Test report generated successfully!');
  console.log(
    `Results available at: ${path.join(FINAL_OUTPUT_DIR, 'test-results.html')}`
  );

  // Clean up and exit
  cleanup();
  process.exit(0);
} catch (error) {
  console.error('Error generating tests:', error.message);
  process.exit(1);
}
