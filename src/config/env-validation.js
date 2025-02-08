/**
 * @fileoverview Environment Variable Validation System
 *
 * Manages environment configuration validation:
 * - Required variable enforcement
 * - Type checking and constraints
 * - Value validation rules
 * - Error collection and reporting
 *
 * Functions:
 * - validateEnv: Validates all environment variables
 * - validatePath: Validates directory paths
 * - validateLogLevel: Validates logging configuration
 * - validateFileSize: Validates file size constraints
 * - validateLogPath: Validates log file paths
 *
 * Constants:
 * - ENV_CONFIG: Environment validation rules
 * - PATH_PERMISSIONS: Required path permissions
 * - NUMERIC_CONSTRAINTS: Numeric value constraints
 *
 * Error Classes:
 * - ConfigError: Base configuration error
 * - MissingEnvError: Required variable missing
 * - InvalidValueError: Invalid variable value
 * - PathError: Invalid path or permissions
 *
 * Flow:
 * 1. Define validation rules and constraints
 * 2. Load environment variables
 * 3. Check required variables
 * 4. Validate types and values
 * 5. Validate paths and permissions
 * 6. Report validation results
 *
 * Error Handling:
 * - Multiple error collection
 * - Detailed error context
 * - Path permission validation
 * - Type conversion errors
 * - Format validation errors
 * - Size constraint violations
 *
 * @module @/config/envValidation
 * @requires @/utils/common/logger
 * @requires @/utils/common/errors
 *
 * @example
 * // Import validation
 * const { validateEnv } = require('@/config/envValidation');
 *
 * // Validate environment
 * try {
 *   await validateEnv();
 *   console.log('Environment is valid');
 * } catch (error) {
 *   if (error instanceof MissingEnvError) {
 *     console.error('Missing required variable:', error.details.variable);
 *   } else if (error instanceof InvalidValueError) {
 *     console.error('Invalid value:', error.details);
 *   } else if (error instanceof PathError) {
 *     console.error('Path error:', error.details);
 *   }
 * }
 *
 * // Adding New Validation Rules:
 * // 1. Add to ENV_CONFIG:
 * // ENV_CONFIG.NEW_VAR = {
 * //   type: 'string',
 * //   required: true,
 * //   values: ['value1', 'value2'],
 * //   validate: customValidationFunction
 * // }
 * //
 * // 2. Create custom validator if needed:
 * // async function customValidationFunction(value, key) {
 * //   if (!isValid(value)) {
 * //     throw new InvalidValueError(key, value, 'expected format');
 * //   }
 * // }
 */

const { logger } = require('@/utils/common/logger');
const { AppError } = require('@/utils/common/errors');
const fs = require('fs').promises;
const path = require('path');

// Custom error classes
class ConfigError extends AppError {
  constructor(message, details) {
    super(message, 'CONFIG_ERROR', details);
    this.name = 'ConfigError';
  }
}

class MissingEnvError extends ConfigError {
  constructor(variable) {
    super(`Missing required environment variable: ${variable}`, {
      variable,
      type: 'missing_env',
    });
    this.name = 'MissingEnvError';
  }
}

class InvalidValueError extends ConfigError {
  constructor(variable, value, expected) {
    super(`Invalid value for ${variable}`, {
      variable,
      value,
      expected,
      type: 'invalid_value',
    });
    this.name = 'InvalidValueError';
  }
}

class PathError extends ConfigError {
  constructor(variable, path, reason) {
    super(`Invalid path for ${variable}: ${reason}`, {
      variable,
      path,
      reason,
      type: 'path_error',
    });
    this.name = 'PathError';
  }
}

// Constants
const PATH_PERMISSIONS = {
  DIR_OUTPUT: {
    write: true,
    read: true,
  },
  DIR_TEMPLATES: { read: true },
  DIR_CSS: { read: true },
  DIR_IMAGES: { read: true },
  DIR_CSV: { read: true },
};

const NUMERIC_CONSTRAINTS = {
  LOG_MAX_SIZE: {
    min: '1MB',
    max: '1GB',
  },
  LOG_MAX_FILES: {
    min: 1,
    max: 100,
  },
};

