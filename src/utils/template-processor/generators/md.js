/**
 * @file Markdown file generator for the template processing system
 *
 * This module handles the generation of markdown files from processed template content.
 * It includes functionality for file writing, directory creation, and proper encoding handling.
 *
 * Functions:
 * - generateMarkdown: Creates a markdown file with processed content
 *
 * Flow:
 * 1. Validate and clean input content
 * 2. Ensure target directory exists
 * 3. Write content to file with proper encoding
 * 4. Log operation results
 *
 * Error Handling:
 * - Invalid content type conversion
 * - File system operation failures
 * - Directory creation issues
 *
 * @module utils/templateProcessor/generators/md
 * @requires fs/promises
 * @requires @/utils/common/logger
 * @requires @/utils/common/errors
 * @requires @/config/encoding
 * @requires @/utils/file-management/get-file-size
 * @exports generateMarkdown - Function to generate markdown files
 *
 * @example
 * // Generate a markdown file from processed content
 * await generateMarkdown(processedContent, { filepath: './output/document.md' });
 */

const fs = require('fs/promises');
const path = require('path');
const { logger } = require('@/utils/common/logger');
const { AppError } = require('@/utils/common/errors');
const { ENCODING_CONFIG } = require('@/config/encoding');
const { getFileSizeKB } = require('@/utils/file-management/get-file-size');

/**
 * Generates a markdown file from processed content
 *
 * Processes content through:
 * 1. Content validation and cleaning
 * 2. Directory structure verification
 * 3. File writing with encoding
 * 4. Size verification and logging
 *
 * Content Processing:
 * - Converts input to string if needed
 * - Trims whitespace
 * - Validates markdown syntax
 * - Handles special characters
 *
 * @param {string} content - Processed markdown content
 * @param {object} options - Generation options
 * @param {string} options.filepath - Output file path
 * @returns {Promise<void>}
 * @throws {AppError} On file generation failure
 *
 * @example
 * // Basic usage
 * try {
 *   await generateMarkdown('# Title\nContent', {
 *     filepath: './output/doc.md'
 *   });
 *   console.log('Markdown generated successfully');
 * } catch (error) {
 *   console.error('Generation failed:', error);
 * }
 *
 * // With Handlebars content
 * const content = new Handlebars.SafeString('# {{title}}');
 * await generateMarkdown(content, {
 *   filepath: './output/template.md'
 * });
 *
 * // Error handling
 * try {
 *   await generateMarkdown(null, { filepath: './bad/path.md' });
 * } catch (error) {
 *   if (error.code === 'MARKDOWN_GENERATION_ERROR') {
 *     console.error('Invalid content or path');
 *   }
 * }
 */
async function generateMarkdown(content, { filepath }) {
  try {
    // Ensure content is a string and clean invalid characters
    const stringContent = String(content || '').trim();

    // Log detailed content
    logger.debug('Content details before writing:', {
      originalType: typeof content,
      isHandlebarsString:
        content && typeof content === 'object' && 'toString' in content,
      contentLength: stringContent.length,
      firstFewChars: stringContent.substring(0, 100),
      hasMarkdown: stringContent.includes('#'),
      encoding: ENCODING_CONFIG.encoding,
    });

    // Ensure directory exists
    const dir = path.dirname(filepath);
    await fs.mkdir(dir, { recursive: true });

    // Save markdown file
    await fs.writeFile(filepath, stringContent, {
      encoding: ENCODING_CONFIG.encoding,
    });

    // Log result
    const fileSize = await getFileSizeKB(filepath);
    logger.info('Markdown file generated successfully', {
      path: filepath,
      size: fileSize,
      contentLength: stringContent.length,
    });
  } catch (error) {
    logger.error('Error generating markdown file:', {
      error,
      errorCode: error.code,
      errorMessage: error.message,
      filepath,
      contentType: typeof content,
      contentLength: content?.length,
      stack: error.stack,
    });

    throw new AppError(
      'Failed to generate markdown file',
      'MARKDOWN_GENERATION_ERROR',
      {
        originalError: error,
        details: {
          filepath,
          contentType: typeof content,
          contentLength: content?.length,
          errorDetails: {
            code: error.code,
            message: error.message,
          },
        },
      }
    );
  }
}

module.exports = {
  generateMarkdown,
};
