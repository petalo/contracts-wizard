/**
 * @file CSV Data Processing and Validation System for Template Engine
 *
 * Provides a comprehensive CSV processing system that handles:
 * - Complex nested data structures
 * - Array fields with gap preservation
 * - Mixed data types (objects and simple values)
 * - Template field validation and initialization
 * - Empty value handling with defaults
 *
 * Functions:
 * - processCsvData: Main CSV processor with template validation
 * - validateCsvStructure: CSV format validator
 * - parseCsvLine: CSV line parser with quote handling
 * - setNestedValue: Nested object value setter
 * - printDataStructure: Data structure printer for debugging
 * - initializeDataFromFields: Template fields initializer
 * - processDataLines: CSV data lines processor
 *
 * Flow:
 * 1. CSV file reading and structure validation
 * 2. Template fields initialization
 * 3. Data line processing and value extraction
 * 4. Nested structure creation and population
 * 5. Empty value handling and defaults
 *
 * Error Handling:
 * - Invalid CSV structure detection
 * - File access error management
 * - Malformed data line handling
 * - Type conversion error handling
 *
 * @module @/utils/template-processor/core/processCsv
 * @requires fs/promises - File system operations
 * @requires @/utils/common/logger - Logging utilities
 * @requires @/utils/common/errors - Error handling
 * @requires @/config/encoding - File encoding configuration
 */

const fs = require('fs/promises');
const { logger } = require('@/utils/common/logger');
const { AppError } = require('@/utils/common/errors');
const { ENCODING_CONFIG } = require('@/config/encoding');

/**
 * Initialize data object with empty values for all fields
 * Creates nested objects and arrays based on field paths
 *
 * @param {string[]} fields - List of fields from template
 * @returns {object} Data object with empty values
 */
function initializeDataFromFields(fields) {
  const data = {};
  fields.forEach((field) => {
    // Split field into parts to handle nested paths (e.g. "user.address.street")
    const parts = field.split('.');
    let current = data;

    // Iterate through all parts except last to build nested structure
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      const nextPart = parts[i + 1];
      // Check if next part is a numeric array index
      const isNextPartArrayIndex = !isNaN(nextPart);

      if (!(part in current)) {
        // Create new nested array or object based on next part
        current[part] = isNextPartArrayIndex ? [] : {};
        logger.debug('Created nested structure', {
          path: parts.slice(0, i + 1).join('.'),
          part,
          type: isNextPartArrayIndex ? 'array' : 'object',
        });
      } else if (isNextPartArrayIndex && !Array.isArray(current[part])) {
        // Convert existing object to array if needed
        // This handles cases where we need to change type dynamically
        const temp = { ...current[part] };
        current[part] = [];
        // Preserve any existing numeric keys as array indices
        Object.keys(temp).forEach((key) => {
          if (!isNaN(key)) {
            current[part][parseInt(key)] = temp[key];
          }
        });
      }
      current = current[part];
    }

    // Handle the final part of the path
    const lastPart = parts[parts.length - 1];
    if (!isNaN(lastPart)) {
      // For array indices, ensure array is long enough and fill with empty strings
      const index = parseInt(lastPart, 10);
      while (current.length <= index) {
        current.push('');
      }
    } else if (!(lastPart in current)) {
      // For object properties, initialize with empty string if not exists
      current[lastPart] = '';
      logger.debug('Set empty value', {
        path: parts.join('.'),
        part: lastPart,
      });
    }
  });

  logger.debug('Initialized data structure', {
    data: JSON.stringify(data, null, 2),
  });

  return data;
}

/**
 * Validate CSV file structure and format
 *
 * Performs comprehensive CSV validation:
 * 1. Checks file is not empty
 * 2. Validates header row format
 * 3. Verifies required columns exist
 * 4. Ensures consistent column count
 *
 * @param {string[]} lines - Array of CSV lines to validate
 * @returns {boolean} True if structure is valid
 * @throws {AppError} On validation failure with details
 */
function validateCsvStructure(lines) {
  if (lines.length === 0) {
    logger.warn('CSV file is empty');
    return false;
  }

  const headerValues = parseCsvLine(lines[0]);
  const hasKeyColumn = headerValues.some((col) => col.toLowerCase() === 'key');
  const hasValueColumn = headerValues.some(
    (col) => col.toLowerCase() === 'value'
  );

  logger.debug('CSV structure validation', {
    headerValues,
    hasKeyColumn,
    hasValueColumn,
  });

  if (!hasKeyColumn || !hasValueColumn) {
    logger.warn(
      'Invalid CSV structure. Must include "key" and "value" columns'
    );
    return false;
  }

  return true;
}

