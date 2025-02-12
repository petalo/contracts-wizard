#!/usr/bin/env node

/**
 * @file Command Line Interface for Contracts Wizard
 *
 * Main entry point for the Contracts Wizard CLI application.
 * Provides commands for project initialization and contract generation
 * through both interactive and command-line modes.
 *
 * Functions:
 * - initProject: Creates new project with directory structure and example files
 * - generateContract: Processes templates and data to generate contract documents
 * - validateInputs: Validates all input files and their accessibility
 * - createContext: Creates application context object
 * - handleListCommand: Handles the list command to display available resources
 * - cleanupAndExit: Performs cleanup operations and exits the process
 * - ValidationError: Custom error for validation failures
 * - ConfigurationError: Custom error for configuration issues
 * - FileSystemError: Custom error for file system operations
 * - ProcessingError: Custom error for template processing issues
 *
 * Constants:
 * - DEFAULT_LOG_LEVEL: Default logging level for the application
 * - MAX_RETRIES: Maximum number of retries for operations (3)
 * - RETRY_DELAY: Delay between retries in milliseconds (1000)
 *
 * Flow:
 * 1. Parse command line arguments and environment setup
 * 2. Configure verbose mode if --verbose flag is present
 * 3. Validate environment configuration
 * 4. Initialize logging and global error handling
 * 5. Parse commands and options using Commander
 * 6. Execute appropriate command handler:
 *    - Interactive mode: Guide user through prompts
 *    - Generate: Process template and create documents
 *    - Init: Create new project structure
 *    - List: Display available resources
 * 7. Handle results and cleanup
 * 8. Global error handling for uncaught exceptions
 *
 * Error Handling:
 * - ValidationError: Invalid input files or formats
 * - ConfigurationError: Missing or invalid configuration
 * - FileSystemError: File access or permission issues
 * - ProcessingError: Template or data processing failures
 * - NetworkError: External service communication issues
 * - Global handlers for unhandledRejection and uncaughtException
 * - Cleanup operations before exit
 * - Resource release on exit
 *
 * @module bin/contracts-wizard
 * @requires commander - Command-line interface
 * @requires path - Path manipulation
 * @requires fs/promises - File system operations
 * @requires dotenv - Environment configuration
 * @requires module-alias/register - Module path aliases
 * @requires @/core/workflow - Contract generation workflow
 * @requires @/utils/common/errors - Error handling
 * @requires @/utils/common/logger - Logging system
 * @requires @/cli/display - CLI output formatting
 * @requires @/cli/commands - Command handlers
 * @requires @/cli/prompts - Interactive prompts
 * @requires @/config/paths - Path configuration
 * @requires @/config/env-validation - Environment validation
 * @requires @/utils/template-processor/generators/csv - CSV template generation
 * @requires @/utils/template-processor/core/process-template - Template processing
 * @requires @/cli/verbose - Verbose mode configuration
 *
 * @example
 * // Initialize new project
 * contracts-wizard init my-contracts
 *
 * // Generate contract in interactive mode
 * contracts-wizard
 *
 * // Generate contract with command line arguments
 * contracts-wizard generate -t template.md -d data.csv -c style.css
 *
 * // List available resources
 * contracts-wizard list templates
 *
 * // Enable verbose mode
 * contracts-wizard --verbose
 */

const path = require('path');

// Configure aliases before any imports
require('module-alias').addAliases({
  '@': path.join(__dirname, '../src'),
  '@src': path.join(__dirname, '../src'),
  '@utils': path.join(__dirname, '../src/utils'),
  '@core': path.join(__dirname, '../src/core'),
  '@cli': path.join(__dirname, '../src/cli'),
  '@config': path.join(__dirname, '../src/config'),
});

// Load environment variables early
require('dotenv').config();

const { program } = require('commander');
const { logger } = require('@/utils/common/logger');
const { configureVerboseMode } = require('@/cli/verbose');

// Configure console output for verbose mode
if (process.argv.includes('--verbose')) {
  configureVerboseMode(logger);
}

