/**
 * @file Visual Test Results Script
 *
 * Manages the interactive functionality of the visual test results page,
 * including test status updates, debug information toggling, and failure exports.
 *
 * This script provides the core functionality for the visual test results interface,
 * handling user interactions, test result display, and debug information management.
 *
 * Functions:
 * - handleCellClick: Handles clicks on test case cells to show/hide debug info
 * - createExportButton: Creates and manages the failures export button
 * - exportFailures: Exports test failures to a downloadable file
 * - updateMdStatus: Updates test status and initializes UI components
 * - toggleDebug: Toggles visibility of debug information
 * - initializeTestCells: Initializes clickable cells in the test table
 * - captureMarkdownError: Captures and processes markdown errors
 *
 * Constants:
 * - testFailures: array - Stores test failure information
 * - debugMode: boolean - Tracks debug mode state
 *
 * Flow:
 * 1. Initialize global state (testFailures and debugMode)
 * 2. Set up event listeners for DOM and error events
 * 3. Initialize test cells and status on DOM load
 * 4. Handle user interactions (clicks, toggles)
 * 5. Process and display test results
 *
 * Error Handling:
 * - DOM errors: Logged to console with context
 * - Markdown errors: Captured and processed through error handler
 * - Missing elements: Gracefully handled with console warnings
 * - Event failures: Logged with detailed error information
 *
 * @module tests/common/handlebars-helpers/config/scripts
 * @requires document
 * @requires window
 * @requires console
 */

/* global document, window, Node, MutationObserver, Blob */

let testFailures = [];
let debugMode = false;

/**
 * Handles click events on test case cells
 *
 * Manages the showing/hiding of debug information when a test case cell is clicked.
 * Prevents event bubbling and updates the cell's visual state.
 *
 * @param {Event} event - The click event object
 * @example
 * // Basic usage
 * cell.onclick = handleCellClick;
 * // When clicked, toggles debug info and updates cell state
 *
 * // Event handling
 * handleCellClick(event);
 * // Logs: "Cell clicked: Test Case Name"
 * // Logs: "Debug row shown/hidden"
 */
function handleCellClick(event) {
  event.preventDefault();
  event.stopPropagation();
  const cell = event.currentTarget;
  console.log(`Cell clicked: ${cell.textContent.trim()}`);
  const debugRow = cell.parentElement.nextElementSibling;
  if (debugRow && debugRow.classList.contains('debug-info')) {
    const isShowing = debugRow.classList.contains('show');
    debugRow.classList.toggle('show');
    cell.dataset.showing = !isShowing;

    // Highlight differences in raw values
    if (!isShowing) {
      const debugContent = debugRow.querySelector('.debug-section-content');
      const expectedRaw = debugContent.querySelector('.value.raw.expected');
      const actualRaw = debugContent.querySelector('.value.raw.actual');

      if (expectedRaw && actualRaw) {
        const expectedText = expectedRaw.textContent;
        const actualText = actualRaw.textContent;

        if (expectedText !== actualText) {
          let i = 0;
          while (
            i < expectedText.length &&
            i < actualText.length &&
            expectedText[i] === actualText[i]
          ) {
            i++;
          }

          if (i < expectedText.length || i < actualText.length) {
            const expectedHighlight = document.createElement('span');
            expectedHighlight.className = 'mismatch';
            expectedHighlight.textContent = expectedText.slice(i);
            expectedRaw.textContent = expectedText.slice(0, i);
            expectedRaw.appendChild(expectedHighlight);

            const actualHighlight = document.createElement('span');
            actualHighlight.className = 'mismatch';
            actualHighlight.textContent = actualText.slice(i);
            actualRaw.textContent = actualText.slice(0, i);
            actualRaw.appendChild(actualHighlight);
          }
        }
      }
    }

    console.log(`Debug row ${isShowing ? 'hidden' : 'shown'}`);
  }
}

/**
 * Creates or updates the export failures button
 *
 * Manages the export failures button in the controls section,
 * creating it if there are failures and removing it when not needed.
 *
 * @example
 * // With failures
 * testFailures = [{ testName: 'Test 1', expected: 'a', actual: 'b' }];
 * createExportButton();
 * // Creates button with text "📥 Export Failures (1)"
 *
 * // Without failures
 * testFailures = [];
 * createExportButton();
 * // Removes existing button if present
 */
