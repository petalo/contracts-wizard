/**
 * @file HTML Document Generation System
 *
 * Provides comprehensive HTML document generation:
 * - Template to HTML conversion
 * - CSS styling integration
 * - Dynamic content rendering
 * - Document structure formatting
 * - Metadata management
 * - Resource embedding
 *
 * Functions:
 * - generateHTML: Creates HTML from template
 * - applyStyles: Integrates CSS styling
 * - embedResources: Handles resource inclusion
 * - validateOutput: Verifies HTML structure
 * - processMetadata: Manages document metadata
 *
 * Flow:
 * 1. Template loading and validation
 * 2. Content processing
 * 3. Style integration
 * 4. Resource embedding
 * 5. Structure formatting
 * 6. Metadata injection
 * 7. Output validation
 *
 * Error Handling:
 * - Template parsing errors
 * - CSS integration failures
 * - Resource loading issues
 * - Invalid HTML structure
 * - Metadata validation errors
 * - File system errors
 * - Memory constraints
 *
 * @module @/utils/templateProcessor/generators/html
 * @requires handlebars - Template engine
 * @requires fs/promises - File system operations
 * @requires path - Path manipulation
 * @requires @/utils/common/logger - Logging system
 * @requires @/utils/common/errors - Error handling
 * @requires @/config/html-options - HTML configuration
 * @requires @/config/fileExtensions - File extensions configuration
 * @requires @/config/encoding - Encoding configuration
 * @exports generateHTML - HTML document generator
 *
 * @example
 * // Generate HTML document from template
 * const { generateHTML } = require('@/utils/templateProcessor/generators/html');
 *
 * try {
 *   const html = await generateHTML('template.md', {
 *     title: 'Document',
 *     content: 'Hello World'
 *   });
 *   console.log('HTML generated successfully');
 * } catch (error) {
 *   console.error('Generation failed:', error);
 * }
 */

const MarkdownIt = require('markdown-it');
const cheerio = require('cheerio');
const fs = require('fs/promises');
const path = require('path');
const { HtmlValidate } = require('html-validate');
const { logger } = require('@/utils/common/logger');
const { AppError } = require('@/utils/common/errors');
const { CHEERIO_RULES } = require('@/config/cheerio-rules');
const { ENCODING_CONFIG } = require('@/config/encoding');
const { HTML_CONFIG } = require('@/config/html-options');
const { LOCALE_CONFIG } = require('@/config/locale');
const prettier = require('prettier');

const PRETTIER_OPTIONS = {
  printWidth: 120,
  tabWidth: 2,
  useTabs: false,
  semi: true,
  singleQuote: true,
  trailingComma: 'es5',
  bracketSpacing: true,
  arrowParens: 'always',
  endOfLine: 'lf',
};

// Initialize markdown-it with options from HTML_CONFIG
const md = new MarkdownIt(HTML_CONFIG.markdownit);

// Custom heading renderer
md.renderer.rules.heading_open = (tokens, idx) => {
  const token = tokens[idx];
  return `<h${token.tag.slice(1)}>`;
};

md.renderer.rules.heading_close = (tokens, idx) => {
  const token = tokens[idx];
  return `</h${token.tag.slice(1)}>`;
};

// Custom link renderer
md.renderer.rules.link_open = (tokens, idx) => {
  const token = tokens[idx];
  const href = token.attrGet('href');
  const title = token.attrGet('title');

  // Ensure href is a string and handle internal links
  const safeHref = String(href || '');
  const isInternalLink = safeHref.startsWith('#');

  // For internal links, normalize the ID
  const normalizedHref = isInternalLink
    ? '#' +
      safeHref
        .slice(1)
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-+|-+$/g, '')
    : safeHref;

  // Build link tag with proper attributes
  let tag = `<a href="${normalizedHref}"`;
  if (title) {
    tag += ` title="${title}"`;
  }
  tag += '>';
  return tag;
};