// Add global verbose option
program
  .option('--verbose', 'Enable verbose output (same as DEBUG=true)')
  .hook('preAction', (thisCommand) => {
    // Enable debug mode if --verbose is used
    if (thisCommand.opts().verbose) {
      process.env.DEBUG = 'true';
      process.env.LOG_LEVEL = 'debug';
      process.env.LOG_TO_CONSOLE = 'true';
    }
  });

// Log inicio de ejecución
logger.logExecutionStart();

// Parse command line arguments to get the output directory early
const args = process.argv.slice(2);
const outputIndex =
  args.indexOf('--output') !== -1
    ? args.indexOf('--output')
    : args.indexOf('-o');

if (outputIndex !== -1 && outputIndex + 1 < args.length) {
  const output = args[outputIndex + 1];
  const outputDir = path.isAbsolute(output)
    ? output
    : path.join(process.cwd(), output);
  process.env.DIR_OUTPUT = outputDir;
}

const fs = require('fs').promises;
const { startWorkflow } = require('@/core/workflow');
const { AppError } = require('@/utils/common/errors');
const { display } = require('@/cli/display');
const { PATHS } = require('@/config/paths');
const { validateDirectory } = require('@/config/paths');
const {
  selectMarkdownTemplate,
  selectInputMethod,
  selectDataFile,
  selectCssFile,
} = require('@/cli/prompts');
const {
  generateCsvTemplate,
} = require('@/utils/template-processor/generators/csv');
const { handleListCommand } = require('@/cli/commands');
const { validateEnv } = require('@/config/env-validation');
const {
  validateInputs: validateFiles,
} = require('@/utils/template-processor/core/process-template');

// Validate environment configuration before starting
validateEnv();

// Set up global error handlers for uncaught errors
process.on('unhandledRejection', (error) => {
  if (error instanceof AppError) {
    logger.error(error.message, {
      code: error.code,
      details: error.details,
    });
    process.exit(1);
  }
  logger.error('Unhandled rejection:', error);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  if (error instanceof AppError) {
    logger.error(error.message, {
      code: error.code,
      details: error.details,
    });
    process.exit(1);
  }
  logger.error('Uncaught exception:', error);
  process.exit(1);
});

// Add constants
const DEFAULT_LOG_LEVEL = 'info';
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

// Add custom error classes
/**
 * Custom error class for validation failures
 * Represents errors that occur during input validation
 *
 * @example
 * throw new ValidationError('Invalid template format', {
 *   template: 'contract.md',
 *   reason: 'Missing required sections'
 * });
 */
class ValidationError extends AppError {
  /**
   * Creates a new ValidationError instance
   *
   * @param {string} message - Error message
   * @param {object} details - Additional error details
   */
  constructor(message, details) {
    super(message, 'VALIDATION_ERROR', details);
    this.name = 'ValidationError';
  }
}

/**
 * Custom error class for configuration issues
 * Represents errors related to application configuration
 *
 * @example
 * throw new ConfigurationError('Missing required environment variable', {
 *   variable: 'API_KEY',
 *   source: '.env'
 * });
 */
class ConfigurationError extends AppError {
  /**
   * Creates a new ConfigurationError instance
   *
   * @param {string} message - Error message
   * @param {object} details - Additional error details
   */
  constructor(message, details) {
    super(message, 'CONFIG_ERROR', details);
    this.name = 'ConfigurationError';
  }
}

/**
 * Custom error class for file system operations
 * Represents errors that occur during file system interactions
 *
 * @example
 * throw new FileSystemError('Failed to create directory', {
 *   path: '/path/to/dir',
 *   reason: 'Permission denied'
 * });
 */
class FileSystemError extends AppError {
  /**
   * Creates a new FileSystemError instance
   *
   * @param {string} message - Error message
   * @param {object} details - Additional error details
   */
  constructor(message, details) {
    super(message, 'FILESYSTEM_ERROR', details);
    this.name = 'FileSystemError';
  }
}

