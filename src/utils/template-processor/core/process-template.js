/**
 * @file Template Processing System with Handlebars and Spanish Locale Support
 *
 * Provides a template processing system that:
 * - Processes Handlebars templates with Spanish locale
 * - Handles CSV data integration
 * - Manages template field extraction
 * - Supports nested data structures
 * - Provides error handling and validation
 *
 * Functions:
 * - processMarkdownTemplate: Main template processor for end-to-end document generation
 * - processEmptyValues: Handles empty value processing with HTML placeholder generation
 * - validateInputs: Validates existence and accessibility of input files
 * - processDataFile: Processes and validates CSV data against template fields
 * - logGeneratedFiles: Output file logger
 * - removeFrontmatter: Removes YAML frontmatter from markdown content
 * - preprocessImages: Converts image paths to base64 encoded data
 * - formatEmail: Formats email addresses as HTML links
 *
 * Constants:
 * - md: markdown-it instance configuration for HTML generation
 * - imageRegex: Regular expression for image detection in markdown/HTML
 *
 * Flow:
 * 1. Input validation and file accessibility checks
 * 2. CSV data processing and field extraction
 * 3. Template compilation with Handlebars
 * 4. Empty value processing and placeholder generation
 * 5. Markdown to HTML conversion with image processing
 * 6. PDF generation from processed HTML
 * 7. Output file generation and logging
 *
 * Error Handling:
 * - File access errors with detailed path information
 * - Template compilation errors with syntax details
 * - Data processing errors with field validation
 * - Image processing errors with fallback handling
 * - PDF generation errors with browser context handling
 *
 * @module @/utils/template-processor/core/processTemplate
 * @requires handlebars
 * @requires markdown-it
 * @requires fs/promises
 * @requires fs
 * @requires @/utils/common/logger
 * @requires @/utils/common/errors
 * @requires @/utils/common/generate-filename
 * @requires @/utils/file-management/get-file-size
 * @requires @/utils/template-processor/generators/html
 * @requires @/utils/template-processor/generators/pdf
 * @requires @/utils/template-processor/generators/md
 * @exports processMarkdownTemplate - Main template processor
 * @exports processEmptyValues - Empty value handler
 * @exports validateInputs - Input validator
 * @exports processDataFile - Data processor
 * @exports removeFrontmatter - YAML frontmatter cleaner
 * @exports preprocessImages - Image path converter to base64
 * @exports formatEmail - Email formatter to HTML link
 */

const handlebars = require('handlebars');
const MarkdownIt = require('markdown-it');
const fs = require('fs/promises');
const { logger } = require('@/utils/common/logger');
const { AppError } = require('@/utils/common/errors');
const { generateFileName } = require('@/utils/common/generate-filename');
const { getFileSizeKB } = require('@/utils/file-management/get-file-size');
const { generateHtml } = require('@/utils/template-processor/generators/html');
const { generatePdf } = require('@/utils/template-processor/generators/pdf');
const {
  generateMarkdown,
} = require('@/utils/template-processor/generators/md');
const {
  processCsvData,
} = require('@/utils/template-processor/core/process-csv');
const { PATHS } = require('@/config/paths');
const { display } = require('@/cli/display');
const { ENCODING_CONFIG } = require('@/config/encoding');
const moment = require('moment-timezone');
const path = require('path');
const {
  getRelativePath,
} = require('@/utils/file-management/get-relative-path');
const { LOCALE_CONFIG } = require('@/config/locale');
const { HTML_CONFIG } = require('@/config/html-options');
const customRules = require('../renderers/custom-text-renderer');

// Register all handlebars-helpers
require('../handlebars/helpers');

// Configure moment with default timezone and locale
moment.locale(LOCALE_CONFIG.locale);
moment.tz.setDefault(LOCALE_CONFIG.timezone);

// Initialize markdown-it with options from HTML_CONFIG
const md = new MarkdownIt(HTML_CONFIG.markdownit);

// Assign custom renderer rules
Object.assign(md.renderer.rules, customRules);

/**
 * Handles missing values in templates by wrapping them in a span with appropriate data attributes
 *
 * @param {string} path - The full path to the missing value
 * @returns {string} HTML span element with missing value styling
 */
function wrapMissingValue(path) {
  return `<span class="missing-value" data-field="${path}">[[${path}]]</span>`;
}

/**
 * Creates a SafeString for an empty value, using the path as key.
 * @param {string} path - The complete field path (e.g., "user.name").
 * @returns {handlebars.SafeString} The HTML placeholder.
 */