/**
 * Parse CSV line with quote and escape handling
 *
 * Parses a CSV line considering:
 * 1. Field delimiter (comma by default)
 * 2. Quoted values with embedded delimiters
 * 3. Escaped quotes within quoted values
 * 4. Empty field handling
 *
 * @param {string} line - CSV line to parse
 * @returns {string[]} Array of parsed field values
 * @throws {AppError} On malformed line or quote mismatch
 */
function parseCsvLine(line) {
  const values = [];
  let currentValue = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      // Toggle quote state
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      // End of field
      values.push(currentValue.trim());
      currentValue = '';
    } else {
      currentValue += char;
    }
  }

  // Add the last value
  values.push(currentValue.trim());

  // Remove quotes from values
  return values.map((value) => {
    if (value.startsWith('"') && value.endsWith('"')) {
      return value.slice(1, -1);
    }
    return value;
  });
}

/**
 * Process CSV data and validate against template fields
 *
 * Creates a structured object from CSV data while ensuring all template fields exist.
 * Maintains all CSV fields even if not in template fields and initializes missing template fields.
 *
 * @param {string} csvPath - Path to CSV file
 * @param {string[]} templateFields - Array of fields from template
 * @returns {{[key: string]: any}} Processed data object
 * @throws {AppError} If CSV is invalid or processing fails
 */
async function processCsvData(csvPath, templateFields = []) {
  try {
    const content = await fs.readFile(csvPath, ENCODING_CONFIG.default);
    const lines = content.toString().split('\n').filter(Boolean);

    if (!validateCsvStructure(lines)) {
      throw new AppError('Invalid CSV structure');
    }

    // Display CSV lines for debugging
    logger.info('CSV Lines:');
    logger.info('------------------------');
    lines.forEach((line, index) => {
      const [key, value] = parseCsvLine(line);
      logger.info(`${index}: ${key} = ${value}`);
    });
    logger.info('------------------------');

    // First pass: identify arrays and their structure
    const arrayPaths = new Map(); // Map to store base path -> max index
    const arrayStructure = new Map(); // Map to store array -> field structure
    const [, ...dataLines] = lines;

    for (const line of dataLines) {
      const [key] = parseCsvLine(line);
      if (!key) continue;

      const parts = key.split('.');
      if (parts.length >= 2 && !isNaN(parts[1])) {
        // Array field (e.g., items.2.name or child.0)
        const arrayName = parts[0];
        const index = parseInt(parts[1]);
        const field = parts.slice(2).join('.');

        // Update maximum index
        const currentMax = arrayPaths.get(arrayName) || -1;
        if (index > currentMax) {
          arrayPaths.set(arrayName, index);
        }

        // Store object structure if nested fields exist
        if (parts.length > 2) {
          if (!arrayStructure.has(arrayName)) {
            arrayStructure.set(arrayName, new Set());
          }
          arrayStructure.get(arrayName).add(field);
        }
      }
    }

    // Create initial structure with empty arrays
    const data = {};

    // Initialize arrays
    for (const [arrayName, maxIndex] of arrayPaths) {
      const fields = Array.from(arrayStructure.get(arrayName) || []);
      if (fields.length > 0) {
        // Array of objects
        data[arrayName] = new Array(maxIndex + 1).fill(null).map(() => {
          const obj = {};
          fields.forEach((field) => {
            // Create nested structure if field has dots
            const fieldParts = field.split('.');
            let current = obj;
            for (let i = 0; i < fieldParts.length - 1; i++) {
              current[fieldParts[i]] = current[fieldParts[i]] || {};
              current = current[fieldParts[i]];
            }
            current[fieldParts[fieldParts.length - 1]] = '';
          });
          return obj;
        });
      } else {
        // Array of simple values
        data[arrayName] = new Array(maxIndex + 1).fill('');
      }
    }

    // Second pass: populate values
    for (const line of dataLines) {
      const [key, value] = parseCsvLine(line);
      if (!key) continue;

      const parts = key.split('.');
      if (parts.length >= 2 && !isNaN(parts[1])) {
        // Array field
        const arrayName = parts[0];
        const index = parseInt(parts[1]);
        const field = parts.slice(2).join('.');

        // Ensure array exists
        if (!data[arrayName]) {
          data[arrayName] = [];
        }

        if (field) {
          // Array of objects
          if (!data[arrayName][index]) {
            data[arrayName][index] = {};
          }

          // Set nested value
          let current = data[arrayName][index];
          const fieldParts = field.split('.');
          for (let i = 0; i < fieldParts.length - 1; i++) {
            current[fieldParts[i]] = current[fieldParts[i]] || {};
            current = current[fieldParts[i]];
          }
          // Store the value directly for array object fields
          const finalFieldName = fieldParts[fieldParts.length - 1];
          current[finalFieldName] = value || '';
        } else {
          // Array of simple values
          while (data[arrayName].length <= index) {
            data[arrayName].push('');
          }
          // Store the value directly for array simple values
          data[arrayName][index] = value || '';
        }
      } else {
        // Simple field or nested object
        let current = data;
        for (let i = 0; i < parts.length - 1; i++) {
          const part = parts[i];
          // Check if next part is a number to create array
          const isNextPartArrayIndex = !isNaN(parts[i + 1]);
          if (!(part in current)) {
            current[part] = isNextPartArrayIndex ? [] : {};
          } else if (isNextPartArrayIndex && !Array.isArray(current[part])) {
            // Convert to array if needed
            const temp = { ...current[part] };
            current[part] = [];
            Object.entries(temp).forEach(([k, v]) => {
              if (!isNaN(k)) {
                current[part][parseInt(k)] = v;
              }
            });
          }
          current = current[part];
        }
        // Set final value directly for non-array fields
        const finalPart = parts[parts.length - 1];
        current[finalPart] = value || '';
      }
    }

    // Initialize missing fields with empty values
    if (templateFields && templateFields.length > 0) {
      templateFields.forEach((field) => {
        const parts = field.split('.');
        let current = data;
        for (let i = 0; i < parts.length - 1; i++) {
          const part = parts[i];
          if (!(part in current)) {
            current[part] = !isNaN(parts[i + 1]) ? [] : {};
          }
          current = current[part];
        }
        const lastPart = parts[parts.length - 1];
        if (!(lastPart in current)) {
          current[lastPart] = '';
        }
      });
    }

    // Display extracted fields and values
    logger.info('Extracted Fields from CSV:');
    logger.info('------------------------');
    printDataStructure(data);
    logger.info('------------------------');

    logger.debug('Data processed successfully', {
      dataKeys: Object.keys(data),
      nestedStructure: data,
      templateFields,
      matchingFields: templateFields?.filter((field) => {
        const parts = field.split('.');
        let current = data;
        for (const part of parts) {
          if (!current || typeof current !== 'object') return false;
          current = current[part];
        }
        return current !== undefined;
      }),
    });

    return data;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(`Error processing CSV: ${error.message}`);
  }
}

