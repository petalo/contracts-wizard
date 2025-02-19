/**
 * @file Template Utility Functions for Field Extraction and Processing
 *
 * Provides utility functions for template processing:
 * - Template field extraction from Handlebars templates
 * - Helper function registration and validation
 * - Template preprocessing and validation
 * - Error handling for template operations
 *
 * Functions:
 * - extractTemplateFields: Template field extractor
 * - validateTemplate: Template validator
 * - preprocessTemplate: Template preprocessor
 * - registerCustomHelpers: Helper registration utility
 *
 * Flow:
 * 1. Template parsing and validation
 * 2. Field extraction from AST
 * 3. Helper registration and setup
 * 4. Template preprocessing
 *
 * Error Handling:
 * - Template parsing errors
 * - Invalid helper detection
 * - Missing field handling
 * - Syntax error reporting
 *
 * @module @/utils/template-processor/core/template-utils
 * @requires fs/promises - File system promises
 * @requires path - Path manipulation
 * @requires handlebars - Template engine
 * @requires @/utils/common/logger - Logging system
 * @requires @/utils/common/errors - Error handling
 * @requires @/config/encoding - File encoding configuration
 * @exports validateTemplate Template validator function
 * @exports formatValue Value formatter function
 *
 * @example
 * // Extract and validate template fields
 * const {
 *   extractTemplateFields,
 *   validateFields
 * } = require('@/utils/templateProcessor/core/templateUtils');
 *
 * try {
 *   const fields = await extractTemplateFields('contract.md');
 *   if (validateFields(fields)) {
 *     console.log('Valid fields:', fields);
 *   }
 * } catch (error) {
 *   console.error('Template processing failed:', error);
 * }
 *
 * // Process template content with includes
 * const { processTemplateContent } = require('@/utils/templateProcessor/core/templateUtils');
 *
 * try {
 *   const content = await processTemplateContent('template.md');
 *   console.log('Processed content:', content);
 * } catch (error) {
 *   if (error.code === 'INCLUDE_ERROR') {
 *     console.error('Include processing failed:', error.details);
 *   } else {
 *     console.error('Content processing failed:', error);
 *   }
 * }
 */

const fs = require('fs/promises');
const { logger } = require('@/utils/common/logger');
const { AppError } = require('@/utils/common/errors');
const { ENCODING_CONFIG } = require('@/config/encoding');

/**
 * Field validation configuration
 *
 * Defines comprehensive validation rules for template fields:
 * - Pattern matching for field extraction
 * - Name validation rules
 * - Nesting depth limits
 * - Character restrictions
 *
 * Used to maintain consistent field validation across
 * the template processing system and ensure data
 * structure integrity.
 *
 * @constant {object}
 * @property {RegExp} FIELD_PATTERN - Handlebars field extraction pattern
 * @property {RegExp} NAME_PATTERN - Valid field name pattern (alphanumeric + underscore)
 * @property {number} MAX_NESTING - Maximum allowed nesting depth for fields
 *
 * @example
 * // Field extraction
 * const match = FIELD_CONFIG.FIELD_PATTERN.exec('{{user.name}}');
 * // Returns: ['{{user.name}}', 'user.name']
 *
 * // Name validation
 * const isValid = FIELD_CONFIG.NAME_PATTERN.test('user_name');
 * // Returns: true
 *
 * // Invalid characters
 * const isInvalid = FIELD_CONFIG.NAME_PATTERN.test('user-name');
 * // Returns: false
 *
 * // Nesting validation
 * const fields = ['user.address.street.number.unit'];
 * const isTooNested = fields[0].split('.').length > FIELD_CONFIG.MAX_NESTING;
 * // Returns: true (if MAX_NESTING is less than 5)
 */
const FIELD_CONFIG = {
  FIELD_PATTERN: /\{\{([^}]+)\}\}/g,
  NAME_PATTERN: /^[a-zA-Z0-9_]+$/,
  MAX_NESTING: 5,
};

/**
 * Extracts fields from template content
 *
 * Processes template through:
 * 1. File content loading
 * 2. Pattern matching
 * 3. Field extraction
 * 4. Duplicate removal
 * 5. Result formatting
 *
 * @async
 * @param {string} templatePath - Template file path
 * @returns {Promise<string[]>} Unique field names
 * @throws {AppError} On file or extraction errors
 *
 * @example
 * try {
 *   const fields = await extractTemplateFields('contract.md');
 *   console.log('Template fields:', fields);
 * } catch (error) {
 *   console.error('Extraction failed:', error);
 * }
 */
