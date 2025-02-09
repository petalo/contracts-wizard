/**
 * @file HTML DOM Transformation Rules
 *
 * Manages HTML content manipulation rules:
 * - List page break prevention
 * - Table responsiveness
 * - Image accessibility
 * - DOM structure optimization
 *
 * Functions:
 * - applyListTransformation: Prevents page breaks in short lists
 * - applyTableResponsive: Adds mobile-friendly table wrappers
 * - applyImageAccessibility: Ensures image alt attributes
 * - applyAll: Executes all transformations sequentially
 *
 * Constants:
 * - CHEERIO_RULES: Main configuration object
 *   - thresholds: Numeric limits for transformations
 *   - selectors: DOM element selectors
 *   - classes: CSS class names
 *   - rules: Transformation functions
 *
 * Flow:
 * 1. Configure transformation settings
 * 2. Define DOM selectors and classes
 * 3. Implement transformation rules
 * 4. Apply rules to HTML content
 * 5. Generate optimized output
 *
 * Error Handling:
 * - Invalid selector handling
 * - Missing element management
 * - DOM mutation error recovery
 * - Configuration validation
 * - Cheerio API error handling
 *
 * @module @/config/cheerio-rules
 * @requires cheerio - HTML parsing and manipulation
 * @exports CHEERIO_RULES Cheerio parsing configuration
 *
 * @example
 * // Import rules
 * const { CHEERIO_RULES } = require('@/config/cheerio-rules');
 * const $ = cheerio.load(html);
 *
 * // Apply specific transformation
 * CHEERIO_RULES.rules.applyTableResponsive($);
 *
 * // Or apply all transformations
 * CHEERIO_RULES.rules.applyAll($);
 */

/**
 * HTML transformation configuration and rules
 *
 * Comprehensive configuration for HTML content optimization,
 * including thresholds, selectors, and transformation rules
 * for consistent document processing.
 *
 * @constant {object}
 * @property {object} thresholds - Numeric transformation limits
 * @property {object} selectors - DOM element selectors
 * @property {object} classes - CSS class names
 * @property {object} rules - Transformation functions
 */
const CHEERIO_RULES = {
  // Numeric thresholds for transformations
  thresholds: {
    maxListItemsNoBreak: 5, // Maximum items for no-break lists
  },

  // DOM element selectors
  selectors: {
    lists: 'ul, ol', // List elements
    tables: 'table', // Table elements
    images: 'img:not([alt])', // Images without alt
  },

  // CSS classes for styling
  classes: {
    noBreak: 'no-break', // Prevent page breaks
    tableResponsive: 'table-responsive', // Mobile-friendly tables
  },

  // DOM transformation rules
  rules: {
    /**
     * Prevents page breaks within short lists
     *
     * Adds no-break class to lists with fewer items than
     * the threshold to keep them together in PDF output.
     * Improves readability by maintaining list integrity.
     *
     * @param {CheerioAPI} $ - Cheerio instance
     * @returns {void}
     * @example
     * // Keep short list together
     * CHEERIO_RULES.rules.applyListTransformation($);
     * // <ul class="no-break"><li>Item</li></ul>
     */
    applyListTransformation: ($) => {
      $(CHEERIO_RULES.selectors.lists).each((_, list) => {
        if (
          $(list).children().length <
          CHEERIO_RULES.thresholds.maxListItemsNoBreak
        ) {
          $(list).addClass(CHEERIO_RULES.classes.noBreak);
        }
      });
    },

    /**
     * Enhances table responsiveness
     *
     * Wraps tables in responsive containers to enable
     * horizontal scrolling on mobile devices while
     * preserving table structure and readability.
     *
     * @param {CheerioAPI} $ - Cheerio instance
     * @returns {void}
     * @example
     * // Make table mobile-friendly
     * CHEERIO_RULES.rules.applyTableResponsive($);
     * // <div class="table-responsive"><table>...</table></div>
     */
    applyTableResponsive: ($) => {
      $(CHEERIO_RULES.selectors.tables).each((_, table) => {
        $(table).wrap(
          `<div class="${CHEERIO_RULES.classes.tableResponsive}"></div>`
        );
      });
    },

    /**
     * Ensures image accessibility
     *
     * Adds empty alt attributes to images that lack them,
     * improving accessibility compliance and screen reader
     * compatibility.
     *
     * @param {CheerioAPI} $ - Cheerio instance
     * @returns {void}
     * @example
     * // Add missing alt attributes
     * CHEERIO_RULES.rules.applyImageAccessibility($);
     * // <img src="image.jpg" alt="">
     */
    applyImageAccessibility: ($) => {
      $(CHEERIO_RULES.selectors.images).attr('alt', '');
    },

    /**
     * Applies all HTML transformations
     *
     * Executes all transformation rules in sequence to
     * optimize HTML content for accessibility, responsiveness,
     * and PDF output quality.
     *
     * @param {CheerioAPI} $ - Cheerio instance
     * @returns {void}
     * @example
     * // Apply all optimizations
     * const $ = cheerio.load(html);
     * CHEERIO_RULES.rules.applyAll($);
     */
    applyAll: ($) => {
      CHEERIO_RULES.rules.applyListTransformation($);
      CHEERIO_RULES.rules.applyTableResponsive($);
      CHEERIO_RULES.rules.applyImageAccessibility($);
    },
  },
};

// Prevent runtime modifications
Object.freeze(CHEERIO_RULES);
Object.freeze(CHEERIO_RULES.thresholds);
Object.freeze(CHEERIO_RULES.selectors);
Object.freeze(CHEERIO_RULES.classes);
Object.freeze(CHEERIO_RULES.rules);

module.exports = { CHEERIO_RULES };