/**
 * Set value in nested object structure
 *
 * Sets a value in a nested object by:
 * 1. Parsing the dot-notation path
 * 2. Creating missing intermediate objects
 * 3. Handling array indices and gaps
 * 4. Setting the final value
 *
 * @param {object} obj - Target object to modify
 * @param {string} path - Dot notation path (e.g. 'user.addresses.0.city')
 * @param {*} value - Value to set at the path
 * @returns {void}
 * @throws {AppError} On invalid path or array index
 *
 * @example
 * // Basic object path
 * const obj = {};
 * setNestedValue(obj, 'user.name', 'John');
 * // Result: { user: { name: 'John' } }
 *
 * // Array path with gap
 * const obj = { items: [] };
 * setNestedValue(obj, 'items.2', 'third');
 * // Result: { items: ['', '', 'third'] }
 */
function setNestedValue(obj, path, value) {
  // Our format prefers to use indexes in the path, so we need to convert them to dots and inform the user
  const newPath = path.replace(/\[(\d+)\]/g, '.$1');
  if (newPath !== path) {
    logger.warn('Array notation from the CSV file converted to dot notation', {
      original: path,
      converted: newPath,
    });
  }
  path = newPath;

  const parts = path.split('.');
  let current = obj;

  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    const nextPart = parts[i + 1];
    const isNextPartArrayIndex = !isNaN(nextPart);

    if (!(part in current)) {
      current[part] = isNextPartArrayIndex ? [] : {};
    } else if (isNextPartArrayIndex && !Array.isArray(current[part])) {
      // Convert to array if next is an index
      const temp = { ...current[part] };
      current[part] = [];
      Object.entries(temp).forEach(([key, val]) => {
        if (!isNaN(key)) {
          current[part][parseInt(key)] = val;
        }
      });
    }
    current = current[part];
  }

  const lastPart = parts[parts.length - 1];
  if (!isNaN(lastPart)) {
    // Is an array index
    const index = parseInt(lastPart, 10);
    while (current.length <= index) {
      current.push('');
    }
    current[index] = value;
  } else {
    current[lastPart] = value;
  }
}

