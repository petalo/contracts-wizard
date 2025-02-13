/**
 * @file CSV Data Processing System
 *
 * Processes CSV files into structured data objects.
 * Handles validation, type conversion, and template field initialization.
 * Supports nested objects, arrays, and mixed data types.
 *
 * Functions:
 * - processCsvData: Main entry point for CSV processing
 * - validateCsvStructure: Validates CSV file structure
 * - processDataLines: Converts CSV lines to structured object
 * - convertValueType: Type conversion for CSV values
 * - initializeDataFromFields: Template field initialization
 *
 * Flow:
 * 1. Validate CSV structure
 * 2. Parse CSV data
 * 3. Convert values to appropriate types
 * 4. Initialize template fields
 * 5. Return processed data object
 *
 * Error Handling:
 * - Invalid CSV structure
 * - File access errors
 * - Type conversion errors
 * - Missing required fields
 * - Template field validation
 *
 * @module @/utils/template-processor/core/processCsv
 * @requires papaparse - CSV parsing library
 * @requires lodash - Utility library
 * @requires joi - Schema validation
 * @requires fs/promises - File system operations
 * @requires @/utils/common/logger - Logging system
 * @requires @/utils/common/errors - Error handling
 * @requires @/config/encoding - File encoding configuration
 */

const Papa = require('papaparse');
const _ = require('lodash');
const Joi = require('joi');
const fs = require('fs/promises');
const { logger } = require('@/utils/common/logger');
const { AppError } = require('@/utils/common/errors');
const { ENCODING_CONFIG } = require('@/config/encoding');

/**
 * Schema for validating CSV structure
 * Ensures presence of required columns
 */
const csvStructureSchema = Joi.array()
  .items(
    Joi.alternatives().try(
      // Schema para 3 columnas (key, value, comment)
      Joi.object({
        key: Joi.string().required(),
        value: Joi.string().allow('').optional(),
        comment: Joi.string().allow('').optional(),
      }),
      // Schema para 2 columnas (key, value)
      Joi.object({
        key: Joi.string().required(),
        value: Joi.string().allow('').optional(),
      })
    )
  )
  .min(1);

/**
 * Validates CSV file structure
 *
 * @param {Array<{key: string, value: string, comment?: string}>} parsedData - Parsed CSV data
 * @returns {boolean} True if structure is valid
 * @throws {AppError} On validation failure
 */
function validateCsvStructure(parsedData) {
  logger.debug('Validating CSV structure', {
    context: '[data]',
    filename: 'process-csv.js',
    rowCount: parsedData.length,
    sampleRow: parsedData[0],
    type: 'csv-validation',
  });

  try {
    // Transform data to match schema format if needed
    const transformedData = parsedData.map((row) => {
      // Si ya tiene la estructura correcta, devolver como está
      if (row.key !== undefined) {
        const transformed = {
          key: row.key,
          value: row.value || '',
        };
        // Solo añadir comment si existe
        if (row.comment !== undefined) {
          transformed.comment = row.comment;
        }
        return transformed;
      }

      // Extraer key y value del objeto
      const entries = Object.entries(row);
      if (entries.length === 0) {
        return {
          key: '',
          value: '',
        };
      }

      // Manejar caso donde la primera columna es la key
      const transformed = {
        key: entries[0][0],
        value: entries[0][1] || '',
      };

      // Solo añadir comment si existe una tercera columna
      if (entries[2]) {
        transformed.comment = entries[2][1] || '';
      }

      return transformed;
    });

    const { error } = csvStructureSchema.validate(transformedData);
    if (error) {
      logger.warn('Invalid CSV structure', {
        context: '[validation]',
        filename: 'process-csv.js',
        error: error.message,
        details: error.details,
        type: 'structure-validation',
        data: transformedData,
      });
      return false;
    }
    logger.debug('CSV structure validation passed', {
      context: '[validation]',
      filename: 'process-csv.js',
      type: 'structure-validation',
      data: transformedData,
    });
    return true;
  } catch (error) {
    logger.error('CSV validation failed', {
      context: '[validation]',
      filename: 'process-csv.js',
      error: error.message,
      stack: error.stack,
      type: 'structure-validation',
    });
    return false;
  }
}

/**
 * Convert string value to appropriate type
 *
 * @param {string} value - Value to convert
 * @returns {*} Converted value
 */
