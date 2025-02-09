/**
 * @file Custom text renderer for Handlebars templates with enhanced formatting and value wrapping.
 *
 * This renderer extends the default Markdown renderer to add custom formatting for values,
 * specifically handling @index values and providing enhanced logging capabilities.
 *
 * Functions:
 * - wrapIndexValue: Wraps @index values with HTML spans
 * - wrapMissingValue: Wraps missing values with HTML spans
 * - wrapImportedValue: Wraps imported values with HTML spans
 * - text: Main token processing function
 * - paragraph, heading, list, listitem: HTML element renderers
 * - br, hr, space: Simple element renderers
 * - code, codespan: Code block renderers
 * - link, html, table: Complex element renderers
 * - image, strong, em: Inline element renderers
 *
 * Flow:
 * 1. Token received for processing
 * 2. Token type identified and processed
 * 3. HTML output generated with proper wrapping
 *
 * Error Handling:
 * - Handles null/undefined values gracefully
 * - Provides fallbacks for missing properties
 * - Logs processing steps for debugging
 *
 * @module utils/template-processor/renderers/custom-text-renderer
 * @requires handlebars
 * @requires marked
 * @requires @/utils/common/logger
 */

const handlebars = require('handlebars');
const { logger } = require('@/utils/common/logger');
const { marked } = require('marked');

// Configure marked to preserve line breaks and enable GFM
marked.setOptions({
  breaks: true,
  gfm: true,
  pedantic: false,
  mangle: false,
  headerIds: false,
});

/**
 * Debug utility to log object properties
 *
 * @param {string} prefix - Log message prefix
 * @param {object} obj - Object to debug
 * @private
 */
function debugObject(prefix, obj) {
  logger.debug(`${prefix}:`, {
    type: obj?.type,
    raw: obj?.raw,
    text: obj?.text,
    tokens: obj?.tokens?.map((t) => ({
      type: t.type,
      text: t.text,
      raw: t.raw,
      tokens: t.tokens,
    })),
    hasToString: obj?.toString !== Object.prototype.toString,
    isHandlebars: obj instanceof handlebars.SafeString,
    constructor: obj?.constructor?.name,
  });
}

/**
 * Custom text renderer for Handlebars templates.
 * Extends the default Markdown renderer to add custom formatting.
 *
 * @class
 * @example
 * const renderer = new CustomTextRenderer(logger);
 * const html = renderer.text(token);
 */
class CustomTextRenderer {
  /**
   * Creates a new CustomTextRenderer instance
   *
   * @param {object} logger - Logger instance for debugging
   */
  constructor(logger) {
    this.logger = logger;
    this.options = null;
  }

  /**
   * Sets data for the renderer
   *
   * @param {object} data - Data object to use for rendering
   */
  setData(data) {
    this.options.data = data;
  }

  /**
   * Wraps an @index value with the imported-value class
   *
   * @param {string|number} value - The index value to wrap
   * @returns {string} The wrapped HTML string
   * @example
   * renderer.wrapIndexValue(0)
   * // returns: '<span class="imported-value" data-field="@index">0</span>'
   */
  wrapIndexValue(value) {
    if (value === undefined || value === null) {
      return '';
    }
    return `<span class="imported-value" data-field="@index">${value}</span>`;
  }

  /**
   * Wraps a missing value with the appropriate HTML
   *
   * @param {string} field - The field name that is missing
   * @returns {string} The wrapped HTML string
   */
  wrapMissingValue(field) {
    return `<span class="missing-value" data-field="${field}">[[${field}]]</span>`;
  }

  /**
   * Wraps an imported value with the appropriate HTML
   *
   * @param {string} field - The field name
   * @param {string} value - The value to wrap
   * @returns {string} The wrapped HTML string
   */
  wrapImportedValue(field, value) {
    return `<span class="imported-value" data-field="${field}">${value}</span>`;
  }

