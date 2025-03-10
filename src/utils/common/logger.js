/**
 * @file Application Logging System
 *
 * Provides a comprehensive logging system with standardized formatting,
 * metadata grouping, and error handling.
 *
 * The logging system provides consistent formatting, context handling, and error
 * management across the application. It supports multiple output formats,
 * automatic file rotation, and structured metadata.
 *
 * Functions:
 * - validateContext: Validates and normalizes logging contexts
 * - groupMetadata: Groups related metadata fields by category
 * - formatMetadata: Formats metadata for consistent output
 * - addFilename: Extracts source filenames from stack traces
 * - customFormat: Creates standardized log entry format
 * - logger.error: Logs error messages with stack traces
 * - logger.warn: Logs warning messages with metadata
 * - logger.info: Logs informational messages
 * - logger.debug: Logs debug information
 * - logger.logExecutionStart: Logs application startup once
 *
 * Constants:
 * - BASE_DIR: string - Root directory for application
 * - LOG_DIR: string - Directory for log files
 * - originalEmit: function - Original process.emit for event handling
 *
 * Flow:
 * 1. Initialize logging system and validate directories
 * 2. Configure Winston with custom formatters
 * 3. Set up file rotation and console output
 * 4. Process incoming log requests:
 *    - Validate and normalize context
 *    - Group and format metadata
 *    - Apply consistent formatting
 *    - Write to appropriate outputs
 * 5. Handle special cases (errors, events)
 *
 * Error Handling:
 * - Directory creation: Creates missing directories with fallback to console
 * - Invalid contexts: Normalizes invalid contexts to 'system'
 * - Metadata formatting: Handles circular references and invalid types
 * - Stack traces: Provides fallback when stack trace is unavailable
 * - Event logging: Falls back to console.log on logging failures
 * - File rotation: Recreates symlinks if deleted
 * - Winston errors: Falls back to console output
 *
 * @module @/utils/common/logger
 * @requires winston - Logging framework with multiple transports
 * @requires winston-daily-rotate-file - File rotation support
 * @requires path - Path manipulation utilities
 * @requires dotenv - Environment configuration
 * @requires @/config/env - Application environment settings
 * @exports logger - Logging interface with error handling
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

const winston = require('winston');
require('winston-daily-rotate-file');
const path = require('path');
const dotenv = require('dotenv');
const { getLogLevel, isDebugEnabled } = require('@/config/env');
const fs = require('fs');

// Load environment configuration
dotenv.config();

// Base directory for logs
const BASE_DIR = process.cwd();
const LOG_DIR = path.join(BASE_DIR, process.env.LOG_DIR || 'logs');

// Ensure logs directory exists BEFORE configuring winston
const ensureLogDir = () => {
  try {
    if (!fs.existsSync(LOG_DIR)) {
      fs.mkdirSync(LOG_DIR, { recursive: true });
      console.error('Forced to create logs directory:', LOG_DIR);
    }
  } catch (error) {
    console.error('Error creating logs directory:', error);
  }
};

// Ensure directory exists before configuring logger
ensureLogDir();

// Store original emit for event handling
const originalEmit = process.emit;

/**
 * Validates and formats logging context
 *
 * Ensures consistent context formatting by:
 * - Converting null/undefined to 'system'
 * - Extracting context from objects
 * - Normalizing string format (lowercase, no brackets)
 * - Removing whitespace and special characters
 *
 * @function validateContext
 * @param {string|object} context - The context to validate
 * @param {string} [context.context] - Context property if object
 * @param {string} [context.name] - Name property as fallback context
 * @returns {string} Normalized context string
 * @example
 * // String context
 * validateContext('UserService')
 * // returns: 'userservice'
 *
 * // Object with context
 * validateContext({ context: 'AuthModule' })
 * // returns: 'authmodule'
 *
 * // Object with name
 * validateContext({ name: 'DataProcessor' })
 * // returns: 'dataprocessor'
 *
 * // Invalid input
 * validateContext(null)
 * // returns: 'system'
 */
