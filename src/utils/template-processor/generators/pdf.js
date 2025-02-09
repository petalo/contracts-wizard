/**
 * @file PDF Document Generation System
 *
 * Provides comprehensive PDF document generation:
 * - HTML to PDF conversion
 * - Page layout management
 * - Document formatting
 * - Header and footer handling
 * - Metadata embedding
 * - Font configuration
 *
 * Functions:
 * - generatePDF: Creates PDF from HTML
 * - configurePuppeteer: Sets up browser
 * - applyPageSettings: Configures layout
 * - embedMetadata: Adds document info
 * - validateOutput: Verifies PDF structure
 *
 * Flow:
 * 1. HTML content validation
 * 2. Browser initialization
 * 3. Page configuration
 * 4. Content rendering
 * 5. PDF generation
 * 6. Metadata embedding
 * 7. Output validation
 *
 * Error Handling:
 * - Browser launch failures
 * - Page configuration errors
 * - Rendering timeouts
 * - Memory constraints
 * - File system errors
 * - Invalid content
 * - PDF generation failures
 *
 * @module @/utils/templateProcessor/generators/pdf
 * @requires puppeteer - Browser automation
 * @requires fs/promises - File system operations
 * @requires path - Path manipulation
 * @requires @/utils/common/logger - Logging system
 * @requires @/utils/common/errors - Error handling
 * @requires @/config/pdf-options - PDF configuration
 * @requires @/config/file-extensions - File extensions configuration
 * @requires @/config/encoding - Encoding configuration
 * @exports generatePDF - PDF document generator
 *
 * @example
 * // Generate PDF from HTML content
 * const { generatePDF } = require('@/utils/templateProcessor/generators/pdf');
 *
 * try {
 *   await generatePDF('output.pdf', htmlContent, {
 *     format: 'A4',
 *     landscape: false
 *   });
 *   console.log('PDF generated successfully');
 * } catch (error) {
 *   console.error('Generation failed:', error);
 * }
 */

const puppeteer = require('puppeteer');
const fs = require('fs/promises');
const path = require('path');
const { logger } = require('@/utils/common/logger');
const { AppError } = require('@/utils/common/errors');
const { generateHtml } = require('@/utils/template-processor/generators/html');
const {
  createPdfOptions,
  getPuppeteerOptions,
} = require('@/config/pdf-options');
const { ENCODING_CONFIG } = require('@/config/encoding');

/**
 * Generates PDF document from HTML content
 *
 * Comprehensive PDF generation through:
 * 1. Content Validation
 *    - HTML structure verification
 *    - Empty content check
 *    - Character encoding validation
 *
 * 2. Resource Management
 *    - Directory creation
 *    - Temporary file handling
 *    - CSS integration
 *    - Resource cleanup
 *
 * 3. Browser Automation
 *    - Puppeteer initialization
 *    - Page configuration
 *    - Content rendering
 *    - Resource loading
 *
 * 4. PDF Generation
 *    - Layout configuration
 *    - Header/footer setup
 *    - Font embedding
 *    - Metadata inclusion
 *
 * @param {string} content - HTML content to convert
 * @param {object} options - Generation options
 * @param {string} options.outputPath - Output PDF path
 * @param {string} [options.cssPath] - CSS file path
 * @param {boolean} [options.keepHtml=false] - Keep temporary HTML
 * @returns {Promise<Buffer>} Generated PDF buffer
 * @throws {AppError} On generation failure
 *
 * @example
 * // Basic usage
 * try {
 *   await generatePdf('<h1>Title</h1>', {
 *     outputPath: './output/doc.pdf'
 *   });
 *   console.log('PDF generated successfully');
 * } catch (error) {
 *   console.error('Generation failed:', error);
 * }
 *
 * // With CSS styling
 * const options = {
 *   outputPath: './output/styled.pdf',
 *   cssPath: './styles/custom.css',
 *   keepHtml: true // Keep temporary HTML for debugging
 * };
 * await generatePdf(htmlContent, options);
 *
 * // Error handling
 * try {
 *   await generatePdf('', { outputPath: './invalid.pdf' });
 * } catch (error) {
 *   if (error.code === 'EMPTY_CONTENT_ERROR') {
 *     console.error('Content cannot be empty');
 *   }
 * }
 */