function createMissingValueSpan(path) {
  return new handlebars.SafeString(
    `<span class="missing-value" data-field="${path}">[[${path}]]</span>`
  );
}

/**
 * Create an HTML span for an imported value
 *
 * @param {string} value - The value to wrap
 * @param {string} path - The path of the value in the data structure
 * @returns {string} HTML span with the value
 */
function createImportedValueSpan(value, path) {
  return `<span class="imported-value" data-field="${path}">${value}</span>`;
}

// Configure undefined variables to use helperMissing
handlebars.registerHelper('helperMissing', function (/* dynamic arguments */) {
  const args = Array.prototype.slice.call(arguments);
  const options = args.pop();

  // Build the complete path by traversing the context chain
  let path = options.name;
  let currentContext = options.data;
  const pathParts = [];

  // Traverse up the context chain to build the full path
  while (currentContext) {
    if (currentContext._parent) {
      pathParts.unshift(currentContext._parent);
    }
    currentContext = currentContext._parent ? currentContext.parent : null;
  }

  // Combine all parts to form the full path
  if (pathParts.length > 0) {
    path = [...pathParts, path].join('.');
  }

  logger.debug('Helper missing called:', {
    path,
    originalName: options.name,
    pathParts,
    context: options.data,
    parentContexts: pathParts,
    args: args,
    type: 'undefined',
  });

  return createMissingValueSpan(path);
});

// Configure undefined block helpers to use blockHelperMissing
handlebars.registerHelper('blockHelperMissing', function (context, options) {
  const path = options.name;

  logger.debug('Block helper not found:', {
    path,
    context,
    type: 'undefined_block',
  });

  return createMissingValueSpan(path);
});

// Register with helper for context management
handlebars.registerHelper('with', function (context, options) {
  // Get the current path from parent context if it exists
  const parentPath = options.data.root._currentPath || '';
  const currentPath = options.hash.as || this._currentKey || '';
  const fullPath = parentPath ? `${parentPath}.${currentPath}` : currentPath;

  // Save current path in root context
  options.data.root._currentPath = fullPath;

  if (!context) {
    const result = wrapMissingValue(fullPath, '[[missing]]');
    // Restore parent path
    options.data.root._currentPath = parentPath;
    return result;
  }

  // Create a new context that includes both the current context and parent context
  const newContext = Object.create(this);
  Object.assign(newContext, context);
  newContext._parent = this;
  newContext._currentPath = fullPath;

  const result = options.fn(newContext);

  // Restore parent path
  options.data.root._currentPath = parentPath;

  return result;
});

/**
 * Register the 'each' helper for iterating over arrays and objects
 * Enhanced to work with nested contexts and maintain full paths
 *
 * Provides iteration over arrays and objects while maintaining context paths
 * for proper value tracking and error handling.
 */
handlebars.registerHelper('each', function (context, options) {
  if (!context || !context.length) {
    return options.inverse(this);
  }

  let ret = '';
  const parentPath = options.data?.parentPath || '';
  const currentPath = options.hash.as || options.data.key || '';
  const basePath = parentPath
    ? currentPath
      ? `${parentPath}.${currentPath}`
      : parentPath
    : currentPath;

  for (let i = 0; i < context.length; i++) {
    const data = {
      ...options.data,
      index: i,
      first: i === 0,
      last: i === context.length - 1,
      length: context.length,
      parentPath: basePath,
      key: `${i}`,
    };

    let item = context[i];
    if (item && typeof item === 'object' && !Array.isArray(item)) {
      const numericKeys = Object.keys(item).filter((key) => !isNaN(key));
      if (numericKeys.length > 0) {
        const arr = [];
        numericKeys
          .sort((a, b) => parseInt(a) - parseInt(b))
          .forEach((key) => {
            arr[parseInt(key)] = item[key];
          });
        item = arr;
      }
    }

    ret = ret + options.fn(item, { data });
  }
  return ret;
});

/**
 * Register the 'log' helper for debugging
 * Allows printing values to the console directly from templates
 * Useful during development for inspecting data structures
 *
 * @example
 * {{log user}}
 * {{log "Debugging message"}}
 * {{#each items}}
 *   {{log this}}
 *   {{log @index}}
 * {{/each}}
 */
handlebars.registerHelper('log', function (context) {
  // eslint-disable-next-line no-console
  console.log(context);
});