const validateContext = (context) => {
  // If context is undefined or null, return 'system'
  if (!context) return 'system';

  // If context is an object, try to get a valid property
  if (typeof context === 'object') {
    // If it has a 'context' property, use it
    if (context.context) {
      return validateContext(context.context.toString().replace(/[\s]/g, ''));
    }

    // If it has a 'name' property, use it
    if (context.name) {
      return validateContext(context.name.toString().replace(/[\s]/g, ''));
    }

    // If it has no useful properties, use 'system'
    return 'system';
  }

  // Convert to string and clean
  const ctx = String(context).toLowerCase().trim();

  // Remove brackets if present
  return ctx.replace(/^\[|\]$/g, '');
};

/**
 * Groups related metadata fields into logical categories
 *
 * Organizes metadata fields into predefined groups for better readability
 * and analysis. Fields are grouped by type (error, performance, batch, etc)
 * while maintaining the original structure for unmatched fields.
 *
 * Groups:
 * - error: Error-related fields (error, stack, code, details)
 * - perf: Performance metrics (duration, memory, cpu, latency)
 * - batch: Batch processing stats (total, success, failed)
 * - request: HTTP request data (method, url, status)
 * - resource: Resource usage (size, count, limit)
 *
 * @function groupMetadata
 * @param {object} metadata - The metadata to group
 * @param {Error} [metadata.error] - Error object if present
 * @param {string} [metadata.stack] - Error stack trace
 * @param {number} [metadata.duration] - Operation duration
 * @param {number} [metadata.memory] - Memory usage
 * @returns {object} Grouped metadata object
 * @example
 * // Mixed metadata fields
 * groupMetadata({
 *   error: new Error('Failed'),
 *   duration: '1.2s',
 *   memory: '256MB',
 *   userId: '123'
 * })
 * // returns: {
 * //   userId: '123',
 * //   error: { message: 'Failed', stack: '...' },
 * //   perf: { duration: '1.2s', memory: '256MB' }
 * // }
 *
 * // Ungrouped fields
 * groupMetadata({
 *   userId: '123',
 *   role: 'admin'
 * })
 * // returns: { userId: '123', role: 'admin' }
 */
const groupMetadata = (metadata) => {
  if (!metadata || Object.keys(metadata).length === 0) {
    return {};
  }

  const groups = {
    error: ['error', 'stack', 'code', 'details'],
    perf: ['duration', 'memory', 'cpu', 'latency', 'time'],
    batch: ['total', 'success', 'failed', 'processed', 'items'],
    request: ['method', 'url', 'status', 'endpoint'],
    resource: ['size', 'count', 'limit', 'offset', 'rows'],
  };

  const grouped = {};
  const ungrouped = {};

  Object.entries(metadata).forEach(([key, value]) => {
    // Skip context as it's handled separately
    if (key === 'context') return;

    let assigned = false;
    for (const [group, fields] of Object.entries(groups)) {
      if (fields.includes(key)) {
        grouped[group] = grouped[group] || {};
        grouped[group][key] = value;
        assigned = true;
        break;
      }
    }
    if (!assigned) {
      ungrouped[key] = value;
    }
  });

  return {
    ...ungrouped,
    ...grouped,
  };
};

/**
 * Formats metadata for logging output
 *
 * Processes and formats metadata object for consistent log output:
 * - Handles special cases (Error objects, circular refs)
 * - Formats key-value pairs with bullet separators
 * - Sanitizes sensitive data (base64, tokens)
 * - Removes empty/undefined values
 * - Groups related fields by category
 *
 * @function formatMetadata
 * @param {object} metadata - The metadata to format
 * @param {Error} [metadata.error] - Error object to format
 * @param {object} [metadata.params] - Direct params to use
 * @param {string} [metadata.context] - Context (skipped in output)
 * @param {string} [metadata.filename] - Filename (skipped in output)
 * @returns {string} Formatted metadata string
 * @throws {Error} If metadata processing fails
 * @example
 * // Basic metadata
 * formatMetadata({ user: 'john', count: 5 })
 * // returns: ' ┃ user=john • count=5'
 *
 * // Error object
 * formatMetadata({
 *   error: new Error('Failed'),
 *   code: 'ERR_001'
 * })
 * // returns: ' ┃ error={"message":"Failed","stack":"..."} • code=ERR_001'
 *
 * // Direct params
 * formatMetadata({ params: 'key1=val1 • key2=val2' })
 * // returns: ' ┃ key1=val1 • key2=val2'
 *
 * // Empty metadata
 * formatMetadata({})
 * // returns: ''
 */
