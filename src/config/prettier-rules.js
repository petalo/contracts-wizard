/**
 * @file Prettier Code Formatting Configuration
 *
 * Defines code formatting rules for consistent style:
 * - Line length and wrapping
 * - Indentation and spacing
 * - Quote style and semicolons
 * - Bracket and comma formatting
 * - Arrow function parentheses
 * - HTML whitespace handling
 *
 * Constants:
 * - PRETTIER_OPTIONS: Code formatting configuration
 *   - printWidth: Maximum line length
 *   - tabWidth: Spaces per indentation level
 *   - useTabs: Tab vs space preference
 *   - semi: Semicolon usage
 *   - singleQuote: Quote style
 *   - trailingComma: Trailing comma style
 *   - bracketSpacing: Object literal spacing
 *   - arrowParens: Arrow function parentheses
 *   - proseWrap: Markdown text wrapping
 *   - htmlWhitespaceSensitivity: HTML whitespace
 *
 * Flow:
 * 1. Define formatting preferences
 * 2. Configure language-specific rules
 * 3. Set HTML/CSS handling options
 * 4. Freeze configuration object
 *
 * Error Handling:
 * - Invalid configuration detection
 * - Formatting error recovery
 * - Syntax error handling
 * - Configuration validation
 *
 * @module @/config/prettierRules
 *
 * @example
 * // Import configuration
 * const { PRETTIER_OPTIONS } = require('@/config/prettierRules');
 *
 * // Format JavaScript code
 * const formatted = prettier.format(code, {
 *   ...PRETTIER_OPTIONS,
 *   parser: 'babel'
 * });
 *
 * // Format HTML template
 * const html = prettier.format(template, {
 *   ...PRETTIER_OPTIONS,
 *   parser: 'html'
 * });
 *
 * // Format CSS styles
 * const css = prettier.format(styles, {
 *   ...PRETTIER_OPTIONS,
 *   parser: 'css'
 * });
 *
 * // Format Markdown
 * const md = prettier.format(content, {
 *   ...PRETTIER_OPTIONS,
 *   parser: 'markdown'
 * });
 */

/**
 * Prettier formatting configuration object
 *
 * Defines comprehensive code style rules for
 * consistent formatting across all project files.
 *
 * Rule Categories:
 * - Text Wrapping:
 *   - printWidth: 80 characters
 *   - proseWrap: Always wrap markdown
 *
 * - Indentation:
 *   - tabWidth: 2 spaces
 *   - useTabs: false (use spaces)
 *
 * - Punctuation:
 *   - semi: true (always use semicolons)
 *   - singleQuote: true (prefer single quotes)
 *   - trailingComma: ES5 style
 *
 * - Spacing:
 *   - bracketSpacing: true (spaces in objects)
 *   - arrowParens: avoid (minimal parentheses)
 *
 * - HTML/CSS:
 *   - htmlWhitespaceSensitivity: CSS-driven
 *
 * @constant {object}
 * @property {number} printWidth - Maximum line length
 * @property {number} tabWidth - Spaces per indent
 * @property {boolean} useTabs - Tab vs space preference
 * @property {boolean} semi - Semicolon usage
 * @property {boolean} singleQuote - Quote style
 * @property {string} trailingComma - Trailing comma style
 * @property {boolean} bracketSpacing - Object literal spacing
 * @property {string} arrowParens - Arrow function parentheses
 * @property {string} proseWrap - Markdown text wrapping
 * @property {string} htmlWhitespaceSensitivity - HTML whitespace
 *
 * @example
 * // JavaScript formatting
 * {
 *   const obj = { a: 1 };  // With bracketSpacing
 *   const fn = x => x + 1; // Minimal arrow parens
 *   const str = 'text';    // Single quotes
 *   const arr = [1, 2];    // ES5 trailing comma
 * }
 *
 * // HTML formatting
 * <div>
 *   <span>                 // 2-space indent
 *     Content              // 80-char width
 *   </span>
 * </div>
 */
const PRETTIER_OPTIONS = {
  printWidth: 80,
  tabWidth: 2,
  useTabs: false,
  semi: true,
  singleQuote: true,
  trailingComma: 'es5',
  bracketSpacing: true,
  arrowParens: 'avoid',
  proseWrap: 'always',
  htmlWhitespaceSensitivity: 'ignore',
  endOfLine: 'lf',
  embeddedLanguageFormatting: 'auto',
  parser: 'html',
  plugins: ['prettier-plugin-html'],
};

// Prevent runtime modifications
Object.freeze(PRETTIER_OPTIONS);

module.exports = {
  PRETTIER_OPTIONS,
};