/**
 * Register logical operation helpers
 *
 * 'and': Performs logical AND operation between two or more values
 * @example
 * {{#if (and value1 value2)}}
 *   Both values are truthy
 * {{/if}}
 *
 * 'not': Negates a value
 * @example
 * {{#if (not isDisabled)}}
 *   Feature is enabled
 * {{/if}}
 */
handlebars.registerHelper('and', require('../handlebars/helpers/logic/and'));
handlebars.registerHelper('not', require('../handlebars/helpers/logic/not'));

/**
 * Process empty values in data structure
 *
 * Recursively processes values in a data structure, wrapping empty or missing values
 * in appropriate HTML spans. Handles nested objects and arrays.
 *
 * @param {*} value - The value to process
 * @param {string} path - The current path in the data structure
 * @returns {*} Processed value with HTML wrapping where needed
 */
function processEmptyValues(value, path) {
  logger.debug('Processing CSV values:', {
    path,
    type: typeof value,
    isNull: value === null,
    isUndefined: value === undefined,
    isEmpty: value === '',
    isEmptyString: typeof value === 'string' && value === '',
    actualValue: value,
    isObject: typeof value === 'object' && value !== null,
    isArray: Array.isArray(value),
    valueLength: value ? String(value).length : 0,
    valueSpaces:
      typeof value === 'string' ? value.match(/\s/g)?.length || 0 : 0,
    valueEncoded: value ? encodeURIComponent(String(value)) : '',
    valueCharCodes: value
      ? Array.from(String(value)).map((c) => c.charCodeAt(0))
      : [],
  });

  // If the value is null, undefined, "null" string, or an empty object
  if (
    value === null ||
    value === undefined ||
    value === 'null' ||
    (typeof value === 'object' &&
      !Array.isArray(value) &&
      Object.keys(value).length === 0)
  ) {
    const placeholder = createMissingValueSpan(path || 'value');
    logger.debug('Empty/null value found - creating placeholder:', {
      path,
      originalValue: value,
      originalType: typeof value,
      reason:
        value === undefined
          ? 'undefined'
          : value === null
            ? 'null'
            : 'empty_object',
      generatedHtml: placeholder.toString(),
    });
    return new handlebars.SafeString(placeholder);
  }

  // If it's an array, process each element recursively
  if (Array.isArray(value)) {
    logger.debug('Processing array:', {
      path,
      length: value.length,
      values: value,
    });
    // Create a new array with the same length and fill empty slots
    return Array.from({ length: value.length }, (_, index) => {
      const item = value[index];
      // If the slot is empty (undefined or empty object), it will be processed as a missing value
      return processEmptyValues(item, `${path}[${index}]`);
    });
  }

  // If it's an object (but not a SafeString), process each property recursively
  if (
    typeof value === 'object' &&
    value !== null &&
    !(value instanceof handlebars.SafeString)
  ) {
    logger.debug('Processing object:', {
      path,
      keys: Object.keys(value),
    });
    const processed = {};
    for (const [key, val] of Object.entries(value)) {
      processed[key] = processEmptyValues(val, path ? `${path}.${key}` : key);
    }
    return processed;
  }

  // For strings, preserve all whitespace
  if (typeof value === 'string') {
    // If it's an empty string, return a missing value span
    if (value === '') {
      const placeholder = createMissingValueSpan(path || 'value');
      logger.debug('Empty string found - creating placeholder:', {
        path,
        generatedHtml: placeholder.toString(),
      });
      return new handlebars.SafeString(placeholder);
    }

    // For non-empty strings, wrap in imported value span preserving spaces
    const escapedValue = handlebars.escapeExpression(value);
    const wrappedValue = createImportedValueSpan(escapedValue, path || 'value');
    logger.debug('String value processed:', {
      path,
      originalValue: value,
      escapedValue,
      wrappedValue: wrappedValue.toString(),
    });
    return new handlebars.SafeString(wrappedValue);
  }

  // For other types (numbers, booleans), convert to string and wrap
  const stringValue = String(value);
  const escapedValue = handlebars.escapeExpression(stringValue);
  const wrappedValue = createImportedValueSpan(escapedValue, path || 'value');
  logger.debug('Non-string value processed:', {
    path,
    originalValue: value,
    originalType: typeof value,
    stringValue,
    escapedValue,
    wrappedValue: wrappedValue.toString(),
  });
  return new handlebars.SafeString(wrappedValue);
}

