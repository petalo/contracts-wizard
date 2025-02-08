/**
 * @fileoverview PDF Generation Configuration
 *
 * Manages PDF document generation settings:
 * - Page format and margins
 * - Header and footer templates
 * - Logo handling and validation
 * - Puppeteer launch options
 *
 * Functions:
 * - getLogoFilename: Extracts logo filename from CSS
 * - loadLogo: Validates and loads logo file
 * - createPdfOptions: Creates PDF generation options
 * - getPuppeteerOptions: Gets Puppeteer launch options
 *
 * Constants:
 * - MAX_LOGO_SIZE: Maximum allowed logo file size
 *
 * Flow:
 * 1. Extract logo filename from CSS
 * 2. Validate and load logo file
 * 3. Create PDF options with templates
 * 4. Configure Puppeteer launch options
 * 5. Generate PDF with settings
 *
 * Error Handling:
 * - Logo file validation errors
 * - CSS parsing errors
 * - File size limit checks
 * - Template validation errors
 * - Puppeteer configuration errors
 *
 * @module @/config/pdfOptions
 * @requires fs/promises
 * @requires path
 * @requires @/utils/common/logger
 * @requires @/utils/common/errors
 *
 * @example
 * // Import configuration
 * const { createPdfOptions } = require('@/config/pdfOptions');
 *
 * // Create PDF options with logo
 * const options = await createPdfOptions('styles.css');
 *
 * // Generate PDF with custom header
 * const pdf = await page.pdf({
 *   ...options,
 *   headerTemplate: `
 *     <div style="text-align: right; padding: 10px;">
 *       <img src="data:image/png;base64,${logo}" />
 *     </div>
 *   `
 * });
 *
 * // Configure Puppeteer
 * const browser = await puppeteer.launch(getPuppeteerOptions());
 *
 * // Custom PDF Options Example:
 * const customOptions = {
 *   format: 'A4',
 *   margin: { top: '2cm', right: '1cm', bottom: '2cm', left: '1cm' },
 *   displayHeaderFooter: true,
 *   headerTemplate: '<div>Custom Header</div>',
 *   footerTemplate: '<div>Page <span class="pageNumber"></span></div>',
 *   printBackground: true,
 *   landscape: false,
 *   scale: 1,
 *   preferCSSPageSize: true
 * };
 */

const fs = require('fs').promises;
const path = require('path');
const { logger } = require('@/utils/common/logger');
const { AppError } = require('@/utils/common/errors');
const { PATHS } = require('@/config/paths');

const MAX_LOGO_SIZE = 500 * 1024; // 500KB

/**
 * Extract logo filename from CSS content
 *
 * Searches for the --logo-filename custom property in CSS
 * to determine which logo file to use for PDF headers.
 *
 * @param {string} cssPath - Path to CSS file
 * @returns {Promise<string|null>} Logo filename or null if not defined
 *
 * @example
 * // CSS file content:
 * // :root {
 * //   --logo-filename: "company-logo.png";
 * // }
 * const logoFile = await getLogoFilename('styles.css');
 */
async function getLogoFilename(cssPath) {
  try {
    const cssContent = await fs.readFile(cssPath, 'utf8');
    const match = cssContent.match(/--logo-filename:\s*([^;]+);/);
    return match ? match[1].trim().replace(/['"]/g, '') : null;
  } catch (error) {
    logger.warn('Failed to read --logo-filename from CSS', {
      error,
    });
    return null;
  }
}

/**
 * Validate and load logo file
 *
 * Performs comprehensive logo validation:
 * 1. Checks file existence
 * 2. Validates file size (max 500KB)
 * 3. Verifies PNG format
 * 4. Converts to base64 for embedding
 *
 * @param {string} logoPath - Path to logo file
 * @returns {Promise<string>} Base64 encoded logo
 * @throws {AppError} If logo is invalid or too large
 *
 * @example
 * try {
 *   const logo = await loadLogo('path/to/logo.png');
 *   console.log('Logo loaded successfully');
 * } catch (error) {
 *   if (error.code === 'LOGO_TOO_LARGE') {
 *     console.error('Logo exceeds 500KB limit');
 *   }
 * }
 */
async function loadLogo(logoPath) {
  try {
    const stats = await fs.stat(logoPath);
    if (stats.size > MAX_LOGO_SIZE) {
      throw new AppError('Logo file too large', 'LOGO_TOO_LARGE');
    }

    const logoBuffer = await fs.readFile(logoPath);
    // Basic PNG validation (check magic numbers)
    if (logoBuffer[0] !== 0x89 || logoBuffer[1] !== 0x50) {
      throw new AppError('Invalid logo file format', 'INVALID_LOGO_FORMAT');
    }

    return logoBuffer.toString('base64');
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to load logo', 'LOGO_LOAD_ERROR', {
      originalError: error,
    });
  }
}