function createExportButton() {
  const controls = document.querySelector('.controls');
  if (!controls) return;
  const existingButton = document.querySelector('.export-failures');
  if (existingButton) existingButton.remove();
  if (testFailures.length > 0) {
    const exportButton = document.createElement('button');
    exportButton.className = 'export-button export-failures';
    exportButton.innerHTML = `📥 Export Failures (${testFailures.length})`;
    exportButton.onclick = exportFailures;
    controls.appendChild(exportButton);
  }
}

/**
 * Exports test failures to a downloadable file
 *
 * Creates a text file containing details of all test failures
 * and triggers its download.
 *
 * @example
 * // With failures
 * testFailures = [
 *   { testName: 'Test 1', expected: 'a', actual: 'b' }
 * ];
 * exportFailures();
 * // Creates and downloads 'test-failures-2024-03-08.log'
 *
 * // Without failures
 * testFailures = [];
 * exportFailures();
 * // Logs: "No failures to export"
 */
function exportFailures() {
  if (testFailures.length === 0) {
    console.log('No failures to export');
    return;
  }
  console.log(`Exporting ${testFailures.length} failures:`);
  console.table(testFailures);
  const content = testFailures
    .map(
      (failure, index) =>
        `Failure #${index + 1}\nTest: ${failure.testName}\nExpected: ${failure.expected}\nActual: ${failure.actual}\n----------------------------------------\n`
    )
    .join('\n');
  const blob = new Blob([content], { type: 'text/plain' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `test-failures-${new Date().toISOString().slice(0, 10)}.log`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}

/**
 * Updates test status and initializes UI components
 *
 * Evaluates test results, updates status indicators, and initializes
 * UI components like the export button and test cells.
 *
 * @example
 * // Basic usage
 * updateMdStatus();
 * // Updates all test statuses and initializes UI
 *
 * // With failures
 * // Some tests failing
 * updateMdStatus();
 * // Updates status cells and creates export button
 */
function updateMdStatus() {
  console.group('Test Results');
  console.log('Starting test evaluation...');
  testFailures = [];
  const rows = document.querySelectorAll(
    '.test-table tbody tr:not(.test-group)'
  );
  console.log(`Found ${rows.length} test rows to evaluate`);
  let totalTests = 0;
  let passedTests = 0;
  let failedTests = 0;
  let currentGroup = '';
  rows.forEach((row) => {
    const cells = row.querySelectorAll('td');
    if (cells.length < 8) {
      if (cells.length === 1 && cells[0].getAttribute('colspan') === '8') {
        currentGroup = cells[0].textContent.trim();
      }
      return;
    }
    totalTests++;
    const testName = cells[0].textContent.trim();
    const expectedCell = cells[3];
    const mdCell = cells[5];
    const statusMdCell = cells[7];
    const expected = expectedCell.textContent.trim();
    const actual = mdCell.textContent.trim();
    const passed = expected === actual;
    if (passed) {
      passedTests++;
      console.log(`✅ ${testName}: PASS`);
    } else {
      failedTests++;
      console.log(`❌ ${testName}: FAIL`);
      console.log('Expected:', expected);
      console.log('Actual:', actual);
      testFailures.push({
        testName,
        group: currentGroup,
        expected,
        actual,
      });
    }
    statusMdCell.className = passed ? 'status-pass' : 'status-fail';
    statusMdCell.textContent = passed ? '✅ PASS' : '❌ FAIL';
  });
  console.log('=============');
  console.log(`Total Tests : ${totalTests}`);
  console.log(`Passed      : ${passedTests}`);
  console.log(`Failed      : ${failedTests}`);
  console.log(
    `Success Rate: ${((passedTests / totalTests) * 100).toFixed(2)}%`
  );
  if (failedTests > 0) {
    console.group(`Failed Tests (${failedTests})`);
    console.table(testFailures);
    console.groupEnd();
  }
  console.groupEnd();
  createExportButton();
  initializeTestCells();
}

/**
 * Toggles debug information visibility
 *
 * Controls the visibility of debug information rows and updates
 * the UI to reflect the current debug mode state.
 *
 * @example
 * // Enable debug mode
 * toggleDebug();
 * // Shows debug rows and updates button text
 *
 * // Disable debug mode
 * toggleDebug();
 * // Hides debug rows and restores button text
 */
window.toggleDebug = function () {
  debugMode = !debugMode;
  console.log('Debug mode toggled:', debugMode);
  document.body.classList.toggle('show-debug', debugMode);
  const buttons = document.querySelectorAll('.toggle-debug');
  buttons.forEach((button) => {
    button.innerHTML = debugMode ? '🔍 Hide Debug Info' : '🔍 Show Debug Info';
  });
  const debugRows = document.querySelectorAll('.debug-info');
  debugRows.forEach((row) => {
    row.classList.toggle('show', debugMode);
  });
};

/**
 * Initializes clickable cells in the test table
 *
 * Sets up click handlers and visual indicators for cells
 * that can show debug information.
 *
 * @example
 * // Basic initialization
 * initializeTestCells();
 * // Initializes all eligible cells with click handlers
 *
 * // No table found
 * initializeTestCells();
 * // Logs warning: "Table not found"
 */
function initializeTestCells() {
  console.group('Initializing test cells');
  const table = document.querySelector('.test-table');
  if (!table) {
    console.warn('Table not found');
    console.groupEnd();
    return;
  }
  const cells = table.querySelectorAll(
    'tbody tr:not(.test-group):not(.debug-info) td:first-child'
  );
  console.log(`Found ${cells.length} clickable cells`);
  cells.forEach((cell, index) => {
    cell.style.cursor = 'pointer';
    cell.onclick = handleCellClick;
    console.log(`Cell ${index} initialized: ${cell.textContent.trim()}`);
  });
  console.groupEnd();
}

/**
 * Captures and processes markdown errors
 *
 * Handles markdown-related errors by capturing and formatting
 * them for display in the UI.
 *
 * @param {object} error - The error object to process
 * @param {string} [error.location] - Error location
 * @param {string} [error.message] - Error message
 * @param {string} [error.context] - Error context
 * @param {string} [error.source] - Error source
 * @param {string} [error.expected] - Expected value
 * @param {string} [error.actual] - Actual value
 *
 * @example
 * // Basic error
 * captureMarkdownError({
 *   message: 'Invalid markdown',
 *   context: 'Test case'
 * });
 * // Processes and displays error
 *
 * // Detailed error
 * captureMarkdownError({
 *   location: 'file.md',
 *   message: 'Syntax error',
 *   context: 'Parsing',
 *   source: '# Invalid',
 *   expected: '# Valid',
 *   actual: '# Invalid'
 * });
 * // Processes and displays detailed error
 */
function captureMarkdownError(error) {
  if (typeof window.addMarkdownError === 'function') {
    window.addMarkdownError({
      location: error.location || window.location.href,
      message: error.message || 'Unknown markdown error',
      context: error.context || document.title,
      source: error.source,
      expected: error.expected,
      actual: error.actual,
    });
  }
}

// Initialize event listeners
document.addEventListener('DOMContentLoaded', function () {
  console.log('🔄 DOMContentLoaded fired');
  try {
    const generatedAt = document.querySelector(
      'meta[name="generated-at"]'
    ).content;
    console.log(
      '📅 Test report generated at:',
      new Date(generatedAt).toLocaleString()
    );
    updateMdStatus();
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const errorElements = node.querySelectorAll(
                '.missing-value, .error-value, [data-markdown-error]'
              );
              errorElements.forEach((errorElement) => {
                captureMarkdownError({
                  location: errorElement.getAttribute('data-location'),
                  message: errorElement.textContent,
                  context: errorElement.getAttribute('data-context'),
                  source: errorElement.getAttribute('data-source'),
                  expected: errorElement.getAttribute('data-expected'),
                  actual: errorElement.getAttribute('data-actual'),
                });
              });
            }
          });
        }
      });
    });
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  } catch (error) {
    console.error('❌ Error in DOMContentLoaded:', error);
  }
});

window.addEventListener('error', (event) => {
  if (event.error && event.error.name === 'MarkdownError') {
    captureMarkdownError(event.error);
  }
});
