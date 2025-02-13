/**
 * @file Contract Generation Workflow System
 *
 * Manages the complete workflow for contract generation:
 * - Template processing
 * - Data integration
 * - Output generation
 * - Resource management
 *
 * Functions:
 * - createWorkflow: Creates workflow instance
 * - executeWorkflow: Runs workflow steps
 * - validateWorkflow: Validates workflow config
 * - generateOutput: Produces final output
 *
 * Constants:
 * - WORKFLOW_TYPES: Available workflow types
 * - DEFAULT_CONFIG: Default workflow settings
 *
 * Flow:
 * 1. Initialize workflow configuration
 * 2. Validate input data and templates
 * 3. Process template with data
 * 4. Generate output files
 * 5. Clean up resources
 *
 * Error Handling:
 * - Configuration validation
 * - Input data validation
 * - Template processing errors
 * - Output generation failures
 * - Resource cleanup issues
 *
 * @module @/core/workflow
 * @requires @/utils/template-processor
 * @requires @/utils/data-processor
 * @requires @/utils/output-generator
 * @requires @/utils/common/errors
 * @exports createWorkflow - Creates workflow instance
 * @exports executeWorkflow - Executes workflow steps
 * @exports validateWorkflow - Validates configuration
 * @exports generateOutput - Generates final output
 * @exports cleanupResources - Cleans temporary files
 * @exports WORKFLOW_TYPES - Available workflow types
 *
 * @example
 * // Create and execute a workflow
 * const { createWorkflow, executeWorkflow } = require('@/core/workflow');
 *
 * const workflow = createWorkflow({
 *   template: 'contract.md',
 *   data: { client: 'ACME Corp' },
 *   output: 'pdf'
 * });
 *
 * const result = await executeWorkflow(workflow);
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
const path = require('path');
const EventEmitter = require('events');
const {
  processTemplate,
} = require('@/utils/template-processor/core/process-template');
const { processCsv } = require('@/utils/template-processor/core/process-csv');

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
 *
 * @class WorkflowError
 * @augments AppError
 *
 * @example
 * throw new WorkflowError('Operation failed', {
 *   type: 'validation',
 *   details: { field: 'name' }
 * });

 */
class WorkflowError extends AppError {
  /**
   * Creates a new workflow error
   *
   * @param {string} message - Error message
   * @param {Record<string, unknown>} [details={}] - Additional error details
   */
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
 *
 * @class ValidationError
 * @augments WorkflowError
 *
 * @example
 * throw new ValidationError('Invalid input', {
 *   field: 'email',
 *   value: 'invalid'
 * });

 */
class ValidationError extends WorkflowError {
  /**
   * Creates a new validation error
   *
   * @param {string} message - Error message
   * @param {Record<string, unknown>} [details={}] - Additional error details
   */
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
 *
 * @class ProcessingError
 * @augments WorkflowError
 *
 * @example
 * throw new ProcessingError('Template processing failed', {
 *   template: 'invoice.md',
 *   reason: 'syntax error'
 * });

 */
class ProcessingError extends WorkflowError {
  /**
   * Creates a new processing error
   *
   * @param {string} message - Error message
   * @param {Record<string, unknown>} [details={}] - Additional error details
   */
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
 *
 * @class OutputError
 * @augments WorkflowError
 *
 * @example
 * throw new OutputError('PDF generation failed', {
 *   file: 'output.pdf',
 *   reason: 'disk full'
 * });

