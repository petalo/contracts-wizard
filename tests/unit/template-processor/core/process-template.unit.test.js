/**
 * @file Test suite for template processing functionality
 *
 * Tests the core template processing functions including:
 * - Template validation
 * - Data injection
 * - Error handling
 * - Edge cases
 *
 * @module tests/unit/template-processor/core/process-template.unit.test
 */

const fs = require('fs').promises;
const path = require('path');
const {
  processMarkdownTemplate,
  validateTemplateFile,
  injectData,
  removeFrontmatter,
} = require('@/utils/template-processor/core/process-template');
const { AppError } = require('@/utils/common/errors');
const { PATHS } = require('@/config/paths');
const testUtils = require('../../../__common__/helpers/test-utils');

// Mock fs
jest.mock('fs', () => ({
  promises: {
    readFile: jest.fn(),
    writeFile: jest.fn(),
    access: jest.fn(),
    mkdir: jest.fn().mockResolvedValue(undefined),
  },
}));

// Mock path
jest.mock('path', () => ({
  join: jest.fn((base, ...parts) => parts.join('/')),
  resolve: jest.fn((base, ...parts) => parts.join('/')),
  dirname: jest.fn((p) => p.split('/').slice(0, -1).join('/')),
  basename: jest.fn((p) => p.split('/').pop()),
}));

jest.mock('@/utils/template-processor/generators/html', () => ({
  generateHtml: jest.fn().mockImplementation(async (content, options) => {
    return {
      filepath: options.filepath,
      content: content,
    };
  }),
}));

jest.mock('@/utils/template-processor/generators/md', () => ({
  generateMarkdown: jest.fn().mockImplementation(async (content, options) => {
    return {
      filepath: options.filepath,
      content: content,
    };
  }),
}));

jest.mock('@/utils/template-processor/generators/pdf', () => ({
  generatePdf: jest.fn().mockImplementation(async (content, options) => {
    if (content.includes('Invalid Document')) {
      const error = new Error(
        'PDF generation failed due to security restrictions'
      );
      error.code = 'PDF_GENERATION_ERROR';
      throw error;
    }
    return options.outputPath;
  }),
}));

