/* global document, window, MutationObserver, Blob */

/**
 * @file Test Results Update Script
 *
 * Updates test results status in the visual test report
 */

let testFailures = [];
let debugMode = false;

/**
 * Toggle debug information visibility
 */
function toggleDebug() {
  debugMode = !debugMode;
  document.body.classList.toggle('show-debug', debugMode);

  const button = document.querySelector('.toggle-debug');
  if (button) {
    button.innerHTML = debugMode ? '🔍 Hide Debug Info' : '🔍 Show Debug Info';
  }

  // Update debug rows visibility
  const debugRows = document.querySelectorAll('.debug-info');
  debugRows.forEach((row) => {
    row.style.display = debugMode ? 'block' : 'none';
  });
}

/**
 * Create export failures button
 */
function createExportButton() {
  const controls = document.querySelector('.controls');
  if (!controls) return;

  const existingButton = document.querySelector('.export-failures');
  if (existingButton) {
    existingButton.remove();
  }

  const exportButton = document.createElement('button');
  exportButton.className = 'export-failures';
  exportButton.innerHTML = '📥 Export Failures';
  exportButton.onclick = exportFailures;
  controls.appendChild(exportButton);

  // Update visibility based on failures
  updateExportButton();
}

/**
 * Update export button state
 */
function updateExportButton() {
  const exportButton = document.querySelector('.export-failures');
  if (!exportButton) return;

  if (testFailures.length > 0) {
    exportButton.innerHTML = `📥 Export Failures (${testFailures.length})`;
    exportButton.style.display = 'flex';
  } else {
    exportButton.style.display = 'none';
  }
}

/**
 * Export failures to a downloadable file
 */
function exportFailures() {
  if (testFailures.length === 0) {
    console.log('No failures to export');
    return;
  }

  console.log(`Exporting ${testFailures.length} failures:`);
  console.table(
    testFailures.map((f) => ({
      test: f.testName,
      expected: f.expected,
      actual: f.actual,
    }))
  );

  const content = testFailures
    .map(
      (failure, index) =>
        `Failure #${index + 1}\n` +
        `Test: ${failure.testName}\n` +
        `Expected: ${failure.expected}\n` +
        `Actual: ${failure.actual}\n` +
        `Template: ${failure.template}\n` +
        '----------------------------------------\n'
    )
    .join('\n');

  // Log content to console for easy copy/paste
  console.log('\nFailures content:\n', content);

  try {
    // Create download element
    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `test-failures-${new Date().toISOString().slice(0, 10)}.log`;

    // Append, click and cleanup
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    console.log('Export completed successfully');
  } catch (error) {
    console.error('Error exporting failures:', error);
  }
}

/**
 * Clean HTML tags and normalize whitespace
 * @param {string} str - String to clean
 * @returns {string} Cleaned string
 */
function cleanHtml(str) {
  if (!str) return '';
  console.log('Cleaning HTML:', { input: str });
  const cleaned = str
    .replace(/<[^>]+>/g, '') // Remove HTML tags
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim(); // Remove leading/trailing whitespace
  console.log('Cleaned result:', { output: cleaned });
  return cleaned;
}

/**
 * Update the Status (md) column based on comparison
 */