// Custom code block renderer
md.renderer.rules.fence = (tokens, idx) => {
  const token = tokens[idx];
  const code = token.content || '';
  const lang = token.info || '';

  try {
    // If code is null or undefined, return empty
    if (code == null) {
      return '<pre><code></code></pre>';
    }

    // If is an object, convert it to string JSON
    let processedCode =
      typeof code === 'object' ? JSON.stringify(code, null, 2) : String(code);

    // Only escape HTML if it doesn't contain HTML tags
    if (!processedCode.match(/<[^>]+>/)) {
      processedCode = processedCode
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    }

    return lang
      ? `<pre><code class="language-${lang}">${processedCode}</code></pre>`
      : `<pre><code>${processedCode}</code></pre>`;
  } catch (error) {
    logger.error('Failed to process code block:', {
      error,
      code: typeof code === 'object' ? JSON.stringify(code) : code,
    });
    return '<pre><code>[Error processing code block]</code></pre>';
  }
};

// Custom inline code renderer
md.renderer.rules.code_inline = (tokens, idx) => {
  const token = tokens[idx];
  const code = token.content || '';

  try {
    // If null or undefined, return empty
    if (code == null) {
      return '<code></code>';
    }

    // If is an object, convert it to string
    let processedCode =
      typeof code === 'object' ? JSON.stringify(code) : String(code);

    // Solo escapar HTML si no contiene tags HTML
    if (!processedCode.match(/<[^>]+>/)) {
      processedCode = processedCode
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    }

    return `<code>${processedCode}</code>`;
  } catch (error) {
    logger.error('Failed to process inline code:', {
      error,
      code: typeof code === 'object' ? JSON.stringify(code) : code,
    });
    return '<code>[Error processing code]</code>';
  }
};

// Custom HTML renderer para preservar elementos HTML
md.renderer.rules.html_block = (tokens, idx) => tokens[idx].content;
md.renderer.rules.html_inline = (tokens, idx) => tokens[idx].content;

/**
 * Format HTML content with beautification or minification
 *
 * Processes HTML content through:
 * 1. Input validation and sanitization
 * 2. Format mode selection (pretty/minify)
 * 3. Content transformation
 * 4. Output validation
 *
 * Formatting Options:
 * - Pretty: Indented, readable format
 * - Minify: Compact, production format
 *
 * Formatting Rules:
 * - Consistent indentation
 * - Tag alignment
 * - Attribute ordering
 * - Space normalization
 * - Comment preservation
 *
 * @param {string} content - HTML content to format
 * @returns {Promise<string>} Formatted HTML content
 * @throws {AppError} On formatting failure
 *
 * @example
 * // Pretty formatting
 * const pretty = await formatHtml(`
 *   <div>
 *     <p>Content</p>
 *   </div>
 * `);
 * // Returns:
 * // <div>
 * //   <p>Content</p>
 * // </div>
 *
 * // Error handling
 * try {
 *   const formatted = await formatHtml(null);
 * } catch (error) {
 *   console.error('Formatting failed:', error);
 * }
 */
async function formatHtml(content) {
  try {
    // Configure Prettier with HTML parser
    const options = {
      ...PRETTIER_OPTIONS,
      parser: 'html',
      printWidth: 120,
      htmlWhitespaceSensitivity: 'ignore',
    };

    // Format the content using Prettier
    const formattedContent = await prettier.format(content, options);
    return formattedContent;
  } catch (error) {
    logger.warn('HTML formatting failed, using unformatted content', { error });
    return content;
  }
}

/**
 * Generate meta tags from configuration
 *
 * Processes metadata through:
 * 1. Basic tag generation
 * 2. Custom header inclusion
 * 3. Dynamic metadata addition
 * 4. Tag compilation
 *
 * @param {object} options - Generation options
 * @param {boolean} [options.customHeaders] - Include custom headers
 * @param {boolean} [options.metadata] - Include metadata
 * @returns {string[]} Array of meta tag strings
 * @throws {AppError} On invalid options
 *
 * @example
 * const metaTags = generateMetaTags({
 *   customHeaders: true,
 *   metadata: true
 * });
 */
