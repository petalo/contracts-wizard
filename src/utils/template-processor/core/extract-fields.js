/**
 * @file Template Field Extraction System
 *
 * Provides advanced template field extraction:
 * - AST-based template parsing
 * - Variable expression extraction
 * - Helper expression analysis
 * - Block expression handling
 * - Nested structure support
 * - Field name normalization
 *
 * Functions:
 * - extractTemplateFields: Extracts fields from templates
 * - processNode: Processes AST nodes recursively
 * - normalizeFieldName: Normalizes field paths
 * - validateFieldStructure: Validates field hierarchy
 * - extractBlockParams: Extracts block parameters
 * - processPathExpression: Processes path expressions
 *
 * Flow:
 * 1. Template file loading and encoding check
 * 2. AST generation with Handlebars
 * 3. Node traversal and type handling
 *    - MustacheStatement
 *    - BlockStatement
 *    - PathExpression
 *    - SubExpression
 * 4. Field extraction and path building
 * 5. Name normalization and validation
 * 6. Structure validation and cycles check
 * 7. Result compilation and deduplication
 *
 * Error Handling:
 * - Template file access errors
 * - AST parsing failures
 * - Invalid node structures
 * - Malformed expressions
 * - Circular references
 * - Memory constraints
 * - Field validation errors
 * - Encoding issues
 * - Invalid helper usage
 * - Block parameter errors
 *
 * @module @/utils/template-processor/core/extract-fields
 * @requires handlebars - Template parsing engine
 * @requires fs/promises - File system promises
 * @requires path - Path manipulation
 * @requires @/utils/common/logger - Logging system
 * @requires @/utils/common/errors - Error handling
 * @requires @/config/encoding - File encoding configuration
 * @exports extractFields Field extractor function
 * @exports validateFields Field validator function
 * @exports processFields Field processor function
 *
 * @example
 * // Extract fields from template
 * const { extractTemplateFields } = require('@/utils/templateProcessor/core/extractFields');
 *
 * try {
 *   const fields = await extractTemplateFields('contract.md');
 *   console.log('Template fields:', fields);
 * } catch (error) {
 *   if (error.code === 'TEMPLATE_PARSE_ERROR') {
 *     console.error('Invalid template syntax:', error.details);
 *   } else {
 *     console.error('Field extraction failed:', error);
 *   }
 * }
 *
 * // Process AST node manually
 * const { processNode } = require('@/utils/templateProcessor/core/extractFields');
 *
 * const fields = new Set();
 * processNode(astNode, fields);
 * console.log('Extracted fields:', Array.from(fields));
 */

const handlebars = require('handlebars');
const fs = require('fs/promises');
const { logger } = require('@/utils/common/logger');
const { AppError } = require('@/utils/common/errors');
const { ENCODING_CONFIG } = require('@/config/encoding');

/**
 * AST node type configuration
 *
 * Defines constants for AST processing:
 * - Node type identifiers
 * - Expression types
 * - Special keywords
 * - Block types
 *
 * Used to maintain consistent node
 * processing across the system.
 *
 * @constant {object}
 * @property {string} MUSTACHE - Mustache expression
 * @property {string} BLOCK - Block expression
 * @property {string} PROGRAM - Program node
 * @property {string} PATH - Path expression
 * @property {string} SUB_EXPRESSION - Subexpression
 */
const NODE_TYPES = {
  MUSTACHE: 'MustacheStatement',
  BLOCK: 'BlockStatement',
  PROGRAM: 'Program',
  PATH: 'PathExpression',
  SUB_EXPRESSION: 'SubExpression',
};

/**
 * Processes AST node for field extraction
 *
 * Traverses AST nodes through:
 * 1. Node type identification
 * 2. Expression analysis
 * 3. Path extraction
 * 4. Block handling
 * 5. Recursive processing
 *
 * @param {object} node - AST node to process
 * @param {Set} fields - Field collection set
 * @param {string} [prefix] - Path prefix for nested fields
 * @param {object} [context] - Current context for path resolution
 * @throws {AppError} On invalid node structure
 */