/**
 * Logs information about generated output files
 *
 * Retrieves and logs file sizes for generated HTML, PDF and Markdown files.
 * Handles errors gracefully and ensures some output is shown even if size checks fail.
 * Uses display utilities for user-friendly console output.
 *
 * @param {string} htmlPath - Path to generated HTML file
 * @param {string} pdfPath - Path to generated PDF file
 * @param {string} mdPath - Path to generated Markdown file
 * @returns {Promise<void>}
 */
async function logGeneratedFiles(htmlPath, pdfPath, mdPath) {
  // Helper function to get relative paths
  const getRelativePaths = () => ({
    mdRelPath: getRelativePath(mdPath),
    htmlRelPath: getRelativePath(htmlPath),
    pdfRelPath: getRelativePath(pdfPath),
  });

  // Helper function to calculate max lengths
  const getMaxLengths = (paths) => {
    const maxTypeLength = Math.max(
      'Markdown'.length,
      'HTML'.length,
      'PDF'.length
    );
    const maxPathLength = Math.max(
      paths.mdRelPath.length,
      paths.htmlRelPath.length,
      paths.pdfRelPath.length
    );
    return {
      maxTypeLength,
      maxPathLength,
    };
  };

  // Helper function to format a line
  const formatLine = (type, path, size, maxLengths) => {
    const typePadding = ' '.repeat(maxLengths.maxTypeLength - type.length);
    const formattedPath = display.path(path);
    const pathPadding = ' '.repeat(maxLengths.maxPathLength - path.length);
    return `${type}${typePadding}: ${formattedPath}${pathPadding}${size ? ` (${size} KB)` : ''}`;
  };

  try {
    // Add a small delay to ensure files are written
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Get file sizes with error handling for each file
    let htmlSize = 0;
    let pdfSize = 0;
    let mdSize = 0;

    try {
      mdSize = await getFileSizeKB(mdPath);
    } catch (error) {
      logger.warn('Failed to get Markdown file size', {
        path: mdPath,
        error: error.message,
        stack: error.stack,
      });
    }

    try {
      htmlSize = await getFileSizeKB(htmlPath);
    } catch (error) {
      logger.warn('Failed to get HTML file size', {
        path: htmlPath,
        error: error.message,
        stack: error.stack,
      });
    }

    try {
      pdfSize = await getFileSizeKB(pdfPath);
    } catch (error) {
      logger.warn('Failed to get PDF file size', {
        path: pdfPath,
        error: error.message,
        stack: error.stack,
      });
    }

    const paths = getRelativePaths();
    const maxLengths = getMaxLengths(paths);

    // Display output even if some sizes failed
    display.blank();
    display.status.success('Files generated successfully:');
    display.list('Generated files:', [
      formatLine('Markdown', paths.mdRelPath, mdSize, maxLengths),
      formatLine('HTML', paths.htmlRelPath, htmlSize, maxLengths),
      formatLine('PDF', paths.pdfRelPath, pdfSize, maxLengths),
    ]);

    logger.info('Files generated successfully', {
      html: {
        path: htmlPath,
        size: htmlSize || 'unknown',
      },
      pdf: {
        path: pdfPath,
        size: pdfSize || 'unknown',
      },
    });
  } catch (error) {
    logger.warn('Failed to log generated files', {
      error: error.message,
      htmlPath,
      pdfPath,
      mdPath,
      stack: error.stack,
    });

    // Still try to show something to the user
    try {
      const paths = getRelativePaths();
      const maxLengths = getMaxLengths(paths);

      display.blank();
      display.status.success('Files generated successfully:');
      display.list('Generated files:', [
        formatLine('Markdown', paths.mdRelPath, null, maxLengths),
        formatLine('HTML', paths.htmlRelPath, null, maxLengths),
        formatLine('PDF', paths.pdfRelPath, null, maxLengths),
      ]);
    } catch (displayError) {
      logger.error('Failed to display file information', {
        error: displayError.message,
        originalError: error.message,
      });
    }
  }
}

/**
 * Process data file and validate against template fields
 *
 * Loads and processes CSV data, validating it against expected template fields.
 * Handles nested properties and array structures in the data.
 * Provides detailed logging of the processing steps and results.
 *
 * @param {string} dataPath - Path to CSV data file
 * @param {string[]} templateFields - Array of field names from template
 * @returns {Promise<{data: object, stats: object}>} Processed data and statistics
 * @example
 * // Process CSV data file
 * const {data, stats} = await processDataFile(
 *   'data.csv',
 *   ['name', 'items.price']
 * );
 */
