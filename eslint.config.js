const globals = require('globals');
const js = require('@eslint/js');
const shopify = require('@shopify/eslint-plugin');
const prettier = require('eslint-plugin-prettier');

module.exports = [
  js.configs.recommended,
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
      ecmaVersion: 2022,
      sourceType: 'module',
    },
    plugins: {
      '@shopify': shopify,
      prettier: prettier,
    },
    rules: {
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
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-unused-vars': [
        'error',
        {
          vars: 'all',
          args: 'after-used',
          ignoreRestSiblings: false,
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