const formatMetadata = (metadata) => {
  if (!metadata || Object.keys(metadata).length === 0) return '';

  const processValue = (value) => {
    if (value instanceof Error) {
      return {
        message: value.message,
        code: value.code,
        stack: value.stack,
      };
    }
    if (value && typeof value === 'object' && value.error) {
      return {
        ...value,
        error: processValue(value.error),
      };
    }
    if (typeof value === 'string' && value.includes('base64')) {
      return '[BASE64_CONTENT]';
    }
    if (value && typeof value === 'object') {
      const processed = {};
      for (const [k, v] of Object.entries(value)) {
        if (v !== undefined && v !== null && v !== '') {
          processed[k] = processValue(v);
        }
      }
      return Object.keys(processed).length > 0 ? processed : undefined;
    }
    return value;
  };

  // Process and clean metadata
  const cleanMetadata = {};
  for (const [key, value] of Object.entries(metadata)) {
    // Skip context and filename as they're handled separately
    if (key === 'context' || key === 'filename') continue;

    // If it's the params field, use it directly
    if (key === 'params') {
      return ` ┃ ${value}`; // Return params directly with bullet points
    }

    const processed = processValue(value);
    if (processed !== undefined) {
      cleanMetadata[key] = processed;
    }
  }

  // Group related metadata if no params field was found
  const groupedMetadata = groupMetadata(cleanMetadata);

  // Format metadata as key=value pairs for better readability
  if (Object.keys(groupedMetadata).length > 0) {
    const pairs = Object.entries(groupedMetadata).map(([key, value]) => {
      if (typeof value === 'object') {
        return `${key}=${JSON.stringify(value)}`;
      }
      return `${key}=${value}`;
    });
    return ` ┃ ${pairs.join(' • ')}`;
  }

  return '';
};

/**
 * Extracts source filename from error stack
 *
 * Analyzes stack trace to determine the original source file
 * of the log call, filtering out internal and library calls.
 *
 * @param {object} info - Winston log information object
 * @returns {object} Modified info object with filename
 * @example
 * // Adds filename to log info
 * addFilename({ message: 'test' })
 * // Returns: { message: 'test', filename: 'user-service.js' }
 */
const addFilename = winston.format((info) => {
  const stackInfo = Error().stack;
  if (!stackInfo) return info;

  const stackLines = stackInfo.split('\n').map((line) => line.trim());
  for (const line of stackLines) {
    if (line.includes('logger.js') || line.includes('node_modules')) continue;
    const match = line.match(/\((.+?):\d+:\d+\)$/);
    if (match) {
      info.filename = path.basename(match[1]);
      break;
    }
  }
  return info;
});

/**
 * Formats log entries with consistent structure
 *
 * Creates standardized log entries with timestamp, level,
 * filename, context, message, and formatted metadata.
 *
 * @param {object} params - Format parameters
 * @param {string} params.level - Log level
 * @param {string} params.message - Log message
 * @param {string} params.timestamp - ISO timestamp
 * @param {string} [params.filename] - Source file
 * @param {string} [params.context] - Log context
 * @param {object} [params.metadata] - Additional data
 * @returns {string} Formatted log entry
 * @example
 * // Basic log formatting
 * customFormat({
 *   level: 'info',
 *   message: 'Test',
 *   timestamp: '2024-01-01T00:00:00Z'
 * })
 * // Returns: '2024-01-01T00:00:00Z ┃ [INFO] ┃ [system] ┃ Test'
 */
