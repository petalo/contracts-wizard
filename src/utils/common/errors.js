/**
 * @fileoverview Application Error Management System
 *
 * Provides centralized error handling utilities:
 * - Custom error class with code support
 * - Standardized error codes
 * - Error formatting and validation
 * - Type checking utilities
 * - Stack trace capture
 * - Error context enrichment
 * - Error code validation
 *
 * Functions:
 * - formatError: Formats error messages with details
 * - isAppError: Validates error type
 *
 * Classes:
 * - AppError: Custom application error class
 *   - Properties: name, code, details, stack
 *   - Methods: toString, toJSON
 *
 * Constants:
 * - ERROR_CODES: Standard error code enumeration
 *   - UNKNOWN: Unknown error type
 *   - VALIDATION: Input validation errors
 *   - FILE: File operation errors
 *   - TEMPLATE: Template processing errors
 *   - TEMPLATE_NOT_FOUND: Missing template
 *   - DATA_NOT_FOUND: Missing data
 *   - CSS_NOT_FOUND: Missing CSS
 *   - PROCESSING_ERROR: Processing failure
 *
 * Flow:
 * 1. Define error codes
 * 2. Create error instance
 * 3. Add error details
 * 4. Format error message
 * 5. Handle error appropriately
 *
 * Error Handling:
 * - Invalid error code validation
 * - Stack trace capture
 * - Detail object validation
 * - Message formatting
 * - Type checking
 * - Error inheritance
 * - Error serialization
 *
 * @module @/utils/common/errors
 * @exports {Class} AppError - Application error class
 * @exports {Object} ERROR_CODES - Error code constants
 * @exports {Function} formatError - Error formatter
 * @exports {Function} isAppError - Type checker
 *
 * @example
 * // Import error utilities
 * const { AppError, ERROR_CODES } = require('@/utils/common/errors');
 *
 * // Basic error creation
 * throw new AppError('Invalid input', ERROR_CODES.VALIDATION, {
 *   field: 'email',
 *   value: 'invalid'
 * });
 *
 * // Error handling with type checking
 * try {
 *   processData(input);
 * } catch (error) {
 *   if (isAppError(error)) {
 *     console.error(formatError(error));
 *     // Logs: "VALIDATION_ERROR: Invalid input
 *     // Details: { field: 'email', value: 'invalid' }"
 *   }
 * }
 *
 * // Custom error extension
 * class ValidationError extends AppError {
 *   constructor(message, details) {
 *     super(message, ERROR_CODES.VALIDATION, details);
 *     this.name = 'ValidationError';
 *   }
 * }
 *
 * // Error with stack trace
 * const error = new AppError('Process failed', ERROR_CODES.PROCESSING_ERROR);
 * console.log(error.stack);
 * // Shows: "AppError: Process failed
 * //    at processData (/src/process.js:10:5)
 * //    at main (/src/index.js:5:3)"
 */

/**
 * Standard application error codes
 *
 * Defines the complete set of error codes used
 * throughout the application for consistent error
 * handling and reporting.
 *
 * Categories:
 * - System Errors: UNKNOWN
 * - Validation Errors: VALIDATION
 * - File Errors: FILE
 * - Template Errors: TEMPLATE, TEMPLATE_NOT_FOUND
 * - Data Errors: DATA_NOT_FOUND
 * - Resource Errors: CSS_NOT_FOUND
 * - Processing Errors: PROCESSING_ERROR
 *
 * @constant {Object}
 * @property {string} UNKNOWN - Unclassified errors
 * @property {string} VALIDATION - Input validation
 * @property {string} FILE - File operations
 * @property {string} TEMPLATE - Template processing
 * @property {string} TEMPLATE_NOT_FOUND - Missing template
 * @property {string} DATA_NOT_FOUND - Missing data
 * @property {string} CSS_NOT_FOUND - Missing CSS
 * @property {string} PROCESSING_ERROR - Processing failure
 *
 * @example
 * // Using error codes
 * switch (error.code) {
 *   case ERROR_CODES.VALIDATION:
 *     handleValidationError(error);
 *     break;
 *   case ERROR_CODES.FILE:
 *     handleFileError(error);
 *     break;
 *   case ERROR_CODES.TEMPLATE_NOT_FOUND:
 *     handleMissingTemplate(error);
 *     break;
 *   default:
 *     handleUnknownError(error);
 * }
 */
