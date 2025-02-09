/**
 * @file Helper utilities for PDF testing
 *
 * Provides utilities for:
 * - Validating PDF options
 * - Comparing base64 images
 * - Checking PDF structure
 * - Testing headers and footers
 */

const fs = require('fs/promises');
const path = require('path');

/**
 * PDF test configuration options
 * @typedef {object} PdfTestOptions
 * @property {Record<string, string>} format Page format settings
 * @property {Record<string, number>} dimensions Page dimension settings
 */

/**
 * Validates PDF options structure
 * @param {object} options - PDF options to validate
 * @returns {{isValid: boolean, errors?: string[]}} Validation result with errors if any
 */
function validatePdfOptions(options) {
  const requiredProps = ['format', 'displayHeaderFooter'];
  const validFormats = ['A4', 'A3', 'Letter'];

  // Check required properties
  requiredProps.forEach((prop) => {
    if (!(prop in options)) {
      throw new Error(`Missing required property: ${prop}`);
    }
  });

  // Validate format
  if (!validFormats.includes(options.format)) {
    throw new Error(`Invalid format: ${options.format}`);
  }

  // Validate margins if present
  if (options.margin) {
    ['top', 'right', 'bottom', 'left'].forEach((side) => {
      const value = options.margin[side];
      if (value && !value.match(/^\d+(\.\d+)?(cm|mm|in|px)$/)) {
        throw new Error(`Invalid margin value for ${side}: ${value}`);
      }
    });
  }

  return true;
}

/**
 * Compares two base64 images
 * @param {string} base64A - First base64 string
 * @param {string} base64B - Second base64 string
 * @returns {boolean} True if images match
 */
function compareBase64Images(base64A, base64B) {
  // Remove data URL prefix if present
  const cleanA = base64A.replace(/^data:image\/\w+;base64,/, '');
  const cleanB = base64B.replace(/^data:image\/\w+;base64,/, '');
  return cleanA === cleanB;
}

/**
 * Creates test image files
 * @param {string} fixturesPath - Path to fixtures directory
 * @returns {Promise<Record<string, string>>} Paths to created test files
 */
async function createTestImages(fixturesPath) {
  const imagesPath = path.join(fixturesPath, 'images');

  // Create empty file
  await fs.writeFile(path.join(imagesPath, 'invalid', 'empty.png'), '');

  // Create corrupt file
  await fs.writeFile(
    path.join(imagesPath, 'invalid', 'corrupt.png'),
    'invalid-content'
  );

  // Create PNG with wrong extension
  await fs
    .copyFile(
      path.join(imagesPath, 'logo.png'),
      path.join(imagesPath, 'invalid', 'wrong-extension.jpg')
    )
    .catch(() => {
      /* ignore if logo doesn't exist yet */
    });

  return {
    emptyPath: path.join(imagesPath, 'invalid', 'empty.png'),
    corruptPath: path.join(imagesPath, 'invalid', 'corrupt.png'),
    wrongExtPath: path.join(imagesPath, 'invalid', 'wrong-extension.jpg'),
  };
}

/**
 * Validates header/footer templates
 * @param {string} template - Template HTML string
 * @returns {{isValid: boolean, errors?: string[]}} Validation result with errors if any
 */
function validateTemplate(template) {
  const errors = [];

  // Check for basic structure
  if (!template.includes('<div')) {
    errors.push('Missing container div');
  }

  // Check for required styles
  if (!template.includes('style=')) {
    errors.push('Missing styles');
  }

  // Check for malformed tags
  const openTags = (template.match(/<[^/][^>]*>/g) || []).length;
  const closeTags = (template.match(/<\/[^>]+>/g) || []).length;
  if (openTags !== closeTags) {
    errors.push('Malformed HTML: unmatched tags');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

module.exports = {
  validatePdfOptions,
  compareBase64Images,
  createTestImages,
  validateTemplate,
};