/**
 * Custom error class for template processing issues
 * Represents errors that occur during template compilation or rendering
 *
 * @example
 * throw new ProcessingError('Failed to compile template', {
 *   template: 'invoice.md',
 *   reason: 'Invalid syntax at line 42'
 * });
 */
class ProcessingError extends AppError {
  /**
   * Creates a new ProcessingError instance
   *
   * @param {string} message - Error message
   * @param {object} details - Additional error details
   */
  constructor(message, details) {
    super(message, 'PROCESSING_ERROR', details);
    this.name = 'ProcessingError';
  }
}

/**
 * Creates a new Contracts Wizard project with the required directory structure
 * and example files.
 *
 * Creates a complete project structure with all necessary directories,
 * configuration files, and examples. Implements proper error handling
 * and validation for all file system operations.
 *
 * Project Structure:
 * - templates/markdown: For contract templates
 * - templates/css: For styling templates
 * - templates/images: For image assets
 * - data-csv: For CSV data files
 * - output: For generated contracts
 * - logs: For application logs
 *
 * @param {string} projectName - Name of the project directory to create
 * @throws {ValidationError} When project name is invalid
 * @throws {FileSystemError} When file system operations fail
 * @throws {ConfigurationError} When unable to create required configuration
 * @example
 * try {
 *   await initProject('my-contracts');
 *   console.log('Project created successfully');
 * } catch (error) {
 *   console.error('Project creation failed:', error);
 * }
 */
async function initProject(projectName) {
  const correlationId = Date.now().toString(36);
  logger.info('Starting project initialization', {
    correlationId,
    projectName,
  });

  // Validate project name
  if (!projectName || !/^[\w-]+$/.test(projectName)) {
    throw new ValidationError('Invalid project name', {
      projectName,
      message:
        'Project name must contain only letters, numbers, underscores, and hyphens',
    });
  }

  const projectPath = path.join(process.cwd(), projectName);

  try {
    display.status.info(`Creating project ${projectName}...`);

    // Check if project directory already exists
    try {
      await fs.access(projectPath);
      throw new ValidationError('Project directory already exists', {
        path: projectPath,
      });
    } catch (error) {
      // Directory doesn't exist, which is what we want
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }

    // Create project directory
    await fs.mkdir(projectPath);

    // Define directory structure
    const dirs = [
      'templates/markdown',
      'templates/css',
      'templates/images',
      'data-csv',
      'output',
      'logs',
    ];

    // Create all required directories
    for (const dir of dirs) {
      const dirPath = path.join(projectPath, dir);
      try {
        await fs.mkdir(dirPath, { recursive: true });
        logger.debug('Created directory', {
          correlationId,
          path: dir,
        });
      } catch (error) {
        throw new FileSystemError(`Failed to create directory: ${dir}`, {
          path: dirPath,
          originalError: error.message,
        });
      }
    }

    display.status.info('Creating example files...');

    // Copy example files from package templates
    const packageRoot = path.join(__dirname, '..');
    const examples = [
      [
        'examples/markdown/office_lease_EN.example.md',
        'templates/markdown/office_lease_EN.example.md',
      ],
      [
        'examples/css/contract.example.css',
        'templates/css/contract.example.css',
      ],
      [
        'examples/csv/office_lease_EN.example.csv',
        'data-csv/office_lease_EN.example.csv',
      ],
    ];

    // Copy each example file to its destination
    for (const [src, dest] of examples) {
      const srcPath = path.join(packageRoot, src);
      const destPath = path.join(projectPath, dest);
      try {
        await fs.copyFile(srcPath, destPath);
        logger.debug('Copied example file', {
          correlationId,
          source: src,
          destination: dest,
        });
      } catch (error) {
        throw new FileSystemError(`Failed to copy example file: ${src}`, {
          source: srcPath,
          destination: destPath,
          originalError: error.message,
        });
      }
    }

    // Create package.json with basic configuration
    const pkg = {
      name: projectName,
      version: '1.0.0',
      private: true,
      scripts: {
        start: 'contracts-wizard',
        dev: 'DEBUG=true contracts-wizard',
        test: 'echo "Error: no test specified" && exit 1',
      },
      dependencies: {
        'contracts-wizard': '^1.0.0',
      },
    };

    try {
      await fs.writeFile(
        path.join(projectPath, 'package.json'),
        JSON.stringify(pkg, null, 2)
      );
      logger.debug('Created package.json', { correlationId });
    } catch (error) {
      throw new FileSystemError('Failed to create package.json', {
        path: path.join(projectPath, 'package.json'),
        originalError: error.message,
      });
    }

    // Create .env with default configuration
    const envContent = `NODE_ENV=development
LOG_LEVEL=info
LOG_ENABLED=true
DIR_OUTPUT=./output
DIR_TEMPLATES=./templates
DIR_CSS=./templates/css
DIR_IMAGES=./templates/images
DIR_CSV=./data-csv
DEBUG=false`;

    try {
      await fs.writeFile(path.join(projectPath, '.env'), envContent);
      logger.debug('Created .env file', { correlationId });
    } catch (error) {
      throw new FileSystemError('Failed to create .env file', {
        path: path.join(projectPath, '.env'),
        originalError: error.message,
      });
    }

    logger.info('Project initialization completed successfully', {
      correlationId,
      projectName,
      path: projectPath,
    });

    display.status.success(`Project ${projectName} created successfully!`);
    display.status.info(`
Next steps:
1. cd ${projectName}
2. npm install
3. Review the example files in templates/
4. Run 'npm start' to start using the tool

For more information, see the documentation at:
https://github.com/petalo/contracts-wizard`);
  } catch (error) {
    logger.error('Project initialization failed', {
      correlationId,
      error: error.message,
      code: error.code,
      details: error.details,
      projectName,
      path: projectPath,
    });

    // Clean up if project creation failed
    try {
      if (
        await fs
          .access(projectPath)
          .then(() => true)
          .catch(() => false)
      ) {
        await fs.rm(projectPath, {
          recursive: true,
          force: true,
        });
        logger.debug('Cleaned up failed project directory', {
          correlationId,
          path: projectPath,
        });
      }
    } catch (cleanupError) {
      logger.error('Failed to clean up project directory', {
        correlationId,
        error: cleanupError.message,
        path: projectPath,
      });
    }

    if (error instanceof AppError) {
      throw error;
    }
    throw new FileSystemError('Project initialization failed', {
      originalError: error.message,
    });
  }
}

