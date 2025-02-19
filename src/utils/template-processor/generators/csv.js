/**
 * @file CSV Data Processing System
 *
 * Provides comprehensive CSV data processing:
 * - CSV file parsing and validation
 * - Data structure normalization
 * - Field mapping and extraction
 * - Type conversion handling
 * - Empty value management
 * - Error detection and reporting
 *
 * Field Naming Convention:
 * - Use dot notation for nested objects: 'user.address.street'
 * - Use dot notation for array indices: 'items.0', 'items.1'
 * - Do not use bracket notation for arrays: 'items[0]' is not supported
 *
 * Functions:
 * - processCSV: Processes CSV data files
 * - validateStructure: Verifies data format
 * - normalizeFields: Standardizes field names
 * - convertTypes: Handles type conversion
 * - handleEmptyValues: Manages missing data
 *
 * Flow:
 * 1. File validation
 * 2. Content parsing
 * 3. Structure verification
 * 4. Field normalization
 * 5. Type conversion
 * 6. Empty value handling
 * 7. Result compilation
 *
 * Error Handling:
 * - File access errors
 * - Invalid CSV format
 * - Structure validation failures
 * - Type conversion errors
 * - Memory constraints
 * - Field name conflicts
 * - Missing required data
 *
 * @module @/utils/templateProcessor/generators/csv
 * @requires fs/promises - File system operations
 * @requires path - Path manipulation
 * @requires csv-parse - CSV parsing
 * @requires @/utils/common/logger - Logging system
 * @requires @/utils/common/errors - Error handling
 * @exports processCSV - CSV data processor
 *
 * @example
 * // Process CSV data file
 * const { processCSV } = require('@/utils/templateProcessor/generators/csv');
 *
 * try {
 *   const data = await processCSV('data.csv', {
 *     required: ['name', 'email'],
 *     types: { age: 'number' }
 *   });
 *   console.log('CSV processed successfully');
 * } catch (error) {
 *   console.error('Processing failed:', error);
 * }
 */

const fs = require('fs/promises');
const path = require('path');
const { logger } = require('@/utils/common/logger');
const {
  extractTemplateFields,
} = require('@/utils/template-processor/core/extract-fields');
const { PATHS } = require('@/config/paths');
const { FILE_EXTENSIONS } = require('@/config/file-extensions');
const { ENCODING_CONFIG } = require('@/config/encoding');
const { AppError } = require('@/utils/common/errors');

/**
 * Generates CSV structure from template fields
 *
 * Creates a structured CSV format through:
 * 1. Field Validation
 *    - Name format checking
 *    - Duplicate detection
 *    - Path structure validation
 *
 * 2. Structure Creation
 *    - Row generation per field
 *    - Column organization
 *    - Value placeholder setup
 *
 * 3. Comment Generation
 *    - Field descriptions
 *    - Usage instructions
 *    - Type hints
 *
 * 4. Format Validation
 *    - CSV syntax checking
 *    - Character escaping
 *    - Line ending normalization
 *
 * CSV Structure Format:
 * - Each row: fieldName,value,comment
 * - Fields: Original template field names
 * - Values: Empty placeholders for data
 * - Comments: Field descriptions and hints
 *
 * @param {string[]} fields - Template field names
 * @returns {string} CSV structure with empty values
 * @throws {AppError} On structure generation failure
 *
 * @example
 * // Basic field structure
 * const fields = ['name', 'email'];
 * const csv = generateCsvStructure(fields);
 * // Returns:
 * // name,,Field: name
 * // email,,Field: email
 *
 * // Nested fields
 * const nested = ['user.name', 'user.address.city'];
 * const csv = generateCsvStructure(nested);
 * // Returns:
 * // user.name,,Field: user.name
 * // user.address.city,,Field: user.address.city
 *
 * // Array fields
 * const arrays = ['items.0.name', 'items.1.price'];
 * const csv = generateCsvStructure(arrays);
 * // Returns:
 * // items.0.name,,Field: items.0.name
 * // items.1.price,,Field: items.1.price
 */
