/**
 * @file Test timeouts configuration
 *
 * This file configures timeouts for different types of tests.
 */

// Default timeout of 5 seconds for most tests
jest.setTimeout(5000);

// Longer timeout of 30 seconds for PDF generation tests
if (expect.getState().testPath.includes('pdf-generation')) {
  jest.setTimeout(30000);
}