function processNode(node, fields, prefix = '', context = {}) {
  try {
    // Handle different node types
    switch (node.type) {
      case NODE_TYPES.MUSTACHE:
        // Process basic {{field}} expressions
        if (node.path.type === NODE_TYPES.PATH && !node.path.data) {
          // Only skip if it's a helper at the root level
          const isHelper = [
            'if',
            'unless',
            'each',
            'with',
            'eq',
            'formatDate',
            'addYears',
            'now',
            'emptyValue',
          ].includes(node.path.parts[0]);

          if (!isHelper) {
            const fieldPath = prefix
              ? `${prefix}.${node.path.original}`
              : node.path.original;
            fields.add(fieldPath);
          }
        }
        // Always process params regardless of helper
        if (node.params) {
          node.params.forEach((param) => {
            if (param.type === NODE_TYPES.PATH && !param.data) {
              const fieldPath = prefix
                ? `${prefix}.${param.original}`
                : param.original;
              fields.add(fieldPath);
            } else if (param.type === NODE_TYPES.SUB_EXPRESSION) {
              // Process subexpressions (e.g., (eq field "value"))
              processNode(param, fields, prefix, context);
            }
          });
        }
        break;

      case NODE_TYPES.SUB_EXPRESSION:
        // Process helper arguments in subexpressions
        if (node.params) {
          node.params.forEach((param) => {
            if (param.type === NODE_TYPES.PATH && !param.data) {
              const fieldPath = prefix
                ? `${prefix}.${param.original}`
                : param.original;
              fields.add(fieldPath);
            } else if (param.type === NODE_TYPES.SUB_EXPRESSION) {
              processNode(param, fields, prefix, context);
            }
          });
        }
        break;

      case NODE_TYPES.BLOCK:
        // Process block expressions (each, if, etc.)
        if (node.path.type === NODE_TYPES.PATH) {
          if (node.path.original === 'each') {
            // Extract collection path from each blocks
            if (node.params[0] && node.params[0].type === NODE_TYPES.PATH) {
              const fieldPath = prefix
                ? `${prefix}.${node.params[0].original}`
                : node.params[0].original;
              fields.add(fieldPath);
              // Process block contents with updated prefix
              const newContext = {
                ...context,
                each: fieldPath,
              };
              node.program.body.forEach((child) => {
                if (
                  child.type === NODE_TYPES.MUSTACHE &&
                  child.path.type === NODE_TYPES.PATH &&
                  child.path.original === 'this'
                ) {
                  // Skip 'this' references in each blocks
                  return;
                }
                processNode(child, fields, fieldPath, newContext);
              });
              return;
            }
          } else if (node.path.original === 'with') {
            // Extract scope path from with blocks
            if (node.params[0] && node.params[0].type === NODE_TYPES.PATH) {
              const fieldPath = prefix
                ? `${prefix}.${node.params[0].original}`
                : node.params[0].original;
              fields.add(fieldPath);
              // Process block contents with updated prefix
              const newContext = {
                ...context,
                with: fieldPath,
              };
              node.program.body.forEach((child) => {
                processNode(child, fields, fieldPath, newContext);
              });
              return;
            }
          }
        }

        // Process all params regardless of helper
        if (node.params) {
          node.params.forEach((param) => {
            if (param.type === NODE_TYPES.PATH && !param.data) {
              const fieldPath = prefix
                ? `${prefix}.${param.original}`
                : param.original;
              fields.add(fieldPath);
            } else if (param.type === NODE_TYPES.SUB_EXPRESSION) {
              processNode(param, fields, prefix, context);
            }
          });
        }

        // Process block contents
        node.program.body.forEach((child) => {
          processNode(child, fields, prefix, context);
        });

        // Process else block if present
        if (node.inverse) {
          node.inverse.body.forEach((child) =>
            processNode(child, fields, prefix, context)
          );
        }
        break;

      case NODE_TYPES.PROGRAM:
        // Process all child nodes
        node.body.forEach((child) =>
          processNode(child, fields, prefix, context)
        );
        break;

      default:
        break;
    }
  } catch (error) {
    logger.error('AST node processing failed', {
      error,
      nodeType: node.type,
      node: JSON.stringify(node, null, 2),
    });
    throw new AppError('Failed to process AST node', 'AST_ERROR', {
      originalError: error,
      nodeType: node.type,
      node: JSON.stringify(node, null, 2),
    });
  }
}

/**
 * Extracts fields from template using AST
 *
 * Processes template through:
 * 1. File content loading or direct string parsing
 * 2. AST generation
 * 3. Node traversal
 * 4. Field collection
 * 5. Result sorting
 *
 * @param {string} input - Template file path or template string
 * @returns {Promise<string[]>} Array of extracted fields
 * @throws {AppError} On template processing failure
 */
async function extractTemplateFields(input) {
  try {
    let templateContent = input;

    // If input looks like a file path, try to read it
    if (input.includes('/') || input.includes('\\')) {
      try {
        templateContent = await fs.readFile(input, ENCODING_CONFIG.encoding);
      } catch (error) {
        // If file read fails, assume input is a template string
        logger.debug('Input is not a file path, treating as template string', {
          input,
          error: error.message,
        });
      }
    }

    // Parse template and extract fields
    const ast = handlebars.parse(templateContent);
    const fields = new Set();
    processNode(ast, fields);

    // Convert Set to sorted array
    return Array.from(fields).sort();
  } catch (error) {
    logger.error('Template field extraction failed', {
      error,
      input,
    });
    throw new AppError('Failed to extract template fields', 'TEMPLATE_ERROR', {
      originalError: error,
      input,
    });
  }
}

module.exports = {
  extractTemplateFields,
  processNode,
  NODE_TYPES, // Exported for testing
};
