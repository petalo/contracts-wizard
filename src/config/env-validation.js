/**
 * @file Environment Variable Validation System
 *
 * Provides comprehensive validation for environment variables:
 * - Required vs optional variables
 * - Type checking and coercion
 * - Value constraints and formats
 * - Path validation and permissions
 *
 * Functions:
 * - validateEnv: Main validation entry point
 * - validatePath: Directory path validation
 * - validateLogLevel: Log level validation
 * - validateFileSize: File size format validation
 *
 * Constants:
 * - PATH_PERMISSIONS: Directory access requirements
 * - NUMERIC_CONSTRAINTS: Size and count limits
 * - ENV_CONFIG: Variable validation rules
 *
 * Flow:
 * 1. Load environment configuration
 * 2. Validate required variables
 * 3. Check types and formats
 * 4. Validate paths and permissions
 * 5. Apply custom validations
 *
 * Error Handling:
 * - MissingEnvError: Required variable missing
 * - InvalidValueError: Invalid value format/type
 * - PathError: Invalid path or permissions
 *
 * @module @/config/env-validation
 * @requires fs/promises
 * @requires path
 * @requires @/config/env
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
// prettier-ignore
const {
  ENV,
  LOG_LEVELS,
  NODE_ENVS
} = require('./env');

/**
 * Custom error class for configuration errors
 *
 * Base class for all configuration-related errors.
 * Provides standard error formatting and handling.
 *
 * @example
 * throw new ConfigError('Invalid configuration', {
 *   key: 'DATABASE_URL',
 *   value: 'invalid://url'
 * });
 */
class ConfigError extends AppError {
  /**
   * Creates a new ConfigError instance
   *
   * @param {string} message - Error message
   * @param {object} details - Additional error details
   */
  constructor(message, details) {
    super(message, 'CONFIG_ERROR', details);
    this.name = 'ConfigError';
  }
}

/**
 * Custom error class for missing environment variables
 *
 * Thrown when a required environment variable is not set.
 * Includes the variable name in the error details.
 *
 * @example
 * throw new MissingEnvError('API_KEY');
 */
class MissingEnvError extends ConfigError {
  /**
   * Creates a new MissingEnvError instance
   *
   * @param {string} variable - Name of the missing variable
   */
  constructor(variable) {
    super(`Missing required environment variable: ${variable}`, {
      variable,
      type: 'missing_env',
    });
    this.name = 'MissingEnvError';
  }
}

/**
 * Custom error class for invalid environment values
 *
 * Thrown when an environment variable has an invalid value.
 * Includes the variable name, actual value, and expected format.
 *
 * @example
 * throw new InvalidValueError('PORT', 'abc', 'number');
 */
class InvalidValueError extends ConfigError {
  /**
   * Creates a new InvalidValueError instance
   *
   * @param {string} variable - Name of the invalid variable
   * @param {*} value - The invalid value
   * @param {string} expected - Description of expected format/value
   */
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

/**
 * Custom error class for path-related errors
 *
 * Thrown when there are issues with file paths or directories.
 * Includes the path and specific reason for the error.
 *
 * @example
 * throw new PathError('OUTPUT_DIR', '/invalid/path', 'Directory not writable');
 */
class PathError extends ConfigError {
  /**
   * Creates a new PathError instance
   *
   * @param {string} variable - Name of the path variable
   * @param {string} path - The invalid path
   * @param {string} reason - Reason for the error
   */
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

/**
 * Directory permission requirements
 * @constant {object}
 */
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

/**
 * Numeric value constraints
 * @constant {object}
 */
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
 * @constant {object}
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
    values: NODE_ENVS,
    required: true,
  },

  // Logging configuration
  LOG_LEVEL: {
    type: 'string',
    values: LOG_LEVELS,
    required: true,
    validate: validateLogLevel,
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
  LOG_DIR: {
    type: 'string',
    required: true,
    validate: validatePath,
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
  if (!LOG_LEVELS.includes(value.toLowerCase())) {
    throw new InvalidValueError(key, value, LOG_LEVELS);
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
  /**
   * Converts a file size string to bytes
   *
   * Parses a string representing file size (e.g., '1MB', '2GB')
   * and converts it to the equivalent number of bytes.
   * Supports units: B, KB, MB, GB
   *
   * @param {string} sizeStr - Size string with unit (e.g., '1MB')
   * @returns {number} Size in bytes
   * @throws {InvalidValueError} If size format is invalid
   *
   * @example
   * convertToBytes('1MB')  // Returns: 1048576
   * convertToBytes('2GB')  // Returns: 2147483648
   * convertToBytes('512KB') // Returns: 524288
   */
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
    const value = ENV[key] || process.env[key];

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

/**
 * Validates environment variable configuration
 *
 * @param {string} name - Environment variable name
 * @param {string} value - Environment variable value
 * @param {object} rules - Validation rules
 * @returns {boolean} True if valid, false otherwise
 * @example
 * validateEnvVar('LOG_LEVEL', 'debug', { required: true, values: ['debug', 'info', 'warn', 'error'] })
 */

/**
 * Validates required environment variables
 *
 * Checks if all required environment variables are present and have valid values.
 *
 * @param {string[]} required - List of required variable names
 * @returns {boolean} True if all required variables are valid
 * @example
 * validateRequired(['NODE_ENV', 'LOG_LEVEL'])
 */

/**
 * Validates environment variable values against allowed values
 *
 * Ensures environment variables only contain allowed values.
 *
 * @param {object} allowedValues - Map of variable names to allowed values
 * @returns {boolean} True if all values are valid
 * @example
 * validateValues({ NODE_ENV: ['development', 'production', 'test'] })
 */

/**
 * Validates environment variable formats using regex patterns
 *
 * Checks if environment variables match their expected format patterns.
 *
 * @param {object} patterns - Map of variable names to regex patterns
 * @returns {boolean} True if all formats are valid
 * @example
 * validateFormats({ PORT: /^\d+$/, URL: /^https?:\/\/.+$/ })
 */

/**
 * Validates command arguments and options
 *
 * Checks if the provided command is valid and exists in the list
 * of allowed commands. Returns false if validation fails.
 *
 * @param {string} command Command to validate
 * @returns {boolean} True if command is valid
 */

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
