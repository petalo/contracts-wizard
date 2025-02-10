/**
 * @file ESLint Configuration
 *
 * This file provides a comprehensive ESLint configuration for enforcing code quality,
 * style consistency and documentation standards across the project.
 *
 * Key features:
 * - Enforces JavaScript best practices and prevents common errors
 * - Requires thorough JSDoc documentation for functions, classes and methods
 * - Maintains consistent code formatting through Prettier integration
 * - Configures special rules for test files
 * - Enforces strict object and array formatting rules
 *
 * The configuration is structured in layers:
 * 1. Base ESLint recommended rules
 * 2. Main configuration block for all .js files:
 *    - JSDoc documentation requirements
 *    - Code style rules (indentation, line length, etc)
 *    - Object/Array formatting rules
 *    - Console logging restrictions
 * 3. Test file overrides that relax certain rules
 *
 * Documentation Requirements:
 * - All functions must have JSDoc comments with descriptions
 * - Parameters and return values must be documented
 * - Files must have overview documentation
 * - Classes must include examples
 *
 * Code Style Rules:
 * - 2 space indentation
 * - 80 character line length limit
 * - Consistent object/array formatting
 * - Properties on separate lines
 * - Strict bracket spacing rules
 *
 * Error Prevention:
 * - No unused variables
 * - No console.log in production (only warn/error allowed)
 * - Strict type checking in JSDoc
 *
 * Test File Exceptions:
 * - Allows console.log
 * - Allows unused variables
 *
 * @module eslint.config - Main ESLint configuration module that defines all linting rules and code style standards
 * @requires globals - Provides predefined global variables for Node.js and testing environments
 * @requires @eslint/js - Core ESLint rules and recommended configurations for JavaScript
 * @requires @shopify/eslint-plugin - Additional high-quality rules and best practices from Shopify
 * @requires eslint-plugin-prettier - Runs Prettier as an ESLint rule for consistent code formatting
 * @requires eslint-plugin-jsdoc - Enforces comprehensive JSDoc documentation standards and validates types
 */

const globals = require('globals');
const js = require('@eslint/js');
const shopify = require('@shopify/eslint-plugin');
const prettier = require('eslint-plugin-prettier');
const jsdoc = require('eslint-plugin-jsdoc');

module.exports = [
  js.configs.recommended,
  {
    files: ['**/*.js'],
    plugins: {
      jsdoc,
      prettier,
      '@shopify': shopify,
    },
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
      ecmaVersion: 2022,
      sourceType: 'module',
    },
    rules: {
      // JSDoc rules
      'jsdoc/require-jsdoc': [
        'error',
        {
          require: {
            FunctionDeclaration: true,
            MethodDefinition: true,
            ClassDeclaration: true,
            ArrowFunctionExpression: false,
            FunctionExpression: false,
          },
          exemptEmptyFunctions: true,
        },
      ],
      'jsdoc/require-description': [
        'error',
        {
          contexts: [
            'ClassDeclaration',
            'FunctionDeclaration',
            'MethodDefinition',
          ],
        },
      ],
      'jsdoc/require-param-description': 'error',
      'jsdoc/require-returns-description': 'error',
      'jsdoc/require-param-type': 'error',
      'jsdoc/require-returns-type': 'error',
      'jsdoc/valid-types': [
        'error',
        {
          allowEmptyNamepaths: true,
        },
      ],
      'jsdoc/check-param-names': 'error',
      'jsdoc/check-tag-names': [
        'error',
        {
          definedTags: [
            'file',
            'fileoverview',
            'function',
            'constant',
            'flow',
            'error',
            'module',
            'requires',
            'exports',
            'example',
            'throws',
            'returns',
            'param',
            'type',
            'typedef',
            'property',
            'async',
            'augments',
            'class',
            'description',
            'private',
            'public',
            'protected',
            'readonly',
            'todo',
          ],
        },
      ],
      'jsdoc/check-types': [
        'error',
        {
          unifyParentAndChildTypeChecks: true,
          noDefaults: true,
        },
      ],
      'jsdoc/require-example': [
        'error',
        {
          contexts: ['ClassDeclaration'],
          exemptedBy: ['private', 'internal'],
          checkConstructors: false,
          checkGetters: false,
          checkSetters: false,
        },
      ],
      'jsdoc/require-file-overview': [
        'error',
        {
          tags: {
            file: {
              initialCommentsOnly: true,
              mustExist: true,
              preventDuplicates: true,
            },
            fileoverview: {
              initialCommentsOnly: true,
              mustExist: true,
              preventDuplicates: true,
            },
          },
        },
      ],
      // Console statements not allowed in production code
      'no-console': ['error', { allow: ['warn', 'error'] }],
      // No unused variables allowed
      'no-unused-vars': [
        'error',
        {
          vars: 'all',
          args: 'after-used',
          ignoreRestSiblings: false,
        },
      ],
      // Indentation rule:
      // - 'error': Severity level
      // - 2: Base number of spaces for indentation
      indent: [
        'error', // Marks any incorrect indentation as error
        2, // Uses 2 spaces as base indentation
        {
          // Indents cases inside switch statements
          SwitchCase: 1,
          // Indents variable declarations
          VariableDeclarator: 1,
          // Indents IIFE (Immediately Invoked Function Expression) bodies
          outerIIFEBody: 1,
          // Indents member access expressions (e.g., object.property)
          MemberExpression: 1,
          FunctionDeclaration: {
            // Indents parameters in function declarations
            parameters: 1,
            // Indents function body
            body: 1,
          },
          FunctionExpression: {
            // Indents parameters in function expressions
            parameters: 1,
            // Indents function body
            body: 1,
          },
          CallExpression: {
            // Indents arguments in function calls
            arguments: 1,
          },
          // Indents array elements
          ArrayExpression: 1,
          // Indents object properties
          ObjectExpression: 1,
          // Indents import declarations
          ImportDeclaration: 1,
          // Controls whether nested ternary expressions should be on one line
          flatTernaryExpressions: false,
          // Controls whether comments should be ignored when validating indentation
          ignoreComments: false,
          // Add ignoredNodes configuration
          ignoredNodes: [
            'TemplateLiteral',
            'TemplateLiteral > *',
            'TaggedTemplateExpression',
          ],
        },
      ],
      'prettier/prettier': [
        'error',
        {
          // Maximum line length before wrapping
          printWidth: 80,
          // Number of spaces per indentation level
          tabWidth: 2,
          // Add spaces between brackets in object literals
          bracketSpacing: true,
          // Place array elements on new lines
          arrayElementNewline: 'always',
          // Configure closing bracket position
          bracketSameLine: false,
        },
      ],
      'object-curly-newline': [
        'error',
        {
          ObjectExpression: {
            consistent: true,
            multiline: true,
            minProperties: 3,
          },
          ObjectPattern: {
            consistent: true,
            multiline: true,
            minProperties: 3,
          },
          ImportDeclaration: {
            consistent: true,
            multiline: true,
            minProperties: 3,
          },
          ExportDeclaration: {
            consistent: true,
            multiline: true,
            minProperties: 3,
          },
        },
      ],
      'object-property-newline': [
        'error',
        // Controls whether all properties must be on their own line
        { allowAllPropertiesOnSameLine: false },
      ],
      '@typescript-eslint/consistent-indexed-object-style': 'off',
    },
  },
  {
    files: ['tests/**/*.{js,jsx}', '**/*.test.js'],
    rules: {
      'no-console': 'off',
    },
  },
  {
    files: ['**/*.test.js', '**/tests/**/*.js'],
    rules: {
      'no-unused-vars': 'off',
    },
  },
];