/**
 * Creates and initializes the application context object
 *
 * Builds a context object that contains configuration settings,
 * file paths, and runtime options. Validates required paths
 * and settings before creating the context.
 *
 * @param {object} options - CLI options and configuration
 * @param {string} [options.template] - Path to template file
 * @param {string} [options.data] - Path to data file
 * @param {string} [options.css] - Path to CSS file
 * @param {boolean} [options.debug] - Enable debug mode
 * @param {string} [options.output] - Output directory path
 * @throws {ConfigurationError} When required configuration is missing
 * @returns {object} Initialized application context
 * @example
 * const context = createContext({
 *   template: './template.md',
 *   data: './data.csv',
 *   debug: true
 * });
 *
 * // Use context in workflow
 * await startWorkflow(context);
 */
function createContext(options = {}) {
  // Validate required paths
  if (!PATHS.base) {
    throw new ConfigurationError('Base path is not configured');
  }

  // Create context with validated paths
  const context = {
    ...options,
    paths: {
      base: PATHS.base,
      templates: PATHS.templates || path.join(PATHS.base, 'templates'),
      css: PATHS.css || path.join(PATHS.base, 'templates/css'),
      output: PATHS.output || path.join(PATHS.base, 'output'),
    },
    config: {
      debug: process.env.DEBUG === 'true' || options.debug === true,
      env: process.env.NODE_ENV || 'development',
      logLevel: process.env.LOG_LEVEL || DEFAULT_LOG_LEVEL,
    },
  };

  // Log context creation for debugging
  logger.debug('Created application context', {
    paths: context.paths,
    config: context.config,
    options: {
      ...options,
      // Exclude potentially sensitive data
      template: options.template ? path.basename(options.template) : undefined,
      data: options.data ? path.basename(options.data) : undefined,
      css: options.css ? path.basename(options.css) : undefined,
    },
  });

  return context;
}

