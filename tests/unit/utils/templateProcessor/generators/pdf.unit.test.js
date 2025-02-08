/**
 * @fileoverview Unit tests for PDF generation
 */

const { generatePDF } = require('@/utils/templateProcessor/generators/pdf');
const puppeteer = require('puppeteer');
const fs = require('fs').promises;

jest.mock('puppeteer');
jest.mock('fs', () => ({
  promises: {
    readFile: jest.fn(),
    writeFile: jest.fn(),
  },
}));

describe.skip('PDF Generator', () => {
  let mockBrowser;
  let mockPage;

  beforeEach(() => {
    mockPage = {
      setContent: jest.fn(),
      pdf: jest.fn().mockResolvedValue(Buffer.from('PDF content')),
      close: jest.fn(),
    };
    mockBrowser = {
      newPage: jest.fn().mockResolvedValue(mockPage),
      close: jest.fn(),
    };
    puppeteer.launch.mockResolvedValue(mockBrowser);
    jest.clearAllMocks();
  });

  test('should generate PDF from HTML', async () => {
    const html = '<h1>Test</h1>';
    const outputPath = 'output.pdf';
    const options = { format: 'A4' };

    await generatePDF(html, outputPath, options);

    expect(puppeteer.launch).toHaveBeenCalled();
    expect(mockPage.setContent).toHaveBeenCalledWith(html);
    expect(mockPage.pdf).toHaveBeenCalledWith(expect.objectContaining(options));
    expect(fs.writeFile).toHaveBeenCalledWith(outputPath, expect.any(Buffer));
  });

  test('should handle custom PDF options', async () => {
    const html = '<h1>Test</h1>';
    const outputPath = 'output.pdf';
    const options = {
      format: 'Letter',
      margin: { top: '1cm', bottom: '1cm' },
      printBackground: true,
    };

    await generatePDF(html, outputPath, options);

    expect(mockPage.pdf).toHaveBeenCalledWith(expect.objectContaining(options));
  });

  test('should handle empty HTML', async () => {
    const html = '';
    const outputPath = 'output.pdf';

    await expect(generatePDF(html, outputPath)).rejects.toThrow();
  });

  test('should handle browser launch errors', async () => {
    puppeteer.launch.mockRejectedValue(new Error('Browser error'));
    const html = '<h1>Test</h1>';
    const outputPath = 'output.pdf';

    await expect(generatePDF(html, outputPath)).rejects.toThrow(
      'Browser error'
    );
  });

  test('should handle page creation errors', async () => {
    mockBrowser.newPage.mockRejectedValue(new Error('Page error'));
    const html = '<h1>Test</h1>';
    const outputPath = 'output.pdf';

    await expect(generatePDF(html, outputPath)).rejects.toThrow('Page error');
  });

  test('should handle PDF generation errors', async () => {
    mockPage.pdf.mockRejectedValue(new Error('PDF error'));
    const html = '<h1>Test</h1>';
    const outputPath = 'output.pdf';

    await expect(generatePDF(html, outputPath)).rejects.toThrow('PDF error');
  });

  test('should handle write errors', async () => {
    fs.writeFile.mockRejectedValue(new Error('Write error'));
    const html = '<h1>Test</h1>';
    const outputPath = 'output.pdf';

    await expect(generatePDF(html, outputPath)).rejects.toThrow('Write error');
  });

  test('should close browser and page after generation', async () => {
    const html = '<h1>Test</h1>';
    const outputPath = 'output.pdf';

    await generatePDF(html, outputPath);

    expect(mockPage.close).toHaveBeenCalled();
    expect(mockBrowser.close).toHaveBeenCalled();
  });

  test('should close browser and page on error', async () => {
    mockPage.pdf.mockRejectedValue(new Error('PDF error'));
    const html = '<h1>Test</h1>';
    const outputPath = 'output.pdf';

    await expect(generatePDF(html, outputPath)).rejects.toThrow();

    expect(mockPage.close).toHaveBeenCalled();
    expect(mockBrowser.close).toHaveBeenCalled();
  });
});
