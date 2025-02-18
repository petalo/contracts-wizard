/**
 * @file Test Results Analyzer
 *
 * Analyzes visual test results and exports failures:
 * - Loads test results HTML
 * - Normalizes and compares test outputs
 * - Filters false positives
 * - Exports real failures
 *
 * Flow:
 * 1. Load test results page
 * 2. Extract test results
 * 3. Normalize and compare values
 * 4. Export actual failures
 *
 * Error Handling:
 * - Browser launch failures
 * - Page load timeouts
 * - DOM access errors
 * - File system errors
 *
 * @module tests/common/handlebars-helpers/export-failures
 * @requires puppeteer
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

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
 * Determines if a failure is a false positive
 * @param {object} failure The failure to check
 * @returns {boolean} True if the failure is a false positive
 */
function isFalsePositive(failure) {
  // Si los valores son iguales después de normalizar
  if (compareValues(failure.expected, failure.actual)) {
    return true;
  }

  // Si ambos valores están vacíos (null, undefined, etc)
  if (!normalizeValue(failure.expected) && !normalizeValue(failure.actual)) {
    return true;
  }

  return false;
}

(async () => {
  try {
    console.log('Launching browser...');
    const browser = await puppeteer.launch({
      headless: 'new',
    });

    console.log('Creating new page...');
    const page = await browser.newPage();

    console.log('Loading test results...');
    const testResultsPath = path.resolve(__dirname, 'output/test-results.html');
    const fileUrl = `file://${testResultsPath}`;
    console.log('Loading file:', fileUrl);
    await page.goto(fileUrl);

    // Esperar a que la página cargue y se procesen los tests
    console.log('Waiting for test table...');
    await page.waitForSelector('.test-table', { timeout: 5000 });

    // Verificar si hay fallos
    const failures = await page.evaluate(() => {
      // eslint-disable-next-line no-undef
      const failedRows = document.querySelectorAll('.status-fail');
      return Array.from(failedRows).map((row) => {
        const testRow = row.closest('tr');
        return {
          name: testRow.querySelector('td:first-child').textContent,
          expected: testRow.querySelector('td:nth-child(4)').textContent,
          actual: testRow.querySelector('td:nth-child(5)').textContent,
          group: testRow.previousElementSibling?.classList.contains(
            'test-group'
          )
            ? testRow.previousElementSibling.textContent
            : 'Unknown Group',
        };
      });
    });

    // Filtrar falsos positivos
    const realFailures = failures.filter(
      (failure) => !isFalsePositive(failure)
    );

    if (realFailures.length > 0) {
      console.log(
        `Found ${realFailures.length} real failures out of ${failures.length} total failures:`
      );

      // Agrupar fallos por grupo de test
      const groupedFailures = realFailures.reduce((groups, failure) => {
        const group = failure.group;
        if (!groups[group]) {
          groups[group] = [];
        }
        groups[group].push({
          name: failure.name,
          expected: normalizeValue(failure.expected),
          actual: normalizeValue(failure.actual),
        });
        return groups;
      }, {});

      console.log(JSON.stringify(groupedFailures, null, 2));

      // Guardar fallos en un archivo
      const failuresPath =
        'tests/__common__/handlebars-helpers/output/test-failures.json';
      fs.writeFileSync(failuresPath, JSON.stringify(groupedFailures, null, 2));
      console.log(`Failures saved to ${failuresPath}`);
    } else {
      if (failures.length > 0) {
        console.log(`All ${failures.length} failures were false positives!`);
      } else {
        console.log('No failures found!');
      }
    }

    await browser.close();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
})();
