/**
 * @fileoverview Unit tests for HTML generation from markdown content
 *
 * Tests cover:
 * 1. Basic markdown to HTML conversion
 * 2. CSS styling integration
 * 3. Empty value handling
 * 4. Cheerio transformations
 * 5. Combinatorial state testing
 */

const fs = require('fs/promises');
const path = require('path');
const cheerio = require('cheerio');
const {
  generateHtml,
  validateHtml,
  validateHtmlOptions,
  createHtmlFromMarkdown,
} = require('../../../src/utils/templateProcessor/generators/html');
const resourceManager = require('../../../tests/__common__/helpers/resource-manager');

// Use environment variables for test directories
const TEST_OUTPUT_DIR = process.env.DIR_OUTPUT || 'tests/output';
const TEST_CSS_DIR = process.env.DIR_CSS || 'tests/__common__/fixtures/css';
const TEST_FIXTURES_PATH =
  process.env.TEST_FIXTURES_PATH || 'tests/__common__/fixtures';

describe.skip('HTML Generation Unit Tests', () => {
  const OUTPUT_PATH = path.resolve(process.cwd(), TEST_OUTPUT_DIR);
  const CSS_PATH = path.resolve(process.cwd(), TEST_CSS_DIR);

  // Setup test environment
  beforeAll(async () => {
    // Create test directories if they don't exist
    await fs.mkdir(OUTPUT_PATH, { recursive: true });
    await fs.mkdir(CSS_PATH, { recursive: true });

    // Create test CSS files if they don't exist
    const cssFiles = ['valid.css', 'invalid.css', 'empty.css'];
    for (const file of cssFiles) {
      const filePath = path.join(CSS_PATH, file);
      try {
        await fs.access(filePath);
      } catch {
        await fs.writeFile(filePath, ''); // Create empty file if it doesn't exist
      }
    }
  });

  // Clean up test files after each test
  afterEach(async () => {
    try {
      const files = await fs.readdir(OUTPUT_PATH);
      await Promise.all(
        files.map((file) =>
          fs.unlink(path.join(OUTPUT_PATH, file)).catch(() => {})
        )
      );
    } catch (error) {
      console.warn('Error cleaning up test files:', error);
    }
  });

  describe('Basic HTML Generation', () => {
    test('should generate valid HTML structure from simple content', async () => {
      // Arrange
      const content = '<h1>Test Document</h1><p>Simple content</p>';
      const outputPath = path.join(OUTPUT_PATH, 'simple.html');

      try {
        // Act
        await generateHtml(content, { filepath: outputPath });

        // Assert
        const generatedHtml = await fs.readFile(outputPath, 'utf-8');
        expect(generatedHtml).toBeTruthy();
        const $ = cheerio.load(generatedHtml);
        expect($('html').length).toBe(1);
        expect($('head').length).toBe(1);
        expect($('body').length).toBe(1);
        expect($('h1').text()).toBe('Test Document');
        expect($('p').text()).toBe('Simple content');

        // Verify file exists
        const fileExists = await fs
          .access(outputPath)
          .then(() => true)
          .catch(() => false);
        expect(fileExists).toBe(true);
      } catch (error) {
        console.error('Test failed:', error);
        throw error;
      }
    });

    test('should properly escape special characters in HTML', async () => {
      // Arrange
      const content = '<h1>Test & Document</h1><p>Content with © and ®</p>';
      const outputPath = path.join(OUTPUT_PATH, 'special.html');

      // Act
      await generateHtml(content, { filepath: outputPath });

      // Assert
      const generatedHtml = await fs.readFile(outputPath, 'utf-8');
      const $ = cheerio.load(generatedHtml);
      expect($('h1').html()).toBe('Test &amp; Document');
      expect($('p').html()).toBe('Content with © and ®');
    });
  });

  describe('CSS Integration', () => {
    test('should correctly include external CSS file', async () => {
      // Arrange
      const testCssContent = `
        .missing-value {
          color: red;
          font-style: italic;
        }
      `;
      const cssPath = path.join(CSS_PATH, 'valid.css');
      await fs.writeFile(cssPath, testCssContent);

      const content =
        '<h1>Styled Document</h1><p class="missing-value">Empty field</p>';
      const outputPath = path.join(OUTPUT_PATH, 'styled.html');

      // Act
      await generateHtml(content, {
        filepath: outputPath,
        cssPath,
      });

      // Assert
      const generatedHtml = await fs.readFile(outputPath, 'utf-8');
      const $ = cheerio.load(generatedHtml);
      expect($('style').length).toBe(1);
      expect($('style').html()).toContain('.missing-value');
      expect($('style').html()).toContain('color: red');
    });

    test('should generate valid HTML without CSS file', async () => {
      // Arrange
      const content = '<h1>No Style Document</h1>';
      const outputPath = path.join(OUTPUT_PATH, 'no-style.html');

      // Act
      await generateHtml(content, { filepath: outputPath });

      // Assert
      const generatedHtml = await fs.readFile(outputPath, 'utf-8');
      const $ = cheerio.load(generatedHtml);
      expect($('style').length).toBe(1);
      expect($('h1').text()).toBe('No Style Document');
    });
  });

  describe('Empty Value Handling', () => {
    test('should preserve missing value markers in HTML', async () => {
      // Arrange
      const content = `
        <div>
          <p>Name: <span class="missing-value">[[name]]</span></p>
          <p>Email: <span class="missing-value">[[email]]</span></p>
        </div>
      `;
      const outputPath = path.join(OUTPUT_PATH, 'with-markers.html');

      // Act
      await generateHtml(content, { filepath: outputPath });

      // Assert
      const generatedHtml = await fs.readFile(outputPath, 'utf-8');
      const $ = cheerio.load(generatedHtml);
      expect($('.missing-value').length).toBe(2);
      expect($('.missing-value').first().text()).toBe('[[name]]');
      expect($('.missing-value').last().text()).toBe('[[email]]');
    });
  });

  describe('HTML Transformations', () => {
    test('should preserve list structure', async () => {
      // Arrange
      const content = `
        <ul>
          <li>Item 1</li>
          <li>Item 2</li>
          <li>Item 3</li>
        </ul>
      `;
      const outputPath = path.join(OUTPUT_PATH, 'list.html');

      // Act
      await generateHtml(content, {
        filepath: outputPath,
        transformations: true,
      });

      // Assert
      const generatedHtml = await fs.readFile(outputPath, 'utf-8');
      const $ = cheerio.load(generatedHtml);
      expect($('ul li').length).toBe(3);
      expect($('li').first().text().trim()).toBe('Item 1');
    });

    test('should preserve table structure', async () => {
      // Arrange
      const content = `
        <table>
          <tr><td>Cell 1</td></tr>
        </table>
      `;
      const outputPath = path.join(OUTPUT_PATH, 'table.html');

      // Act
      await generateHtml(content, {
        filepath: outputPath,
        transformations: true,
      });

      // Assert
      const generatedHtml = await fs.readFile(outputPath, 'utf-8');
      const $ = cheerio.load(generatedHtml);
      expect($('table').length).toBe(1);
      expect($('td').text()).toBe('Cell 1');
    });

    test('should handle images appropriately', async () => {
      // Arrange
      const content = '<img src="test.jpg">';
      const outputPath = path.join(OUTPUT_PATH, 'image.html');

      // Act
      await generateHtml(content, {
        filepath: outputPath,
        transformations: true,
      });

      // Assert
      const generatedHtml = await fs.readFile(outputPath, 'utf-8');
      const $ = cheerio.load(generatedHtml);
      expect($('img').length).toBe(1);
      expect($('img').attr('src')).toBe('test.jpg');
    });
  });

  describe('Error Handling', () => {
    test('should handle empty content gracefully', async () => {
      // Arrange
      const outputPath = path.join(OUTPUT_PATH, 'empty.html');

      // Act
      await generateHtml('', { filepath: outputPath });

      // Assert
      const generatedHtml = await fs.readFile(outputPath, 'utf-8');
      const $ = cheerio.load(generatedHtml);
      expect($('body').text().trim()).toBe('');
    });

    test('should auto-close malformed HTML tags', async () => {
      // Arrange
      const content = '<h1>Unclosed Tag<p>Missing closing tags';
      const outputPath = path.join(OUTPUT_PATH, 'malformed.html');

      // Act
      await generateHtml(content, { filepath: outputPath });

      // Assert
      const generatedHtml = await fs.readFile(outputPath, 'utf-8');
      const $ = cheerio.load(generatedHtml);
      expect($('h1').length).toBe(1);
      expect($('p').length).toBe(1);
    });
  });

  describe('Markdown to HTML Conversion', () => {
    test('should convert basic markdown to valid HTML', async () => {
      // Arrange
      const markdown = '# Title\n\nParagraph text';

      // Act & Assert
      await expect(createHtmlFromMarkdown(markdown)).resolves.toMatch(
        /<h1>Title<\/h1>/
      );
    });

    test('should properly escape special characters in markdown', async () => {
      // Arrange
      const markdown = '# Title & More\n\n**Bold** & _italic_';

      // Act & Assert
      await expect(createHtmlFromMarkdown(markdown)).resolves.toMatch(
        /Title &amp; More/
      );
    });

    test('should handle code blocks with custom toString objects', async () => {
      // Arrange
      const markdown = '```javascript\nCustom Object String\n```';

      // Act
      const html = await createHtmlFromMarkdown(markdown);

      // Assert
      const $ = cheerio.load(html);
      expect($('code').text().trim()).toBe('Custom Object String');
    });

    test('should handle code blocks with plain objects using JSON.stringify', async () => {
      // Arrange
      const markdown = '```javascript\n{"key":"value"}\n```';

      // Act
      const html = await createHtmlFromMarkdown(markdown);

      // Assert
      const $ = cheerio.load(html);
      expect($('code').text().trim()).toBe('{"key":"value"}');
    });

    test('should handle code blocks with null or undefined values', async () => {
      // Arrange
      const markdown =
        '```javascript\nnull\n```\n\n```javascript\nundefined\n```';

      // Act
      const html = await createHtmlFromMarkdown(markdown);

      // Assert
      const $ = cheerio.load(html);
      const codeBlocks = $('code');
      expect(codeBlocks.length).toBe(2);
      expect(codeBlocks.first().text().trim()).toBe('null');
      expect(codeBlocks.last().text().trim()).toBe('undefined');
    });

    test('should preserve HTML elements in markdown content', async () => {
      // Arrange
      const markdown = '# Title\n\n<div class="custom">Content</div>';

      // Act & Assert
      await expect(createHtmlFromMarkdown(markdown)).resolves.toMatch(
        /<div class="custom">Content<\/div>/
      );
    });
  });

  describe('HTML Validation', () => {
    test('should validate well-formed HTML5 structure', async () => {
      // Arrange
      const validHtml = `<!DOCTYPE html>
        <html lang="en">
          <head>
            <meta charset="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <title>Test Document</title>
          </head>
          <body>
            <main>
              <h1>Test Document</h1>
              <p>This is a valid HTML5 document.</p>
            </main>
          </body>
        </html>`;

      // Act & Assert
      await expect(validateHtml(validHtml)).resolves.toBeUndefined();
    });

    test('should reject empty HTML content', async () => {
      // Arrange
      const invalidHtml = '';

      // Act & Assert
      await expect(validateHtml(invalidHtml)).rejects.toThrow(
        'HTML content cannot be empty'
      );
    });

    test('should reject HTML with only whitespace', async () => {
      // Arrange
      const emptyHtml = '   ';

      // Act & Assert
      await expect(validateHtml(emptyHtml)).rejects.toThrow(
        'HTML content cannot be empty'
      );
    });

    test('should reject malformed HTML structure', async () => {
      // Arrange
      const invalidHtml = '<div><span>Unclosed tags';

      // Act & Assert
      await expect(validateHtml(invalidHtml)).rejects.toThrow(
        'Invalid HTML structure'
      );
    });

    test('should validate HTML with template variables', async () => {
      // Arrange
      const templateHtml = `<!DOCTYPE html>
        <html lang="en">
          <head>
            <meta charset="UTF-8" />
            <title>{{title}}</title>
          </head>
          <body>
            <div class="{{className}}">
              <h1>{{heading}}</h1>
              <p>{{content}}</p>
            </div>
          </body>
        </html>`;

      // Act & Assert
      await expect(validateHtml(templateHtml)).resolves.toBeUndefined();
    });
  });

  describe('HTML Options Validation', () => {
    test('should accept valid configuration options', () => {
      // Arrange
      const validOptions = {
        filepath: path.join(OUTPUT_PATH, 'test.html'),
        cssPath: path.join(CSS_PATH, 'valid.css'),
      };

      // Act & Assert
      expect(() => validateHtmlOptions(validOptions)).not.toThrow();
    });

    test('should reject invalid filepath type', () => {
      // Arrange
      const invalidOptions = {
        filepath: 123,
        cssPath: path.join(CSS_PATH, 'valid.css'),
      };

      // Act & Assert
      expect(() => validateHtmlOptions(invalidOptions)).toThrow(
        'Invalid filepath'
      );
    });

    test('should handle missing optional parameters', () => {
      // Arrange & Act & Assert
      expect(() => validateHtmlOptions({})).not.toThrow();
    });

    test('should reject invalid options object types', () => {
      // Arrange & Act & Assert
      expect(() => validateHtmlOptions(null)).toThrow('Invalid options object');
    });
  });
});

describe.skip('HTML Generation', () => {
  // ... existing code ...
});