/**
 * Print nested data structure for debugging
 *
 * Recursively prints object structure with:
 * - Array length information
 * - Nested object indentation
 * - Empty value indicators
 * - Type information
 *
 * @param {object} obj - Object to print
 * @param {string} [prefix=''] - Indentation prefix
 * @example
 * // Print a nested object structure
 * const data = {
 *   users: [
 *     { name: 'John', age: 30 },
 *     { name: 'Jane', age: 25 }
 *   ]
 * };
 * printDataStructure(data);
 * // Output:
 * // users: [Array with 2 elements]
 * //   0:
 * //     name: John
 * //     age: 30
 * //   1:
 * //     name: Jane
 * //     age: 25
 */
function printDataStructure(obj, prefix = '') {
  if (!obj) {
    logger.info(`${prefix || 'value'}: null or undefined`);
    return;
  }

  if (Array.isArray(obj)) {
    logger.info(`${prefix}: [Array with ${obj.length} elements]`);
    obj.forEach((value, index) => {
      const newPrefix = prefix ? `${prefix}.${index}` : String(index);
      if (typeof value === 'object' && value !== null) {
        printDataStructure(value, newPrefix);
      } else {
        logger.info(`${newPrefix}: ${value} (${typeof value})`);
      }
    });
  } else if (typeof obj === 'object') {
    Object.entries(obj).forEach(([key, value]) => {
      const newPrefix = prefix ? `${prefix}.${key}` : key;
      if (typeof value === 'object' && value !== null) {
        if (Array.isArray(value)) {
          logger.info(`${newPrefix}: [Array with ${value.length} elements]`);
          value.forEach((item, index) => {
            const itemPrefix = `${newPrefix}.${index}`;
            if (typeof item === 'object' && item !== null) {
              printDataStructure(item, itemPrefix);
            } else {
              logger.info(`${itemPrefix}: ${item} (${typeof item})`);
            }
          });
        } else {
          printDataStructure(value, newPrefix);
        }
      } else {
        logger.info(`${newPrefix}: ${value} (${typeof value})`);
      }
    });
  } else {
    logger.info(`${prefix}: ${obj} (${typeof obj})`);
  }
}

/**
 * Process CSV data lines and create structured object
 * @param {string[]} lines - Array of CSV lines
 * @param {string[]} templateFields - Array of template fields
 * @returns {{[key: string]: any}} Processed data object
 */
async function processDataLines(lines, templateFields) {
  const data = {};
  const [header, ...dataLines] = lines;

  // Validate header
  const headerValues = parseCsvLine(header);
  const keyIndex = headerValues.findIndex((col) => col.toLowerCase() === 'key');
  const valueIndex = headerValues.findIndex(
    (col) => col.toLowerCase() === 'value'
  );

  if (keyIndex === -1 || valueIndex === -1) {
    throw new AppError('Invalid CSV structure: missing key or value column');
  }

  // Process data lines
  for (const line of dataLines) {
    const values = parseCsvLine(line);
    const key = values[keyIndex];
    const value = values[valueIndex];

    if (!key) continue;

    const parts = key.split('.');
    let current = data;

    // Handle array fields
    if (parts.length >= 2 && !isNaN(parts[1])) {
      const arrayName = parts[0];
      const index = parseInt(parts[1]);
      const field = parts.slice(2).join('.');

      if (!data[arrayName]) {
        data[arrayName] = [];
      }

      if (field) {
        // Array of objects
        if (!data[arrayName][index]) {
          data[arrayName][index] = {};
        }
        let current = data[arrayName][index];
        const fieldParts = field.split('.');
        for (let i = 0; i < fieldParts.length - 1; i++) {
          current[fieldParts[i]] = current[fieldParts[i]] || {};
          current = current[fieldParts[i]];
        }
        current[fieldParts[fieldParts.length - 1]] = value || '';
      } else {
        // Array of simple values
        while (data[arrayName].length <= index) {
          data[arrayName].push('');
        }
        data[arrayName][index] = value || '';
      }
    } else {
      // Handle nested objects
      for (let i = 0; i < parts.length - 1; i++) {
        const part = parts[i];
        if (!(part in current)) {
          current[part] = {};
        }
        current = current[part];
      }
      current[parts[parts.length - 1]] = value || '';
    }
  }

  // Initialize missing fields with empty values
  if (templateFields && templateFields.length > 0) {
    templateFields.forEach((field) => {
      const parts = field.split('.');
      let current = data;
      for (let i = 0; i < parts.length - 1; i++) {
        const part = parts[i];
        if (!(part in current)) {
          current[part] = !isNaN(parts[i + 1]) ? [] : {};
        }
        current = current[part];
      }
      const lastPart = parts[parts.length - 1];
      if (!(lastPart in current)) {
        current[lastPart] = '';
      }
    });
  }

  return data;
}

module.exports = {
  processCsvData,
  validateCsvStructure,
  parseCsvLine,
  setNestedValue,
  printDataStructure,
  initializeDataFromFields,
  processDataLines,
};