  /**
   * Processes a token and returns the rendered text
   *
   * @param {object} token - The token to process
   * @returns {string} The rendered text
   * @example
   * renderer.text({ type: 'text', text: '@index' })
   * // returns: '<span class="imported-value" data-field="@index"></span>'
   */
  text(token) {
    this.logger?.emit('Processing token:', {
      type: typeof token,
      isObject: token && typeof token === 'object',
      hasString: token?.toString?.(),
      isSafeString: token?.toHTML || token?.string,
      value: token,
    });

    // Handle null/undefined
    if (!token) {
      return '';
    }

    // Handle SafeString objects
    if (token.toHTML || token.string) {
      const str = token.toHTML ? token.toHTML() : token.string;
      if (str.startsWith('@index') || str.includes('@index')) {
        return this.wrapIndexValue(str.replace('@index', ''));
      }
      if (str.includes('[[') && str.includes(']]')) {
        const field = str.match(/\[\[(.*?)\]\]/)[1];
        return this.wrapMissingValue(field);
      }
      if (str.includes('data-field=')) {
        return str; // Already wrapped
      }
      return str;
    }

    // Handle strings
    if (typeof token === 'string') {
      if (token.startsWith('@index') || token.includes('@index')) {
        return this.wrapIndexValue(token.replace('@index', ''));
      }
      if (token.includes('[[') && token.includes(']]')) {
        const field = token.match(/\[\[(.*?)\]\]/)[1];
        return this.wrapMissingValue(field);
      }
      if (token.includes('data-field=')) {
        return token; // Already wrapped
      }
      return token;
    }

    // Handle arrays
    if (Array.isArray(token)) {
      return token.map((t) => this.text(t)).join('');
    }

    // Handle objects
    if (typeof token === 'object') {
      // Check for @index property
      if (token['@index'] !== undefined) {
        return this.wrapIndexValue(token['@index']);
      }

      // Check for field and value properties
      if (token.field && token.value !== undefined) {
        return this.wrapImportedValue(token.field, token.value);
      }

      // Check for text property that may contain @index or missing values
      if (token.text) {
        const text = token.text.toString();
        if (text.startsWith('@index') || text.includes('@index')) {
          return this.wrapIndexValue(text.replace('@index', ''));
        }
        if (text.includes('[[') && text.includes(']]')) {
          const field = text.match(/\[\[(.*?)\]\]/)[1];
          return this.wrapMissingValue(field);
        }
        if (text.includes('data-field=')) {
          return text; // Already wrapped
        }
        return text;
      }

      // Handle nested tokens
      if (token.tokens) {
        return token.tokens.map((t) => this.text(t)).join('');
      }

      // Handle objects with toString
      if (token.toString && token.toString() !== '[object Object]') {
        const str = token.toString();
        if (str.startsWith('@index') || str.includes('@index')) {
          return this.wrapIndexValue(str.replace('@index', ''));
        }
        if (str.includes('[[') && str.includes(']]')) {
          const field = str.match(/\[\[(.*?)\]\]/)[1];
          return this.wrapMissingValue(field);
        }
        if (str.includes('data-field=')) {
          return str; // Already wrapped
        }
        return str;
      }
    }

    // Default case
    return token.toString();
  }

  /**
   * Format paragraphs with custom styling
   * @param {string} text - Paragraph content
   * @returns {string} Formatted paragraph HTML
   */
  paragraph(text) {
    logger.debug('paragraph() called with:', {
      input: text,
      type: typeof text,
      isHandlebars: text instanceof handlebars.SafeString,
      hasTokens: text?.tokens?.length > 0,
      hasText: !!text?.text,
      raw: text?.raw,
    });

    let content = '';

    if (text instanceof handlebars.SafeString) {
      const rawContent = text.toString();
      const tokens = marked.lexer(rawContent);
      content = tokens.map((token) => this.text(token)).join('');
      logger.debug('paragraph(): SafeString processed', { content });
    } else if (text && typeof text === 'object') {
      debugObject('paragraph(): Processing object', text);

      if (text.tokens) {
        content = text.tokens
          .map((token) => {
            logger.debug('paragraph(): Processing nested token', { token });
            return this.text(token);
          })
          .join('');
        logger.debug('paragraph(): Joined nested tokens', { content });
      } else if (text.text) {
        content = text.text;
        logger.debug('paragraph(): Using direct text', { content });
      }
    } else {
      content = String(text || '');
      logger.debug('paragraph(): Converted to string', { content });
    }

    const result = `<p class="custom-paragraph">${content}</p>`;
    logger.debug('paragraph(): Final result', { result });
    return result;
  }

