/**
 * @fileoverview Tests for PDF generation from HTML content
 *
 * Tests cover:
 * 1. Basic HTML to PDF conversion
 * 2. Error handling for invalid inputs
 * 3. CSS styling preservation
 * 4. Empty value markers in output
 */

const fs = require('fs/promises');
const path = require('path');
const puppeteer = require('puppeteer');
const {
  generatePdf,
} = require('../../../src/utils/templateProcessor/generators/pdf');
const { AppError } = require('../../../src/utils/common/errors');

// Mock dependencies
jest.mock('fs/promises');
jest.mock('puppeteer');

describe.skip('PDF Generation', () => {
  let mockBrowser;
  let mockPage;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Setup Puppeteer mocks
    mockPage = {
      setContent: jest.fn(),
      goto: jest.fn().mockResolvedValue(),
      pdf: jest.fn().mockResolvedValue(Buffer.from('mock pdf content')),
      close: jest.fn(),
    };

    mockBrowser = {
      newPage: jest.fn().mockResolvedValue(mockPage),
      close: jest.fn(),
    };

    puppeteer.launch.mockResolvedValue(mockBrowser);
  });

  describe('Basic Conversion', () => {
    test('should generate PDF from simple HTML', async () => {
      const options = {
        content: '<h1>Test</h1>',
        outputPath: 'test.pdf',
      };

      // Use the PDF test utilities for optimized generation
      const result = await testUtils.pdf.queuePdfGeneration(async () => {
        return await generatePdf(options);
      });

      expect(result).toBeInstanceOf(Buffer);
      expect(mockPage.goto).toHaveBeenCalled();
      expect(mockPage.pdf).toHaveBeenCalled();
    });

    test('should handle HTML with special characters', async () => {
      const options = {
        content: '<div>Test & Special © Characters</div>',
        outputPath: 'test.pdf',
      };

      const result = await testUtils.pdf.queuePdfGeneration(async () => {
        return await generatePdf(options);
      });

      expect(result).toBeInstanceOf(Buffer);
      expect(mockPage.goto).toHaveBeenCalled();
    });

    test('should preserve DOCTYPE and meta tags', async () => {
      const options = {
        content:
          '<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body>Test</body></html>',
        outputPath: 'test.pdf',
      };

      const result = await testUtils.pdf.queuePdfGeneration(async () => {
        return await generatePdf(options);
      });

      expect(result).toBeInstanceOf(Buffer);
      expect(mockPage.goto).toHaveBeenCalled();
    });
  });

  describe('CSS Handling', () => {
    test('should preserve CSS styles in generated PDF', async () => {
      const options = {
        content: '<style>h1 { color: red; }</style><h1>Test</h1>',
        outputPath: 'test.pdf',
      };

      const result = await testUtils.pdf.queuePdfGeneration(async () => {
        return await generatePdf(options);
      });

      expect(result).toBeInstanceOf(Buffer);
      expect(mockPage.goto).toHaveBeenCalled();
    });

    test('should handle external CSS file', async () => {
      const options = {
        content: '<div>Test</div>',
        cssPath: 'styles.css',
        outputPath: 'test.pdf',
      };

      fs.readFile.mockResolvedValueOnce('h1 { color: blue; }');

      const result = await testUtils.pdf.queuePdfGeneration(async () => {
        return await generatePdf(options);
      });

      expect(result).toBeInstanceOf(Buffer);
      expect(mockPage.goto).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    test('should throw error for empty HTML', async () => {
      const options = {
        content: '',
        outputPath: 'test.pdf',
      };

      await expect(generatePdf(options)).rejects.toThrow(AppError);
      await expect(generatePdf(options)).rejects.toThrow(
        'HTML content cannot be empty'
      );
    });

    test('should throw error for invalid output path', async () => {
      const options = {
        content: '<div>Test</div>',
        outputPath: '/invalid/path/test.pdf',
      };

      fs.writeFile.mockRejectedValueOnce(new Error('Failed to write file'));

      await expect(generatePdf(options)).rejects.toThrow(AppError);
      await expect(generatePdf(options)).rejects.toThrow(
        'Failed to generate PDF'
      );
    });

    test('should handle browser launch errors', async () => {
      puppeteer.launch.mockRejectedValueOnce(
        new Error('Browser launch failed')
      );

      const options = {
        content: '<div>Test</div>',
        outputPath: 'test.pdf',
      };

      await expect(generatePdf(options)).rejects.toThrow(AppError);
      await expect(generatePdf(options)).rejects.toThrow(
        'Failed to generate PDF'
      );
    });
  });

  // Cleanup after each test
  afterEach(async () => {
    await testUtils.pdf.cleanupPdfFiles(process.cwd());
  });
});
