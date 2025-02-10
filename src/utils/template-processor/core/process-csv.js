/**
 * @file Provides a comprehensive CSV data processing system for template engine
 * that handles complex nested data structures, array fields, mixed data types,
 * template validation, and empty value handling.
 *
 * Functions:
 * - processCsvData: Process CSV data and validate against template fields
 * - validateCsvStructure: Validate CSV file structure and format
 * - parseCsvLine: Parse CSV line with quote and escape handling
 * - setNestedValue: Set value in nested object structure
 * - printDataStructure: Print nested data structure for debugging
 * - initializeDataFromFields: Initialize data object with empty values
 * - processDataLines: Process CSV data lines and create structured object
 *
 * Constants:
 * - ENCODING_CONFIG: object - File encoding configuration for CSV processing
 *
 * Flow:
 * 1. CSV file reading and structure validation
 * 2. Template fields initialization with empty values
 * 3. Data line parsing and value extraction
 * 4. Nested structure creation and population
 * 5. Array and object handling with gap preservation
 * 6. Empty value handling with defaults
 *
 * Error Handling:
 * - Invalid CSV structure: Throws AppError with structure validation details
 * - File access error: Throws AppError with file operation details
 * - Malformed line: Throws AppError with line parsing details
 * - Type conversion error: Throws AppError with conversion details
 * - Missing columns: Throws AppError if key or value columns are missing
 *
 * @module @/utils/template-processor/core/processCsv
 * @requires fs/promises - File system operations for async file handling
 * @requires @/utils/common/logger - Logging utilities for operation tracking
 * @requires @/utils/common/errors - Custom error handling and AppError class
 * @requires @/config/encoding - File encoding configuration settings
 */

const fs = require('fs/promises');
const { logger } = require('@/utils/common/logger');
const { AppError } = require('@/utils/common/errors');
const { ENCODING_CONFIG } = require('@/config/encoding');

/**
 * Initialize data object with empty values for all fields
 *
 * Creates a nested object structure based on field paths, handling both
 * array indices and object properties. Preserves array gaps and maintains
 * proper data types.
 *
 * @function initializeDataFromFields
 * @param {string[]} fields - List of fields from template
 * @returns {Record<string,*>} Data object with empty values
 * @example
 * // Basic object structure
 * const data = initializeDataFromFields(['name', 'age']);
 * // returns: { name: '', age: '' }
 *
 * // Nested object structure
 * const data = initializeDataFromFields(['user.name', 'user.age']);
 * // returns: { user: { name: '', age: '' } }
 *
 * // Array structure
 * const data = initializeDataFromFields(['items.0', 'items.2']);
 * // returns: { items: ['', '', ''] }
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
 * Performs comprehensive validation of CSV file structure including
 * header format, required columns, and data consistency.
 *
 * @function validateCsvStructure
 * @param {string[]} lines - Array of CSV lines to validate
 * @returns {boolean} True if structure is valid
 * @throws {AppError} On validation failure with details
 * @example
 * // Valid CSV structure
 * const isValid = validateCsvStructure(['key,value', 'name,John']);
 * // returns: true
 *
 * // Invalid CSV structure (missing columns)
 * const isValid = validateCsvStructure(['invalid,csv', 'no,key,column']);
 * // throws: AppError('Invalid CSV structure')
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
 * Parses a CSV line considering field delimiters, quoted values,
 * escaped quotes, and empty fields. Handles complex cases like
 * embedded delimiters and multi-line values.
 *
 * @function parseCsvLine
 * @param {string} line - CSV line to parse
 * @returns {string[]} Array of parsed field values
 * @throws {AppError} On malformed line or quote mismatch
 * @example
 * // Basic parsing
 * const fields = parseCsvLine('name,John');
 * // returns: ['name', 'John']
 *
 * // Quoted values with commas
 * const fields = parseCsvLine('address,"123 Main St, Apt 4"');
 * // returns: ['address', '123 Main St, Apt 4']
 *
 * // Empty fields
 * const fields = parseCsvLine('name,,age');
 * // returns: ['name', '', 'age']
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
 * Handles nested objects, arrays with gaps, and mixed data types.
 *
 * @async
 * @function processCsvData
 * @param {string} csvPath - Path to CSV file
 * @param {string[]} templateFields - Array of fields from template
 * @returns {Record<string,*>} Processed data object with all fields
 * @throws {AppError} If CSV is invalid or processing fails
 * @example
 * // Basic usage with simple fields
 * const data = await processCsvData('data.csv', ['name', 'age']);
 * // returns: { name: 'John', age: '30' }
 *
 * // Complex nested structure
 * const data = await processCsvData('data.csv', ['user.name', 'user.addresses.0.city']);
 * // returns: { user: { name: 'John', addresses: [{ city: 'NY' }] } }
 *
 * // Array with gaps
 * const data = await processCsvData('data.csv', ['items.0', 'items.2']);
 * // returns: { items: ['first', '', 'third'] }
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
 * Sets a value in a nested object structure, creating intermediate
 * objects and arrays as needed. Handles array indices, object
 * properties, and type conversions.
 *
 * @function setNestedValue
 * @param {Record<string,*>} obj - Target object to modify
 * @param {string} path - Dot notation path (e.g. 'user.addresses.0.city')
 * @param {*} value - Value to set at the path
 * @returns {void}
 * @throws {AppError} On invalid path or array index
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
 *
 * // Mixed object and array path
 * const obj = {};
 * setNestedValue(obj, 'users.0.address.city', 'NY');
 * // Result: { users: [{ address: { city: 'NY' } }] }
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
 * Recursively prints object structure with detailed type information,
 * array lengths, and proper indentation. Useful for debugging and
 * data structure visualization.
 *
 * @function printDataStructure
 * @param {Record<string,*>} obj - Object to print
 * @param {string} [prefix=''] - Indentation prefix
 * @example
 * // Print simple object
 * const data = { name: 'John', age: 30 };
 * printDataStructure(data);
 * // Output:
 * // name: John (string)
 * // age: 30 (number)
 *
 * // Print nested structure
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
 * //     name: John (string)
 * //     age: 30 (number)
 * //   1:
 * //     name: Jane (string)
 * //     age: 25 (number)
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
 *
 * Processes CSV lines into a structured object, handling nested paths,
 * array indices, and object properties. Validates header structure and
 * maintains data integrity.
 *
 * @async
 * @function processDataLines
 * @param {string[]} lines - Array of CSV lines
 * @param {string[]} templateFields - Array of template fields
 * @returns {Record<string, any>} Processed data object
 * @throws {AppError} If CSV structure is invalid or processing fails
 * @example
 * // Basic key-value processing
 * const lines = ['key,value', 'name,John', 'age,30'];
 * const data = await processDataLines(lines, ['name', 'age']);
 * // returns: { name: 'John', age: '30' }
 *
 * // Nested object processing
 * const lines = ['key,value', 'user.name,John', 'user.age,30'];
 * const data = await processDataLines(lines, ['user.name', 'user.age']);
 * // returns: { user: { name: 'John', age: '30' } }
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