  /**
   * Format headings with custom styling
   * @param {string} text - Heading text
   * @param {number} level - Heading level
   * @returns {string} Formatted heading HTML
   */
  heading(text, level) {
    logger.debug('heading() called with:', {
      input: text,
      level,
      type: typeof text,
      isHandlebars: text instanceof handlebars.SafeString,
      hasTokens: text?.tokens?.length > 0,
      hasText: !!text?.text,
    });

    const headingLevel = level || text?.depth || 1;
    let content = '';

    if (text instanceof handlebars.SafeString) {
      content = text.toString();
      logger.debug('heading(): SafeString processed', { content });
    } else if (text && typeof text === 'object') {
      debugObject('heading(): Processing object', text);

      if (text.tokens) {
        content = text.tokens
          .map((token) => {
            logger.debug('heading(): Processing nested token', { token });
            return this.text(token);
          })
          .join('');
        logger.debug('heading(): Joined nested tokens', { content });
      } else if (text.text) {
        content = text.text;
        logger.debug('heading(): Using direct text', { content });
      }
    } else {
      content = String(text || '');
      logger.debug('heading(): Converted to string', { content });
    }

    const result = `<h${headingLevel}>${content}</h${headingLevel}>`;
    logger.debug('heading(): Final result', { result });
    return result;
  }

  /**
   * Format lists with custom styling
   * @param {string} body - List content
   * @param {boolean} ordered - Whether list is ordered
   * @returns {string} Formatted list HTML
   */
  list(body, ordered) {
    logger.debug('list() called with:', {
      body,
      ordered,
      bodyType: typeof body,
      bodyLength: body?.length,
    });

    if (!body) return '';

    if (body && typeof body === 'object' && body.items) {
      const items = body.items.map((item) => this.listitem(item)).join('\n');
      const tag = ordered ? 'ol' : 'ul';
      const result = `<${tag}>\n${items}\n</${tag}>\n`;
      logger.debug('list(): Final result from items', { result });
      return result;
    }

    const tag = ordered ? 'ol' : 'ul';
    const result = `<${tag}>\n${String(body)}</${tag}>\n`;
    logger.debug('list(): Final result from string', { result });
    return result;
  }

  /**
   * Format list items with custom styling
   * @param {string} text - List item content
   * @returns {string} Formatted list item HTML
   */
  listitem(text) {
    logger.debug('listitem() called with:', {
      input: text,
      type: typeof text,
      isHandlebars: text instanceof handlebars.SafeString,
      hasTokens: text?.tokens?.length > 0,
      hasText: !!text?.text,
      raw: text?.raw,
    });

    let content = '';

    if (text instanceof handlebars.SafeString) {
      const rawContent = text.toString();
      const tokens = marked.lexer(rawContent);
      content = tokens.map((token) => this.text(token)).join('');
      logger.debug('listitem(): SafeString processed', { content });
    } else if (text && typeof text === 'object') {
      debugObject('listitem(): Processing object', text);

      if (text.tokens) {
        content = text.tokens
          .map((token) => {
            logger.debug('listitem(): Processing nested token', { token });
            return this.text(token);
          })
          .join('');
        logger.debug('listitem(): Joined nested tokens', { content });
      } else if (text.text) {
        content = text.text;
        logger.debug('listitem(): Using direct text', { content });
      }
    } else {
      content = String(text || '');
      logger.debug('listitem(): Converted to string', { content });
    }

    const result = `<li>${content}</li>`;
    logger.debug('listitem(): Final result', { result });
    return result;
  }

  /**
   * Format line breaks with custom styling
   * @returns {string} Formatted line break HTML
   */
  br() {
    logger.debug('br() called');
    return '<br class="custom-break">';
  }

  /**
   * Format horizontal rules with custom styling
   * @returns {string} Formatted horizontal rule HTML
   */
  hr() {
    logger.debug('hr() called');
    return '<hr class="custom-hr">';
  }

  /**
   * Formats a single space character.
   * Used for consistent space handling in text content.
   * Ensures proper spacing in rendered output.
   *
   * @returns {string} A single space character
   */
  space() {
    logger.debug('space() called');
    return ' ';
  }

  /**
   * Format code spans with custom styling
   * @param {string} text - Code content
   * @returns {string} Formatted code span HTML
   */
  codespan(text) {
    return `<code class="custom-code">${text}</code>`;
  }

  /**
   * Format code blocks with custom styling
   * @param {string} code - Code content
   * @param {string} lang - Programming language
   * @returns {string} Formatted code block HTML
   */
  code(code, lang) {
    const langClass = lang ? ` class="language-${lang}"` : '';
    return `<pre><code${langClass}>${String(code || '')}</code></pre>\n`;
  }