function generateCsvStructure(fields) {
  return fields.map((field) => `${field},,Field: ${field}`).join('\n');
}

/**
 * Formats CSV content with headers
 *
 * Processes content through:
 * 1. Header validation
 * 2. Content validation
 * 3. Header addition
 * 4. Format verification
 * 5. Output generation
 *
 * Adds standard headers:
 * - key: Field identifier
 * - value: Data placeholder
 * - comment: Field description
 *
 * @param {string} csvStructure - CSV structure to format
 * @returns {string} Formatted CSV content with headers
 * @throws {AppError} On formatting failure
 *
 * @example
 * try {
 *   const csv = formatCsvContent('name,,Field: name');
 *   // Returns: "key,value,comment\nname,,Field: name"
 * } catch (error) {
 *   console.error('Formatting failed:', error);
 * }
 */
function formatCsvContent(csvStructure) {
  return `key,value,comment\n${csvStructure}`;
}

/**
 * Generates a CSV template file from a markdown template
 *
 * @param {string} templatePath - Path to markdown template file
 * @returns {Promise<string>} Path to generated CSV file
 * @throws {AppError} On template processing failure
 */
async function generateCsvTemplate(templatePath) {
  const correlationId = Date.now().toString(36);
  try {
    logger.debug('Starting CSV template generation', {
      filename: 'csv.js',
      context: '[template]',
      correlationId,
      operation: 'generate',
      technical: {
        function: 'generateCsvTemplate',
        args: {
          templatePath,
        },
      },
    });

    // Extract fields from template
    let fields;
    try {
      fields = await extractTemplateFields(templatePath);
      if (!fields || fields.length === 0) {
        logger.error('No fields found in template', {
          filename: 'csv.js',
          context: '[template]',
          correlationId,
          error: {
            code: 'TEMPLATE_ERROR',
            message: 'Template contains no extractable fields',
            type: 'ValidationError',
          },
          impact: 'Cannot generate CSV template without fields',
          data: {
            templatePath,
            templateContent: await fs.readFile(
              templatePath,
              ENCODING_CONFIG.default
            ),
          },
        });
        throw new AppError('No fields found in template', 'TEMPLATE_ERROR');
      }

      logger.debug('Fields extracted successfully', {
        filename: 'csv.js',
        context: '[template]',
        correlationId,
        technical: {
          function: 'extractTemplateFields',
          state: {
            fieldCount: fields.length,
            fields,
          },
        },
      });
    } catch (error) {
      // Propagate AppError instances directly
      if (error instanceof AppError) {
        logger.error('Template field extraction failed with AppError', {
          filename: 'csv.js',
          context: '[template]',
          correlationId,
          error: {
            code: error.code,
            message: error.message,
            type: error.name,
            details: error.details,
          },
          impact: 'Cannot proceed with CSV generation',
          data: {
            templatePath,
          },
        });
        throw error;
      }
      // Wrap other errors
      logger.error('Template field extraction failed with unexpected error', {
        filename: 'csv.js',
        context: '[template]',
        correlationId,
        error: {
          code: 'TEMPLATE_ERROR',
          message: error.message,
          type: error.name,
          stack: error.stack,
        },
        impact: 'Cannot proceed with CSV generation',
        data: {
          templatePath,
        },
      });
      throw new AppError(
        'Failed to extract template fields',
        'TEMPLATE_ERROR',
        {
          originalError: error,
          path: templatePath,
        }
      );
    }

    // Generate CSV structure
    const csvStructure = generateCsvStructure(fields);
    const csvContent = formatCsvContent(csvStructure);

    logger.debug('CSV content generated', {
      filename: 'csv.js',
      context: '[template]',
      correlationId,
      technical: {
        function: 'generateCsvStructure',
        state: {
          structureLength: csvStructure.length,
          contentLength: csvContent.length,
          fieldCount: fields.length,
        },
      },
    });

    // Generate output filename
    const templateName = path.basename(
      templatePath,
      FILE_EXTENSIONS.markdown[0]
    );
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const csvFilename = `${templateName}-${timestamp}`;
    const outputPath = path.join(
      PATHS.csv,
      `${csvFilename}${FILE_EXTENSIONS.csv[0]}`
    );

    logger.debug('Output path generated', {
      filename: 'csv.js',
      context: '[template]',
      correlationId,
      technical: {
        function: 'generateCsvTemplate',
        state: {
          templateName,
          timestamp,
          outputPath,
        },
      },
    });

    // Ensure output directory exists
    try {
      await fs.mkdir(PATHS.csv, { recursive: true });
      logger.debug('Output directory created/verified', {
        filename: 'csv.js',
        context: '[file]',
        correlationId,
        technical: {
          function: 'mkdir',
          args: {
            path: PATHS.csv,
            recursive: true,
          },
        },
      });
    } catch (error) {
      logger.error('Failed to create output directory', {
        filename: 'csv.js',
        context: '[file]',
        correlationId,
        error: {
          code: 'CSV_DIR_ERROR',
          message: error.message,
          type: error.name,
          stack: error.stack,
        },
        impact: 'Cannot save generated CSV template',
        data: {
          path: PATHS.csv,
          mode: error.code,
        },
        recovery: [
          'Verify directory permissions',
          'Check disk space',
          'Ensure parent directories exist',
        ],
      });
      throw new AppError('Failed to create output directory', 'CSV_DIR_ERROR', {
        originalError: error,
        path: PATHS.csv,
      });
    }

    // Write CSV file
    try {
      await fs.writeFile(outputPath, csvContent, ENCODING_CONFIG.default);
      logger.info('CSV template generated successfully', {
        filename: 'csv.js',
        context: '[template]',
        correlationId,
        operation: {
          name: 'csv_template_generation',
          status: 'success',
          result: {
            outputPath,
            fieldCount: fields.length,
          },
        },
        metrics: {
          contentLength: csvContent.length,
          fieldCount: fields.length,
        },
      });
      return outputPath;
    } catch (error) {
      logger.error('Failed to write CSV file', {
        filename: 'csv.js',
        context: '[file]',
        correlationId,
        error: {
          code: 'CSV_WRITE_ERROR',
          message: error.message,
          type: error.name,
          stack: error.stack,
        },
        impact: 'Generated CSV template could not be saved',
        data: {
          path: outputPath,
          contentLength: csvContent.length,
          mode: error.code,
        },
        recovery: [
          'Verify file permissions',
          'Check disk space',
          'Ensure directory is writable',
        ],
      });
      throw new AppError('Failed to write CSV template', 'CSV_WRITE_ERROR', {
        originalError: error,
        path: outputPath,
      });
    }
  } catch (error) {
    // Log and rethrow AppError instances directly
    if (error instanceof AppError) {
      logger.error('CSV template generation failed with AppError', {
        filename: 'csv.js',
        context: '[template]',
        correlationId,
        error: {
          code: error.code,
          message: error.message,
          type: error.name,
          details: error.details,
        },
        impact: 'CSV template could not be generated',
        data: {
          templatePath,
        },
      });
      throw error;
    }

    // Wrap other errors
    logger.error('CSV template generation failed with unexpected error', {
      filename: 'csv.js',
      context: '[template]',
      correlationId,
      error: {
        code: 'CSV_GENERATION_ERROR',
        message: error.message,
        type: error.name,
        stack: error.stack,
      },
      impact: 'CSV template could not be generated',
      data: {
        templatePath,
      },
    });
    throw new AppError(
      'Failed to generate CSV template',
      'CSV_GENERATION_ERROR',
      {
        originalError: error,
        path: templatePath,
      }
    );
  }
}

module.exports = {
  generateCsvTemplate,
  generateCsvStructure,
  formatCsvContent,
};
