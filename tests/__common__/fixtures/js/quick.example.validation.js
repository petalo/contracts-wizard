/**
 * @file Validation script for explanation spans in test output
 *
 * This script checks the content of spans with class 'explanation'
 * and applies error styles if they contain invalid or ungenerated values.
 * It also validates specific helper outputs against expected formats and values.
 */

(function () {
  // Mock document for testing
  const document = {
    addEventListener: jest.fn(),
    querySelectorAll: jest.fn(),
    querySelector: jest.fn(),
    getElementById: jest.fn(),
    createElement: jest.fn(),
  };

  // Helper functions for validation
  const isValidISODate = (str) => {
    const isoDateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[+-]\d{2}:\d{2}$/;
    return isoDateRegex.test(str);
  };

  const isValidShortDate = (str) => {
    const shortDateRegex = /^\d{2}\/\d{2}\/\d{4}$/;
    return shortDateRegex.test(str);
  };

  const isValidLongDate = (str) => {
    const longDateRegex = /^[a-záéíóúñ]+, \d{2} de [a-záéíóúñ]+ de \d{4}$/i;
    return longDateRegex.test(str);
  };

  const isValidTime = (str) => {
    const timeRegex = /^\d{2}:\d{2}:\d{2}$/;
    return timeRegex.test(str);
  };

  // Expected values for test cases
  const expectedValues = {
    undefined_value: {
      value: undefined,
      error: 'Value is undefined',
    },
    empty_value: {
      value: '',
      error: 'Value is empty',
    },
    null_value: {
      value: null,
      error: 'Value is null',
    },
    raw_value: {
      value: '[[raw_value]]',
      error: 'Value was not processed',
    },
    'user.name': {
      value: 'John Doe',
      error: 'Expected value: John Doe',
    },
    'company.address.street': {
      value: '123 Main St',
      error: 'Expected value: 123 Main St',
    },
    'items.0': {
      value: 'First item',
      error: 'Expected value: First item',
    },
    status: {
      value: '1',
      error: 'Expected value: 1',
    },
  };

  document.addEventListener('DOMContentLoaded', function () {
    // Function to validate an explanation div
    /**
     * Validates an explanation div element
     *
     * Checks the content and attributes of an explanation div
     * and adds error classes if validation fails.
     *
     * @param {HTMLElement} explanationDiv - The div element to validate
     */
    function validateExplanation(explanationDiv) {
      // Get the data-field attribute from the explanation div
      const dataField = explanationDiv.getAttribute('data-field');

      // Find the span value within the explanation div
      const spanValue = explanationDiv.querySelector('span');

      // Check for unrendered markdown images using regex
      const unrenderedImageRegex = /!\[.*?\]\(.*?\)/;
      if (unrenderedImageRegex.test(explanationDiv.innerHTML)) {
        explanationDiv.classList.add('error');
        explanationDiv.textContent = 'Error: Image not rendered';
        return;
      }

      // Check for missing values
      if (spanValue && spanValue.classList.contains('missing-value')) {
        explanationDiv.classList.add('error');
        explanationDiv.textContent = `Error: Value is missing (${dataField})`;
        return;
      }
    }

    // Validate all explanations
    document.querySelectorAll('div.explanation').forEach(validateExplanation);

    // Add event listener for image load errors
    document.querySelectorAll('img').forEach((img) => {
      img.onerror = () => {
        const explanationDiv = img.nextElementSibling;
        if (
          explanationDiv &&
          explanationDiv.classList.contains('explanation')
        ) {
          explanationDiv.classList.add('error');
          explanationDiv.textContent = 'Error: Image failed to load';
        }
      };
    });
  });

  /**
   * Validates form input values against rules
   *
   * Checks form input values against validation rules
   * and displays appropriate error messages.
   */
  function validateForm() {
    // ... existing code ...
  }
})();