async function processDataFile(dataPath, templateFields) {
  try {
    logger.debug('Processing data file', {
      path: dataPath,
      templateFields,
      templateFieldCount: templateFields?.length,
    });

    // Convert all fields to strings first
    const stringFields = templateFields
      ? Array.isArray(templateFields)
        ? templateFields.map(String)
        : Array.isArray(Object.values(templateFields))
          ? Object.values(templateFields).map(String)
          : Object.values(templateFields || {}).map(String)
      : [];

    // Filter out special helpers
    const filteredFields = stringFields.filter(
      (field) => !['if', 'unless', 'each', 'with'].includes(field)
    );

    logger.debug('Processing template fields:', {
      originalFields: templateFields,
      stringFields,
      processedFields: filteredFields,
    });

    // Create base structure with template fields
    const baseData = {};
    filteredFields.forEach((field) => {
      const parts = String(field).split('.');
      let current = baseData;
      parts.slice(0, -1).forEach((part) => {
        current[part] = current[part] || {};
        current = current[part];
      });
      // Initialize field as empty
      const lastPart = parts[parts.length - 1];
      if (!(lastPart in current)) {
        current[lastPart] = '';
      }
    });

    if (!dataPath) {
      logger.debug('No data file provided, returning template structure', {
        structure: baseData,
      });
      return {
        data: baseData,
        stats: {
          totalFields: filteredFields.length || 0,
          processedFields: 0,
        },
      };
    }

    // Process CSV data with template fields
    const csvData = await processCsvData(dataPath, filteredFields);

    // Merge CSV data with base structure
    const mergedData = { ...baseData };
    Object.entries(csvData).forEach(([key, value]) => {
      const parts = String(key).split('.');
      let current = mergedData;
      parts.slice(0, -1).forEach((part) => {
        current[part] = current[part] || {};
        current = current[part];
      });
      const lastPart = parts[parts.length - 1];
      current[lastPart] = value;
    });

    logger.debug('Data processed successfully', {
      dataKeys: Object.keys(mergedData),
      templateFields: filteredFields,
      baseStructure: baseData,
      csvData: csvData,
      finalStructure: mergedData,
    });

    return {
      data: mergedData,
      stats: {
        totalFields: filteredFields.length || 0,
        processedFields: Object.keys(csvData).length,
      },
    };
  } catch (error) {
    logger.error('Failed to process data file', {
      error,
      path: dataPath,
      templateFields,
      errorDetails: {
        message: error.message,
        type: error.name,
        code: error.code,
      },
    });
    throw new AppError('Failed to process data file', 'DATA_PROCESSING_ERROR', {
      cause: error,
      details: {
        path: dataPath,
        templateFields,
      },
    });
  }
}

/**
 * Validates input files exist and are accessible
 *
 * Performs comprehensive validation of all input files required for template processing.
 *
 * @param {string} templatePath - Path to template file
 * @param {string} [dataPath] - Optional path to data file
 * @param {string} [cssPath] - Optional path to CSS file
 * @returns {Promise<void>}
 * @throws {AppError} When files are missing or inaccessible
 * @example
 * // Validate all files
 * await validateInputs(
 *   'path/to/template.md',
 *   'path/to/data.csv',
 *   'path/to/styles.css'
 * );
 *
 * // Validate template only
 * await validateInputs('path/to/template.md');
 */
async function validateInputs(templatePath, dataPath, cssPath) {
  try {
    // Template is always required
    if (!templatePath) {
      throw new AppError('Template path is required', 'INPUT_VALIDATION_ERROR');
    }

    const resolvedTemplatePath = path.resolve(templatePath);
    try {
      await fs.access(resolvedTemplatePath);
      logger.debug('Template file validated', {
        originalPath: templatePath,
        resolvedPath: resolvedTemplatePath,
      });
    } catch (error) {
      throw new AppError(
        `Template file not found or not accessible: ${resolvedTemplatePath}`,
        'INPUT_VALIDATION_ERROR'
      );
    }

    // Validate data file if provided
    if (dataPath) {
      const resolvedDataPath = path.resolve(dataPath);
      try {
        await fs.access(resolvedDataPath);
        logger.debug('Data file validated', {
          originalPath: dataPath,
          resolvedPath: resolvedDataPath,
        });
      } catch (error) {
        throw new AppError(
          `Data file not found or not accessible: ${resolvedDataPath}`,
          'INPUT_VALIDATION_ERROR'
        );
      }
    } else {
      logger.debug('No data file provided, skipping validation');
    }

    // Validate CSS file if provided
    if (cssPath) {
      const resolvedCssPath = path.resolve(cssPath);
      try {
        await fs.access(resolvedCssPath);
        logger.debug('CSS file validated', {
          originalPath: cssPath,
          resolvedPath: resolvedCssPath,
        });
      } catch (error) {
        throw new AppError(
          `CSS file not found or not accessible: ${resolvedCssPath}`,
          'INPUT_VALIDATION_ERROR'
        );
      }
    } else {
      logger.debug('No CSS file provided, skipping validation');
    }
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    logger.error('Input validation failed', {
      error: error.message,
      templatePath,
      dataPath,
      cssPath,
      stack: error.stack,
    });
    throw new AppError(
      `Failed to validate input files: ${error.message}`,
      'INPUT_VALIDATION_ERROR',
      {
        originalError: error,
        paths: {
          templatePath,
          dataPath,
          cssPath,
        },
      }
    );
  }
}

