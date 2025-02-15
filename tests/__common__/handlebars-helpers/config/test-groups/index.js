/**
 * @file Test Groups Index
 *
 * Combines all test groups into a single export:
 * - If/Else tests
 * - Equality tests
 * - Currency tests
 * - Date tests
 * - Date manipulation tests
 * - Array tests
 * - Object tests
 * - Value tests
 *
 * @module tests/common/handlebars-helpers/config/test-groups
 */

const fs = require('fs');
const path = require('path');

// Read and log currency.js content
const currencyPath = path.join(__dirname, 'currency.js');
console.log('Reading currency.js file:', {
  path: currencyPath,
  exists: fs.existsSync(currencyPath),
  content: fs.existsSync(currencyPath)
    ? fs.readFileSync(currencyPath, 'utf8')
    : 'File not found',
});

const IF_ELSE_TESTS = require('./if-else');
const EQUALITY_TESTS = require('./equality');
const CURRENCY_TESTS = require('./currency');
const DATE_TESTS = require('./date');
const DATE_MANIPULATION_TESTS = require('./date-manipulation');
const ARRAY_TESTS = require('./array');
const OBJECT_TESTS = require('./object');
const VALUE_TESTS = require('./value');

// Filter tests by source
const directTests = CURRENCY_TESTS.filter((test) => test.source === 'Direct');
const csvTests = CURRENCY_TESTS.filter((test) => test.source === 'CSV');
const noSourceTests = CURRENCY_TESTS.filter((test) => !test.source);

console.log('CURRENCY_TESTS analysis:', {
  total: CURRENCY_TESTS.length,
  direct: directTests.length,
  csv: csvTests.length,
  noSource: noSourceTests.length,
  noSourceTests: noSourceTests.map((test) => test.name),
});

const TEST_GROUPS = {
  'Basic If/Else Tests': IF_ELSE_TESTS,
  'Equality Tests': EQUALITY_TESTS,
  'Currency Formatting': CURRENCY_TESTS,
  'Date Formatting': DATE_TESTS,
  'Date Manipulation': DATE_MANIPULATION_TESTS,
  'Array Tests': ARRAY_TESTS,
  'Object Tests': OBJECT_TESTS,
  'Value Extraction': VALUE_TESTS,
};

console.log('TEST_GROUPS Currency Formatting:', {
  length: TEST_GROUPS['Currency Formatting'].length,
  names: TEST_GROUPS['Currency Formatting'].map((test) => test.name),
  firstTest: TEST_GROUPS['Currency Formatting'][0],
  lastTest:
    TEST_GROUPS['Currency Formatting'][
      TEST_GROUPS['Currency Formatting'].length - 1
    ],
  isArray: Array.isArray(TEST_GROUPS['Currency Formatting']),
  type: typeof TEST_GROUPS['Currency Formatting'],
});

module.exports = {
  TEST_GROUPS,
};
