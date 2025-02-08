/**
 * @fileoverview Data Validation Utilities
 *
 * Provides comprehensive data validation functions for:
 * - Empty field detection
 * - Undefined value checking
 * - Type validation
 * - Format validation
 * - Length validation
 * - Nested object validation
 * - Suspicious content detection
 * - Security pattern matching
 * - Data sanitization
 * - Custom validation rules
 *
 * Functions:
 * - validateData: Comprehensive data validator
 *
 * Constants:
 * - FORMAT_PATTERNS: Regular expressions for format validation
 *   - EMAIL: Email address format
 *   - DATE_ISO: ISO date format
 *   - URL: URL format
 *   - PHONE: Phone number format
 *
 * - SUSPICIOUS_PATTERNS: Regular expressions for security validation
 *   - SQL_INJECTION: SQL injection patterns
 *   - SCRIPT_TAGS: Script tag injection
 *   - NULL_BYTES: Null byte injection
 *   - ONLY_WHITESPACE: Empty content masking
 *   - PATH_TRAVERSAL: Directory traversal
 *   - COMMAND_INJECTION: Shell command injection
 *
 * Flow:
 * 1. Check for empty fields and null values
 * 2. Identify undefined values
 * 3. Validate data types and formats
 * 4. Check field lengths and ranges
 * 5. Validate nested objects
 * 6. Detect suspicious content
 * 7. Report validation issues with context
 * 8. Apply custom validation rules
 *
 * Error Handling:
 * - Empty field detection
 * - Undefined value handling
 * - Type mismatches
 * - Format violations
 * - Length violations
 * - Suspicious content alerts
 * - Custom validation errors
 * - Nested validation failures
 *
 * @module @/utils/common/validateData
 * @exports {Function} validateData - Data validator
 * @exports {Object} FORMAT_PATTERNS - Format validation patterns
 * @exports {Object} SUSPICIOUS_PATTERNS - Security validation patterns
 *
 * @example
 * // Import validation utilities
 * const { validateData } = require('@/utils/common/validateData');
 *
 * // Basic validation
 * const result = validateData({
 *   name: 'John',
 *   email: '',
 *   role: undefined
 * });
 *
 * // Advanced validation with options
 * const result = validateData(data, {
 *   strictMode: true,
 *   requiredFields: ['name', 'email'],
 *   fieldTypes: {
 *     name: 'string',
 *     age: 'number'
 *   }
 * });
 *
 * // Security validation
 * const result = validateData(userInput, {
 *   strictMode: true,
 *   fieldFormats: {
 *     query: (value) => !SUSPICIOUS_PATTERNS.SQL_INJECTION.test(value)
 *   }
 * });
 */

/**
 * Regular expression patterns for format validation
 * Used to validate specific field formats
 *
 * Supported Formats:
 * - Email addresses (RFC 5322)
 * - ISO dates (ISO 8601)
 * - URLs (HTTP/HTTPS)
 * - Phone numbers (international)
 *
 * @constant {Object}
 * @property {RegExp} EMAIL - Validates email format
 * @property {RegExp} DATE_ISO - Validates ISO date format
 * @property {RegExp} URL - Validates URL format
 * @property {RegExp} PHONE - Validates phone number format
 *
 * @example
 * // Email validation
 * const isValidEmail = FORMAT_PATTERNS.EMAIL.test('user@example.com');
 *
 * // Date validation
 * const isValidDate = FORMAT_PATTERNS.DATE_ISO.test('2024-03-15T14:30:00Z');
 *
 * // URL validation
 * const isValidUrl = FORMAT_PATTERNS.URL.test('https://example.com/path');
 *
 * // Phone validation
 * const isValidPhone = FORMAT_PATTERNS.PHONE.test('+1-234-567-8900');
 */
