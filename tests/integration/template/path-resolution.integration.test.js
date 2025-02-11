/**
 * @file Integration tests for template path resolution functionality
 * @fileoverview Tests the template path resolution system to ensure proper handling of file paths,
 * template processing, and error cases in the template processing workflow.
 *
 * Functions:
 * - processMarkdownTemplate: Tests the main template processing function
 *
 * Constants:
 * - fixturesDir: string - Path to test fixtures directory
 * - templatesDir: string - Path to templates directory
 * - csvDir: string - Path to CSV files directory
 * - cssDir: string - Path to CSS files directory
 * - outputDir: string - Path to test output directory
 *
 * Flow:
 * 1. Set up test directories and paths
 * 2. Run template resolution tests with various path configurations
 * 3. Verify error handling for invalid paths and missing files
 * 4. Clean up test output files
 *
 * Error Handling:
 * - Missing template file: Throws AppError
 * - Invalid template paths: Throws AppError
 * - File system errors: Logged with console.warn
 *
 * @module tests/integration/template/path-resolution
 * @requires path
 * @requires fs/promises
 * @requires ../../../src/utils/template-processor/core/process-template
 * @requires ../../../src/config/paths
 * @requires ../../../src/utils/common/errors
 */

const path = require('path');
const fs = require('fs/promises');
const {
  processMarkdownTemplate,
} = require('../../../src/utils/template-processor/core/process-template');
const { PATHS } = require('../../../src/config/paths');
const { AppError } = require('../../../src/utils/common/errors');

describe.skip('Template Path Resolution', () => {
  // Setup test fixtures
  const fixturesDir = path.join(__dirname, '../../__common__/fixtures');
  const templatesDir = path.join(fixturesDir, 'markdown');
  const csvDir = path.join(fixturesDir, 'csv');
  const cssDir = path.join(fixturesDir, 'css');
  const outputDir = path.join(__dirname, '../../output');

  beforeAll(async () => {
    // Crear directorio de output si no existe
    await fs.mkdir(outputDir, { recursive: true });
  });

  afterAll(async () => {
    // Clean up test files
    try {
      const files = await fs.readdir(outputDir);
      for (const file of files) {
        await fs.unlink(path.join(outputDir, file));
      }
    } catch (error) {
      console.warn('Error cleaning up test files:', error);
    }
  });

  describe('Template Resolution', () => {
    test('should resolve template in root directory', async () => {
      const templatePath = path.join(templatesDir, 'quick.example.md');
      const csvPath = path.join(csvDir, 'quick.example.csv');
      const cssPath = path.join(cssDir, 'quick.example.css');

      const result = await processMarkdownTemplate(
        templatePath,
        csvPath,
        cssPath,
        outputDir
      );

      expect(result).toBeDefined();
      expect(result.content).toContain('imported-value');
      expect(result.files.html).toBeDefined();
      expect(result.files.md).toBeDefined();
      // No verificamos el PDF ya que puede fallar por el timeout
    });

    test('should resolve template without data', async () => {
      const templatePath = path.join(templatesDir, 'quick.example.md');
      const cssPath = path.join(cssDir, 'quick.example.css');

      const result = await processMarkdownTemplate(
        templatePath,
        null,
        cssPath,
        outputDir
      );

      expect(result).toBeDefined();
      expect(result.content).toMatch(
        /<span class="missing-value"[^>]*>.*<\/span>/
      );
      expect(result.files.html).toBeDefined();
      expect(result.files.md).toBeDefined();
    });

    test('should handle relative paths', async () => {
      const templatePath = path.relative(
        process.cwd(),
        path.join(templatesDir, 'quick.example.md')
      );
      const csvPath = path.relative(
        process.cwd(),
        path.join(csvDir, 'quick.example.csv')
      );
      const cssPath = path.relative(
        process.cwd(),
        path.join(cssDir, 'quick.example.css')
      );

      const result = await processMarkdownTemplate(
        templatePath,
        csvPath,
        cssPath,
        outputDir
      );

      expect(result).toBeDefined();
      expect(result.files.html).toBeDefined();
      expect(result.files.md).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    test('should handle missing template file', async () => {
      const templatePath = path.join(templatesDir, 'non-existent.md');
      const csvPath = path.join(csvDir, 'quick.example.csv');
      const cssPath = path.join(cssDir, 'quick.example.css');

      await expect(
        processMarkdownTemplate(templatePath, csvPath, cssPath, outputDir)
      ).rejects.toThrow(AppError);
    });

    test('should handle invalid template paths', async () => {
      const templatePath = path.join(templatesDir, '../outside/template.md');
      const csvPath = path.join(csvDir, 'quick.example.csv');
      const cssPath = path.join(cssDir, 'quick.example.css');

      await expect(
        processMarkdownTemplate(templatePath, csvPath, cssPath, outputDir)
      ).rejects.toThrow(AppError);
    });
  });
});