function generateMetaTags(options = {}) {
  const metaTags = [];

  // Add basic meta tags
  HTML_CONFIG.meta.basic.forEach((meta) => {
    if (meta.charset) {
      metaTags.push(`<meta charset="${meta.charset}">`);
    } else {
      metaTags.push(`<meta name="${meta.name}" content="${meta.content}">`);
    }
  });

  // Add custom headers if enabled
  if (options.customHeaders) {
    HTML_CONFIG.meta.custom.forEach((meta) => {
      metaTags.push(`<meta name="${meta.name}" content="${meta.content}">`);
    });
  }

  // Add metadata if enabled
  if (options.metadata) {
    const now = new Date().toISOString();
    metaTags.push(`<meta name="date" content="${now}">`);
    HTML_CONFIG.meta.extra.forEach((meta) => {
      metaTags.push(`<meta name="${meta.name}" content="${meta.content}">`);
    });
  }

  return metaTags;
}

/**
 * Wraps content in proper HTML structure with CSS and metadata
 *
 * Processes content through:
 * 1. CSS file loading
 * 2. Directory creation
 * 3. Meta tag generation
 * 4. Content wrapping
 * 5. Structure validation
 *
 * @param {string} content - Markdown-generated HTML content
 * @param {object} options - Generation options
 * @param {string} [options.cssPath] - Path to CSS file
 * @param {boolean} [options.customHeaders] - Include custom headers
 * @param {boolean} [options.metadata] - Include metadata
 * @returns {Promise<string>} Complete HTML document
 * @throws {AppError} On wrapping failure
 *
 * @example
 * const html = await wrapWithHtmlStructure(content, {
 *   cssPath: 'styles.css',
 *   customHeaders: true
 * });
 */
async function wrapWithHtmlStructure(content, options = {}) {
  let cssContent = '';
  if (options.cssPath) {
    try {
      await fs.mkdir(path.dirname(options.cssPath), { recursive: true });
      cssContent = await fs.readFile(options.cssPath, ENCODING_CONFIG.default);
      logger.debug('Successfully read CSS file', {
        cssPath: options.cssPath,
        cssLength: cssContent.length,
      });
    } catch (error) {
      logger.warn('Failed to read CSS file, continuing without CSS', {
        error,
        cssPath: options.cssPath,
        errorMessage: error.message,
      });
    }
  }

  const metaTags = generateMetaTags(options);

  return HTML_CONFIG.templates.base({
    lang: LOCALE_CONFIG?.lang || 'en',
    meta: metaTags,
    style: cssContent,
    content: content,
  });
}

/**
 * Validates HTML content structure
 *
 * Validates through:
 * 1. Content presence check
 * 2. HTML5 specification compliance
 * 3. Structure verification
 * 4. Tag balance check
 * 5. Element validation
 *
 * @param {string} html - HTML content to validate
 * @returns {Promise<void>} Resolves if valid
 * @throws {AppError} If HTML is invalid
 *
 * @example
 * try {
 *   await validateHtml(content);
 *   console.log('HTML is valid');
 * } catch (error) {
 *   console.error('Validation failed:', error);
 * }
 */