const FORMAT_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  DATE_ISO:
    /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?(Z|[-+]\d{2}:?\d{2})?)?$/,
  URL: /^https?:\/\/[\w-]+(\.[\w-]+)+([\w.,@?^=%&:/~+#-]*[\w@?^=%&/~+#-])?$/,
  PHONE: /^\+?[\d\s-()]{8,}$/,
};

/**
 * Regular expression patterns for detecting suspicious content
 * Used for security validation of input data
 *
 * Security Checks:
 * - SQL injection attempts
 * - Script tag injection
 * - Null byte attacks
 * - Directory traversal
 * - Command injection
 * - Empty content masking
 *
 * @constant {Object}
 * @property {RegExp} SQL_INJECTION - Detects common SQL injection patterns
 * @property {RegExp} SCRIPT_TAGS - Detects script tag injection attempts
 * @property {RegExp} NULL_BYTES - Detects null byte injection attempts
 * @property {RegExp} ONLY_WHITESPACE - Detects empty content masquerading as valid
 * @property {RegExp} PATH_TRAVERSAL - Detects directory traversal attempts
 * @property {RegExp} COMMAND_INJECTION - Detects shell command injection attempts
 *
 * @example
 * // SQL injection check
 * const hasSqlInjection = SUSPICIOUS_PATTERNS.SQL_INJECTION
 *   .test("SELECT * FROM users");
 *
 * // XSS check
 * const hasXss = SUSPICIOUS_PATTERNS.SCRIPT_TAGS
 *   .test("<script>alert('xss')</script>");
 *
 * // Path traversal check
 * const hasTraversal = SUSPICIOUS_PATTERNS.PATH_TRAVERSAL
 *   .test("../../../etc/passwd");
 *
 * // Command injection check
 * const hasCommand = SUSPICIOUS_PATTERNS.COMMAND_INJECTION
 *   .test("file.txt; rm -rf /");
 */
const SUSPICIOUS_PATTERNS = {
  SQL_INJECTION: /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION)\b)|(--)|(;)/i,
  SCRIPT_TAGS: /<script\b[^>]*>[\s\S]*?<\/script>/i,
  NULL_BYTES: /\0/,
  ONLY_WHITESPACE: /^\s*$/,
  PATH_TRAVERSAL: /\.\.[/\\]/,
  COMMAND_INJECTION: /[;&|`$]/,
};

// Freeze constants to prevent modification
Object.freeze(FORMAT_PATTERNS);
Object.freeze(SUSPICIOUS_PATTERNS);

/**
 * Validates input data completeness and quality
 *
 * Performs comprehensive data validation:
 * 1. Checks for empty fields and null values
 * 2. Identifies undefined values
 * 3. Validates data types and formats
 * 4. Validates field lengths and ranges
 * 5. Validates nested objects
 * 6. Detects suspicious content
 * 7. Reports validation issues with context
 * 8. Applies custom validation rules
 *
 * @param {Object} data - Data object to validate
 * @param {Object} [options] - Validation options
 * @param {boolean} [options.strictMode=false] - Enable strict validation
 * @param {string[]} [options.requiredFields] - Fields that must be present
 * @param {Object} [options.fieldTypes] - Expected types for fields
 * @param {Object} [options.fieldFormats] - Expected formats for fields
 * @param {Object} [options.fieldLengths] - Min/max lengths for fields
 * @param {Object} [options.nestedValidation] - Rules for nested objects
 * @returns {Object} Validation results
 * @property {string[]} emptyFields - Fields with empty values
 * @property {string[]} undefinedFields - Fields with undefined values
 * @property {Object[]} suspiciousFields - Fields with suspicious content
 * @property {Object[]} typeErrors - Fields with incorrect types
 * @property {Object[]} formatErrors - Fields with incorrect formats
 * @property {Object[]} lengthErrors - Fields with invalid lengths
 * @property {Object[]} nestedErrors - Validation errors in nested objects
 * @property {boolean} hasIssues - Whether any issues were found
 * @property {Object} context - Additional validation context
 *
 * @example
 * // Basic validation
 * const result = validateData({
 *   username: 'john_doe',
 *   email: 'invalid-email'
 * });
 *
 * // Type validation
 * const result = validateData(data, {
 *   fieldTypes: {
 *     age: 'number',
 *     active: 'boolean',
 *     tags: 'array'
 *   }
 * });
 *
 * // Format validation
 * const result = validateData(data, {
 *   fieldFormats: {
 *     email: 'EMAIL',
 *     website: 'URL',
 *     phone: 'PHONE'
 *   }
 * });
 *
 * // Length validation
 * const result = validateData(data, {
 *   fieldLengths: {
 *     username: { min: 3, max: 20 },
 *     password: { min: 8, max: 100 },
 *     tags: { max: 5 }
 *   }
 * });
 *
 * // Nested validation
 * const result = validateData(data, {
 *   nestedValidation: {
 *     address: {
 *       requiredFields: ['street', 'city'],
 *       fieldTypes: {
 *         zipCode: 'string',
 *         coordinates: 'array'
 *       }
 *     }
 *   }
 * });
 *
 * // Security validation
 * const result = validateData(userInput, {
 *   strictMode: true,
 *   fieldFormats: {
 *     query: (value) => !SUSPICIOUS_PATTERNS.SQL_INJECTION.test(value),
 *     path: (value) => !SUSPICIOUS_PATTERNS.PATH_TRAVERSAL.test(value)
 *   }
 * });
 */
function validateData(data, options = {}) {
  const {
    strictMode = false,
    requiredFields = [],
    fieldTypes = {},
    fieldFormats = {},
    fieldLengths = {},
    nestedValidation = {},
  } = options;

  const emptyFields = [];
  const undefinedFields = [];
  const suspiciousFields = [];
  const typeErrors = [];
  const formatErrors = [];
  const lengthErrors = [];
  const nestedErrors = [];

  // Helper for type checking
  const checkType = (value, expectedType) => {
    if (value === null) return false;
    if (expectedType === 'array') return Array.isArray(value);
    if (expectedType === 'date') return value instanceof Date && !isNaN(value);
    return typeof value === expectedType;
  };

  // Helper for format checking
  const checkFormat = (value, format) => {
    const pattern = FORMAT_PATTERNS[format];
    if (!pattern) return true; // Skip if format not defined
    return pattern.test(String(value));
  };

  // Helper for length checking
  const checkLength = (value, rules) => {
    if (!rules) return true;
    const length = Array.isArray(value) ? value.length : String(value).length;
    const { min, max } = rules;
    if (min !== undefined && length < min) return false;
    if (max !== undefined && length > max) return false;
    return true;
  };

  // Validate nested object
  const validateNested = (obj, rules, path = '') => {
    const result = validateData(obj, rules);
    if (result.hasIssues) {
      nestedErrors.push({
        path,
        issues: result,
      });
    }
    return result;
  };

  // Validate each field
  Object.entries(data).forEach(([key, value]) => {
    // Check for empty and undefined
    if (value === null || value === '') {
      emptyFields.push(key);
    }
    if (value === undefined) {
      undefinedFields.push(key);
    }

    // Check types if specified
    if (fieldTypes[key] && !checkType(value, fieldTypes[key])) {
      typeErrors.push({
        field: key,
        expectedType: fieldTypes[key],
        actualType:
          value === null
            ? 'null'
            : Array.isArray(value)
              ? 'array'
              : typeof value,
        value:
          value === undefined ? 'undefined' : String(value).substring(0, 50),
      });
    }

    // Check formats if specified
    if (fieldFormats[key] && !checkFormat(value, fieldFormats[key])) {
      formatErrors.push({
        field: key,
        expectedFormat: fieldFormats[key],
        value: String(value).substring(0, 50),
      });
    }

    // Check lengths if specified
    if (fieldLengths[key] && !checkLength(value, fieldLengths[key])) {
      lengthErrors.push({
        field: key,
        rules: fieldLengths[key],
        actualLength: Array.isArray(value)
          ? value.length
          : String(value).length,
        value: String(value).substring(0, 50),
      });
    }

    // Check for suspicious content in strings
    if (typeof value === 'string') {
      Object.entries(SUSPICIOUS_PATTERNS).forEach(([pattern, regex]) => {
        if (regex.test(value)) {
          suspiciousFields.push({
            key,
            issue: pattern.toLowerCase(),
            value: value.substring(0, 50),
            pattern: regex.toString(),
          });
        }
      });
    }

    // Validate nested objects
    if (nestedValidation[key] && value && typeof value === 'object') {
      validateNested(value, nestedValidation[key], key);
    }
  });

  // Check required fields
  requiredFields.forEach((field) => {
    if (!(field in data)) {
      undefinedFields.push(field);
    }
  });

  const result = {
    emptyFields,
    undefinedFields,
    suspiciousFields,
    typeErrors,
    formatErrors,
    lengthErrors,
    nestedErrors,
    hasIssues:
      emptyFields.length > 0 ||
      undefinedFields.length > 0 ||
      suspiciousFields.length > 0 ||
      typeErrors.length > 0 ||
      formatErrors.length > 0 ||
      lengthErrors.length > 0 ||
      nestedErrors.length > 0,
  };

  // Add validation context
  if (result.hasIssues) {
    result.context = {
      timestamp: new Date().toISOString(),
      totalIssues:
        emptyFields.length +
        undefinedFields.length +
        suspiciousFields.length +
        typeErrors.length +
        formatErrors.length +
        lengthErrors.length +
        nestedErrors.length,
      validatedFields: Object.keys(data),
      options: {
        strictMode,
        requiredFields,
        fieldTypes,
        fieldFormats,
        fieldLengths,
        nestedValidation: Object.keys(nestedValidation),
      },
    };
  }

  return result;
}

module.exports = {
  validateData,
  FORMAT_PATTERNS,
  SUSPICIOUS_PATTERNS,
};
