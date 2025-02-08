/**
 * @fileoverview Core Document Generation Workflow
 *
 * Manages the main document generation pipeline:
 * - Template processing and validation
 * - Data input handling and validation
 * - Document generation and output
 * - Error handling and logging
 *
 * Functions:
 * - startWorkflow: Executes document generation pipeline
 * - validateInputs: Validates input files and directories
 * - processMarkdownTemplate: Processes markdown templates with data
 *
 * Constants:
 * - MAX_RETRIES: Maximum number of retries for operations (3)
 * - RETRY_DELAY: Delay between retries in milliseconds (1000)
 *
 * Flow:
 * 1. Initialize workflow context and correlation ID
 * 2. Validate input files and data
 * 3. Process markdown template
 * 4. Apply CSS styling
 * 5. Generate output documents
 * 6. Handle errors and cleanup
 *
 * Error Handling:
 * - WorkflowError: Base error for workflow issues
 *   - ValidationError: Input validation failures
 *   - ProcessingError: Template processing issues
 *   - OutputError: Document generation failures
 * - Retry logic for transient failures
 * - Proper error context and logging
 * - Resource cleanup on failure
 *
 * @module @/core/workflow
 * @requires @/utils/common/logger - Logging utilities
 * @requires @/utils/common/errors - Error handling
 * @requires @/utils/common/validateData - Data validation
 * @requires @/config/paths - Path configuration and validation
 * @requires @/utils/template-processor/core/process-template - Template processing
 * @exports {Function} startWorkflow - Main workflow executor
 * @exports {Function} validateInputs - Input validation
 * @exports {Class} WorkflowError - Base workflow error
 * @exports {Class} ValidationError - Validation error
 * @exports {Class} ProcessingError - Processing error
 * @exports {Class} OutputError - Output generation error
 */

const {
  processMarkdownTemplate,
  validateInputs,
} = require('@/utils/template-processor/core/process-template');
const { logger } = require('@/utils/common/logger');
const { validateDirectory } = require('@/config/paths');
const { AppError } = require('@/utils/common/errors');
const {
  processCsvData,
} = require('@/utils/template-processor/core/process-csv');

/**
 * Maximum number of retry attempts for transient operations
 * @constant {number}
 */
const MAX_RETRIES = 3;

/**
 * Delay in milliseconds between retry attempts
 * @constant {number}
 */
const RETRY_DELAY = 1000;

/**
 * Base error class for workflow-related errors
 * Extends AppError to maintain consistent error handling
 *
 * @class WorkflowError
 * @extends AppError
 */
class WorkflowError extends AppError {
  constructor(message, details = {}) {
    super(message, 'WORKFLOW_ERROR', {
      ...details,
      timestamp: new Date().toISOString(),
    });
    this.name = 'WorkflowError';
  }
}

/**
 * Error class for validation failures during workflow
 * Used when input data or files fail validation
 *
 * @class ValidationError
 * @extends WorkflowError
 */
class ValidationError extends WorkflowError {
  constructor(message, details = {}) {
    super(message, {
      ...details,
      type: 'validation',
      severity: 'error',
    });
    this.name = 'ValidationError';
  }
}

/**
 * Error class for template processing failures
 * Used when template transformation or rendering fails
 *
 * @class ProcessingError
 * @extends WorkflowError
 */
class ProcessingError extends WorkflowError {
  constructor(message, details = {}) {
    super(message, {
      ...details,
      type: 'processing',
      severity: 'error',
    });
    this.name = 'ProcessingError';
  }
}

/**
 * Error class for output generation failures
 * Used when file writing or format conversion fails
 *
 * @class OutputError
 * @extends WorkflowError
 */
class OutputError extends WorkflowError {
  constructor(message, details = {}) {
    super(message, {
      ...details,
      type: 'output',
      severity: 'error',
    });
    this.name = 'OutputError';
  }
}

