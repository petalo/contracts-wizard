/**
 * @file Test Runner for Handlebars Helpers
 *
 * Executes tests for Handlebars helpers and collects results:
 * - Test execution and error handling
 * - Result collection and formatting
 * - Debug information gathering
 *
 * @module tests/common/handlebars-helpers/lib/test-runner
 */

// Setup module resolution
const path = require('path');
const moduleAlias = require('module-alias');

// Calculate paths and setup module resolution
const PROJECT_ROOT = path.resolve(__dirname, '../../../../');
const SRC_DIR = path.join(PROJECT_ROOT, 'src');

// Configure module aliases
moduleAlias.addAlias('@', SRC_DIR);

// Setup test environment
process.env.NODE_ENV = 'test';

// Setup mocks
const mockLogger = {
  debug: (...args) => console.log('[DEBUG]', ...args),
  info: (...args) => console.log('[INFO]', ...args),
  warn: (...args) => console.log('[WARN]', ...args),
  error: (...args) => console.error('[ERROR]', ...args),
};

const mockLocaleConfig = {
  locale: 'es',
  lang: 'es',
  timezone: 'Europe/Madrid',
  country: 'ES',
  fullLocale: 'es-ES',
};

// Mock required modules
const mockModules = {
  '@/utils/common/logger': { logger: mockLogger },
  '@/config/locale': { LOCALE_CONFIG: mockLocaleConfig },
};

// Register mocks in require.cache
Object.entries(mockModules).forEach(([modulePath, mockExports]) => {
  const resolvedPath = require.resolve(modulePath);
  require.cache[resolvedPath] = {
    id: resolvedPath,
    filename: resolvedPath,
    loaded: true,
    exports: mockExports,
  };
});

// Import dependencies
const handlebars = require('handlebars');
const { compareHtml } = require('./html-utils');

// Import helpers
const {
  formatDate,
  addYears,
  now,
  formatCurrency,
  getCurrencySymbol,
  formatNumber,
} = require('@/utils/template-processor/handlebars/helpers');

// Register helpers
function registerHelpers() {
  console.log('Registering Handlebars helpers...');

  // Date helpers
  handlebars.registerHelper('formatDate', formatDate);
  handlebars.registerHelper('addYears', addYears);
  handlebars.registerHelper('now', now);

  // Currency helpers
  handlebars.registerHelper('formatCurrency', formatCurrency);
  handlebars.registerHelper('currencySymbol', getCurrencySymbol);

  // Number helpers
  handlebars.registerHelper('formatNumber', formatNumber);

  // Basic comparison helpers
  handlebars.registerHelper('eq', function (a, b) {
    return a === b;
  });

  handlebars.registerHelper('if', function (conditional, options) {
    if (conditional) {
      return options.fn(this);
    } else {
      return options.inverse(this);
    }
  });

  console.log('Helpers registered successfully');
}

// Register helpers before running tests
registerHelpers();

/**
 * Run a single test case
 * @param {object} test - Test configuration
 * @returns {object} Test result with pass/fail status and debug info
 */
function runTest(test) {
  try {
    // Log test execution
    mockLogger.debug('Running test:', {
      filename: 'test-runner.js',
      context: '[test]',
      test: {
        name: test.name,
        template: test.template,
        context: test.context,
      },
    });

    // Compile template
    const template = handlebars.compile(test.template);

    // Execute template
    const actual = template(test.context);

    // Compare with expected
    const passed = compareHtml(test.expected, actual);

    // Create debug info
    const debugInfo = {
      template: test.template,
      context: JSON.stringify(test.context, null, 2),
      expected: test.expected,
      actual,
      diff: passed /* eslint-disable */
        ? null
        : {
            expectedLength: test.expected.length,
            actualLength: actual.length,
            expectedChars: Array.from(test.expected).map((c) =>
              c.charCodeAt(0)
            ),
            actualChars: Array.from(actual).map((c) => c.charCodeAt(0)),
          },
    }; /* eslint-enable */

    // Log test result
    mockLogger.debug('Test completed:', {
      filename: 'test-runner.js',
      context: '[test]',
      result: {
        name: test.name,
        passed,
        actual,
        expected: test.expected,
      },
    });

    return {
      passed,
      actual,
      debug: debugInfo,
    };
  } catch (error) {
    mockLogger.error('Test execution failed:', {
      filename: 'test-runner.js',
      context: '[test]',
      error: error.message,
      test: {
        name: test.name,
        template: test.template,
      },
    });

    return {
      passed: false,
      actual: error.message,
      debug: {
        error: error.message,
        stack: error.stack,
      },
    };
  }
}

/**
 * Run all tests in a test group
 * @param {object} testGroup - Group of tests to run
 * @returns {object[]} Array of test results
 */
function runTestGroup(testGroup) {
  return testGroup.map((test) => ({
    ...test,
    result: runTest(test),
  }));
}

/**
 * Run all test groups
 * @param {object} testGroups - All test groups to run
 * @returns {object} Test results organized by group
 */
function runAllTests(testGroups) {
  const results = {};

  for (const [groupName, tests] of Object.entries(testGroups)) {
    results[groupName] = runTestGroup(tests);
  }

  return results;
}

module.exports = {
  runTest,
  runTestGroup,
  runAllTests,
};
