/**
 * @file ESLint Configuration
 *
 * Provides ESLint configuration for the project:
 * - JavaScript and TypeScript linting rules
 * - JSDoc documentation requirements
 * - Code style enforcement
 * - Test file exceptions
 *
 * Functions:
 * - None (configuration only)
 *
 * Constants:
 * - None (configuration only)
 *
 * Flow:
 * 1. Import required plugins and configurations
 * 2. Define base configuration
 * 3. Configure JSDoc rules
 * 4. Configure code style rules
 * 5. Define test file overrides
 *
 * Error Handling:
 * - Invalid configuration detection
 * - Rule conflict resolution
 * - Plugin loading errors
 *
 * @module eslint.config
 * @requires globals
 * @requires @eslint/js
 * @requires @shopify/eslint-plugin
 * @requires eslint-plugin-prettier
 * @requires eslint-plugin-jsdoc
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
          },
          ObjectPattern: {
            consistent: true,
            multiline: true,
          },
          ImportDeclaration: {
            consistent: true,
            multiline: true,
          },
          ExportDeclaration: {
            consistent: true,
            multiline: true,
          },
        },
      ],
      'object-property-newline': [
        'error',
        // Controls whether all properties must be on their own line
        { allowAllPropertiesOnSameLine: false },
      ],
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