/**
 * Executes the document generation workflow
 *
 * Processes the complete document generation pipeline with proper
 * error handling, retries for transient failures, and comprehensive
 * logging at each step.
 *
 * @async
 * @param {Object} context - Workflow context
 * @param {string} context.templatePath - Path to markdown template
 * @param {string} context.dataPath - Path to data file
 * @param {string} context.cssPath - Path to CSS file
 * @param {string} context.outputDir - Output directory path
 * @param {boolean} context.outputHtml - Generate HTML output
 * @param {boolean} context.outputPdf - Generate PDF output
 * @param {string} [context.correlationId] - Operation correlation ID
 * @returns {Promise<Object>} Processing results
 * @throws {WorkflowError} If workflow fails at any stage
 *
 * @example
 * // Basic usage
 * const result = await startWorkflow({
 *   templatePath: 'contract.md',
 *   dataPath: 'data.csv',
 *   cssPath: 'style.css',
 *   outputDir: './output',
 *   outputHtml: true,
 *   outputPdf: true
 * });
 *
 * // With correlation ID and error handling
 * try {
 *   const result = await startWorkflow({
 *     templatePath: 'contract.md',
 *     correlationId: 'job-123',
 *     ...options
 *   });
 * } catch (error) {
 *   if (error instanceof ValidationError) {
 *     console.error('Invalid input:', error.details);
 *   } else {
 *     console.error('Processing failed:', error);
 *   }
 * }
 */
async function startWorkflow(context) {
  const correlationId = context.correlationId || Date.now().toString(36);
  let cleanup = [];

  try {
    const {
      templatePath,
      dataPath,
      cssPath,
      outputDir,
      outputHtml = true,
      outputPdf = true,
    } = context;

    // Get PATHS after context is loaded to ensure DIR_OUTPUT is set
    const { PATHS } = require('@/config/paths');

    logger.debug('Workflow started', {
      correlationId,
      context: {
        templatePath,
        dataPath,
        cssPath,
        outputDir: outputDir || PATHS.output,
        outputHtml,
        outputPdf,
      },
    });

    // Validate input files with retries
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        await validateInputs(templatePath, dataPath, cssPath);
        break;
      } catch (error) {
        if (attempt === MAX_RETRIES) {
          throw new ValidationError('Input validation failed after retries', {
            attempts: attempt,
            originalError: error.message,
          });
        }
        logger.warn(`Retry ${attempt}/${MAX_RETRIES} validating inputs`, {
          correlationId,
          error: error.message,
        });
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
      }
    }

    // Ensure output directory exists and is writable
    const finalOutputDir = outputDir || PATHS.output;
    await validateDirectory(finalOutputDir, true);

    // Process template
    try {
      // Load and validate CSV data if provided
      let templateData;
      if (dataPath) {
        // Process CSV data
        templateData = await processCsvData(dataPath);

        logger.debug('Template data validated successfully', {
          correlationId,
          fields: Object.keys(templateData),
        });
      }

      const result = await processMarkdownTemplate(
        templatePath,
        dataPath,
        cssPath,
        finalOutputDir,
        templateData // Pass the validated data
      );

      logger.info('Workflow completed successfully', {
        correlationId,
        outputFiles: result.files,
      });

      return result;
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new ProcessingError('Template processing failed', {
        originalError: error.message,
        templatePath,
      });
    }
  } catch (error) {
    logger.error('Workflow failed', {
      correlationId,
      error: error.message,
      code: error.code,
      details: error.details,
    });

    // Perform cleanup if necessary
    for (const cleanupFn of cleanup) {
      try {
        await cleanupFn();
      } catch (cleanupError) {
        logger.error('Cleanup failed', {
          correlationId,
          error: cleanupError.message,
        });
      }
    }

    throw error;
  }
}

module.exports = {
  startWorkflow,
  validateInputs,
  // Export error classes for instanceof checks
  WorkflowError,
  ValidationError,
  ProcessingError,
  OutputError,
};