const customFormat = winston.format.printf(
  // prettier-ignore
  ({
    level,
    message,
    timestamp,
    filename,
    context,
    ...metadata
  }) => {
    try {
      // Format the base log message with padding for alignment
      let log = `${timestamp || new Date().toISOString()}`;

      // Add level with color and padding (siempre requerido)
      const levelPad = 7; // Longitud máxima de los niveles (ERROR, INFO, etc)
      const levelStr = (level || 'info').toUpperCase();
      const levelFormatted = levelStr.padEnd(levelPad);
      log += ` ┃ [${levelFormatted}]`;

      // Add validated context with padding
      const contextPad = 10; // Ajusta según necesidad
      context = context.replace(/[\s]/g, '');
      const validContext = validateContext(context);
      const contextFormatted = validContext.padEnd(contextPad);
      log += ` ┃ [${contextFormatted}]`;

      // Add filename if available with padding
      if (filename) {
        filename = filename.replace(/[\s]/g, '');
        const filenamePad = 20; // Ajusta según necesidad
        const filenameFormatted = filename.padEnd(filenamePad);
        log += ` ┃ [${filenameFormatted}]`;
      }

      // Add message
      log += ` ┃ ${message || 'No message provided'}`;

      // Add formatted metadata
      try {
        const metadataStr = formatMetadata(metadata);
        if (metadataStr) {
          log += metadataStr;
        }
      } catch (error) {
        console.error('Error formatting metadata:', error);
      }

      return log;
    } catch (error) {
      // If something fails, return a minimal but functional log message
      const timestamp = new Date().toISOString();
      const lvl = (level || 'info').toUpperCase();
      const msg = message || 'Error formatting log message';
      return `${timestamp} ┃ [${lvl}] ┃ [system] ┃ ${msg}`;
    }
  }
);

/**
 * Winston logger configuration
 *
 * Configures the Winston logger with appropriate transports
 * and formatting based on environment settings.
 *
 * @type {winston.Logger}
 */
const winstonLogger = winston.createLogger({
  level: getLogLevel(),
  format: winston.format.combine(
    winston.format.timestamp(),
    addFilename(),
    customFormat
  ),
  transports: [
    new winston.transports.DailyRotateFile({
      dirname: LOG_DIR,
      filename: 'history-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: process.env.LOG_MAX_SIZE || '10m',
      maxFiles: process.env.LOG_MAX_FILES || '7d',
      createSymlink: true,
      symlinkName: 'latest.log',
      auditFile: path.join(LOG_DIR, '.audit.json'),
      tailable: true,
      zippedArchive: false,
      handleExceptions: true,
      handleRejections: true,
      json: false,
      options: { flags: 'w' }, // Open in write mode, truncating file
    }),
  ],
});

// Ensure latest.log is recreated on each execution
try {
  const latestLogPath = path.join(LOG_DIR, 'latest.log');
  if (fs.existsSync(latestLogPath)) {
    fs.unlinkSync(latestLogPath);
  }
} catch (error) {
  console.error('Error recreating latest.log:', error);
}

// Add console transport in development
if (isDebugEnabled()) {
  // Configure Winston colors for console output
  winston.addColors({
    error: 'red',
    warn: 'yellow',
    info: 'green',
    debug: 'cyan',
  });

  winstonLogger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize({
          all: false,
          level: true,
          message: false,
          colors: {
            error: 'red',
            warn: 'yellow',
            info: 'green',
            debug: 'cyan',
          },
        }),
        winston.format.timestamp(),
        addFilename(),
        customFormat
      ),
    })
  );
}

// Watch logs directory for deletion
fs.watch(path.dirname(LOG_DIR), (eventType, filename) => {
  if (eventType === 'rename' && filename === path.basename(LOG_DIR)) {
    ensureLogDir();
  }
});

/**
 * Public logging interface
 *
 * Provides standardized logging methods with automatic context handling,
 * error processing, and metadata formatting.
 *
 * @type {object}
 * @property {Function} error - Logs error messages with stack traces
 * @property {Function} warn - Logs warning messages
 * @property {Function} info - Logs informational messages
 * @property {Function} debug - Logs debug information
 * @property {Function} logExecutionStart - Logs application startup
 *
 * @example
 * // Basic logging
 * logger.info('Operation completed', { context: 'task', duration: '5s' });
 *
 * // Error logging
 * try {
 *   doSomething();
 * } catch (error) {
 *   logger.error(error);
 * }
 *
 * // Debug with context
 * logger.debug('Processing data', {
 *   context: 'data',
 *   items: 100,
 *   type: 'users'
 * });
 */
