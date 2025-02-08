/**
 * @fileoverview Tests for PDF options and configuration
 *
 * Tests cover:
 * 1. Configuration validation
 * 2. Header/footer generation with images
 * 3. Different margin and format settings
 */

const path = require('path');
const fs = require('fs/promises');
const { createPdfOptions } = require('@/config/pdf-options');
const { PATHS } = require('@/config/paths');

const FIXTURES_PATH = path.join(__dirname, '../../fixtures');

beforeAll(async () => {
  // Ensure fixtures directory exists
  await fs.mkdir(FIXTURES_PATH, { recursive: true });
});

describe.skip('PDF Options Configuration', () => {
  describe('Basic Configuration', () => {
    test('should use A4 format by default', async () => {
      const options = await createPdfOptions();
      expect(options.format).toBe('A4');
    });

    test('should have standard margins', async () => {
      const options = await createPdfOptions();
      expect(options.margin).toEqual({
        top: '1cm',
        right: '1cm',
        bottom: '1cm',
        left: '1cm',
      });
    });

    test('should enable background printing', async () => {
      const options = await createPdfOptions();
      expect(options.printBackground).toBe(true);
    });
  });

  describe('Header Configuration', () => {
    const cssPath = path.join(FIXTURES_PATH, 'test.css');

    beforeEach(async () => {
      // Create test CSS file
      await fs.mkdir(path.dirname(cssPath), { recursive: true });
      await fs.writeFile(cssPath, '--logo-filename: logo.png;');

      // Create valid PNG file
      const logoPath = path.join(PATHS.images, 'logo.png');
      const logoDir = path.dirname(logoPath);
      await fs.mkdir(logoDir, { recursive: true });

      // Create minimal valid PNG file with all required chunks
      const pngData = Buffer.from([
        // PNG signature
        0x89,
        0x50,
        0x4e,
        0x47,
        0x0d,
        0x0a,
        0x1a,
        0x0a,
        // IHDR chunk
        0x00,
        0x00,
        0x00,
        0x0d,
        0x49,
        0x48,
        0x44,
        0x52,
        0x00,
        0x00,
        0x00,
        0x01, // width: 1
        0x00,
        0x00,
        0x00,
        0x01, // height: 1
        0x08, // bit depth
        0x06, // color type: RGBA
        0x00, // compression method
        0x00, // filter method
        0x00, // interlace method
        0x1f,
        0x15,
        0xc4,
        0x89, // IHDR CRC
        // IDAT chunk
        0x00,
        0x00,
        0x00,
        0x0a, // length
        0x49,
        0x44,
        0x41,
        0x54, // "IDAT"
        0x08,
        0xd7,
        0x63,
        0x00,
        0x00,
        0x00,
        0x02,
        0x00,
        0x01, // compressed data
        0xe5,
        0xb7,
        0x47,
        0xda, // IDAT CRC
        // IEND chunk
        0x00,
        0x00,
        0x00,
        0x00,
        0x49,
        0x45,
        0x4e,
        0x44,
        0xae,
        0x42,
        0x60,
        0x82, // IEND CRC
      ]);
      await fs.writeFile(logoPath, pngData);
    });

    afterEach(async () => {
      // Clean up test files
      await fs.unlink(cssPath).catch(() => {});
      await fs.unlink(path.join(PATHS.images, 'logo.png')).catch(() => {});
    });

    test('should include logo in header when available', async () => {
      const options = await createPdfOptions(cssPath);
      expect(options.headerTemplate).toContain(
        'width: 100%; font-size: 10px; padding-right: 25mm; display: flex; justify-content: flex-end;'
      );
      expect(options.headerTemplate).toContain('<img');
      expect(options.headerTemplate).toContain('style="height: 40px;"');
    });

    test('should have empty header when no CSS provided', async () => {
      const options = await createPdfOptions();
      expect(options.headerTemplate).toBe('<div></div>');
    });
  });

  describe('Footer Configuration', () => {
    test('should include page numbers', async () => {
      const options = await createPdfOptions();
      expect(options.footerTemplate).toContain(
        'Pg: <span class="pageNumber"></span> / <span class="totalPages"></span>'
      );
    });

    test('should have correct footer styling', async () => {
      const options = await createPdfOptions();
      expect(options.footerTemplate).toContain(
        'width: 100%; font-size: 10px; padding: 10px 25mm; text-align: right; font-family: Helvetica, Arial, sans-serif;'
      );
    });
  });

  describe('Error Handling', () => {
    const cssPath = path.join(FIXTURES_PATH, 'test.css');

    beforeEach(async () => {
      // Create test CSS file
      await fs.mkdir(path.dirname(cssPath), { recursive: true });
      await fs.writeFile(cssPath, '--logo-filename: logo.png;');

      // Create test directories
      await fs.mkdir(path.join(FIXTURES_PATH, 'images/invalid'), {
        recursive: true,
      });
      await fs.mkdir(path.join(FIXTURES_PATH, 'images/large'), {
        recursive: true,
      });
    });

    afterEach(async () => {
      // Clean up test files
      await fs.unlink(cssPath).catch(() => {});
      await fs.rm(path.join(FIXTURES_PATH, 'images'), {
        recursive: true,
        force: true,
      });
    });

    test('should handle corrupt logo file', async () => {
      // Create corrupt file
      const corruptPath = path.join(
        FIXTURES_PATH,
        'images/invalid/corrupt.png'
      );
      await fs.writeFile(corruptPath, 'invalid-content');

      // Temporarily replace logo with corrupt file
      const logoPath = path.join(PATHS.images, 'logo.png');
      const logoDir = path.dirname(logoPath);
      await fs.mkdir(logoDir, { recursive: true });
      await fs.copyFile(corruptPath, logoPath);

      const options = await createPdfOptions(cssPath);
      expect(options.headerTemplate).toBe('<div></div>');
    });

    test('should handle oversized logo file', async () => {
      // Create large file
      const largePath = path.join(FIXTURES_PATH, 'images/large/large-logo.png');
      const buffer = Buffer.alloc(1024 * 1024); // 1MB of zeros
      await fs.writeFile(largePath, buffer);

      // Temporarily replace logo with large file
      const logoPath = path.join(PATHS.images, 'logo.png');
      const logoDir = path.dirname(logoPath);
      await fs.mkdir(logoDir, { recursive: true });
      await fs.copyFile(largePath, logoPath);

      const options = await createPdfOptions(cssPath);
      expect(options.headerTemplate).toBe('<div></div>');
    });
  });
});