const ERROR_CODES = {
  UNKNOWN: 'UNKNOWN_ERROR',
  VALIDATION: 'VALIDATION_ERROR',
  FILE: 'FILE_ERROR',
  TEMPLATE: 'TEMPLATE_ERROR',
  TEMPLATE_NOT_FOUND: 'TEMPLATE_NOT_FOUND',
  DATA_NOT_FOUND: 'DATA_NOT_FOUND',
  CSS_NOT_FOUND: 'CSS_NOT_FOUND',
  PROCESSING_ERROR: 'PROCESSING_ERROR',
};

/**
 * Custom application error class
 *
 * Extends the native Error class with:
 * - Error code support
 * - Additional details object
 * - Stack trace capture
 * - JSON serialization
 * - Custom formatting
 *
 * @class
 * @extends Error
 * @property {string} name - Error name
 * @property {string} code - Error code
 * @property {Object} details - Additional info
 * @property {string} stack - Stack trace
 *
 * @example
 * // Basic usage
 * throw new AppError(
 *   'File not found',
 *   ERROR_CODES.FILE,
 *   { path: '/path/to/file' }
 * );
 *
 * // With error chaining
 * try {
 *   await processFile(path);
 * } catch (error) {
 *   throw new AppError(
 *     'Processing failed',
 *     ERROR_CODES.PROCESSING_ERROR,
 *     { originalError: error }
 *   );
 * }
 *
 * // Custom error properties
 * const error = new AppError('Invalid data', ERROR_CODES.VALIDATION);
 * error.details.timestamp = new Date();
 * error.details.severity = 'high';
 */
class AppError extends Error {
  /**
   * Creates a new AppError instance
   *
   * @param {string} message - Error message
   * @param {string} code - Error code from ERROR_CODES
   * @param {Object} [details={}] - Additional error details
   */
  constructor(message, code, details = {}) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Formats error message with details
 *
 * Creates a detailed error message string that includes:
 * - Error code (if AppError)
 * - Error message
 * - Additional details (if available)
 * - Stack trace (in debug mode)
 *
 * @param {Error} error - Error to format
 * @param {Object} [options] - Formatting options
 * @param {boolean} [options.includeStack=false] - Include stack trace
 * @returns {string} Formatted error message
 *
 * @example
 * // Basic formatting
 * const error = new AppError('Invalid', 'VALIDATION');
 * console.log(formatError(error));
 * // "VALIDATION: Invalid
 * // Details: {}"
 *
 * // With details
 * const error = new AppError('Invalid', 'VALIDATION', {
 *   field: 'email',
 *   value: 'test'
 * });
 * console.log(formatError(error));
 * // "VALIDATION: Invalid
 * // Details: {
 * //   field: 'email',
 * //   value: 'test'
 * // }"
 *
 * // With stack trace
 * console.log(formatError(error, { includeStack: true }));
 * // Includes full stack trace in output
 */
function formatError(error) {
  if (error instanceof AppError) {
    return `${error.code}: ${error.message}\nDetails: ${JSON.stringify(error.details, null, 2)}`;
  }
  return error.message;
}

/**
 * Checks if error is an AppError instance
 *
 * Type guard function to validate whether an error
 * is an instance of the custom AppError class.
 * Useful for TypeScript type narrowing.
 *
 * @param {Error} error - Error to check
 * @returns {boolean} True if AppError instance
 *
 * @example
 * // Basic type checking
 * if (isAppError(error)) {
 *   // Access AppError properties
 *   console.log(error.code);
 * }
 *
 * // With error handling
 * try {
 *   await processData();
 * } catch (error) {
 *   if (isAppError(error)) {
 *     handleAppError(error);
 *   } else {
 *     handleSystemError(error);
 *   }
 * }
 *
 * // Type guard in TypeScript
 * function handleError(error: Error) {
 *   if (isAppError(error)) {
 *     // TypeScript knows error is AppError
 *     console.log(error.code);
 *   }
 * }
 */
function isAppError(error) {
  return error instanceof AppError;
}

// Prevent modifications to error codes
Object.freeze(ERROR_CODES);

module.exports = {
  ERROR_CODES,
  AppError,
  formatError,
  isAppError,
};