/**
 * Environment validation configuration
 *
 * Defines validation rules for environment variables:
 * - Required vs optional variables
 * - Allowed types and values
 * - Validation constraints
 * - Format requirements
 *
 * Each variable configuration includes:
 * - type: Expected data type (string, boolean, number)
 * - values: Allowed values for enums
 * - required: Whether variable is mandatory
 * - format: Expected format (regex)
 * - validate: Custom validation function
 * - min/max: Numeric constraints
 *
 * @constant {Object}
 *
 * @example
 * // Variable configuration examples:
 * {
 *   // Boolean configuration
 *   DEBUG: {
 *     type: 'boolean',
 *     required: false
 *   },
 *
 *   // Enum configuration
 *   NODE_ENV: {
 *     type: 'string',
 *     values: ['development', 'production', 'test'],
 *     required: true
 *   },
 *
 *   // Numeric configuration
 *   LOG_MAX_FILES: {
 *     type: 'number',
 *     required: true,
 *     min: 1,
 *     max: 100
 *   },
 *
 *   // Path configuration
 *   DIR_OUTPUT: {
 *     type: 'string',
 *     required: true,
 *     validate: validatePath
 *   }
 * }
 */
const ENV_CONFIG = {
  // Application environment
  NODE_ENV: {
    type: 'string',
    values: ['development', 'production', 'test'],
    required: true,
  },

  // Logging configuration
  LOG_LEVEL: {
    type: 'string',
    values: ['error', 'warn', 'info', 'debug', 'trace'],
    required: true,
    validate: validateLogLevel,
  },
  LOG_ENABLED: {
    type: 'boolean',
    required: true,
  },
  LOG_MAX_SIZE: {
    type: 'string',
    required: true,
    format: /^\d+[KMG]B$/,
    validate: validateFileSize,
  },
  LOG_MAX_FILES: {
    type: 'number',
    required: true,
    min: 1,
    max: 100,
  },
  FULL_LOG_PATH: {
    type: 'string',
    required: true,
    validate: validateLogPath,
  },
  LATEST_LOG_PATH: {
    type: 'string',
    required: true,
    validate: validateLogPath,
  },

  // Debug mode
  DEBUG: {
    type: 'string',
    values: ['true', 'false', 'trace', 'debug', 'info', 'warn', 'error'],
    required: false,
  },

  // Directory paths
  DIR_OUTPUT: {
    type: 'string',
    required: true,
    validate: validatePath,
  },
  DIR_TEMPLATES: {
    type: 'string',
    required: true,
    validate: validatePath,
  },
  DIR_CSS: {
    type: 'string',
    required: true,
    validate: validatePath,
  },
  DIR_IMAGES: {
    type: 'string',
    required: true,
    validate: validatePath,
  },
  DIR_CSV: {
    type: 'string',
    required: true,
    validate: validatePath,
  },
};

/**
 * Validates a directory path and its permissions
 *
 * @param {string} value - Path to validate
 * @param {string} key - Environment variable name
 * @throws {PathError} If path is invalid or lacks permissions
 */
async function validatePath(value, key) {
  const absolutePath = path.isAbsolute(value) ? value : path.resolve(value);

  try {
    const stats = await fs.stat(absolutePath);
    if (!stats.isDirectory()) {
      throw new PathError(key, value, 'Not a directory');
    }

    if (PATH_PERMISSIONS[key]) {
      await fs.access(
        absolutePath,
        PATH_PERMISSIONS[key].write
          ? fs.constants.R_OK | fs.constants.W_OK
          : fs.constants.R_OK
      );
    }
  } catch (error) {
    if (error instanceof PathError) throw error;
    throw new PathError(key, value, error.message);
  }
}

/**
 * Validates log level configuration
 *
 * @param {string} value - Log level to validate
 * @param {string} key - Environment variable name
 * @throws {InvalidValueError} If log level is invalid
 */
function validateLogLevel(value, key) {
  const validLevels = ['error', 'warn', 'info', 'debug', 'trace'];
  if (!validLevels.includes(value.toLowerCase())) {
    throw new InvalidValueError(key, value, validLevels);
  }
}

/**
 * Validates file size format and constraints
 *
 * @param {string} value - File size to validate
 * @param {string} key - Environment variable name
 * @throws {InvalidValueError} If file size is invalid
 */