/**
 * Removes YAML frontmatter from markdown content
 *
 * @param {string} content - Markdown content that may contain frontmatter
 * @returns {string} Content without frontmatter
 */
function removeFrontmatter(content) {
  if (!content || typeof content !== 'string') {
    return content;
  }

  // Regex to detect frontmatter (content between --- at the start of the file)
  const frontmatterRegex = /^---\n([\s\S]*?)\n---\n/;

  return content.replace(frontmatterRegex, '');
}

/**
 * Pre-processes images in markdown content
 * @param {string} content - Markdown content
 * @param {string} basePath - Base path for resolving relative paths
 * @returns {Promise<string>} - Content with base64 encoded images
 */
async function preprocessImages(content, basePath) {
  // Regex to find images in markdown and HTML
  const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)|<img[^>]+src="([^"]+)"[^>]*>/g;
  let result = content;

  // Find all matches
  const matches = Array.from(content.matchAll(imageRegex));

  // Process each image
  for (const match of matches) {
    const [fullMatch, alt, mdSrc, htmlSrc] = match;
    const src = mdSrc || htmlSrc;

    if (!src) continue;

    try {
      // If path starts with /, use path from project root
      const imagePath = src.startsWith('/')
        ? path.join(process.cwd(), src)
        : path.resolve(path.dirname(basePath), src);

      const imageBuffer = await fs.readFile(imagePath);
      const base64Image = imageBuffer.toString('base64');
      const mimeType =
        path.extname(imagePath).toLowerCase() === '.png'
          ? 'image/png'
          : 'image/jpeg';
      const base64Src = `data:${mimeType};base64,${base64Image}`;

      logger.debug('Image converted to base64:', {
        originalPath: src,
        resolvedPath: imagePath,
        size: imageBuffer.length,
        mimeType,
      });

      // Replace original image with base64 version
      if (mdSrc) {
        result = result.replace(fullMatch, `![${alt || ''}](${base64Src})`);
      } else {
        // For HTML images, preserve width and height attributes
        const widthMatch = fullMatch.match(/width="([^"]+)"/);
        const heightMatch = fullMatch.match(/height="([^"]+)"/);
        const width = widthMatch ? widthMatch[1] : '';
        const height = heightMatch ? heightMatch[1] : '';

        // Replace while maintaining original attributes
        result = result.replace(
          fullMatch,
          `<img src="${base64Src}"${width ? ` width="${width}"` : ''}${height ? ` height="${height}"` : ''}>`
        );
      }
    } catch (error) {
      logger.warn('Failed to convert image to base64:', {
        error,
        src,
        fullMatch,
      });
    }
  }

  return result;
}

/**
 * Extracts template fields from a Handlebars template
 *
 * Parses the template AST to find all variable references and block helpers.
 * Used to determine which fields are required for template processing.
 *
 * @param {string} template - The Handlebars template string to analyze
 * @returns {string[]} Array of field names found in the template
 */
