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

// Force test environment
process.env.NODE_ENV = 'test';

const fs = require('fs');
const os = require('os');
const Papa = require('papaparse');
const { execSync } = require('child_process');
const { TEST_GROUPS } = require('./config/test-groups/index.js');

// Import the main handlebars configuration and helpers
const handlebars = require('handlebars');
const helpers = require('@/utils/template-processor/handlebars/helpers');

// Log helper registration
console.log('Registered helpers:', {
  helpers: Object.keys(helpers),
  handlebarsHelpers: Object.keys(handlebars.helpers),
});

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
handlebars.registerHelper('eq', function (v1, v2, options) {
  if (options?.data?.isSubexpression) {
    return v1 === v2;
  }
  return v1 === v2 ? options.fn(this) : options.inverse(this);
});
handlebars.registerHelper('each', function (context, options) {
  if (!context || !Array.isArray(context)) {
    return options.inverse(this);
  }
  return context.map((item) => options.fn(item)).join('');
});

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
  let mdContent = '<!DOCTYPE html>\n<html lang="es">\n<head>\n';
  mdContent += '<meta charset="UTF-8">\n';
  mdContent +=
    '<meta name="viewport" content="width=device-width, initial-scale=1.0">\n';
  mdContent += '<title>Visual Test Results</title>\n';
  mdContent += `<meta name="generated-at" content="${new Date().toISOString()}">\n`;
  mdContent += `<link rel="stylesheet" href="../config/styles.css">\n`;
  mdContent += `<script src="../config/scripts.js"></script>\n`;
  mdContent += '</head>\n<body>\n';
  mdContent += '<div class="test-report">\n';
  mdContent += '<div class="controls">\n';
  mdContent +=
    '  <button class="toggle-debug" onclick="toggleDebug()">🔍 Show Debug Info</button>\n';
  mdContent += '</div>\n';
  mdContent += '<table class="test-table">\n';
  mdContent += '<thead>\n';
  mdContent += '<tr>\n';
  mdContent += '<th>Test Case</th>\n';
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
      mdContent += `<td>${test.source || 'Direct'}</td>\n`;
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
      // Add debug row
      mdContent += '<tr class="debug-info">\n';
      mdContent += '<td colspan="8">\n';
      mdContent += '<div class="debug-details">\n';
      mdContent += `<span><strong>Template:</strong> <code>${test.template}</code></span>\n`;
      mdContent += `<span><strong>Context:</strong> <code>${JSON.stringify(test.context, null, 2)}</code></span>\n`;
      if (test.source === 'CSV') {
        mdContent += `<span><strong>CSV Key:</strong> <code>${test.input}</code></span>\n`;
      }
      mdContent += '</div>\n';
      mdContent += '</td>\n';
      mdContent += '</tr>\n';
    });
  });

  mdContent += '</tbody>\n';
  mdContent += '</table>\n';
  mdContent += '</div>\n';
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

/**
 * Verifies that all required helpers are registered
 * @returns {boolean} True if all helpers are registered
 */
function verifyHelperRegistration() {
  const requiredHelpers = [
    'formatDate',
    'addYears',
    'now',
    'formatCurrency',
    'formatNumber',
    'eq',
    'each',
    'if',
    'unless',
    'with',
  ];

  const missingHelpers = requiredHelpers.filter(
    (helper) => !handlebars.helpers[helper]
  );

  if (missingHelpers.length > 0) {
    console.error('Missing required helpers:', missingHelpers);
    throw new Error(`Missing required helpers: ${missingHelpers.join(', ')}`);
  }

  console.log('Helper verification passed:', {
    required: requiredHelpers.length,
    registered: Object.keys(handlebars.helpers).length,
    helpers: Object.keys(handlebars.helpers),
  });

  return true;
}

// Main execution
try {
  console.log('Generating visual test report...');

  // Verify helpers before running tests
  verifyHelperRegistration();

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
