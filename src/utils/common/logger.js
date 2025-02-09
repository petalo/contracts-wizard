/**
 * @fileoverview Application Logging System
 *
 * Provides a comprehensive logging system with standardized formatting,
 * context validation, metadata grouping, and error handling.
 *
 * Functions:
 * - validateContext: Validates and normalizes logging contexts
 * - groupMetadata: Groups related metadata fields
 * - formatMetadata: Formats and sanitizes metadata for logging
 * - addFilename: Extracts source filenames from stack traces
 * - customFormat: Formats log entries with consistent structure
 * - logger: Public logging interface with error handling
 *   - error(): Logs error messages with stack traces and error context
 *   - warn(): Logs warning messages with optional metadata
 *   - info(): Logs informational messages with optional context
 *   - debug(): Logs debug information with optional metadata
 *   - logExecutionStart(): Logs application startup information once per session
 *
 * Constants:
 * - VALID_CONTEXTS: Set of allowed logging contexts
 * - BASE_DIR: Root directory for application
 * - LOG_DIR: Directory for log files
 *
 * Flow:
 * 1. Initialize logging system and ensure directories
 * 2. Validate and clean incoming log data
 * 3. Format log entries with consistent structure
 * 4. Write to appropriate outputs (file/console)
 * 5. Handle errors and provide fallbacks
 *
 * Error Handling:
 * - Directory creation failures
 * - Invalid contexts
 * - Metadata formatting errors
 * - Stack trace parsing issues
 * - Event logging failures
 *
 * @module @/utils/common/logger
 * @requires winston
 * @requires winston-daily-rotate-file
 * @requires path
 * @requires dotenv
 * @requires @/config/env
 * @exports {Object} logger - Logging interface
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

// Load environment configuration
dotenv.config();

// Base directory for logs
const BASE_DIR = process.cwd();
const LOG_DIR = path.join(BASE_DIR, process.env.LOG_DIR || 'logs');

/**
 * Valid logging contexts as defined in logging.mdc
 * @constant {Set<string>}
 */
const VALID_CONTEXTS = new Set([
  'api', // API interactions, requests, responses
  'audit', // Audit trail, compliance events
  'auth', // Authentication specific events
  'cache', // Cache operations, hits, misses
  'cleanup', // Cleanup operations, maintenance
  'config', // Configuration changes, env vars
  'data', // Data processing, transformations
  'db', // Database operations, queries
  'email', // Email sending, templates
  'error', // Error handling, exceptions
  'export', // Export operations, data dumps
  'file', // File system operations, I/O
  'format', // Data formatting, transformations
  'health', // Health checks, system status
  'import', // Import operations, data loading
  'metrics', // Application metrics, stats
  'migration', // Data migrations, schema updates
  'network', // Network operations, connections
  'perf', // Performance metrics, timings
  'queue', // Message queue operations
  'security', // Security events, authorization
  'session', // Session management
  'storage', // Storage operations (S3, etc)
  'sync', // Synchronization operations
  'system', // System operations, startup
  'task', // Background tasks, jobs
  'template', // Template processing
  'test', // Test execution, setup
  'ui', // User interface events
  'user', // User-specific actions and events
  'user-pref', // User preferences and settings
  'user-profile', // User profile operations
  'user-activity', // User activity tracking
  'user-content', // User-generated content
  'validation', // Input validation, schemas
]);

// Ensure logs directory exists
try {
  if (!require('fs').existsSync(LOG_DIR)) {
    require('fs').mkdirSync(LOG_DIR, { recursive: true });
  }
} catch (error) {
  console.error('Error creating logs directory:', error);
}

// Store original emit for event handling
const originalEmit = process.emit;

/**
 * Validates and formats logging context
 *
 * Ensures that the provided context is valid according to logging standards.
 * Handles context normalization and provides fallback to system context.
 *
 * @param {string} context - The context to validate
 * @returns {string} Validated and normalized context
 * @example
 * // Returns 'system' for invalid context
 * validateContext('invalid') // returns 'system'
 *
 * // Normalizes valid context
 * validateContext('[API]') // returns 'api'
 */
const validateContext = (context) => {
  if (!context) return 'system';
  const ctx = context.toLowerCase().trim();

  // Remove brackets if present
  const cleanContext = ctx.replace(/^\[|\]$/g, '');

  if (!VALID_CONTEXTS.has(cleanContext)) {
    console.warn(`Invalid context [${context}] used, defaulting to [system]`);
    return 'system';
  }
  return cleanContext;
};

/**
 * Groups related metadata fields into logical categories
 *
 * Organizes metadata fields into predefined groups for better readability
 * and analysis. Fields that don't match any group remain ungrouped.
 *
 * @param {Object} metadata - The metadata to group
 * @returns {Object} Grouped metadata object
 * @example
 * // Groups related fields
 * groupMetadata({
 *   duration: '1s',
 *   memory: '100MB',
 *   userId: '123'
 * })
 * // Returns: { perf: { duration: '1s', memory: '100MB' }, userId: '123' }
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
 * Processes and formats metadata object for logging, handling special cases
 * and providing consistent output format.
 *
 * @param {Object} metadata - The metadata to format
 * @returns {string} Formatted metadata string
 * @throws {Error} If metadata processing fails
 * @example
 * // Basic metadata formatting
 * formatMetadata({ user: 'john', count: 5 })
 * // Returns: ' ┃ user=john • count=5'
 *
 * // Handling errors
 * formatMetadata({ error: new Error('Failed') })
 * // Returns: ' ┃ error={"message":"Failed","stack":"..."}'
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
    const processed = processValue(value);
    if (processed !== undefined) {
      cleanMetadata[key] = processed;
    }
  }

  // Group related metadata
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
 * @param {Object} info - Winston log information object
 * @returns {Object} Modified info object with filename
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
 * @param {Object} params - Format parameters
 * @param {string} params.level - Log level
 * @param {string} params.message - Log message
 * @param {string} params.timestamp - ISO timestamp
 * @param {string} [params.filename] - Source file
 * @param {string} [params.context] - Log context
 * @param {Object} [params.metadata] - Additional data
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
  ({ level, message, timestamp, filename, context, ...metadata }) => {
    try {
      // Format the base log message
      let log = `${timestamp || new Date().toISOString()}`;

      // Add level (siempre requerido)
      log += ` ┃ [${(level || 'info').toUpperCase()}]`;

      // Add filename if available
      if (filename) {
        log += ` ┃ [${filename}]`;
      }

      // Add validated context (siempre requerido)
      const validContext = validateContext(context);
      log += ` ┃ [${validContext}]`;

      // Add message (si no hay mensaje, usar un placeholder)
      log += ` ┃ ${message || 'No message provided'}`;

      // Add formatted metadata
      try {
        const metadataStr = formatMetadata(metadata);
        if (metadataStr) {
          log += metadataStr;
        }
      } catch (error) {
        // If metadata formatting fails, at least log the main message
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
      options: { flags: 'w' },
    }),
  ],
});

// Add console transport in development
if (isDebugEnabled()) {
  winstonLogger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        addFilename(),
        customFormat
      ),
    })
  );
}

/**
 * Public logging interface
 *
 * Provides standardized logging methods with automatic context handling,
 * error processing, and metadata formatting.
 *
 * @type {Object}
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
   * @param {Object} [metadata={}] - Additional error context
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
   * @param {Object} [metadata={}] - Additional warning context
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
   * @param {Object} [metadata={}] - Additional information context
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
   * @param {Object} [metadata={}] - Additional debug context
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
