/**
 * @fileoverview CLI Command Handlers and Utilities
 *
 * Implements command handlers and utilities for CLI operations:
 * - File listing by type (templates, CSV, CSS)
 * - Template validation and creation
 * - Command argument processing
 * - Error handling and reporting
 *
 * Functions:
 * - validateListType: Validates file type arguments
 * - createNewDataTemplate: Creates CSV templates from markdown
 * - handleListCommand: Lists files by type with formatting
 *
 * Constants:
 * - LIST_TYPES: Valid file type enumerations
 *   - TEMPLATE: Markdown templates
 *   - CSV: Data files
 *   - CSS: Style sheets
 *
 * Flow:
 * 1. Validate command arguments
 * 2. Process file operations
 * 3. Generate output files
 * 4. Display results
 * 5. Handle any errors
 *
 * Error Handling:
 * - Invalid type validation
 * - File access failures
 * - Template processing errors
 * - File listing failures
 * - Path validation errors
 *
 * @module @/cli/commands
 * @requires @/utils/common/logger - Logging utilities
 * @requires @/utils/common/errors - Error handling
 * @requires @/utils/file-management/file-scanner - File operations
 * @requires @/utils/template-processor/generators/csv - CSV generation
 * @requires @/cli/display - CLI output formatting
 * @requires @/config/file-extensions - File type definitions
 * @exports {Object} LIST_TYPES - File type constants
 * @exports {Function} validateListType - Type validation
 * @exports {Function} createNewDataTemplate - Template creation
 * @exports {Function} handleListCommand - File listing
 *
 * @example
 * // List template files
 * const { handleListCommand, LIST_TYPES } = require('@/cli/commands');
 * await handleListCommand(LIST_TYPES.TEMPLATE);
 *
 * // Create new data template
 * const templatePath = await createNewDataTemplate('template.md');
 */

const { logger } = require('@/utils/common/logger');
const { AppError } = require('@/utils/common/errors');
const { listFiles } = require('@/utils/file-management/file-scanner');
const {
  generateCsvTemplate,
} = require('@/utils/template-processor/generators/csv');
const { display } = require('@/cli/display');
const { FILE_EXTENSIONS } = require('@/config/file-extensions');

/**
 * Valid file type constants for listing operations
 *
 * Defines the allowed file types that can be used with
 * list commands and file operations. Maps directly to
 * file extensions configuration.
 *
 * @constant {Object}
 * @property {string} TEMPLATE - Markdown template files
 * @property {string} CSV - Data files
 * @property {string} CSS - Style sheets
 */
const LIST_TYPES = {
  // Original types
  markdown: 'markdown',
  csv: 'csv',
  css: 'css',

  // Aliases
  templates: 'markdown',
  data: 'csv',
  styles: 'css',
};

/**
 * Validates file type argument for list operations
 *
 * Ensures the provided type matches one of the valid
 * LIST_TYPES values. Throws an error for invalid types
 * to prevent processing with incorrect file types.
 *
 * @param {string} type - File type to validate
 * @throws {AppError} If type is not in LIST_TYPES
 * @example
 * // Validate template type
 * validateListType('templates');
 * // Throws for invalid type
 * validateListType('invalid'); // AppError
 */
function validateListType(type) {
  if (!Object.keys(LIST_TYPES).includes(type)) {
    throw new AppError(
      `Invalid list type: ${type}. Valid types are: templates, data, styles`,
      'INVALID_TYPE'
    );
  }
  return LIST_TYPES[type];
}

/**
 * Creates a new CSV data template from markdown
 *
 * Generates a CSV template file based on a markdown template:
 * 1. Validates template path and extension
 * 2. Checks template existence
 * 3. Generates CSV structure
 * 4. Saves to new file
 *
 * @async
 * @param {string} templatePath - Path to source markdown template
 * @returns {Promise<string>} Path to created CSV template
 * @throws {AppError} For invalid extension, missing template, or generation failure
 * @example
 * // Create template from markdown
 * const csvPath = await createNewDataTemplate('contract.md');
 * console.log(`Template created at: ${csvPath}`);
 */
async function createNewDataTemplate(templatePath) {
  try {
    if (!templatePath.endsWith(FILE_EXTENSIONS.markdown[0])) {
      throw new AppError(
        `Invalid file extension. Expected ${FILE_EXTENSIONS.markdown[0]} file`,
        'INVALID_EXTENSION',
        { path: templatePath }
      );
    }

    const templates = await listFiles(LIST_TYPES.TEMPLATE);
    if (!templates.includes(templatePath)) {
      throw new AppError('Template not found', 'TEMPLATE_NOT_FOUND');
    }

    display.header('Creating Data Template');
    display.status.info(`Using template: ${display.path(templatePath)}`);

    const dataPath = await generateCsvTemplate(templatePath);
    display.status.success(`Created data template: ${display.path(dataPath)}`);

    return dataPath;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    logger.error('Data template creation failed', { error });
    throw new AppError('Failed to create data template', 'TEMPLATE_ERROR', {
      originalError: error,
    });
  }
}

/**
 * Lists files of specified type with formatting
 *
 * Retrieves and displays a formatted list of files:
 * 1. Validates the requested file type
 * 2. Scans for matching files
 * 3. Displays formatted results
 *
 * @async
 * @param {string} type - File type to list (templates, data, styles)
 * @returns {Promise<void>}
 * @throws {AppError} For invalid type or listing failure
 * @example
 * // List all template files
 * await handleListCommand('templates');
 * // List all data files
 * await handleListCommand('data');
 */
async function handleListCommand(type) {
  try {
    const fileType = validateListType(type);
    const files = await listFiles(fileType);
    display.list(`${type.toUpperCase()} Files:`, files);
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    logger.error('File listing failed', { error });
    throw new AppError('Failed to list files', 'LIST_ERROR', {
      originalError: error,
    });
  }
}

module.exports = {
  LIST_TYPES,
  validateListType,
  createNewDataTemplate,
  handleListCommand,
};