function extractTemplateFields(template) {
  try {
    const ast = handlebars.parse(template);
    const fields = new Set();

    /**
     * Recursively traverses the AST to find all variable references
     *
     * Processes MustacheStatement and BlockStatement nodes to extract
     * variable names and helper references.
     *
     * @param {object} node - Current AST node being processed
     */
    function traverse(node) {
      if (!node) return;

      if (node.type === 'MustacheStatement') {
        // Capturar variables simples
        if (node.path && node.path.original) {
          fields.add(node.path.original);
        }
      } else if (node.type === 'BlockStatement') {
        // Capturar bloques (with, each, etc)
        if (node.path && node.path.original) {
          fields.add(node.path.original);
        }
        // También procesar los parámetros del bloque
        if (node.params) {
          node.params.forEach((param) => {
            if (param && param.original) {
              fields.add(param.original);
            }
          });
        }
      }

      // Recorrer subexpresiones y programas
      if (node.program) {
        node.program.body.forEach(traverse);
      }
      if (node.inverse) {
        node.inverse.body.forEach(traverse);
      }
    }

    ast.body.forEach(traverse);

    // Filtrar campos especiales y convertir a array
    const validFields = Array.from(fields).filter((field) => {
      // Ignorar helpers especiales y variables del sistema
      const specialHelpers = [
        'if',
        'unless',
        'each',
        'with',
        'eq',
        'and',
        'not',
        'log',
      ];
      const systemVars = ['@index', '@key', 'this'];
      return !specialHelpers.includes(field) && !systemVars.includes(field);
    });

    logger.debug('Template fields extracted:', {
      totalFields: fields.size,
      validFields: validFields.length,
      fields: validFields,
    });

    return validFields;
  } catch (error) {
    logger.error('Error extracting template fields:', {
      error: error.message,
      stack: error.stack,
    });
    return [];
  }
}

/**
 * Process markdown template with comprehensive data injection and transformation
 *
 * @param {string} templatePath - Path to the markdown template file
 * @param {string} dataPath - Path to the CSV data file
 * @param {string} cssPath - Path to the CSS styles file
 * @param {string} outputDir - Directory path for generated files
 * @returns {Promise<{content: string, files: {md: string, html: string, pdf: string}, stats: {totalFields: number, processedFields: number}}>} Generated file paths and processing statistics
 * @throws {AppError} When template processing fails
 */