const logger = {
  /**
   * Logs error messages with stack traces
   *
   * @param {string|Error} message - Error message or Error object
   * @param {object} [metadata={}] - Additional error context
   * @returns {void}
   * @example
   * logger.error(new Error('Database connection failed'));
   * logger.error('Operation failed', { context: 'db', code: 'CONN_ERROR' });
   */
  error: (message, metadata = {}) => {
    if (message instanceof Error) {
      return winstonLogger.error(message.message, {
        context: 'error',
        error: message,
        stack: message.stack,
        code: message.code,
      });
    }
    if (!metadata.context) {
      metadata.context = 'system';
    }
    return winstonLogger.error(message, metadata);
  },

  /**
   * Logs warning messages
   *
   * @param {string} message - Warning message
   * @param {object} [metadata={}] - Additional warning context
   * @returns {void}
   * @example
   * logger.warn('High memory usage', { context: 'perf', usage: '85%' });
   */
  warn: (message, metadata = {}) => {
    if (!metadata.context) {
      metadata.context = 'system';
    }
    return winstonLogger.warn(message, metadata);
  },

  /**
   * Logs informational messages
   *
   * @param {string} message - Info message
   * @param {object} [metadata={}] - Additional information context
   * @returns {void}
   * @example
   * logger.info('User logged in', { context: 'auth', userId: '123' });
   */
  info: (message, metadata = {}) => {
    if (!metadata.context) {
      metadata.context = 'system';
    }
    return winstonLogger.info(message, metadata);
  },

  /**
   * Logs debug information
   *
   * @param {string} message - Debug message
   * @param {object} [metadata={}] - Additional debug context
   * @returns {void}
   * @example
   * logger.debug('Processing batch', { context: 'task', items: 50 });
   */
  debug: (message, metadata = {}) => {
    if (!metadata.context) {
      metadata.context = 'system';
    }
    return winstonLogger.debug(message, metadata);
  },

  _executionStarted: false,

  /**
   * Logs application startup information
   *
   * Records the start of a new execution with environment details
   * and system information. Ensures only one startup log per session.
   *
   * @returns {void}
   * @example
   * logger.logExecutionStart();
   * // Logs: New execution started | env=development | time=... | pid=... | nodeVersion=...
   */
  logExecutionStart: () => {
    if (logger._executionStarted) return;
    logger._executionStarted = true;

    const env = process.env.NODE_ENV || 'development';
    const date = new Date().toLocaleString();

    logger.info('New execution started', {
      context: 'system',
      env,
      time: date,
      pid: process.pid,
      nodeVersion: process.version,
    });
  },
};

/**
 * Node.js event capture for logging
 *
 * Intercepts Node.js events and routes them through the logging system
 * with appropriate context and error handling.
 *
 * @param {string} event - Event name
 * @param {...*} args - Event arguments
 * @returns {boolean} Event emission result
 * @example
 * process.emit('events', {
 *   level: 'info',
 *   message: 'Custom event',
 *   data: { context: 'system' }
 * });
 */
process.emit = function (event, ...args) {
  if (event === 'events') {
    const [eventData] = args;
    const level = eventData.level || 'debug';
    const logMethod = logger[level] || logger.debug;
    const message = eventData.message.replace(/\[\d+m/g, '');

    // Ensure event data has a context
    const eventMetadata = {
      context: eventData.context || 'system',
      ...eventData.data,
      timestamp: new Date().toISOString(),
    };

    try {
      logMethod.call(logger, message, eventMetadata);
      // Fallback to console.log if logger fails
    } catch (error) {
      console.error('Error in event logging:', error);
      // eslint-disable-next-line no-console
      console.log(
        `${new Date().toISOString()} [${level.toUpperCase()}]: ${message}`
      );
    }
  }
  return originalEmit.apply(process, [event, ...args]);
};

module.exports = { logger };
