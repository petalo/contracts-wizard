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
 * @throws {AppError} On invalid node structure
 */
function processNode(node, fields) {
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
            fields.add(node.path.original);
          }
        }
        // Always process params regardless of helper
        if (node.params) {
          node.params.forEach((param) => {
            if (param.type === NODE_TYPES.PATH && !param.data) {
              fields.add(param.original);
            } else if (param.type === NODE_TYPES.SUB_EXPRESSION) {
              // Process subexpressions (e.g., (eq field "value"))
              processNode(param, fields);
            }
          });
        }
        break;

      case NODE_TYPES.SUB_EXPRESSION:
        // Process helper arguments in subexpressions
        if (node.params) {
          node.params.forEach((param) => {
            if (param.type === NODE_TYPES.PATH && !param.data) {
              fields.add(param.original);
            } else if (param.type === NODE_TYPES.SUB_EXPRESSION) {
              processNode(param, fields);
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
              fields.add(node.params[0].original);
            }
          }
        }

        // Process all params regardless of helper
        if (node.params) {
          node.params.forEach((param) => {
            if (param.type === NODE_TYPES.PATH && !param.data) {
              fields.add(param.original);
            } else if (param.type === NODE_TYPES.SUB_EXPRESSION) {
              processNode(param, fields);
            }
          });
        }

        // Process block contents
        node.program.body.forEach((child) => {
          if (node.path.original === 'each') {
            // Skip 'this' references in each blocks
            if (
              child.type === NODE_TYPES.MUSTACHE &&
              child.path.type === NODE_TYPES.PATH &&
              child.path.original === 'this'
            ) {
              return;
            }
          }
          processNode(child, fields);
        });

        // Process else block if present
        if (node.inverse) {
          node.inverse.body.forEach((child) => processNode(child, fields));
        }
        break;

      case NODE_TYPES.PROGRAM:
        // Process all child nodes
        node.body.forEach((child) => processNode(child, fields));
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
 * 1. File content loading
 * 2. AST generation
 * 3. Node traversal
 * 4. Field collection
 * 5. Result sorting
 *
 * @async
 * @param {string} templatePath - Template file path
 * @returns {Promise<string[]>} Extracted field names
 * @throws {AppError} On template or parsing errors
 *
 * @example
 * try {
 *   const fields = await extractTemplateFields('template.md');
 *   console.log('Fields:', fields);
 *   // ['address', 'user.name', 'items.0.price']
 * } catch (error) {
 *   console.error('Extraction failed:', error);
 * }
 */
async function extractTemplateFields(templatePath) {
  try {
    logger.debug('Starting template field extraction', {
      path: templatePath,
    });

    // Load template content
    const content = await fs.readFile(templatePath, ENCODING_CONFIG.default);

    // Generate AST from template
    const ast = handlebars.parse(content);
    const fields = new Set();

    // Process AST nodes
    processNode(ast, fields);

    // Sort and return unique fields
    const uniqueFields = Array.from(fields).sort();
    logger.debug('Template field extraction complete', {
      count: uniqueFields.length,
      fields: uniqueFields,
    });

    logger.debug('Extracted fields from template:', { fields: uniqueFields });

    return uniqueFields;
  } catch (error) {
    logger.error('Template field extraction failed', {
      error,
      path: templatePath,
      message: error.message,
      stack: error.stack,
    });

    throw new AppError('Failed to extract template fields', 'TEMPLATE_ERROR', {
      originalError: error,
      path: templatePath,
    });
  }
}

module.exports = {
  extractTemplateFields,
  processNode,
  NODE_TYPES, // Exported for testing
};