function convertValueType(value) {
  logger.debug('Converting value type', {
    context: '[data]',
    filename: 'process-csv.js',
    originalValue: value,
    type: typeof value,
    operation: 'type-conversion',
  });

  try {
    // If value is empty or undefined/null, return empty string
    if (
      value === '' ||
      value === undefined ||
      value === null ||
      value === 'null' ||
      value === 'undefined'
    ) {
      logger.debug('Empty value detected', {
        context: '[data]',
        filename: 'process-csv.js',
        type: 'empty-value',
        operation: 'type-conversion',
      });
      return '';
    }

    // If value contains #, keep as string
    if (typeof value === 'string' && value.includes('#')) {
      logger.debug('Comment detected in value', {
        context: '[data]',
        filename: 'process-csv.js',
        value,
        type: 'string-with-comment',
        operation: 'type-conversion',
      });
      return value;
    }

    // If value is a "pure" numeric string (no spaces or other characters)
    if (
      typeof value === 'string' &&
      /^-?\d+(\.\d+)?$/.test(value.trim()) &&
      !value.includes(' ')
    ) {
      const num = Number(value);
      if (Number.isFinite(num)) {
        logger.debug('Value converted to number', {
          context: '[data]',
          filename: 'process-csv.js',
          originalValue: value,
          convertedValue: num,
          type: 'number-conversion',
          operation: 'type-conversion',
        });
        return num;
      }
    }

    // If value is a "pure" boolean (exactly 'true' or 'false')
    if (value === 'true' || value === 'false') {
      const bool = value === 'true';
      logger.debug('Value converted to boolean', {
        context: '[data]',
        filename: 'process-csv.js',
        originalValue: value,
        convertedValue: bool,
        type: 'boolean-conversion',
        operation: 'type-conversion',
      });
      return bool;
    }

    // If value is a date string in ISO format
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        logger.debug('Value is a valid date', {
          context: '[data]',
          filename: 'process-csv.js',
          originalValue: value,
          convertedValue: value,
          type: 'date-string',
          operation: 'type-conversion',
        });
        return value;
      }
    }

    // For any other case, keep as string
    logger.debug('Value kept as string', {
      context: '[data]',
      filename: 'process-csv.js',
      value,
      type: 'string-preserved',
      operation: 'type-conversion',
    });
    return value;
  } catch (error) {
    logger.debug('Value conversion failed', {
      context: '[error]',
      filename: 'process-csv.js',
      value,
      error: error.message,
      type: 'conversion-error',
      operation: 'type-conversion',
    });
    return value;
  }
}

/**
 * Process data lines from CSV into a structured object
 *
 * @param {Array<{key: string, value: string}>} lines - Array of key-value pairs from CSV
 * @returns {object} - Processed data structure
 */
function processDataLines(lines) {
  const result = {};
  const paths = new Set();

  logger.debug('Processing CSV lines:', {
    context: '[data]',
    filename: 'process-csv.js',
    lines: JSON.stringify(lines),
    type: 'process-start',
  });

  // First pass: collect all paths
  lines.forEach((line) => {
    if (line.key) {
      paths.add(line.key);
    }
  });

  logger.debug('Collected paths:', {
    context: '[data]',
    filename: 'process-csv.js',
    paths: Array.from(paths),
    type: 'process-paths',
  });

  // Second pass: process each line
  lines.forEach((line) => {
    if (!line.key) return;

    const parts = line.key.split('.');
    let current = result;
    const lastIndex = parts.length - 1;

    // Process each part of the path
    parts.forEach((part, index) => {
      // If this is a numeric index, ensure parent is an array
      if (/^\d+$/.test(part)) {
        const arrayIndex = parseInt(part, 10);
        if (!Array.isArray(current)) {
          current = [];
        }
        // Ensure the array has enough elements
        while (current.length <= arrayIndex) {
          current.push({});
        }
      }

      // If this is the last part, set the value
      if (index === lastIndex) {
        current[part] = line.value;
      }
      // Otherwise, create nested object/array if needed
      else {
        if (!current[part]) {
          // If next part is numeric, initialize as array
          const nextPart = parts[index + 1];
          current[part] = /^\d+$/.test(nextPart) ? [] : {};
        }
        current = current[part];
      }
    });

    logger.debug('Processed line:', {
      context: '[data]',
      filename: 'process-csv.js',
      key: line.key,
      value: line.value,
      currentResult: JSON.stringify(result),
      type: 'process-line',
    });
  });

  // Post-process to handle parent.N.child.M structure
  if (result.parent) {
    // First, ensure all parent entries exist
    const maxParentIndex = Math.max(
      ...Object.keys(result.parent)
        .map(Number)
        .filter((n) => !isNaN(n))
    );
    while (result.parent.length <= maxParentIndex) {
      result.parent.push({});
    }

    // Then process each parent's child array
    result.parent.forEach((parent) => {
      if (!parent.child) {
        parent.child = [];
      }

      // Convert object with numeric keys to array
      const maxChildIndex = Math.max(
        ...Object.keys(parent.child)
          .map(Number)
          .filter((n) => !isNaN(n))
      );
      const childArray = new Array(maxChildIndex + 1).fill(undefined);

      // Fill in the values we have
      Object.entries(parent.child).forEach(([idx, value]) => {
        childArray[Number(idx)] = value;
      });

      parent.child = childArray;
    });
  }

  logger.debug('Final processed result:', {
    context: '[data]',
    filename: 'process-csv.js',
    result: JSON.stringify(result),
    type: 'process-complete',
  });

  return result;
}

/**
 * Initialize data structure with template fields
 *
 * @param {object} data - Existing data object
 * @param {Array<string>} templateFields - Template field paths
 * @returns {object} Initialized data object
 */