/**
 * Generates contract documents from template and data files
 *
 * Processes the template with optional data and styling to generate
 * HTML and PDF output files. Implements retry logic for file operations
 * and proper error handling for all steps of the generation process.
 *
 * @param {object} options - Generation options
 * @param {string} options.template - Path to markdown template
 * @param {string} [options.data] - Path to CSV data file
 * @param {string} [options.css] - Path to CSS styling file
 * @param {string} [options.output] - Output directory path
 * @throws {ValidationError} When input validation fails
 * @throws {FileSystemError} When file operations fail
 * @throws {ProcessingError} When template processing fails
 * @example
 * try {
 *   await generateContract({
 *     template: './templates/contract.md',
 *     data: './data/input.csv',
 *     css: './styles/theme.css',
 *     output: './output'
 *   });
 * } catch (error) {
 *   console.error('Contract generation failed:', error);
 * }
 */

/**
 * Generates contract documents from template and data files
 *
 * Processes the template with optional data and styling to generate
 * HTML and PDF output files. Implements retry logic for file operations
 * and proper error handling for all steps of the generation process.
 */
// prettier-ignore
async function generateContract({
  template,
  data,
  css,
  output,
}) {
  const correlationId = Date.now().toString(36);
  logger.info('Starting contract generation', {
    correlationId,
    template: path.basename(template),
    hasData: !!data,
    hasCss: !!css,
  });

  try {
    // Convert paths to absolute if relative
    const templatePath = path.isAbsolute(template)
      ? template
      : path.join(process.cwd(), template);
    const dataPath = data
      ? path.isAbsolute(data)
        ? data
        : path.join(process.cwd(), data)
      : null;
    const cssPath = css
      ? path.isAbsolute(css)
        ? css
        : path.join(process.cwd(), css)
      : null;
    const outputDir = output
      ? path.isAbsolute(output)
        ? output
        : path.join(process.cwd(), output)
      : PATHS.output;

    logger.debug('Resolved paths', {
      correlationId,
      templatePath,
      dataPath,
      cssPath,
      outputDir,
    });

    // Validate files exist and are accessible
    await validateFiles(templatePath, dataPath, cssPath);

    // Ensure output directory exists and is writable
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        await validateDirectory(outputDir, true);
        break;
      } catch (error) {
        if (attempt === MAX_RETRIES) {
          throw new FileSystemError('Failed to validate output directory', {
            path: outputDir,
            attempts: attempt,
            originalError: error.message,
          });
        }
        logger.warn(
          `Retry ${attempt}/${MAX_RETRIES} validating output directory`,
          {
            correlationId,
            path: outputDir,
            error: error.message,
          }
        );
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
      }
    }

    display.status.info('Processing template...');

    // Create context with validated paths
    const context = {
      templatePath,
      dataPath,
      cssPath,
      outputDir,
      outputHtml: true,
      outputPdf: true,
      correlationId,
    };

    logger.debug('Starting workflow with context', {
      correlationId,
      context: {
        ...context,
        // Exclude full paths from logs
        templatePath: path.basename(templatePath),
        dataPath: dataPath ? path.basename(dataPath) : null,
        cssPath: cssPath ? path.basename(cssPath) : null,
      },
    });

    // Start workflow with context
    const result = await startWorkflow(context);

    logger.info('Contract generation completed successfully', {
      correlationId,
      outputFiles: result.files,
    });

    return result;
  } catch (error) {
    logger.error('Contract generation failed', {
      correlationId,
      error: error.message,
      code: error.code,
      details: error.details,
      paths: {
        template: path.basename(template),
        data: data ? path.basename(data) : null,
        css: css ? path.basename(css) : null,
        output,
      },
    });

    // Rethrow with appropriate error type
    if (error instanceof AppError) {
      throw error;
    }
    throw new ProcessingError('Contract generation failed', {
      originalError: error.message,
    });
  }
}

