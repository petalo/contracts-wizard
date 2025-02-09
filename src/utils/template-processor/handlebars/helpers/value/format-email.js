/**
 * @file Email formatting helper for Handlebars
 *
 * Provides email formatting functionality that:
 * - Validates email format
 * - Wraps emails in HTML links
 * - Handles missing/invalid values
 * - Applies consistent styling
 *
 * Functions:
 * - formatEmail: Main email formatting function
 *
 * Flow:
 * 1. Validate email input
 * 2. Format valid emails as links
 * 3. Handle invalid/missing values
 * 4. Apply styling classes
 *
 * Error Handling:
 * - Invalid email format
 * - Missing values
 * - Null/undefined inputs
 *
 * @module @/utils/template-processor/handlebars/helpers/value/format-email
 * @requires handlebars
 */

const handlebars = require('handlebars');

/**
 * Formats email to HTML link with proper styling
 *
 * @param {string} email - Input email address
 * @returns {handlebars.SafeString} Formatted HTML
 */
function formatEmail(email) {
  if (!email || typeof email !== 'string' || !email.includes('@')) {
    const htmlString = `<span class="missing-value" data-field="email">[[email]]</span>`;
    return new handlebars.SafeString(htmlString);
  }
  const htmlString = `<span class="imported-value" data-field="email"><a href="mailto:${handlebars.escapeExpression(email)}">${handlebars.escapeExpression(email)}</a></span>`;
  return new handlebars.SafeString(htmlString);
}

module.exports = {
  formatEmail,
};