function initializeDataFromFields(data, templateFields = []) {
  logger.debug('Initializing template fields', {
    context: '[data]',
    filename: 'process-csv.js',
    existingKeys: Object.keys(data),
    templateFields,
    type: 'field-initialization',
  });

  const result = templateFields.reduce((result, field) => {
    if (!_.has(result, field)) {
      logger.debug('Setting missing field', {
        context: '[data]',
        filename: 'process-csv.js',
        field,
        value: '',
        type: 'field-initialization',
      });
      _.set(result, field, '');
    }
    return result;
  }, _.cloneDeep(data));

  logger.debug('Field initialization complete', {
    context: '[data]',
    filename: 'process-csv.js',
    resultKeys: Object.keys(result),
    type: 'initialization-complete',
  });

  return result;
}

/**
 * Process CSV data and validate against template fields
 *
 * @param {string} csvPath - Path to CSV file
 * @param {Array<string>} templateFields - Template field paths
 * @returns {Promise<{ [key: string]: any }>} Processed data object
 * @throws {AppError} If processing fails
 */
async function processCsvData(csvPath, templateFields = []) {
  const correlationId = Date.now().toString(36);
  logger.debug('Starting CSV processing', {
    context: '[data]',
    filename: 'process-csv.js',
    correlationId,
    path: csvPath,
    templateFields,
    templateFieldCount: templateFields?.length,
    type: 'process-start',
  });

  try {
    // Read file content
    const content = await fs.readFile(csvPath, ENCODING_CONFIG.default);
    logger.debug('File read complete', {
      context: '[file]',
      filename: 'process-csv.js',
      correlationId,
      path: csvPath,
      contentLength: content.length,
      type: 'file-read',
    });

    // Parse CSV
    const { data: parsedData, errors } = Papa.parse(content, {
      header: true,
      skipEmptyLines: 'greedy',
      comments: '#',
      delimiter: ',',
      transformHeader: (h) => h.toLowerCase().trim(),
      error: (error) => {
        logger.error('CSV parsing error', {
          context: '[error]',
          filename: 'process-csv.js',
          correlationId,
          error: error.message,
          type: error.type,
        });
        throw new AppError('Failed to parse CSV file', 'CSV_PARSING_ERROR', {
          cause: error,
          details: {
            path: csvPath,
            errorType: error.type,
            errorMessage: error.message,
          },
        });
      },
      // No fallar si faltan campos
      transform: (value) => value || '',
    });

    // Filtrar errores que no sean FieldMismatch
    const criticalErrors = errors.filter(
      (error) => error.type !== 'FieldMismatch'
    );

    if (criticalErrors.length > 0) {
      logger.error('CSV parsing failed', {
        context: '[error]',
        filename: 'process-csv.js',
        correlationId,
        errors: criticalErrors,
        type: 'parse-error',
      });
      throw new AppError('Failed to parse CSV file', 'CSV_PARSING_ERROR', {
        details: {
          path: csvPath,
          errors: criticalErrors,
        },
      });
    }

    logger.debug('CSV parsing complete', {
      context: '[data]',
      filename: 'process-csv.js',
      correlationId,
      rowCount: parsedData.length,
      firstRow: parsedData[0],
      type: 'parse-complete',
    });

    // Validate CSV structure
    if (!validateCsvStructure(parsedData)) {
      logger.error('Invalid CSV structure detected', {
        context: '[validation]',
        filename: 'process-csv.js',
        correlationId,
        type: 'structure-error',
      });
      throw new AppError('Invalid CSV structure', 'CSV_STRUCTURE_ERROR', {
        details: {
          path: csvPath,
          data: parsedData,
        },
      });
    }

    // Process data lines into structured object
    let processedData = processDataLines(parsedData);

    // Initialize missing template fields
    if (templateFields.length > 0) {
      logger.debug('Processing template fields', {
        context: '[data]',
        filename: 'process-csv.js',
        correlationId,
        templateFields,
        existingKeys: Object.keys(processedData),
        type: 'template-processing',
      });
      processedData = initializeDataFromFields(processedData, templateFields);
    }

    // Log processed data for debugging
    logger.debug('CSV processing complete', {
      context: '[data]',
      filename: 'process-csv.js',
      correlationId,
      templateFields,
      processedFields: Object.keys(processedData),
      data: processedData,
      type: 'process-complete',
    });

    return processedData;
  } catch (error) {
    logger.error('CSV processing failed', {
      context: '[error]',
      filename: 'process-csv.js',
      correlationId,
      error: error.message,
      code: error.code,
      details: error.details,
      stack: error.stack,
    });

    // Re-throw CSV specific errors
    if (
      error instanceof AppError &&
      (error.code === 'CSV_PARSING_ERROR' ||
        error.code === 'CSV_STRUCTURE_ERROR')
    ) {
      throw error;
    }

    // Wrap other errors
    throw new AppError('Failed to process CSV file', 'CSV_PROCESSING_ERROR', {
      cause: error,
      details: {
        path: csvPath,
        templateFields,
      },
    });
  }
}

module.exports = {
  processCsvData,
  validateCsvStructure,
  processDataLines,
  convertValueType,
  initializeDataFromFields,
};
