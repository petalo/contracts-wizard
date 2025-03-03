/**
 * @file Test logging utilities
 *
 * Provides specialized debug logging functionality for tests
 * that can be enabled/disabled via environment variables.
 *
 * @module tests/utils/test-logger
 */

const TEST_DEBUG = process.env.TEST_DEBUG === 'true';

/**
 * Logs debug information during test execution
 *
 * @param {string} message - The message to log
 * @param {any} [data] - Optional data to include
 */
function debugTest(message, data) {
  if (TEST_DEBUG) {
    console.log('\n[TEST DEBUG]', message);
    if (data !== undefined) {
      console.log(JSON.stringify(data, null, 2));
    }
    console.log(''); // Empty line for readability
  }
}

/**
 * Logs a mock function call history
 *
 * @param {string} name - Name of the mock
 * @param {jest.Mock} mockFn - The mock function
 */
function debugMock(name, mockFn) {
  if (TEST_DEBUG) {
    console.log(
      `\n[MOCK CALLS] ${name} called ${mockFn.mock.calls.length} times:`
    );
    mockFn.mock.calls.forEach((call, i) => {
      console.log(`Call ${i + 1}:`, call);
    });
    console.log(''); // Empty line for readability
  }
}

module.exports = {
  debugTest,
  debugMock,
};