function validateFileSize(value, key) {
  if (!value.match(/^\d+[KMG]B$/)) {
    throw new InvalidValueError(key, value, 'Format: <number>[K|M|G]B');
  }

  // Convert size to bytes for comparison
  function convertToBytes(sizeStr) {
    const size = parseInt(sizeStr);
    const unit = sizeStr.slice(-2, -1);
    const multipliers = {
      K: 1024,
      M: 1024 * 1024,
      G: 1024 * 1024 * 1024,
    };
    return size * multipliers[unit];
  }

  const sizeInBytes = convertToBytes(value);
  const constraints = NUMERIC_CONSTRAINTS[key];

  if (constraints) {
    const minSizeBytes = convertToBytes(constraints.min);
    const maxSizeBytes = convertToBytes(constraints.max);

    if (sizeInBytes < minSizeBytes || sizeInBytes > maxSizeBytes) {
      throw new InvalidValueError(
        key,
        value,
        `${constraints.min}-${constraints.max}`
      );
    }
  }
}

/**
 * Validates log file path and parent directory
 *
 * @param {string} value - Path to validate
 * @param {string} key - Environment variable name
 * @throws {PathError} If path is invalid
 */
async function validateLogPath(value, key) {
  const absolutePath = path.isAbsolute(value) ? value : path.resolve(value);
  const directory = path.dirname(absolutePath);

  try {
    await fs.access(directory, fs.constants.R_OK | fs.constants.W_OK);
  } catch (error) {
    throw new PathError(
      key,
      value,
      `Parent directory not accessible: ${error.message}`
    );
  }
}

/**
 * Validates all environment variables
 *
 * Performs comprehensive validation:
 * 1. Checks for required variables
 * 2. Validates variable types
 * 3. Verifies value constraints
 * 4. Validates paths and permissions
 * 5. Collects all validation errors
 *
 * @throws {ConfigError} If validation fails
 * @returns {void}
 */
async function validateEnv() {
  const errors = [];

  for (const [key, config] of Object.entries(ENV_CONFIG)) {
    const value = process.env[key];

    try {
      // Check required variables
      if (config.required && !value) {
        throw new MissingEnvError(key);
      }

      if (!value) continue;

      // Validate type and value
      let num;
      switch (config.type) {
        case 'boolean':
          if (value !== 'true' && value !== 'false') {
            throw new InvalidValueError(key, value, ['true', 'false']);
          }
          break;
        case 'number':
          num = Number(value);
          if (isNaN(num)) {
            throw new InvalidValueError(key, value, 'number');
          }
          if (config.min !== undefined && num < config.min) {
            throw new InvalidValueError(key, value, `>= ${config.min}`);
          }
          if (config.max !== undefined && num > config.max) {
            throw new InvalidValueError(key, value, `<= ${config.max}`);
          }
          break;
        case 'string':
          if (config.values && !config.values.includes(value)) {
            throw new InvalidValueError(key, value, config.values);
          }
          if (config.format && !value.match(config.format)) {
            throw new InvalidValueError(key, value, config.format.toString());
          }
          break;
      }

      // Run custom validation if defined
      if (config.validate) {
        await config.validate(value, key);
      }
    } catch (error) {
      if (error instanceof ConfigError) {
        errors.push(error);
      } else {
        errors.push(
          new ConfigError(`Validation failed for ${key}`, {
            variable: key,
            value,
            error: error.message,
          })
        );
      }
    }
  }

  if (errors.length > 0) {
    const errorMessage = ['Environment validation failed:']
      .concat(errors.map((e) => `- ${e.message}`))
      .join('\n');

    logger.error(errorMessage, {
      errors: errors.map((e) => ({
        name: e.name,
        message: e.message,
        details: e.details,
      })),
    });

    throw new ConfigError('Multiple validation errors', {
      errors: errors.map((e) => e.details),
    });
  }

  logger.debug('Environment variables validated successfully', {
    variables: Object.keys(ENV_CONFIG)
      .filter((key) => process.env[key])
      .reduce((acc, key) => {
        acc[key] = key.includes('PATH')
          ? path.basename(process.env[key])
          : process.env[key];
        return acc;
      }, {}),
  });
}

// Prevent runtime modifications
Object.freeze(ENV_CONFIG);
Object.freeze(PATH_PERMISSIONS);
Object.freeze(NUMERIC_CONSTRAINTS);

module.exports = {
  validateEnv,
  ENV_CONFIG,
  // Export error classes for instanceof checks
  ConfigError,
  MissingEnvError,
  InvalidValueError,
  PathError,
};