// Handle interactive mode
/**
 * Interactive mode command handler
 *
 * Guides the user through the contract generation process with interactive prompts:
 * 1. Template selection from available markdown files
 * 2. Input method selection (CSV file or create new)
 * 3. Data file selection or generation
 * 4. CSS theme selection
 *
 * The function handles all user interactions and executes the appropriate
 * workflow based on user choices. Includes proper error handling and
 * cleanup on exit.
 *
 * Flow:
 * 1. Start interactive mode
 * 2. Select template file
 * 3. Choose input method
 * 4. Select/create data file
 * 5. Select CSS theme
 * 6. Generate contract
 * 7. Clean up and exit
 *
 * Error Handling:
 * - Invalid file selections
 * - File access issues
 * - Template generation failures
 * - Contract generation errors
 *
 * @throws {ValidationError} When selected files are invalid
 * @throws {FileSystemError} When file operations fail
 * @throws {ProcessingError} When contract generation fails
 */
program.description('Generate contracts interactively').action(async () => {
  try {
    logger.debug('=== INTERACTIVE MODE STARTED ===');
    display.status.info('Starting interactive mode...');

    // Step 1: Template selection
    const template = await selectMarkdownTemplate();
    logger.debug('Template selected:', { template });

    // Step 2: Input method selection
    const inputMethod = await selectInputMethod();
    logger.debug('Input method selected:', { inputMethod });

    // Step 3: Data file selection or creation
    let data;
    if (inputMethod === 'csv') {
      data = await selectDataFile(template);
      logger.debug('Data file selected:', { data });
    } else if (inputMethod === 'create') {
      // Generate new CSV template from markdown
      display.status.info('Generating CSV template from markdown...');
      data = await generateCsvTemplate(template);
      display.status.success(`CSV template generated at: ${data}`);
      display.status.info(
        'Please fill in the CSV file and run the command again with the filled file.'
      );
      // Asegurar que todos los procesos se cierren antes de salir
      await cleanupAndExit(0);
      return;
    } else {
      // No data input selected
      data = null;
      logger.debug('No data input selected');
    }

    // Step 4: CSS theme selection
    const css = await selectCssFile();
    logger.debug('CSS file selected:', { css });

    // Use default output directory
    const outputDir = process.env.DIR_OUTPUT || 'output_files';
    logger.debug('Using default output directory:', { outputDir });

    // Convert all paths to absolute
    const templatePath = path.isAbsolute(template)
      ? template
      : path.join(process.cwd(), template);
    const dataPath = data
      ? path.isAbsolute(data)
        ? data
        : path.join(process.cwd(), data)
      : null;
    const cssPath = css
      ? path.isAbsolute(css)
        ? css
        : path.join(process.cwd(), css)
      : null;

    // Validate all files exist and are accessible
    await validateFiles(templatePath, dataPath, cssPath);
    await validateDirectory(outputDir, true);

    // Create context with validated paths
    const context = {
      templatePath,
      dataPath,
      cssPath,
      outputDir,
      outputHtml: true,
      outputPdf: true,
    };

    logger.debug('Starting workflow with context:', context);

    // Execute workflow with collected information
    await startWorkflow(context);

    display.status.success('Contract generated successfully!');
    // Asegurar que todos los procesos se cierren antes de salir
    await cleanupAndExit(0);
  } catch (error) {
    logger.error('Interactive mode failed:', error);

    if (error instanceof AppError) {
      console.error(`Error: ${error.message} (${error.code})`);
    } else {
      console.error(`Error: ${error.message}`);
    }

    console.error('\nFor detailed error information:');
    console.error('1. Set DEBUG=true in your .env file');
    console.error(
      `2. Check the log file at: ${process.env.LATEST_LOG_PATH || 'logs/logging-latest.log'}`
    );

    // Asegurar que todos los procesos se cierren antes de salir con error
    await cleanupAndExit(1);
  }
});

