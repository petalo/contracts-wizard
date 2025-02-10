/**
 * @file CSV Data Processing System
 *
 * @fileoverview Provides a streamlined CSV processing system using modern libraries:
 * - PapaParse for CSV parsing
 * - Lodash for data manipulation
 * - Joi for validation and type conversion
 *
 * Functions:
 * - processCsvData: Process CSV data and validate against template fields
 * - validateCsvStructure: Validate CSV file structure
 * - processDataLines: Transform CSV data into structured object
 *
 * Flow:
 * 1. CSV file reading and validation
 * 2. Data parsing with PapaParse
 * 3. Structure transformation with Lodash
 * 4. Type validation with Joi
 * 5. Template field validation
 *
 * Error Handling:
 * - Invalid CSV structure
 * - File access errors
 * - Type conversion errors
 * - Missing required fields
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
    Joi.object({
      key: Joi.string().required(),
      value: Joi.string().allow('').optional(),
    })
  )
  .min(1);

/**
 * Schema for validating individual values
 * Handles type conversion for common data types
 */
const valueSchema = Joi.alternatives().try(
  Joi.number(),
  Joi.boolean(),
  Joi.string().allow('')
);

/**
 * Validates CSV file structure
 *
 * @param {Array<Object>} parsedData - Parsed CSV data
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
    const { error } = csvStructureSchema.validate(parsedData);
    if (error) {
      logger.warn('Invalid CSV structure', {
        context: '[validation]',
        filename: 'process-csv.js',
        error: error.message,
        details: error.details,
        type: 'structure-validation',
      });
      return false;
    }
    logger.debug('CSV structure validation passed', {
      context: '[validation]',
      filename: 'process-csv.js',
      type: 'structure-validation',
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
 * Converts string values to appropriate types
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
    // Si el valor está vacío, mantenerlo como string vacío
    if (value === '' || value === undefined || value === null) {
      logger.debug('Empty value detected', {
        context: '[data]',
        filename: 'process-csv.js',
        type: 'empty-value',
        operation: 'type-conversion',
      });
      return '';
    }

    // Si el valor contiene #, lo mantenemos como string
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

    // Intentar convertir a número primero
    if (typeof value === 'string' && !isNaN(value) && value.trim() !== '') {
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

    // Intentar convertir a booleano
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

    // Si no se pudo convertir, mantener como string
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
 * Process CSV data into structured object
 *
 * @param {Array<Object>} parsedData - Parsed CSV data
 * @returns {Object} Processed data object
 */
function processDataLines(parsedData) {
  logger.debug('Processing CSV data lines', {
    context: '[data]',
    filename: 'process-csv.js',
    rowCount: parsedData.length,
    firstRow: parsedData[0],
    type: 'csv-processing',
  });

  const result = parsedData.reduce((result, { key, value }) => {
    if (!key) {
      logger.debug('Empty key found', {
        context: '[data]',
        filename: 'process-csv.js',
        value,
        type: 'empty-key',
        operation: 'data-processing',
      });
      return result;
    }

    logger.debug('Processing data line', {
      context: '[data]',
      filename: 'process-csv.js',
      key,
      value,
      type: 'line-processing',
      operation: 'data-processing',
    });

    // Convert the value to appropriate type
    const processedValue = convertValueType(value);

    // Handle array notation in keys
    const normalizedKey = key.replace(/\[(\d+)\]/g, '.$1');
    logger.debug('Key normalized', {
      context: '[data]',
      filename: 'process-csv.js',
      originalKey: key,
      normalizedKey,
      processedValue,
      type: 'key-normalization',
      operation: 'data-processing',
    });

    _.set(result, normalizedKey, processedValue);
    return result;
  }, {});

  logger.debug('Data processing complete', {
    context: '[data]',
    filename: 'process-csv.js',
    resultKeys: Object.keys(result),
    resultStructure: JSON.stringify(result),
    type: 'processing-complete',
  });

  return result;
}

/**
 * Initialize data structure with template fields
 *
 * @param {Object} data - Existing data object
 * @param {Array<string>} templateFields - Template field paths
 * @returns {Object} Initialized data object
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
 * @returns {Promise<Object>} Processed data object
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
      transformHeader: (h) => h.toLowerCase(),
    });

    if (errors.length > 0) {
      logger.error('CSV parsing failed', {
        context: '[error]',
        filename: 'process-csv.js',
        correlationId,
        errors,
        type: 'parse-error',
      });
      throw new AppError('Failed to parse CSV file', 'CSV_PARSE_ERROR');
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
      throw new AppError('Invalid CSV structure', 'CSV_STRUCTURE_ERROR');
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
      path: csvPath,
      templateFields,
      stack: error.stack,
      type: 'process-error',
    });

    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError('Failed to process CSV data', 'CSV_PROCESSING_ERROR', {
      originalError: error,
    });
  }
}

module.exports = {
  processCsvData,
  validateCsvStructure,
  processDataLines,
  // Exported for testing
  convertValueType,
  initializeDataFromFields,
};