  /**
   * Format links with custom styling
   * @param {string} href - Link URL
   * @param {string} title - Link title
   * @param {string} text - Link text
   * @returns {string} Formatted link HTML
   */
  link(href, title, text) {
    debugObject('LINK', {
      href,
      title,
      text,
    });

    // Handle imported values in href
    let finalHref = href;
    let field = null;

    if (href && href.includes('data-field=')) {
      // Extract the URL and field from the imported value span
      const urlMatch = href.match(/data-field="([^"]+)"[^>]*>([^<]+)</);
      if (urlMatch) {
        field = urlMatch[1];
        finalHref = ''; // Empty href for imported values
      }
    }

    const titleAttr = title ? ` title="${title}"` : '';
    let content = text;

    if (text instanceof handlebars.SafeString) {
      content = text.toString();
    } else if (typeof text === 'object') {
      content = text.text || String(text);
    }

    // If the href is an imported value, wrap the entire link
    if (field) {
      return this.wrapImportedValue(field, `<a href="">${content}</a>`);
    }

    return `<a href="${finalHref}"${titleAttr}>${content}</a>`;
  }

  /**
   * Processes raw HTML content with proper handling of SafeStrings.
   * Handles both direct HTML strings and Handlebars SafeString objects.
   * Preserves HTML structure while ensuring proper escaping.
   *
   * @param {string|handlebars.SafeString} html - HTML content to process
   * @returns {string} Processed HTML content
   */
  html(html) {
    logger.debug('html() called with:', {
      input: html,
      type: typeof html,
      isHandlebars: html instanceof handlebars.SafeString,
      hasText: !!html?.text,
    });

    let result;
    if (html instanceof handlebars.SafeString) {
      result = html.toString();
      logger.debug('html(): SafeString processed', { result });
    } else if (typeof html === 'object' && html.text) {
      result = html.text;
      logger.debug('html(): Object text processed', { result });
    } else {
      result = String(html || '');
      logger.debug('html(): Converted to string', { result });
    }
    return result;
  }

  /**
   * Formats tables with custom styling and structure.
   * Handles header and body content separately to create a properly structured HTML table.
   * Ensures proper nesting of thead and tbody elements.
   *
   * @param {string} header - Table header content
   * @param {string} body - Table body content
   * @returns {string} Formatted table HTML
   */
  table(header, body) {
    return `<table>\n<thead>\n${header}</thead>\n<tbody>\n${body}</tbody>\n</table>\n`;
  }

  /**
   * Formats table rows with proper structure and styling.
   * Creates a table row element with the provided content.
   * Handles content formatting and ensures proper HTML structure.
   *
   * @param {string} content - Row content
   * @returns {string} Formatted table row HTML
   */
  tablerow(content) {
    return `<tr>\n${content}</tr>\n`;
  }

  /**
   * Formats table cells with custom styling and structure.
   * Handles both header and data cells with proper alignment.
   * Supports cell alignment and header/data cell differentiation.
   *
   * @param {string} content - Cell content
   * @param {object} flags - Cell flags
   * @param {boolean} flags.header - Whether cell is a header
   * @param {string} [flags.align] - Cell alignment
   * @returns {string} Formatted table cell HTML
   */
  tablecell(content, flags) {
    const type = flags.header ? 'th' : 'td';
    const align = flags.align ? ` align="${flags.align}"` : '';
    return `<${type}${align}>${content}</${type}>\n`;
  }

  /**
   * Formats blockquotes with custom styling and structure.
   * Creates a properly formatted blockquote element with the provided content.
   * Ensures proper nesting and HTML structure.
   *
   * @param {string} quote - Quote content
   * @returns {string} Formatted blockquote HTML
   */
  blockquote(quote) {
    return `<blockquote>\n${quote}</blockquote>\n`;
  }

  /**
   * Format images with custom styling
   * @param {string} href - Image URL
   * @param {string} title - Image title
   * @param {string} text - Alt text
   * @returns {string} Formatted image HTML
   */
  image(href, title, text) {
    const titleAttr = title ? ` title="${title}"` : '';
    const altAttr = text ? ` alt="${text}"` : '';
    return `<img src="${href}"${altAttr}${titleAttr}>`;
  }

  /**
   * Format strong text with custom styling
   * @param {string} text - Text content
   * @returns {string} Formatted strong text HTML
   */
  strong(text) {
    return `<strong>${text}</strong>`;
  }

  /**
   * Format emphasized text with custom styling
   * @param {string} text - Text content
   * @returns {string} Formatted emphasized text HTML
   */
  em(text) {
    return `<em>${text}</em>`;
  }
}

module.exports = CustomTextRenderer;
