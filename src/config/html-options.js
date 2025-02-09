/**
 * @file HTML Generation Configuration
 *
 * Manages HTML document generation settings:
 * - Code formatting options
 * - Metadata configuration
 * - Base HTML template structure
 * - Document styling integration
 * - Markdown processing options
 *
 * Constants:
 * - HTML_CONFIG: Main configuration object
 *   - prettier: Code formatting rules
 *   - meta: Document metadata settings
 *   - templates: HTML document templates
 *   - markdownit: Markdown processing options
 *
 * Flow:
 * 1. Import dependencies (locale, prettier rules)
 * 2. Configure HTML formatting options
 * 3. Define metadata structure
 * 4. Create document templates
 * 5. Configure markdown processing
 * 6. Freeze configuration for immutability
 *
 * Metadata Categories:
 * - basic: Required metadata (charset, viewport)
 * - custom: Application-specific metadata
 * - extra: Optional optimization metadata
 *
 * Error Handling:
 * - Configuration immutability enforcement
 * - Template parameter validation
 * - Metadata structure validation
 * - Formatting error prevention
 * - Invalid template handling
 *
 * @module @/config/htmlOptions
 * @requires @/config/locale
 * @requires @/config/prettierRules
 *
 * @example
 * // Import configuration
 * const { HTML_CONFIG } = require('@/config/htmlOptions');
 *
 * // Use prettier options
 * const formatted = prettier.format(html, HTML_CONFIG.prettier);
 *
 * // Generate document with metadata
 * const meta = [
 *   ...HTML_CONFIG.meta.basic,
 *   ...HTML_CONFIG.meta.custom,
 *   { name: 'description', content: 'Document description' }
 * ].map(m => createMetaTag(m));
 *
 * // Create document from template
 * const html = HTML_CONFIG.templates.base({
 *   lang: 'en',
 *   meta,
 *   style: 'body { font-family: Arial; }',
 *   content: '<main>Content</main>'
 * });
 *
 * // Configure markdown processing
 * const md = new MarkdownIt(HTML_CONFIG.markdownit);
 */

const { LOCALE_CONFIG } = require('@/config/locale');
const { PRETTIER_OPTIONS } = require('@/config/prettier-rules');
const { HANDLEBARS_CONFIG } = require('@/config/handlebars-config');

/**
 * HTML generation configuration object
 *
 * Comprehensive configuration for HTML document generation,
 * including formatting rules, metadata settings, base
 * templates, and markdown processing options.
 *
 * @constant {object}
 * @property {object} prettier - Code formatting configuration
 * @property {object} meta - Document metadata settings
 * @property {object} templates - HTML document templates
 * @property {object} markdownit - Markdown processing options
 *
 * @example
 * // Metadata usage
 * const metaTags = [
 *   { charset: 'UTF-8' },
 *   { name: 'viewport', content: 'width=device-width' },
 *   { name: 'generator', content: 'Contracts Wizard' }
 * ];
 *
 * // Template usage
 * const doc = HTML_CONFIG.templates.base({
 *   lang: 'es',
 *   meta: metaTags.map(createMetaTag),
 *   style: `
 *     body { margin: 0; }
 *     .content { padding: 1rem; }
 *   `,
 *   content: `
 *     <div class="content">
 *       <h1>Document Title</h1>
 *       <p>Document content...</p>
 *     </div>
 *   `
 * });
 *
 * // Markdown options usage
 * const md = new MarkdownIt(HTML_CONFIG.markdownit);
 */
const HTML_CONFIG = {
  // Code formatting configuration
  prettier: {
    ...PRETTIER_OPTIONS,
    parser: 'html',
  },

  // Document metadata configuration
  meta: {
    // Basic required metadata
    basic: [
      {
        charset: 'UTF-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1.0',
      },
    ],
    // Application-specific metadata
    custom: [
      {
        name: 'generator',
        content: 'Contracts Wizard',
      },
      {
        name: 'application-name',
        content: 'petalo',
      },
    ],
    // Additional optimization metadata
    extra: [
      {
        name: 'format-detection',
        content: 'telephone=no',
      },
    ],
  },

  // HTML document templates
  templates: {
    /**
     * Base HTML document template
     *
     * Creates a complete HTML5 document with:
     * - Proper DOCTYPE and language
     * - Metadata integration
     * - Embedded styles
     * - Content placement
     *
     * @param {object} options - Template options
     * @param {string} [options.lang='en'] - Document language
     * @param {string[]} [options.meta=[]] - Metadata tags
     * @param {string} [options.style=''] - CSS styles
     * @param {string} [options.content=''] - Document content
     * @returns {string} Complete HTML document
     */
    base: ({
      lang = LOCALE_CONFIG?.lang || 'en',
      meta = [],
      style = '',
      content = '',
    }) => `<!DOCTYPE html>
<html lang="${lang}">
<head>
  ${meta.join('\n  ')}
  <style type="text/css">
    ${style}
  </style>
</head>
<body>
  ${content}
</body>
</html>`,
  },

  // Markdown-it configuration
  markdownit: {
    html: true,
    breaks: true,
    linkify: true,
    typographer: true,
    xhtml: true,
    quotes: '""\'\'',
    langPrefix: 'language-',
    highlight: null,
  },

  // Empty value configuration
  emptyValue: HANDLEBARS_CONFIG.emptyValue,
};

// Prevent runtime modifications
Object.freeze(HTML_CONFIG);
Object.freeze(HTML_CONFIG.prettier);
Object.freeze(HTML_CONFIG.meta);
Object.freeze(HTML_CONFIG.templates);
Object.freeze(HTML_CONFIG.markdownit);
Object.freeze(HTML_CONFIG.emptyValue);

module.exports = {
  HTML_CONFIG,
};