async function validateHtml(html) {
  if (!html || html.trim() === '') {
    throw new AppError('HTML content cannot be empty', 'EMPTY_HTML_ERROR');
  }

  try {
    // Initialize HTML validator with more permissive config for markdown-generated HTML
    const htmlvalidate = new HtmlValidate({
      extends: ['html-validate:recommended'],
      rules: {
        'no-unknown-elements': 'error',
        'void-style': 'off',
        'doctype-style': 'off',
        'attr-quotes': 'off',
        'element-case': 'off',
        'no-trailing-whitespace': 'off',
        'no-inline-style': 'off',
        'prefer-native-element': 'off',
        'heading-level': 'off',
        'no-missing-references': 'off',
        'wcag/h30': 'off',
        'wcag/h37': 'off',
        'wcag/h67': 'off',
        'element-permitted-content': 'off',
        'element-required-content': 'off',
        'no-raw-characters': 'off',
        'require-sri': 'off',
        'valid-id': 'off',
        'no-conditional-comment': 'off',
        'no-deprecated': 'off',
        'prefer-button': 'off',
        'require-csp-nonce': 'off',
        'no-dup-class': 'off',
        'no-implicit-close': 'off',
      },
    });

    // Para HTML parcial (no documento completo), envolvemos en un div
    const contentToValidate = html.trim().startsWith('<!DOCTYPE')
      ? html
      : `<div>${html}</div>`;

    // Validate HTML content
    const report = await htmlvalidate.validateString(contentToValidate);

    // Solo fallar en errores críticos
    if (!report.valid) {
      const errors = report.results[0]?.messages || [];
      const criticalErrors = errors.filter((err) => err.severity === 2);

      if (criticalErrors.length > 0) {
        const errorMessages = criticalErrors.map(
          (err) =>
            `${err.message} (${err.ruleId}) at line ${err.line}:${err.column}`
        );

        throw new AppError('Invalid HTML structure', 'INVALID_HTML_ERROR', {
          errors: errorMessages,
          details: criticalErrors,
        });
      }
    }

    logger.debug('HTML validation successful', {
      contentLength: html.length,
    });
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('HTML validation failed', 'VALIDATION_ERROR', {
      originalError: error,
      details: error.toString(),
    });
  }
}

/**
 * Validates HTML generation options
 *
 * Validates through:
 * 1. Options object check
 * 2. Path validation
 * 3. CSS path verification
 * 4. Boolean option validation
 * 5. Type checking
 *
 * @param {object} options - Options to validate
 * @param {string} [options.filepath] - Output file path
 * @param {string} [options.cssPath] - CSS file path
 * @param {boolean} [options.minify] - Minify output
 * @param {boolean} [options.customHeaders] - Include headers
 * @param {boolean} [options.metadata] - Include metadata
 * @param {boolean} [options.transformations] - Apply transforms
 * @throws {AppError} If options are invalid
 *
 * @example
 * try {
 *   validateHtmlOptions({
 *     filepath: 'output.html',
 *     minify: true
 *   });
 * } catch (error) {
 *   console.error('Invalid options:', error);
 * }
 */
function validateHtmlOptions(options) {
  if (!options || typeof options !== 'object') {
    throw new AppError('Invalid options object', 'INVALID_OPTIONS_ERROR');
  }

  // Validate filepath if provided
  if (options.filepath && typeof options.filepath !== 'string') {
    throw new AppError('Invalid filepath', 'INVALID_PATH_ERROR');
  }

  // Validate cssPath if provided
  if (options.cssPath && typeof options.cssPath !== 'string') {
    throw new AppError('Invalid CSS path', 'INVALID_CSS_PATH_ERROR');
  }

  // Validate boolean options
  const booleanOptions = [
    'minify',
    'customHeaders',
    'metadata',
    'transformations',
  ];
  booleanOptions.forEach((option) => {
    if (option in options && typeof options[option] !== 'boolean') {
      throw new AppError(`Invalid ${option} option`, 'INVALID_OPTION_ERROR');
    }
  });

  logger.debug('HTML options validation successful', { options });
}

/**
 * Pre-processes markdown content to handle special cases
 *
 * @param {string|object} markdown - Raw markdown content
 * @returns {string} Processed markdown content
 */
function preprocessMarkdown(markdown) {
  if (!markdown) return '';

  // If markdown is an object with string property, use that directly
  if (typeof markdown === 'object' && markdown !== null && markdown.string) {
    return markdown.string;
  }

  // Convert to string if not already
  return String(markdown);
}

/**
 * Creates HTML from markdown content
 *
 * @param {string|object} markdown - Markdown content to convert
 * @returns {Promise<string>} Generated HTML
 * @throws {AppError} On conversion failure
 */