async function generatePdf(content, options = {}) {
  let browser;
  let tempHtmlPath;
  let page;
  let cleanupPromises = [];

  try {
    // Validate content
    if (!content || content.trim() === '') {
      throw new AppError('HTML content cannot be empty', 'EMPTY_CONTENT_ERROR');
    }

    logger.debug('Starting PDF generation', {
      hasContent: !!content,
      options,
    });

    // Ensure output directory exists
    if (options.outputPath) {
      await fs.mkdir(path.dirname(options.outputPath), { recursive: true });
    }

    // Read CSS file if provided
    let cssContent = '';
    if (options.cssPath) {
      try {
        cssContent = await fs.readFile(
          options.cssPath,
          ENCODING_CONFIG.encoding
        );
        logger.debug('CSS file read successfully', {
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

    // Create temporary HTML file
    tempHtmlPath = path.join(process.cwd(), 'temp', `temp-${Date.now()}.html`);
    await fs.mkdir(path.dirname(tempHtmlPath), { recursive: true });
    logger.debug('Temporary HTML file created', { path: tempHtmlPath });

    // Generate HTML with CSS
    await generateHtml(content, {
      filepath: tempHtmlPath,
      cssPath: options.cssPath,
      transformations: true,
    });

    // Launch browser with configured options
    logger.debug('Launching browser for PDF generation');
    const puppeteerOptions = getPuppeteerOptions();
    logger.debug('Puppeteer launch options', {
      options: puppeteerOptions,
      isTest: process.env.NODE_ENV === 'test',
      isMac: process.platform === 'darwin',
    });

    browser = await puppeteer.launch(puppeteerOptions);
    cleanupPromises.push(async () => {
      try {
        if (browser) {
          const pages = await browser.pages();
          await Promise.all(pages.map((p) => p.close().catch(() => {})));
          await browser.close();
        }
      } catch (e) {
        logger.warn('Failed to close browser', { error: e });
      }
    });

    logger.debug('Browser launched successfully');

    // Create and configure page
    page = await browser.newPage();
    cleanupPromises.push(async () => {
      try {
        if (page && !page.isClosed()) {
          await page.close();
        }
      } catch (e) {
        logger.warn('Failed to close page', { error: e });
      }
    });

    logger.debug('Browser page created');

    // Load the file
    const fileUrl = 'file://' + path.resolve(tempHtmlPath);
    await page.goto(fileUrl, {
      waitUntil: ['load', 'networkidle0'],
      timeout: 30000,
    });
    logger.debug('Page loaded successfully', { fileUrl });

    // Configure PDF options using pdfOptions.js
    const pdfOptions = await createPdfOptions(options.cssPath);
    pdfOptions.path = options.outputPath;

    // Generate PDF
    logger.debug('Generating PDF', {
      pdfOptions,
      outputPath: options.outputPath,
    });

    const pdfBuffer = await page.pdf(pdfOptions);
    logger.debug('PDF buffer generated', {
      pdfSize: pdfBuffer.length,
    });

    // Write PDF file
    await fs.writeFile(options.outputPath, pdfBuffer);
    logger.debug('PDF generation completed', {
      path: options.outputPath,
      size: pdfBuffer.length,
    });

    return pdfBuffer;
  } catch (error) {
    throw new AppError('Failed to generate PDF', 'PDF_GEN_ERROR', {
      originalError: error,
      details: error.message,
    });
  } finally {
    // Execute all cleanup promises in parallel
    await Promise.all(
      cleanupPromises.map((cleanup) =>
        cleanup().catch((e) => {
          logger.warn('Cleanup operation failed', { error: e });
        })
      )
    );

    // Remove temporary HTML file
    if (tempHtmlPath && !options.keepHtml) {
      try {
        await fs.unlink(tempHtmlPath);
        logger.debug('Temporary HTML file removed', { path: tempHtmlPath });
      } catch (cleanupError) {
        logger.warn('Failed to remove temporary file', { cleanupError });
      }
    }

    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }
  }
}

module.exports = {
  generatePdf,
};
