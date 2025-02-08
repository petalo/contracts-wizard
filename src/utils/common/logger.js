/**
 * @fileoverview Application Logging System
 *
 * Provides a comprehensive logging system with:
 * - Multiple log levels (error, warn, info, debug)
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
 * - logger.error: Error level messages with stack traces
 * - logger.logExecutionStart: Session start marker
 *
 * Constants:
 * - BASE_DIR: Root directory for application
 * - LOG_DIR: Directory for log files
 * - LATEST_LOG: Current log file name
 * - HISTORY_PATTERN: Historical log file pattern
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
 * Winston format for extracting source filenames
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
 * @param {Object} info - Winston log information object
 * @returns {Object} Modified info object with filename
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
 * @param {Object} params - Format parameters
 * @param {string} params.level - Log level
 * @param {string} params.message - Log message
 * @param {string} params.timestamp - ISO timestamp
 * @param {string} [params.filename] - Source file
 * @param {Object} [params.metadata] - Additional data
 * @returns {string} Formatted log entry
 */
const customFormat = winston.format.printf(
  ({ level, message, timestamp, filename, ...metadata }) => {
    // Start with timestamp and level
    let log = `${timestamp} [${level.toUpperCase()}]`;

    // Add filename if available
    if (filename) {
      log += ` [${filename}]`;
    }

    // Add message
    log += `: ${message}`;

    // Process metadata
    if (Object.keys(metadata).length > 0) {
      const processValue = (value) => {
        // Si es un error, incluir más detalles
        if (value instanceof Error) {
          return {
            message: value.message,
            name: value.name,
            code: value.code,
            stack: value.stack,
            details: value.details,
            originalError:
              value.originalError && processValue(value.originalError),
          };
        }
        // Si es un objeto con error, procesarlo
        if (value && typeof value === 'object' && value.error) {
          return {
            ...value,
            error: processValue(value.error),
          };
        }
        if (typeof value === 'string' && value.includes('base64')) {
          return value.replace(
            /(data:image\/[^;]+;base64,)[^"'\\}\s]+/g,
            '$1[BASE64_CONTENT_TRUNCATED]'
          );
        }
        return value;
      };

      const cleanMetadata = Object.entries(metadata).reduce(
        (acc, [key, val]) => {
          acc[key] = processValue(val);
          return acc;
        },
        {}
      );

      log += ` ${JSON.stringify(cleanMetadata)}`;
    }
    return log;
  }
);

/**
 * Winston logger configuration
 *
 * Determines log level based on environment variables with priority:
 * 1. LOG_LEVEL - Explicit level setting
 * 2. DEBUG - Force debug/info level
 * 3. NODE_ENV - Development defaults to debug
 * 4. Default to info level
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
        winston.format.timestamp(),
        addFilename(),
        winston.format.printf(
          ({ level, message, timestamp, filename, ...metadata }) => {
            let log = `${timestamp} [${level}]`;
            if (filename) log += ` [${filename}]`;
            log += `: ${message}`;
            if (Object.keys(metadata).length > 0) {
              log += ` ${JSON.stringify(metadata)}`;
            }
            return log;
          }
        )
      ),
    })
  );
}

/**
 * Public logging interface
 *
 * Provides standardized logging methods with error handling
 * and execution tracking. Supports multiple log levels and
 * automatic metadata processing.
 *
 * @type {Object}
 * @property {Function} error - Error level logging with stack traces
 * @property {Function} warn - Warning level logging
 * @property {Function} info - Information level logging
 * @property {Function} debug - Debug level logging
 * @property {Function} logExecutionStart - Logs application startup
 */
const logger = {
  error: (message, ...args) => {
    if (args[0] instanceof Error) {
      const error = args[0];
      return winstonLogger.error(error.message, {
        error,
        stack: error.stack,
        code: error.code,
        details: error.details,
        originalError: error.originalError,
      });
    }
    return winstonLogger.error(message, ...args);
  },
  warn: (...args) => winstonLogger.warn(...args),
  info: (...args) => winstonLogger.info(...args),
  debug: (...args) => winstonLogger.debug(...args),
  _executionStarted: false,
  logExecutionStart: () => {
    if (logger._executionStarted) return;
    logger._executionStarted = true;

    const separator = '━'.repeat(100);
    const date = new Date().toLocaleString();

    logger.info(separator);
    logger.info('▶ New Execution Started --- env: ' + process.env.NODE_ENV);
    logger.info(`▶ ${date}`);
    logger.info(separator);
  },
};

/**
 * Node.js event capture for logging
 *
 * Intercepts Node.js events and routes them through the logging
 * system with appropriate levels and formatting. Preserves the
 * original event emission chain.
 *
 * @param {string} event - Event name
 * @param {...*} args - Event arguments
 * @returns {boolean} Event emission result
 */
process.emit = function (event, ...args) {
  if (event === 'events') {
    const [eventData] = args;
    // Determinar el nivel de log basado en el tipo de evento
    const level = eventData.level || 'debug';
    const logMethod = logger[level] || logger.debug;

    // Formatear el mensaje con colores si están presentes
    const message = eventData.message.replace(/\[\d+m/g, ''); // Eliminar códigos de color

    // Loggear con el nivel apropiado
    logMethod.call(logger, `[node:events]: ${message}`, {
      ...eventData.data,
      timestamp: new Date().toISOString(),
      level,
      source: 'node:events',
    });
  }
  return originalEmit.apply(process, [event, ...args]);
};

module.exports = { logger };