async function processMarkdownTemplate(
  templatePath,
  dataPath,
  cssPath,
  outputDir
) {
  let templateContent = '';
  let rawData = {};

  try {
    logger.debug('Starting template processing', {
      context: 'template',
      templatePath,
      dataPath,
      cssPath,
      outputDir,
    });

    // Validate inputs
    await validateInputs(templatePath, dataPath, cssPath);

    // Read template content first
    templateContent = await fs.readFile(templatePath, ENCODING_CONFIG.default);

    // Extract fields from template
    const templateFields = extractTemplateFields(templateContent);
    logger.debug('Fields extracted from template:', {
      context: 'template',
      operation: 'field-extraction',
      totalFields: templateFields.length,
      fields: templateFields,
    });

    // Process data file with template fields
    const { data } = await processDataFile(dataPath, templateFields);
    rawData = data;

    // Pre-process the data to handle empty values
    const processedData = processEmptyValues(rawData, '');

    logger.debug('Data structure before template processing:', {
      context: 'template',
      templateFields,
      dataKeys: Object.keys(processedData),
      dataSample: JSON.stringify(processedData, null, 2).substring(0, 200),
    });

    // Enable access to non-own properties
    handlebars.allowProtoPropertiesByDefault = true;
    handlebars.allowProtoMethodsByDefault = true;

    // Add before template processing
    logger.debug('Template AST:', {
      context: 'template',
      ast: handlebars.parse(templateContent).body.map((node) => ({
        type: node.type,
        path: node.path && node.path.original,
        params: node.params && node.params.map((p) => p.original),
        hash:
          node.hash &&
          node.hash.pairs.map((p) => ({
            key: p.key,
            value: p.value.original,
          })),
      })),
    });

    logger.debug('Template context:', {
      context: 'template',
      helpers: Object.keys(handlebars.helpers),
      data: JSON.stringify(rawData, null, 2),
    });

    // Process template with pre-processed data
    const template = handlebars.compile(templateContent);
    let markdown = template(processedData);

    // Remove frontmatter if exists
    markdown = removeFrontmatter(String(markdown || ''));

    // Pre-process images before HTML conversion
    markdown = await preprocessImages(markdown, templatePath);

    // Log markdown content before saving
    logger.debug('Generated markdown content:', {
      context: 'template',
      contentType: typeof markdown,
      isHandlebarsString:
        markdown && typeof markdown === 'object' && 'toString' in markdown,
      contentLength: markdown?.length || 0,
      firstFewLines: String(markdown || '')
        .split('\n')
        .slice(0, 5),
      hasMarkdown: String(markdown || '').includes('#'),
    });

    // Generate filenames
    const finalOutputDir = outputDir || PATHS.output;
    const {
      html: htmlPath,
      pdf: pdfPath,
      md: mdPath,
    } = await generateFileName(dataPath || templatePath, finalOutputDir, [
      'html',
      'pdf',
      'md',
    ]);

    // Ensure output directory exists
    await fs.mkdir(finalOutputDir, { recursive: true });

    // Log paths before writing
    logger.debug('Generated file paths:', {
      context: 'template',
      htmlPath,
      pdfPath,
      mdPath,
      outputDir: finalOutputDir,
    });

    // Save processed markdown
    await generateMarkdown(String(markdown || ''), {
      filepath: mdPath,
    });
    logger.debug('Markdown file generated', {
      context: 'template',
      path: mdPath,
      size: await getFileSizeKB(mdPath),
    });

    // Convert to HTML (now asynchronous)
    const htmlContent = md.render(markdown);

    // Log markdown and HTML content for debugging
    logger.debug('Markdown to HTML conversion:', {
      context: 'template',
      markdown: markdown.substring(0, 500),
      html: htmlContent.substring(0, 500),
      imageTag: htmlContent.match(/<img[^>]+>/g),
    });

    // Post-process HTML to clean up markers
    const cleanedHtml = htmlContent.replace(
      /<!--HB-START-->|<!--HB-END-->/g,
      ''
    );

    logger.debug('HTML conversion complete', {
      context: 'template',
      htmlSize: cleanedHtml.length,
      hasHtml: !!cleanedHtml,
      containsMissingValue: cleanedHtml.includes('missing-value'),
      firstLines: cleanedHtml.split('\n').slice(0, 3).join('\n'),
      spanCount: (cleanedHtml.match(/<span class="missing-value">/g) || [])
        .length,
      beforeCleanup: htmlContent.includes('HB-START'),
      afterCleanup: cleanedHtml.includes('HB-START'),
      containsValidHtml: /<[^>]+>/.test(cleanedHtml),
    });

    // Generate outputs
    await generateHtml(cleanedHtml, {
      filepath: htmlPath,
      cssPath: cssPath,
    });
    logger.debug('HTML file generated', {
      context: 'template',
      path: htmlPath,
      size: await getFileSizeKB(htmlPath),
    });

    try {
      await generatePdf(cleanedHtml, {
        cssPath: cssPath,
        outputPath: pdfPath,
        keepHtml: true,
      });
    } catch (error) {
      if (
        error.message === 'PDF generation failed due to security restrictions'
      ) {
        throw error; // Re-throw PDF generation errors as is
      }

      const wrappedError = new Error('Failed to process template');
      wrappedError.details = {
        message: error.message,
        stack: error.stack,
      };
      throw wrappedError;
    }

    logger.info('PDF file generated', {
      context: 'template',
      path: pdfPath,
      size: await getFileSizeKB(pdfPath),
    });

    // Verify and display generated files
    await logGeneratedFiles(htmlPath, pdfPath, mdPath);

    return {
      content: cleanedHtml,
      files: {
        md: mdPath,
        html: htmlPath,
        pdf: pdfPath,
      },
      stats: {
        context: 'template',
        totalFields: processedData.stats?.totalFields || 0,
        processedFields: processedData.stats?.processedFields || 0,
      },
    };
  } catch (error) {
    logger.error('Template processing failed', {
      context: 'template',
      operation: 'process',
      error: {
        message: error.message,
        code: error.code,
        stack: error.stack,
      },
      dataFields: error.data ? Object.keys(error.data).length : 0,
    });
    throw error;
  }
}

/**
 * Formats email to HTML link
 *
 * Converts email to HTML anchor tag
 *
 * @param {string} email - Input email
 * @returns {string} Formatted email
 */
function formatEmail(email) {
  if (!email || typeof email !== 'string' || !email.includes('@')) {
    const htmlString = `<span class="missing-value" data-field="email">[[email]]</span>`;
    return new handlebars.SafeString(htmlString);
  }
  const htmlString = `<span class="imported-value" data-field="email"><a href="mailto:${handlebars.escapeExpression(email)}">${handlebars.escapeExpression(email)}</a></span>`;
  return new handlebars.SafeString(htmlString);
}

// Register email helper
handlebars.registerHelper('formatEmail', formatEmail);

module.exports = {
  processMarkdownTemplate,
  // Exported for testing
  processEmptyValues,
  validateInputs,
  processDataFile,
  removeFrontmatter,
  preprocessImages,
  formatEmail,
};