/**
 * Get Puppeteer launch options based on environment
 *
 * Configures Puppeteer browser instance with:
 * - Headless mode configuration
 * - Security settings
 * - Performance optimizations
 * - Platform-specific options
 *
 * @returns {Object} Puppeteer launch options
 *
 * @example
 * const browser = await puppeteer.launch({
 *   ...getPuppeteerOptions(),
 *   defaultViewport: { width: 1920, height: 1080 }
 * });
 */
function getPuppeteerOptions() {
  const isTest = process.env.NODE_ENV === 'test';
  const isMac = process.platform === 'darwin';

  const options = {
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--disable-gpu',
      '--font-render-hinting=none',
      '--allow-file-access-from-files',
      '--enable-local-file-accesses',
      '--disable-web-security',
      '--window-size=1920,1080',
    ],
    ignoreHTTPSErrors: true,
    defaultViewport: {
      width: 1920,
      height: 1080,
      deviceScaleFactor: 1,
    },
  };

  if (isMac) {
    options.args.push('--use-gl=swiftshader');
  }

  logger.debug('Puppeteer launch options', {
    options,
    isTest,
    isMac,
  });
  return options;
}

/**
 * Create PDF generation options
 *
 * Configures PDF document generation with:
 * - Page format and margins
 * - Header with optional logo
 * - Footer with page numbers
 * - Print and layout settings
 *
 * @param {string} [cssPath] - Path to CSS file for logo extraction
 * @returns {Promise<Object>} PDF generation options
 *
 * @example
 * // Basic usage
 * const options = await createPdfOptions('style.css');
 *
 * // Custom margins
 * const options = await createPdfOptions('style.css');
 * options.margin = { top: '2cm', right: '1cm', bottom: '2cm', left: '1cm' };
 *
 * // Landscape mode
 * const options = await createPdfOptions('style.css');
 * options.landscape = true;
 */
async function createPdfOptions(cssPath) {
  const options = {
    format: 'A4',
    margin: {
      top: '1cm',
      right: '1cm',
      bottom: '1cm',
      left: '1cm',
    },
    printBackground: true,
    displayHeaderFooter: true,
    preferCSSPageSize: true,
    landscape: false,
    scale: 1,
    tagged: true,
    outline: true,
  };

  // Only try to add header with logo if CSS is provided
  if (cssPath) {
    try {
      const logoFilename = await getLogoFilename(cssPath);

      if (logoFilename) {
        const logoPath = path.join(PATHS.images, logoFilename);
        const base64Logo = await loadLogo(logoPath);

        options.headerTemplate = `
        <div style="width: 100%; font-size: 10px; padding-right: 25mm; display: flex; justify-content: flex-end;">
            <img src="data:image/png;base64,${base64Logo}" style="height: 40px;" />
        </div>`;
      } else {
        // No logo defined in CSS
        options.headerTemplate = '<div></div>';
      }
    } catch (error) {
      logger.warn('Logo not found or invalid, header will be empty', { error });
      options.headerTemplate = '<div></div>';
    }
  } else {
    // No CSS provided, use empty header
    options.headerTemplate = '<div></div>';
  }

  // Add footer with page numbers
  options.footerTemplate = `
    <div style="width: 100%; font-size: 10px; padding: 10px 25mm; text-align: right; font-family: Helvetica, Arial, sans-serif;">
        <span> Pg: <span class="pageNumber"></span> / <span class="totalPages"></span></span>
    </div>`;

  return options;
}

module.exports = {
  createPdfOptions,
  loadLogo,
  getPuppeteerOptions,
};