/**
 * Performs cleanup operations and exits the process
 * Ensures all resources are properly released before exit
 *
 * @param {number} code - Exit code to use when terminating the process
 * @returns {Promise<void>}
 * @example
 * // Clean up and exit with success code
 * await cleanupAndExit(0);
 *
 * // Clean up and exit with error code
 * await cleanupAndExit(1);
 */
async function cleanupAndExit(code) {
  // Force cleanup of any remaining resources
  if (global.gc) {
    try {
      global.gc();
    } catch (error) {
      logger.warn('Failed to force garbage collection:', error);
    }
  }

  // Ensure all file handles are closed
  await new Promise((resolve) => setTimeout(resolve, 100));

  // Ensure all loggers are flushed
  await new Promise((resolve) => {
    const loggers = logger.getLoggers ? logger.getLoggers() : [];
    if (loggers.length > 0) {
      Promise.all(loggers.map((l) => l.end())).then(resolve);
    } else {
      resolve();
    }
  });

  // Kill any remaining child processes
  const processes = process
    ._getActiveHandles()
    .filter((h) => h._handle && h._handle.hasRef());
  if (processes.length > 0) {
    processes.forEach((p) => {
      try {
        if (typeof p.destroy === 'function') p.destroy();
        else if (typeof p.kill === 'function') p.kill();
      } catch (error) {
        logger.warn('Failed to kill process:', error);
      }
    });
  }

  // Final delay to ensure everything is cleaned up
  await new Promise((resolve) => setTimeout(resolve, 100));

  // Force exit
  process.exit(code);
}

// Handle generate command
/**
 * Generate command handler
 *
 * Processes contract generation from command line arguments.
 * Allows specifying template, data, CSS, and output paths directly.
 *
 * Options:
 * - template (-t): Required. Path to markdown template file
 * - data (-d): Optional. Path to CSV data file
 * - css (-c): Optional. Path to CSS style file
 * - output (-o): Optional. Output directory for generated files
 *
 * Flow:
 * 1. Validate command options
 * 2. Convert paths to absolute
 * 3. Validate file existence and accessibility
 * 4. Generate contract documents
 * 5. Clean up and exit
 *
 * Error Handling:
 * - Missing required template
 * - Invalid file paths
 * - File access issues
 * - Contract generation failures
 *
 * @throws {ValidationError} When required files are missing or invalid
 * @throws {FileSystemError} When file operations fail
 * @throws {ProcessingError} When contract generation fails
 *
 * @example
 * contracts-wizard generate -t template.md -d data.csv -c style.css -o output/
 */
program
  .command('generate')
  .description('Generate contract documents from template and data')
  .requiredOption('-t, --template <path>', 'Path to markdown template file')
  .option('-d, --data <path>', 'Path to CSV data file')
  .option('-c, --css <path>', 'Path to CSS style file')
  .option('-o, --output <dir>', 'Output directory for generated files')
  .action(async (options) => {
    try {
      await generateContract({
        template: options.template,
        data: options.data,
        css: options.css,
        output: options.output,
      });
      process.exit(0);
    } catch (error) {
      logger.error('Contract generation failed:', error);
      if (error instanceof AppError) {
        console.error(`Error: ${error.message} (${error.code})`);
      } else {
        console.error(`Error: ${error.message}`);
      }
      console.error('\nFor detailed error information:');
      console.error('1. Set DEBUG=true in your .env file');
      console.error(
        `2. Check the log file at: ${process.env.LATEST_LOG_PATH || 'logs/latest.log'}`
      );
      process.exit(1);
    }
  });

// Handle list command
/**
 * List command handler
 *
 * Lists available contract templates and data files.
 * Displays paths and basic information about each file.
 *
 * Options:
 * - templates (-t): Optional. Show only template files
 * - data (-d): Optional. Show only data files
 * - css (-c): Optional. Show only CSS files
 *
 * Flow:
 * 1. Scan configured directories
 * 2. Filter files by type based on options
 * 3. Format and display file information
 * 4. Clean up and exit
 *
 * Error Handling:
 * - Directory access issues
 * - File read failures
 * - Invalid file types
 *
 * @throws {FileSystemError} When directory or file operations fail
 *
 * @example
 * contracts-wizard list -t  # List only templates
 * contracts-wizard list     # List all files
 */