 */
class OutputError extends WorkflowError {
  /**
   * Creates a new output error
   *
   * @param {string} message - Error message
   * @param {Record<string, unknown>} [details={}] - Additional error details
   */
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
 * Cleanup handler for resources
 *
 * @param {Array} cleanupTasks - Array of cleanup functions to execute
 * @returns {Promise<void>}
 */
async function cleanupResources(cleanupTasks) {
  if (!cleanupTasks || !cleanupTasks.length) return;

  logger.debug('Starting resource cleanup', {
    taskCount: cleanupTasks.length,
  });

  await Promise.all(
    cleanupTasks.map((task) =>
      task().catch((error) => {
        logger.warn('Cleanup task failed:', {
          error: error.message,
          stack: error.stack,
        });
      })
    )
  );

  logger.debug('Resource cleanup completed');
}

/**
 * Executes the document generation workflow
 *
 * Processes the complete document generation pipeline with proper
 * error handling, retries for transient failures, and comprehensive
 * logging at each step.
 *
 * @async
 * @param {object} context - Workflow context
 * @param {string} context.templatePath - Path to markdown template
 * @param {string} context.dataPath - Path to data file
 * @param {string} context.cssPath - Path to CSS file
 * @param {string} context.outputDir - Output directory path
 * @param {boolean} [context.outputHtml=true] - Generate HTML output
 * @param {boolean} [context.outputPdf=true] - Generate PDF output
 * @param {string} [context.correlationId] - Operation correlation ID
 * @returns {Promise<Record<string, unknown>>} Processing results
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
  const cleanupTasks = [];

  try {
    //prettier-ignore
    const {
      templatePath,
      dataPath,
      cssPath,
      outputDir,
      options = {},
    } = context;

    // Get PATHS after context is loaded to ensure DIR_OUTPUT is set
    const { PATHS } = require('@/config/paths');

    // Log initial paths for debugging
    logger.debug('Initial paths in workflow:', {
      templatePath,
      dataPath,
      cssPath,
      outputDir,
      options,
      PATHS_templates: PATHS.templates,
      PATHS_output: PATHS.output,
      isTemplateAbsolute: path.isAbsolute(templatePath),
      isDataAbsolute: dataPath ? path.isAbsolute(dataPath) : null,
      isCssAbsolute: cssPath ? path.isAbsolute(cssPath) : null,
    });

    // Validate input files with retries
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        await validateInputs(templatePath, dataPath, cssPath);
        logger.debug('Input validation successful on attempt', { attempt });
        break;
      } catch (error) {
        if (attempt === MAX_RETRIES) {
          throw new ValidationError('Input validation failed after retries', {
            attempts: attempt,
            originalError: error.message,
            paths: {
              templatePath,
              dataPath,
              cssPath,
            },
          });
        }
        logger.warn(`Retry ${attempt}/${MAX_RETRIES} validating inputs`, {
          correlationId,
          error: error.message,
          paths: {
            templatePath,
            dataPath,
            cssPath,
          },
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
        logger.debug('Processing CSV data', { dataPath });
        templateData = await processCsvData(dataPath);
        logger.debug('CSV data processed successfully', {
          dataPath,
          fields: Object.keys(templateData),
        });
      }

      // Process template with data
      const result = await processMarkdownTemplate(
        templatePath,
        dataPath,
        cssPath,
        finalOutputDir,
        options
      );
      logger.info('Template processing completed', {
        context: 'workflow',
        filename: 'workflow.js',
      });

      return result;
    } catch (error) {
      logger.error('Template processing failed', {
        error: error.message,
        stack: error.stack,
        templatePath,
        dataPath,
        cssPath,
      });

      if (error instanceof ValidationError) {
        throw error;
      }

      throw new ProcessingError('Template processing failed', {
        originalError: error.message,
        stack: error.stack,
        paths: {
          templatePath,
          dataPath,
          cssPath,
        },
      });
    }
  } catch (error) {
    logger.error('Workflow failed', {
      correlationId,
      error: error.message,
      code: error.code,
      details: error.details,
      stack: error.stack,
    });

    // Perform cleanup if necessary
    for (const cleanupFn of cleanupTasks) {
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
  } finally {
    // Ensure cleanup runs even if there's an error
    await cleanupResources(cleanupTasks);

    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }

    // Small delay to ensure all resources are released
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
}

/**
 * Base workflow class with common functionality
 *
 * @class BaseWorkflow
 * @augments EventEmitter
 *
 * @example
 * const workflow = new BaseWorkflow({
 *   template: 'template.md',
 *   data: { name: 'John' },
 *   output: 'pdf'
 * });
 *
 * workflow.on('progress', (progress) => {
 *   console.log(`Progress: ${progress}%`);
 * });
 *
 * await workflow.execute();
 */
class BaseWorkflow extends EventEmitter {
  /**
   * Creates a new workflow instance
   *
   * @param {{template: string, data: Record<string, unknown>, output: string}} config - Workflow configuration
   */
  constructor(config) {
    super();
    this.config = config;
  }

  /**
   * Executes the workflow
   *
   * @param {{correlationId: string, logger: Record<string, unknown>}} context - Execution context
   * @returns {Promise<Record<string, unknown>>} The workflow result
   *
   * @example
   * const result = await workflow.execute({
   *   correlationId: 'abc123',
   *   logger: console
   * });
   */
  async execute(context) {
    this.emit('start', { context });
    try {
      const result = await this._process();
      this.emit('complete', { result });
      return result;
    } catch (error) {
      this.emit('error', { error });
      throw error;
    }
  }

  /**
   * Internal processing method
   *
   * @returns {Promise<Record<string, unknown>>} Processing result
   * @private
   */
  async _process() {
    // To be implemented by subclasses
    throw new Error('Not implemented');
  }
}

/**
 * Contract workflow for processing markdown templates
 *
 * @class ContractWorkflow
 * @augments BaseWorkflow
 *
 * @example
 * const workflow = new ContractWorkflow({
 *   template: 'contract.md',
 *   data: { client: 'ACME Corp' },
 *   output: 'pdf'
 * });
 *
 * await workflow.execute();
 */
class ContractWorkflow extends BaseWorkflow {
  /**
   * Internal processing method
   *
   * @returns {Promise<Record<string, unknown>>} Processing result
   * @private
   */
  async _process() {
    const { template, data } = this.config;
    const result = await processTemplate(template, data);
    return result;
  }
}

/**
 * CSV workflow for processing data files
 *
 * @class CsvWorkflow
 * @augments BaseWorkflow
 *
 * @example
 * const workflow = new CsvWorkflow({
 *   template: 'data.csv',
 *   data: { rows: [...] },
 *   output: 'json'
 * });
 *
 * await workflow.execute();
 */
class CsvWorkflow extends BaseWorkflow {
  /**
   * Internal processing method
   *
   * @returns {Promise<Record<string, unknown>>} Processing result
   * @private
   */
  async _process() {
    const { template, data } = this.config;
    const result = await processCsv(template, data);
    return result;
  }
}

// Export the workflow classes and utilities
module.exports = {
  startWorkflow,
  validateInputs,
  // Export error classes for instanceof checks
  WorkflowError,
  ValidationError,
  ProcessingError,
  OutputError,
  BaseWorkflow,
  ContractWorkflow,
  CsvWorkflow,
};
