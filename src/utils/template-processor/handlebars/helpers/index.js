/**
 * @fileoverview Main export file for all Handlebars helpers
 *
 * This file exports all available Handlebars helpers organized by category:
 * - Array helpers (each, eachWithGaps)
 * - Comparison helpers (eq)
 * - Date helpers (formatDate, addYears, now)
 * - Value helpers (lookup, extract)
 *
 * @module @/utils/template-processor/handlebars/helpers
 */

const { eachHelper } = require('./array/each');
const eq = require('./comparison/eq');
const { formatDate, addYears, now } = require('./date/format');
const lookup = require('./value/lookup');
const { extractValue } = require('./value/extract');

// Register all helpers with Handlebars
const handlebars = require('handlebars');

// Array helpers
handlebars.registerHelper('each', eachHelper);

// Comparison helpers
handlebars.registerHelper('eq', eq);

// Date helpers
handlebars.registerHelper('formatDate', formatDate);
handlebars.registerHelper('addYears', addYears);
handlebars.registerHelper('now', now);

// Value helpers
handlebars.registerHelper('lookup', lookup);

// Export all helpers for testing and direct use
module.exports = {
  // Array helpers
  eachHelper,

  // Comparison helpers
  eq,

  // Date helpers
  formatDate,
  addYears,
  now,

  // Value helpers
  lookup,
  extractValue,
};