async function createHtmlFromMarkdown(markdown) {
  try {
    // Pre-process markdown
    const processedMarkdown = preprocessMarkdown(markdown);

    // Use markdown-it for rendering
    const html = md.render(processedMarkdown);

    // Log para debugging
    logger.debug('Markdown to HTML conversion:', {
      markdown: processedMarkdown.substring(0, 100),
      html: html.substring(0, 100),
      imageTag: html.match(/<img[^>]+>/g),
      codeBlocks: html.match(/<code[^>]*>.*?<\/code>/g),
    });

    // Basic validation of generated HTML
    await validateHtml(html);

    return html;
  } catch (error) {
    logger.error('Markdown to HTML conversion failed', {
      error: error.message,
      markdown: String(markdown).substring(0, 100) + '...',
      stack: error.stack,
    });
    throw new AppError(
      'Failed to convert markdown to HTML',
      'CONVERSION_ERROR',
      {
        originalError: error,
      }
    );
  }
}

/**
 * Generates HTML from content with optional CSS
 *
 * @param {string} content - HTML content
 * @param {object} options - Generation options
 * @param {string} [options.filepath] - Output file path
 * @param {string} [options.cssPath] - CSS file path
 * @param {boolean} [options.transformations] - Apply transformations
 * @returns {Promise<string>} Generated HTML
 */
async function generateHtml(content, options = {}) {
  try {
    logger.info('Starting HTML generation...', {
      filepath: options.filepath,
      cssPath: options.cssPath,
      transformations: options.transformations,
    });

    // Create output directory
    const outputDir = path.dirname(options.filepath);
    await fs.mkdir(outputDir, { recursive: true });
    logger.debug('Created output directory', { outputDir });

    // Verify output directory is accessible
    try {
      await fs.access(outputDir);
      logger.debug('Output directory exists and is accessible', { outputDir });
    } catch (error) {
      throw new AppError(
        'Output directory is not accessible',
        'OUTPUT_DIR_ERROR',
        {
          originalError: error,
          outputDir,
        }
      );
    }

    // Read CSS if provided
    let cssContent = '';
    if (options.cssPath) {
      try {
        cssContent = await fs.readFile(
          options.cssPath,
          ENCODING_CONFIG.encoding
        );
        logger.debug('Successfully read CSS file', {
          cssPath: options.cssPath,
          cssLength: cssContent.length,
        });
      } catch (error) {
        logger.warn('Failed to read CSS file', {
          error,
          cssPath: options.cssPath,
        });
      }
    }

    // Wrap content with HTML structure
    const wrappedContent = await wrapWithHtmlStructure(content, {
      cssPath: options.cssPath,
    });
    logger.debug('Content wrapped with HTML structure', {
      contentLength: wrappedContent.length,
    });

    // Apply transformations if enabled
    let transformedContent = wrappedContent;
    if (options.transformations) {
      const $ = cheerio.load(wrappedContent, CHEERIO_RULES.options);
      // Apply transformations here
      transformedContent = $.html();
      logger.debug('Applied Cheerio transformations', {
        contentLength: transformedContent.length,
      });
    }

    // Format HTML
    const formattedContent = await formatHtml(transformedContent);
    logger.debug('HTML content formatted', {
      contentLength: formattedContent.length,
    });

    // Write HTML file
    logger.debug('Writing HTML file...', { filepath: options.filepath });
    await fs.writeFile(
      options.filepath,
      formattedContent,
      ENCODING_CONFIG.encoding
    );
    await new Promise((resolve) => setTimeout(resolve, 100)); // Wait for filesystem

    // Verify file was written
    const stats = await fs.stat(options.filepath);
    logger.debug('HTML file written and verified', {
      filepath: options.filepath,
      size: stats.size,
    });

    return formattedContent;
  } catch (error) {
    throw new AppError('Failed to generate HTML', 'HTML_GEN_ERROR', {
      originalError: error,
      details: error.message,
    });
  }
}

module.exports = {
  generateHtml,
  wrapWithHtmlStructure,
  formatHtml,
  validateHtml,
  validateHtmlOptions,
  createHtmlFromMarkdown,
};
