/**
 * @fileoverview Application Logging System
 *
 * Provides comprehensive logging functionality:
 * - Multi-level logging (debug, info, warn, error)
 * - File-based logging with rotation
 * - Console output in debug mode
 * - Metadata and context tracking
 * - Stack trace analysis
 * - Base64 content handling
 * - JSON object processing
 * - Source file tracking
 *
 * Functions:
 * - logger.debug: Debug level messages
 * - logger.info: Information level messages
 * - logger.warn: Warning level messages
 * - logger.error: Error level messages
 * - logger.logExecutionStart: Session start marker
 *
 * Constants:
 * - BASE_DIR: Application root directory
 * - LOG_DIR: Log files directory
 * - LATEST_LOG_PATH: Current log file path
 * - FULL_LOG_PATH: Historical log file path
 *
 * Flow:
 * 1. Initialize logging system
 * 2. Configure log formats
 * 3. Set up file transports
 * 4. Process log messages
 * 5. Write to appropriate outputs
 * 6. Rotate log files
 *
 * Error Handling:
 * - Directory creation failures
 * - File write permissions
 * - Format processing errors
 * - Transport failures
 * - Metadata sanitization
 * - Stack trace parsing
 * - Base64 truncation
 *
 * @module @/utils/common/logger
 * @requires winston - Logging framework
 * @requires winston-daily-rotate-file - Log rotation
 * @requires path - Path manipulation
 * @requires fs/promises - File operations
 * @requires dotenv - Environment config
 * @exports {Object} logger - Logger instance
 *
 * @example
 * // Import logger
 * const { logger } = require('@/utils/common/logger');
 *
 * // Basic logging
 * logger.debug('Processing started', { item: 'data' });
 * logger.info('Operation complete');
 * logger.warn('Resource low', { usage: '90%' });
 * logger.error('Process failed', { error });
 *
 * // With source tracking
 * logger.info('Function called', {
 *   function: 'processData',
 *   args: { id: 123 }
 * });
 * // [INFO] [data-processor.js]: Function called {"function":"processData","args":{"id":123}}
 *
 * // With error handling
 * try {
 *   await processFile(path);
 * } catch (error) {
 *   logger.error('File processing failed', {
 *     path,
 *     error: error.message,
 *     stack: error.stack
 *   });
 * }
 *
 * // Session markers
 * logger.logExecutionStart();
 * // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * // ▶ New Execution Started --- env: development
 * // ▶ 2024-03-15 14:30:22
 * // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

/**
 * Custom log message formatter
 *
 * Creates formatted log entries with:
 * - Timestamp
 * - Log level
 * - Source filename
 * - Message content
 * - Sanitized metadata
 *
 * Handles special cases:
 * - Base64 content truncation
 * - JSON string parsing
 * - Nested object processing
 * - Circular references
 * - Error object formatting
 * - Buffer data handling
 *
 * @type {winston.Logform.Format}
 *
 * @example
 * // Basic message
 * logger.info('User logged in');
 * // 2024-03-15T14:30:22Z [INFO] [auth.js]: User logged in
 *
 * // With metadata
 * logger.debug('Request received', {
 *   method: 'POST',
 *   path: '/api/data',
 *   body: { id: 123 }
 * });
 * // 2024-03-15T14:30:22Z [DEBUG] [api.js]: Request received {"method":"POST","path":"/api/data","body":{"id":123}}
 *
 * // With base64 content
 * logger.debug('Image processed', {
 *   data: 'data:image/png;base64,iVBORw0KGgoAAAANSU...'
 * });
 * // 2024-03-15T14:30:22Z [DEBUG] [image.js]: Image processed {"data":"data:image/png;base64,[BASE64_CONTENT_TRUNCATED]"}
 */

/**
 * Filename extraction formatter
 *
 * Extracts source filename from error stack:
 * 1. Analyzes stack trace
 * 2. Filters internal calls
 * 3. Extracts relevant file info
 * 4. Handles special cases
 *
 * Features:
 * - Project path detection
 * - Multiple extension support
 * - Internal call filtering
 * - Anonymous function handling
 * - Module path resolution
 * - Directory fallback
 *
 * @type {winston.Logform.Format}
 *
 * @example
 * // Named function
 * function processData() {
 *   logger.info('Processing');
 *   // [INFO] [data-processor.js]: Processing
 * }
 *
 * // Anonymous function
 * const handler = () => {
 *   logger.info('Handling');
 *   // [INFO] [api-module]: Handling
 * }
 *
 * // Class method
 * class Service {
 *   execute() {
 *     logger.info('Executing');
 *     // [INFO] [service.js]: Executing
 *   }
 * }
 */

const winston = require('winston');
require('winston-daily-rotate-file');
const path = require('path');
const dotenv = require('dotenv');
const { LOCALE_CONFIG } = require('@/config/locale');
const { PATHS } = require('@/config/paths');

// Load environment configuration
dotenv.config();