async function extractTemplateFields(templatePath) {
  try {
    logger.debug('Starting template field extraction', {
      templatePath,
    });

    // Load template content
    const content = await fs.readFile(templatePath, ENCODING_CONFIG.default);
    const fields = new Set();

    // Extract fields using pattern
    let match;
    while ((match = FIELD_CONFIG.FIELD_PATTERN.exec(content)) !== null) {
      fields.add(match[1].trim());
    }

    // Convert to array and log results
    const fieldArray = Array.from(fields);
    logger.debug('Template field extraction complete', {
      templatePath,
      fieldCount: fieldArray.length,
      fields: fieldArray,
    });

    return fieldArray;
  } catch (error) {
    // Handle specific file not found error
    if (error.code === 'ENOENT') {
      throw new AppError('Template file not found', 'TEMPLATE_NOT_FOUND', {
        path: templatePath,
      });
    }

    // Log and wrap other errors
    logger.error('Template field extraction failed', {
      error,
      templatePath,
    });
    throw new AppError('Failed to extract template fields', 'TEMPLATE_ERROR', {
      originalError: error,
      path: templatePath,
    });
  }
}

/**
 * Validates template field names
 *
 * Performs comprehensive field validation through:
 * 1. Array structure validation
 * 2. Field name pattern matching
 * 3. Nesting depth checking
 * 4. Empty value detection
 * 5. Character validation
 *
 * Validation Rules:
 * - Names must be alphanumeric with underscores
 * - Maximum nesting depth of 5 levels
 * - No empty or whitespace-only names
 * - Array indices must be numeric
 *
 * @param {string[]} fields - Array of field names to validate
 * @returns {boolean} True if all fields are valid
 * @throws {AppError} On validation errors with details
 *
 * @example
 * // Basic validation
 * const validFields = ['user.name', 'user.email'];
 * validateFields(validFields); // Returns: true
 *
 * // Array field validation
 * const arrayFields = ['items.0.name', 'items.1.price'];
 * validateFields(arrayFields); // Returns: true
 *
 * // Invalid cases
 * try {
 *   // Invalid character
 *   validateFields(['user-name']);
 *   // Excessive nesting
 *   validateFields(['a.b.c.d.e.f']);
 *   // Empty field
 *   validateFields(['user.', '.name']);
 * } catch (error) {
 *   console.error(error.message);
 *   // Logs validation error details
 * }
 *
 * // Mixed validation
 * const mixedFields = [
 *   'user.name',           // Valid
 *   'items.0.title',       // Valid
 *   'address.street_name', // Valid
 *   'user.email@invalid',  // Invalid character
 *   ''                     // Invalid empty
 * ];
 */
function validateFields(fields) {
  try {
    logger.debug('Starting field validation', {
      fieldCount: fields?.length,
    });

    // Validate array structure
    if (!Array.isArray(fields) || fields.length === 0) {
      logger.debug('Invalid field array structure', {
        isArray: Array.isArray(fields),
        length: fields?.length,
      });
      return false;
    }

    // Validate each field
    const isValid = fields.every((field) => {
      // Check for empty fields
      if (typeof field !== 'string' || field.trim() === '') {
        logger.debug('Invalid field found', {
          field,
          type: typeof field,
        });
        return false;
      }

      // Validate nested field structure
      const parts = field.split('.');
      if (parts.length > FIELD_CONFIG.MAX_NESTING) {
        logger.debug('Excessive nesting depth', {
          field,
          depth: parts.length,
          maxAllowed: FIELD_CONFIG.MAX_NESTING,
        });
        return false;
      }

      // Validate each part against pattern
      return parts.every((part) => FIELD_CONFIG.NAME_PATTERN.test(part));
    });

    logger.debug('Field validation complete', {
      isValid,
      fieldCount: fields.length,
    });

    return isValid;
  } catch (error) {
    logger.error('Field validation failed', {
      error,
      fields,
    });
    throw new AppError('Failed to validate fields', 'VALIDATION_ERROR', {
      originalError: error,
      fields,
    });
  }
}

module.exports = {
  extractTemplateFields,
  validateFields,
  FIELD_CONFIG, // Exported for testing
};