describe('Template Processor', () => {
  const TEST_FILES_DIR = path.join(__dirname, 'test-files');
  const TEST_OUTPUT_DIR = path.join(__dirname, 'output');
  const SIMPLE_TEMPLATE_PATH = path.join(TEST_FILES_DIR, 'simple.md');
  const SIMPLE_DATA_PATH = path.join(TEST_FILES_DIR, 'simple.csv');
  const CSS_PATH = path.join(TEST_FILES_DIR, 'style.css');

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Mock successful file access
    fs.access.mockResolvedValue(undefined);

    // Mock successful file reads
    fs.readFile.mockImplementation((filePath) => {
      if (filePath.includes('simple.md')) {
        return Promise.resolve('# Test Template\n\nHello {{name}}!');
      }
      if (filePath.includes('simple.csv')) {
        return Promise.resolve('key,value\nname,World');
      }
      if (filePath.includes('style.css')) {
        return Promise.resolve('body { font-family: Arial; }');
      }
      if (filePath.includes('missing.md')) {
        return Promise.resolve('Name: {{name}}, Age: {{age}}');
      }
      if (filePath.includes('missing.csv')) {
        return Promise.resolve('key,value\nname,John');
      }
      if (filePath.includes('array.md')) {
        return Promise.resolve(`{{#each items}}
          - {{this}}
        {{/each}}`);
      }
      if (filePath.includes('array.csv')) {
        return Promise.resolve(
          'key,value\nitems.0,First\nitems.1,Second\nitems.2,Third'
        );
      }
      return Promise.reject(new Error('File not found'));
    });

    // Mock successful file writes
    fs.writeFile.mockResolvedValue(undefined);
  });

  describe('Basic Template Processing', () => {
    test('should process simple template with data', async () => {
      const result = await processMarkdownTemplate(
        SIMPLE_TEMPLATE_PATH,
        SIMPLE_DATA_PATH
      );

      expect(result.content).toMatch(
        /<p>Hello <span class="imported-value" data-field="name">World<\/span>!<\/p>/
      );
      expect(result.files).toEqual(
        expect.objectContaining({
          md: expect.stringContaining('.md'),
          html: expect.stringContaining('.html'),
          pdf: expect.stringContaining('.pdf'),
        })
      );
      expect(result.stats).toEqual(
        expect.objectContaining({
          totalFields: expect.any(Number),
          processedFields: expect.any(Number),
        })
      );
    });

    test('should apply CSS styling when provided', async () => {
      const result = await processMarkdownTemplate(
        SIMPLE_TEMPLATE_PATH,
        SIMPLE_DATA_PATH,
        CSS_PATH
      );

      // Verify that CSS is included in the document
      const {
        generateHtml,
      } = require('@/utils/template-processor/generators/html');
      const mockCalls = generateHtml.mock.calls;
      expect(mockCalls.length).toBeGreaterThan(0);
      const lastCall = mockCalls[mockCalls.length - 1];
      expect(lastCall[1].cssPath).toBe(CSS_PATH);

      expect(result.content).toContain('font-family: Arial');
    });
  });

  describe('Missing Value Handling', () => {
    const MISSING_TEMPLATE_PATH = path.join(TEST_FILES_DIR, 'missing.md');
    const MISSING_DATA_PATH = path.join(TEST_FILES_DIR, 'missing.csv');

    test('should handle missing values gracefully', async () => {
      // Act
      const result = await processMarkdownTemplate(
        MISSING_TEMPLATE_PATH,
        MISSING_DATA_PATH
      );

      // Assert
      expect(result.content).toMatch(
        /<p>Name: <span class="imported-value" data-field="name">John<\/span>, Age: <span class="missing-value" data-field="age">\[\[age\]\]<\/span><\/p>/
      );
      expect(result.files).toEqual(
        expect.objectContaining({
          md: expect.stringContaining('.md'),
          html: expect.stringContaining('.html'),
          pdf: expect.stringContaining('.pdf'),
        })
      );
    });

    test('should handle nested missing values with full path', async () => {
      // Arrange
      fs.readFile.mockImplementation((filePath) => {
        if (filePath.includes('missing.md')) {
          return Promise.resolve(
            '{{#with user}}Name: {{name}}, Email: {{contact.email}}{{/with}}'
          );
        }
        if (filePath.includes('missing.csv')) {
          return Promise.resolve('key,value\nuser.name,John');
        }
        return Promise.reject(new Error('File not found'));
      });

      // Act
      const result = await processMarkdownTemplate(
        MISSING_TEMPLATE_PATH,
        MISSING_DATA_PATH
      );

      // Assert
      expect(result.content).toMatch(
        /<p>Name: <span class="imported-value" data-field="user\.name">John<\/span>, Email: <span class="missing-value" data-field="user\.contact\.email">\[\[user\.contact\.email\]\]<\/span><\/p>/
      );
    });

    test('should handle deeply nested contexts with missing values', async () => {
      // Arrange
      fs.readFile.mockImplementation((filePath) => {
        if (filePath.includes('missing.md')) {
          return Promise.resolve(`{{#with user}}
            {{#with profile}}
              {{#with contact}}
                Name: {{../name}}, 
                Email: {{email}}, 
                Phone: {{phone}},
                Address: {{address.street}}
              {{/with}}
            {{/with}}
          {{/with}}`);
        }
        if (filePath.includes('missing.csv')) {
          return Promise.resolve(
            'key,value\nuser.profile.name,John\nuser.profile.contact.email,john@example.com'
          );
        }
        return Promise.reject(new Error('File not found'));
      });

      // Act
      const result = await processMarkdownTemplate(
        MISSING_TEMPLATE_PATH,
        MISSING_DATA_PATH
      );

      // Assert
      expect(result.content).toMatch(
        /<span class="imported-value" data-field="user\.profile\.name">John<\/span>/
      );
      expect(result.content).toMatch(
        /<span class="imported-value" data-field="user\.profile\.contact\.email">john@example\.com<\/span>/
      );
      expect(result.content).toMatch(
        /<span class="missing-value" data-field="user\.profile\.contact\.phone">\[\[user\.profile\.contact\.phone\]\]<\/span>/
      );
      expect(result.content).toMatch(
        /<span class="missing-value" data-field="user\.profile\.contact\.address\.street">\[\[user\.profile\.contact\.address\.street\]\]<\/span>/
      );
    });
  });

  describe('Array Value Processing', () => {
    const ARRAY_TEMPLATE_PATH = path.join(TEST_FILES_DIR, 'array.md');
    const ARRAY_DATA_PATH = path.join(TEST_FILES_DIR, 'array.csv');

    test('should process array values correctly', async () => {
      // Act
      const result = await processMarkdownTemplate(
        ARRAY_TEMPLATE_PATH,
        ARRAY_DATA_PATH
      );

      // Assert
      expect(result.content).toMatch(/First.*Second.*Third/s);
      expect(result.content).toMatch(
        /<span class="imported-value" data-field="items\.0">First<\/span>/
      );
      expect(result.content).toMatch(
        /<span class="imported-value" data-field="items\.1">Second<\/span>/
      );
      expect(result.content).toMatch(
        /<span class="imported-value" data-field="items\.2">Third<\/span>/
      );
    });
  });

  describe('Frontmatter Handling', () => {
    test('should remove frontmatter correctly', () => {
      // Arrange
      const contentWithFrontmatter = `---
title: Test Document
author: John Doe
---
# Main Content
Hello World!`;

      // Act
      const result = removeFrontmatter(contentWithFrontmatter);

      // Assert
      expect(result).toBe('# Main Content\nHello World!');
    });

    test('should preserve content without frontmatter', () => {
      // Arrange
      const contentWithoutFrontmatter = '# Main Content\nHello World!';

      // Act
      const result = removeFrontmatter(contentWithoutFrontmatter);

      // Assert
      expect(result).toBe(contentWithoutFrontmatter);
    });
  });

  describe('Image and Link Processing', () => {
    test('should handle images with proper alt text', async () => {
      // Arrange
      fs.readFile.mockImplementation((filePath) => {
        if (filePath.includes('simple.md')) {
          return Promise.resolve('![{{alt}}]({{url}})');
        }
        if (filePath.includes('simple.csv')) {
          return Promise.resolve(
            'key,value\nalt,Test Image\nurl,/path/to/image.jpg'
          );
        }
        return Promise.reject(new Error('File not found'));
      });

      // Act
      const result = await processMarkdownTemplate(
        SIMPLE_TEMPLATE_PATH,
        SIMPLE_DATA_PATH
      );

      // Assert
      expect(result.content).toMatch(
        /<img src="\/path\/to\/image\.jpg" alt="Test Image"/
      );
    });

    test('should process links correctly', async () => {
      // Arrange
      fs.readFile.mockImplementation((filePath) => {
        if (filePath.includes('simple.md')) {
          return Promise.resolve('[{{text}}]({{url}})');
        }
        if (filePath.includes('simple.csv')) {
          return Promise.resolve(
            'key,value\ntext,Click Here\nurl,https://example.com'
          );
        }
        return Promise.reject(new Error('File not found'));
      });

      // Act
      const result = await processMarkdownTemplate(
        SIMPLE_TEMPLATE_PATH,
        SIMPLE_DATA_PATH
      );

      // Assert
      expect(result.content).toMatch(
        /<a href="https:\/\/example\.com">Click Here<\/a>/
      );
    });
  });

  describe('Error Handling', () => {
    test('should handle non-existent template file', async () => {
      // Arrange
      const nonExistentPath = path.join(TEST_FILES_DIR, 'non-existent.md');
      const dataPath = SIMPLE_DATA_PATH;

      // Mock file access to fail
      fs.access.mockRejectedValue(new Error('File not found'));

      // Act & Assert
      await expect(
        processMarkdownTemplate(nonExistentPath, dataPath)
      ).rejects.toThrow('Template file not found or not accessible');
    });

    test('should handle non-existent data file', async () => {
      // Arrange
      const templatePath = SIMPLE_TEMPLATE_PATH;
      const nonExistentPath = path.join(TEST_FILES_DIR, 'non-existent.csv');

      // Mock file access to fail for data file only
      fs.access.mockImplementation((filePath) => {
        if (filePath.includes('non-existent.csv')) {
          return Promise.reject(new Error('File not found'));
        }
        return Promise.resolve();
      });

      // Act & Assert
      await expect(
        processMarkdownTemplate(templatePath, nonExistentPath)
      ).rejects.toThrow('Data file not found or not accessible');
    });

    test('should handle invalid CSV data', async () => {
      // Arrange
      fs.readFile.mockImplementation((filePath) => {
        if (filePath.includes('simple.md')) {
          return Promise.resolve('Hello {{name}}!');
        }
        if (filePath.includes('simple.csv')) {
          return Promise.resolve('invalid,csv,data\nwithout,proper,structure');
        }
        return Promise.reject(new Error('File not found'));
      });

      // Act & Assert
      await expect(
        processMarkdownTemplate(SIMPLE_TEMPLATE_PATH, SIMPLE_DATA_PATH)
      ).rejects.toThrow('Invalid CSV structure');
    });
  });
});