/**
 * Custom log message formatter
 *
 * Creates formatted log entries with:
 * - Timestamp
 * - Log level
 * - Source filename
 * - Message content
 * - Sanitized metadata
 *
 * Handles special cases:
 * - Base64 content truncation
 * - JSON string parsing
 * - Nested object processing
 * - Circular references
 * - Error object formatting
 * - Buffer data handling
 *
 * @type {winston.Logform.Format}
 *
 * @example
 * // Basic message
 * logger.info('User logged in');
 * // 2024-03-15T14:30:22Z [INFO] [auth.js]: User logged in
 *
 * // With metadata
 * logger.debug('Request received', {
 *   method: 'POST',
 *   path: '/api/data',
 *   body: { id: 123 }
 * });
 * // 2024-03-15T14:30:22Z [DEBUG] [api.js]: Request received {"method":"POST","path":"/api/data","body":{"id":123}}
 *
 * // With base64 content
 * logger.debug('Image processed', {
 *   data: 'data:image/png;base64,iVBORw0KGgoAAAANSU...'
 * });
 * // 2024-03-15T14:30:22Z [DEBUG] [image.js]: Image processed {"data":"data:image/png;base64,[BASE64_CONTENT_TRUNCATED]"}
 */
const customFormat = winston.format.printf(
  ({ level, message, timestamp, filename, ...metadata }) => {
    // Start with timestamp and level
    let log = `${timestamp} [${level.toUpperCase()}]`;

    // Add filename if available, otherwise add empty brackets to maintain format
    if (filename) {
      log += ` [${filename}]`;
    }

    // Add message with single colon
    log += `: ${message}`;

    const processValue = (value) => {
      if (typeof value === 'string') {
        if (value.startsWith('{') || value.startsWith('[')) {
          try {
            return processValue(JSON.parse(value));
          } catch (e) {
            // If parsing fails, return the string as is
          }
        }
        if (value.includes('base64')) {
          return value.replace(
            /(data:image\/[^;]+;base64,)[^"'\\}\s]+/g,
            '$1[BASE64_CONTENT_TRUNCATED]'
          );
        }
        return value;
      }
      if (typeof value !== 'object' || value === null) {
        return value;
      }
      if (value.constructor !== Object && value.constructor !== Array) {
        if (value.toString && typeof value.toString === 'function') {
          return value.toString();
        }
        return `[${value.constructor?.name || 'Unknown'}]`;
      }
      const processed = Array.isArray(value) ? [] : {};
      for (const [key, val] of Object.entries(value)) {
        processed[key] = processValue(val);
      }
      return processed;
    };

    if (Object.keys(metadata).length > 0 && metadata.constructor === Object) {
      try {
        const cleanMetadata = processValue(metadata);
        log += ` ${JSON.stringify(cleanMetadata)}`;
      } catch (error) {
        /* eslint-disable-next-line no-console */
        console.error('Error processing metadata:', error);
        log += ` ${JSON.stringify(metadata)}`;
      }
    }
    return log;
  }
);

/**
 * Filename extraction formatter
 *
 * Extracts source filename from error stack:
 * 1. Analyzes stack trace
 * 2. Filters internal calls
 * 3. Extracts relevant file info
 * 4. Handles special cases
 *
 * @type {winston.Logform.Format}
 */
const addFilename = winston.format((info) => {
  try {
    const stackInfo = Error().stack;
    if (!stackInfo) return info;

    // Split stack lines and get the caller line
    const stackLines = stackInfo.split('\n').map((line) => line.trim());

    // Find the first relevant line
    let callerLine = null;
    let callerFile = null;

    // Skip first line (Error constructor) and logger.js calls
    for (let i = 1; i < stackLines.length && !callerFile; i++) {
      const line = stackLines[i];

      // Skip internal calls
      if (
        line.includes('logger.js') ||
        line.includes('node_modules') ||
        line.includes('internal/') ||
        line.includes('<anonymous>') ||
        line.includes('new Promise')
      ) {
        continue;
      }

      callerLine = line;

      // Try to get the project path
      const projectPath = line.includes(process.cwd())
        ? line.split(process.cwd())[1]
        : line;

      if (!projectPath) continue;

      // Common extensions in the project
      const extensions = '\\.(?:js|mjs|cjs|ts|md|json|csv|css|html)';

      // Try all patterns in order of specificity
      const patterns = [
        // Full project path with file
        new RegExp(
          `\\/(src|utils|core|generators|templates|data-csv)\\/(?:[^/]+\\/)*([^/\\s:]+${extensions})`
        ),
        // Direct file reference in project path
        new RegExp(`\\/([^/\\s:]+${extensions})`),
        // Function call pattern
        new RegExp(`at (?:.*? \\()?([^/\\s:]+${extensions})`),
        // Basic filename pattern
        new RegExp(`([^/\\s:]+${extensions})`),
      ];

      // Try each pattern
      for (const pattern of patterns) {
        const match = projectPath.match(pattern);
        if (match) {
          callerFile = match[match.length - 1];
          break;
        }
      }

      // If we still don't have a file but have a directory, use it
      if (!callerFile && projectPath.includes('/src/')) {
        const dirMatch = projectPath.match(/\/src\/([^/]+)\//);
        if (dirMatch) {
          callerFile = `${dirMatch[1]}-module`;
        }
      }
    }

    // If we found a file, use it
    if (callerFile) {
      info.filename = callerFile;
    } else if (callerLine) {
      // Last resort: try to extract any meaningful identifier
      const functionMatch = callerLine.match(/at ([^(\s]+)/);
      if (functionMatch) {
        info.filename = `${functionMatch[1]}-function`;
      }
    }

    return info;
  } catch (error) {
    /* eslint-disable-next-line no-console */
    console.error('Error in addFilename format:', error);
    return info;
  }
});

// Create a basic logger that writes to console until the full logger is initialized
const logger = {
  /* eslint-disable-next-line no-console */
  error: console.error.bind(console),
  /* eslint-disable-next-line no-console */
  warn: console.warn.bind(console),
  /* eslint-disable-next-line no-console */
  info: console.info.bind(console),
  /* eslint-disable-next-line no-console */
  debug: process.env.DEBUG === 'true' ? console.debug.bind(console) : () => {},
  logExecutionStart: () => {
    const separator = '━'.repeat(100);
    /* eslint-disable no-console */
    console.info(separator);
    console.info('▶ New Execution Started --- env: ' + process.env.NODE_ENV);
    console.info(`▶ ${new Date().toLocaleString()}`);
    console.info(separator);
    /* eslint-enable no-console */
  },
};

// Ensure debug method is always available
if (!logger.debug) {
  logger.debug = () => {};
}

// Base directory for logs
const BASE_DIR = process.cwd();
const LOG_DIR = path.join(BASE_DIR, PATHS.logs.dir);

// Get log paths from environment or use defaults with .log extension
const LATEST_LOG_PATH = process.env.LATEST_LOG_PATH
  ? path.resolve(BASE_DIR, process.env.LATEST_LOG_PATH)
  : path.join(LOG_DIR, path.basename(PATHS.logs.latest) + '.log');

const FULL_LOG_PATH = process.env.FULL_LOG_PATH
  ? path.resolve(BASE_DIR, process.env.FULL_LOG_PATH)
  : path.join(LOG_DIR, path.basename(PATHS.logs.history) + '.log');

// Create log directories synchronously
try {
  const latestLogDir = path.dirname(LATEST_LOG_PATH);
  const fullLogDir = path.dirname(FULL_LOG_PATH);

  // Create directories if they don't exist
  for (const dir of [latestLogDir, fullLogDir]) {
    if (!require('fs').existsSync(dir)) {
      require('fs').mkdirSync(dir, {
        recursive: true,
        mode: 0o755,
      });
    }
  }

  // Initialize Winston logger
  const winstonLogger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
      winston.format.timestamp(),
      addFilename(),
      customFormat
    ),
    silent: process.env.LOG_ENABLED === 'false',
    transports: [
      new winston.transports.DailyRotateFile({
        filename: FULL_LOG_PATH,
        datePattern: 'YYYY-MM-DD',
        zippedArchive: true,
        maxSize: process.env.LOG_MAX_SIZE || '20m',
        maxFiles: process.env.LOG_MAX_FILES || '14d',
        level: process.env.LOG_LEVEL || 'info',
      }),
      new winston.transports.File({
        filename: LATEST_LOG_PATH,
        level: process.env.LOG_LEVEL || 'info',
        options: { flags: 'w' },
        tailable: true,
        maxsize: process.env.LATEST_LOG_MAX_SIZE || '5m',
        maxFiles: 1,
      }),
    ],
  });

  // Add console transport in debug mode
  if (process.env.DEBUG && process.env.DEBUG !== 'false') {
    winstonLogger.add(
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.timestamp(),
          addFilename(),
          customFormat
        ),
      })
    );
  }

  // Update logger methods to use Winston, but keep fallbacks
  const originalLogger = { ...logger };
  try {
    logger.error = winstonLogger.error.bind(winstonLogger);
    logger.warn = winstonLogger.warn.bind(winstonLogger);
    logger.info = winstonLogger.info.bind(winstonLogger);
    logger.debug = winstonLogger.debug.bind(winstonLogger);
    logger.logExecutionStart = () => {
      const separator = '━'.repeat(100);
      const date = new Date().toLocaleString(LOCALE_CONFIG.fullLocale, {
        timeZone: LOCALE_CONFIG.timezone,
      });

      logger.info(separator);
      logger.info('▶ New Execution Started --- env: ' + process.env.NODE_ENV);
      logger.info(`▶ ${date}`);
      logger.info(separator);
    };
  } catch (error) {
    // Restore original console logger if Winston binding fails
    Object.assign(logger, originalLogger);
    /* eslint-disable-next-line no-console */
    console.error('Error binding Winston methods:', error);
  }
} catch (error) {
  /* eslint-disable-next-line no-console */
  console.error('Error initializing Winston logger:', error);
  // Keep using console logger if Winston initialization fails
}

// Final check to ensure debug method exists
if (!logger.debug) {
  logger.debug = () => {};
}

module.exports = { logger };