function updateMdStatus() {
  console.group('Test Results');
  console.log('Starting test evaluation...');
  testFailures = []; // Reset failures array

  const table = document.querySelector('.test-table');
  if (!table) {
    console.warn('❌ Table not found, waiting...');
    console.groupEnd();
    return;
  }

  // Añadir botón de exportar si no existe
  createExportButton();

  const rows = table.querySelectorAll('tbody tr:not(.test-group)');
  console.log(`Found ${rows.length} test rows to evaluate`);

  let totalTests = 0;
  let passedTests = 0;
  let failedTests = 0;
  let currentGroup = '';

  rows.forEach((row, index) => {
    const cells = row.querySelectorAll('td');

    // Skip if not a test row
    if (cells.length < 8) {
      // Check if it's a group header
      if (cells.length === 1 && cells[0].getAttribute('colspan') === '8') {
        currentGroup = cells[0].textContent.trim();
        console.group(`Group: ${currentGroup}`);
      }
      return;
    }

    totalTests++;
    const testName = cells[0].textContent.trim();
    const expectedCell = cells[3];
    const mdCell = cells[5];
    const statusMdCell = cells[7];

    const codeElement = expectedCell.querySelector('code');
    const expectedValue = cleanHtml(
      codeElement ? codeElement.textContent : expectedCell.textContent
    );
    const mdValue = cleanHtml(mdCell.innerHTML);
    const template = cells[5].textContent.trim();

    // Compare and update status
    const passed = expectedValue === mdValue;
    if (passed) {
      passedTests++;
      console.log(`✅ ${testName}: PASS`);
    } else {
      failedTests++;
      console.group(`❌ ${testName}: FAIL`);
      console.log('Template:', template);
      console.log('Expected:', expectedValue);
      console.log('Actual  :', mdValue);

      // Log detailed comparison
      if (expectedValue.length !== mdValue.length) {
        console.log('Length mismatch:');
        console.log(`  Expected: ${expectedValue.length} chars`);
        console.log(`  Actual  : ${mdValue.length} chars`);
      }

      // Log character codes for debugging
      console.log('Character codes:');
      console.log(
        '  Expected:',
        Array.from(expectedValue)
          .map((c) => `${c}(${c.charCodeAt(0)})`)
          .join(' ')
      );
      console.log(
        '  Actual  :',
        Array.from(mdValue)
          .map((c) => `${c}(${c.charCodeAt(0)})`)
          .join(' ')
      );

      console.groupEnd();

      testFailures.push({
        testName,
        group: currentGroup,
        expected: expectedValue,
        actual: mdValue,
        template,
      });

      // Add debug info row
      const debugRow = document.createElement('tr');
      /* eslint-disable */
      debugRow.innerHTML = `
        <td colspan="8">
          <div class="debug-info">
            Group: ${currentGroup}
            Test: ${testName}
            
            Template: ${template}
            Expected: ${expectedValue}
            Actual: ${mdValue}
            
            Clean Expected: ${expectedValue}
            Clean Actual: ${mdValue}
            
            Length Expected: ${expectedValue.length}
            Length Actual: ${mdValue.length}
            
            Char codes:
            Expected: ${Array.from(expectedValue)
              .map((c) => `${c}(${c.charCodeAt(0)})`)
              .join(' ')}
            Actual  : ${Array.from(mdValue)
              .map((c) => `${c}(${c.charCodeAt(0)})`)
              .join(' ')}
          </div>
        </td>
      `;
      /* eslint-enable */
      row.parentNode.insertBefore(debugRow, row.nextSibling);
    }

    statusMdCell.className = passed ? 'status-pass' : 'status-fail';
    statusMdCell.textContent = passed ? '✅ PASS' : '❌ FAIL';
  });

  // Close any open group
  console.groupEnd();

  // Log test summary
  console.group('Test Summary');
  console.log('=============');
  console.log(`Total Tests : ${totalTests}`);
  console.log(`Passed      : ${passedTests}`);
  console.log(`Failed      : ${failedTests}`);
  console.log(
    `Success Rate: ${((passedTests / totalTests) * 100).toFixed(2)}%`
  );

  if (failedTests > 0) {
    console.group(`Failed Tests (${failedTests})`);
    console.table(
      testFailures.map((f) => ({
        group: f.group,
        test: f.testName,
        expected: f.expected,
        actual: f.actual,
      }))
    );
    console.groupEnd();
  }

  console.groupEnd();
  console.groupEnd();

  // Actualizar contador en el botón
  updateExportButton();
}

// Esperar a que el DOM esté completamente cargado
function init() {
  console.log('🚀 Initializing test results...');

  // Verificar que tenemos acceso a las funciones necesarias
  // prettier-ignore
  if (typeof updateMdStatus !== 'function') {
    console.error('❌ updateMdStatus is not available!', {
      type: typeof updateMdStatus,
      value: updateMdStatus,
    });
    return;
  }

  // Configurar MutationObserver para detectar cambios en el DOM
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        // Si se añaden nodos, verificar si la tabla está lista
        const table = document.querySelector('.test-table');
        if (table) {
          console.log('📋 Table found, running updateMdStatus...');
          try {
            updateMdStatus();
            console.log('✅ updateMdStatus completed successfully');
          } catch (error) {
            console.error('❌ Error running updateMdStatus:', error);
          }
        }
      }
    });
  });

  // Observar cambios en el body
  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  // Ejecutar updateMdStatus inmediatamente
  console.log('📋 Running initial updateMdStatus...');
  try {
    updateMdStatus();
    console.log('✅ Initial updateMdStatus completed successfully');
  } catch (error) {
    console.error('❌ Error running initial updateMdStatus:', error);
  }
}

// Asegurarnos de que el script se ejecuta en el momento correcto
if (document.readyState === 'loading') {
  console.log('🔄 Document still loading, waiting for DOMContentLoaded...');
  document.addEventListener('DOMContentLoaded', () => {
    console.log('🔄 DOMContentLoaded fired, initializing...');
    init();
  });
} else {
  console.log('🔄 Document already loaded, initializing immediately...');
  init();
}