program
  .command('list')
  .description('List available templates and data files')
  .option('-t, --templates', 'Show only template files')
  .option('-d, --data', 'Show only data files')
  .option('-c, --css', 'Show only CSS files')
  .action(async (options) => {
    try {
      if (options.templates) {
        await handleListCommand('templates');
      } else if (options.data) {
        await handleListCommand('data');
      } else if (options.css) {
        await handleListCommand('css');
      } else {
        // If no option specified, show all
        await handleListCommand('all');
      }
    } catch (error) {
      logger.error('List command failed:', error);
      process.exit(1);
    }
  });

// Handle init command
/**
 * Init command handler
 *
 * Initializes a new contracts project with default structure and example files.
 * Creates necessary directories and configuration files.
 *
 * Options:
 * - force (-f): Optional. Overwrite existing files
 * - minimal (-m): Optional. Create minimal project structure
 *
 * Flow:
 * 1. Check if directory is empty or force flag is set
 * 2. Create project structure:
 *    - templates/
 *    - data/
 *    - styles/
 *    - output/
 * 3. Copy example files
 * 4. Generate configuration file
 * 5. Clean up and exit
 *
 * Error Handling:
 * - Directory already exists and no force flag
 * - File system permission issues
 * - Template copy failures
 *
 * @throws {FileSystemError} When directory or file operations fail
 * @throws {ConfigError} When configuration generation fails
 *
 * @example
 * contracts-wizard init      # Normal initialization
 * contracts-wizard init -f   # Force initialization
 */
program
  .command('init')
  .description('Initialize a new contracts project')
  .argument('[project-name]', 'Name of the project directory')
  .option('-f, --force', 'Overwrite existing files')
  .option('-m, --minimal', 'Create minimal project structure')
  .action(async (projectName, options) => {
    try {
      await initProject(projectName, options);
    } catch (error) {
      logger.error('Project initialization failed:', error);
      process.exit(1);
    }
  });

// Parse command line arguments
program.parse(process.argv);

/**
 * Validates all input files for contract generation
 *
 * Checks existence and accessibility of template, data, and CSS files.
 * Implements retry logic for intermittent filesystem issues.
 *
 * @param {string} templatePath - Path to the template file
 * @param {string} [dataPath] - Optional path to the CSV data file
 * @param {string} [cssPath] - Optional path to the CSS style file
 * @throws {ValidationError} When required files are missing or inaccessible
 * @throws {FileSystemError} When file system operations fail
 * @example
 * try {
 *   await validateInputs(
 *     './templates/contract.md',
 *     './data/input.csv',
 *     './styles/theme.css'
 *   );
 * } catch (error) {
 *   if (error instanceof ValidationError) {
 *     console.error('Invalid input:', error.message);
 *   } else {
 *     console.error('System error:', error.message);
 *   }
 * }
 */
async function validateInputs(templatePath, dataPath, cssPath) {
  // Validate template file first
  if (!templatePath) {
    throw new ValidationError('Template file is required');
  }

  const validateFile = async (path, type) => {
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        await fs.access(path);
        return;
      } catch (error) {
        if (attempt === MAX_RETRIES) {
          throw new ValidationError(
            `${type} file not found or not accessible`,
            {
              path,
              type,
              attempts: attempt,
              originalError: error.message,
            }
          );
        }
        logger.warn(`Retry ${attempt}/${MAX_RETRIES} accessing ${type} file`, {
          path,
          error: error.message,
        });
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
      }
    }
  };

  try {
    await validateFile(templatePath, 'Template');

    // Validate data file if provided
    if (dataPath) {
      await validateFile(dataPath, 'Data');
    }

    // Validate CSS file if provided
    if (cssPath) {
      await validateFile(cssPath, 'CSS');
    }
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }
    throw new FileSystemError('File system operation failed', {
      originalError: error.message,
    });
  }
}

// Export functions used by other modules
module.exports = {
  createContext,
  validateInputs,
  initProject,
  generateContract,
};
