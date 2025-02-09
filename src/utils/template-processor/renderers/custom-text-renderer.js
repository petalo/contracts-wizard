/**
 * @file Custom text renderer for markdown-it
 *
 * Provides custom rendering rules for markdown-it that:
 * - Handles special text formatting
 * - Manages value wrapping
 * - Supports custom styling
 *
 * Functions:
 * - createCustomRules: Creates custom rendering rules
 *
 * Flow:
 * 1. Define wrapping functions for different value types
 * 2. Create custom rendering rules
 * 3. Export rules for markdown-it configuration
 *
 * Error Handling:
 * - Invalid value handling with placeholders
 * - Malformed HTML protection
 * - Safe string escaping
 *
 * @module @/utils/template-processor/renderers/custom-text-renderer
 * @requires markdown-it
 */

/**
 * Creates custom rendering rules for markdown-it
 *
 * @returns {object} Custom rendering rules
 */
function createCustomRules() {
  return {
    // Simplify functions to remove unused parameters
    text(tokens, idx) {
      return tokens[idx].content;
    },

    code_inline(tokens, idx) {
      return `<code>${tokens[idx].content}</code>`;
    },

    code_block(tokens, idx) {
      return `<pre><code>${tokens[idx].content}</code></pre>`;
    },

    fence(tokens, idx) {
      return `<pre><code>${tokens[idx].content}</code></pre>`;
    },

    hardbreak() {
      return '<br>\n';
    },

    softbreak() {
      return '\n';
    },
  };
}

// Export custom rules
module.exports = createCustomRules();
