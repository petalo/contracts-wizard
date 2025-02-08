/**
 * @fileoverview End-to-end tests for CLI functionality
 *
 * Tests cover:
 * 1. Basic CLI operations
 * 2. File generation
 * 3. Error handling
 * 4. Input validation
 * 5. Output verification
 *
 * @module tests/e2e/cli
 * @requires fs
 * @requires path
 * @requires child_process
 */

const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const testUtils = require('../utils/testUtils');

const execAsync = util.promisify(exec);

// Constants
const CLI_PATH = path.resolve(__dirname, '../../src/cli.js');
const TEST_FIXTURES_PATH = path.resolve(__dirname, '../__common__/fixtures');
const TEMPLATE_PATH = path.join(
  TEST_FIXTURES_PATH,
  'templates/quick.example.md'
);
const DATA_PATH = path.join(TEST_FIXTURES_PATH, 'data/quick.example.csv');
const CSS_PATH = path.join(TEST_FIXTURES_PATH, 'css/quick.example.css');
const OUTPUT_DIR = path.join(__dirname, '../output');

describe.skip('CLI End-to-End Tests', () => {
  // Setup test environment
  beforeAll(async () => {
    await fs.mkdir(OUTPUT_DIR, { recursive: true });
  });

  // Cleanup after tests
  afterAll(async () => {
    try {
      await fs.rm(OUTPUT_DIR, { recursive: true, force: true });
    } catch (error) {
      console.warn('Error cleaning up test output directory:', error);
    }
  });

  // Clean output directory before each test
  beforeEach(async () => {
    const files = await fs.readdir(OUTPUT_DIR);
    await Promise.all(
      files.map((file) =>
        fs.unlink(path.join(OUTPUT_DIR, file)).catch(() => {})
      )
    );
  });

  describe('Basic CLI Operations', () => {
    test('should display help information', async () => {
      // Act
      const { stdout } = await execAsync(`node ${CLI_PATH} --help`);

      // Assert
      expect(stdout).toContain('Usage:');
      expect(stdout).toContain('Options:');
      expect(stdout).toContain('Commands:');
    });

    test('should display version information', async () => {
      // Act
      const { stdout } = await execAsync(`node ${CLI_PATH} --version`);

      // Assert
      expect(stdout).toMatch(/\d+\.\d+\.\d+/);
    });
  });

  describe('File Generation', () => {
    test('should generate HTML and PDF from template', async () => {
      // Arrange
      const command = `node ${CLI_PATH} generate -t ${TEMPLATE_PATH} -d ${DATA_PATH} -c ${CSS_PATH}`;

      // Act
      const result = await testUtils.pdf.queuePdfGeneration(async () => {
        const { stdout, stderr } = await execAsync(command, {
          env: {
            ...process.env,
            NODE_ENV: 'test',
            DIR_OUTPUT: OUTPUT_DIR,
          },
        });

        // Wait for file operations to complete
        await new Promise((resolve) => setTimeout(resolve, 1000)); // Reduced from 5000ms to 1000ms

        return { stdout, stderr };
      });

      // Assert
      const files = await fs.readdir(OUTPUT_DIR);
      const htmlFile = files.find((f) => f.endsWith('.html'));
      const pdfFile = files.find((f) => f.endsWith('.pdf'));

      expect(htmlFile).toBeDefined();
      expect(pdfFile).toBeDefined();

      // Verify HTML content
      const htmlContent = await fs.readFile(
        path.join(OUTPUT_DIR, htmlFile),
        'utf8'
      );
      expect(htmlContent).toContain('Quick Handlebars & Markdown Test');
      expect(htmlContent).toContain('class="missing-value"');
    });

    afterEach(async () => {
      await testUtils.pdf.cleanupPdfFiles(OUTPUT_DIR);
    });

    test('should generate only HTML when specified', async () => {
      // Arrange
      const command = `node ${CLI_PATH} generate -t ${TEMPLATE_PATH} -d ${DATA_PATH} -c ${CSS_PATH} --format html`;

      // Act
      await execAsync(command, {
        env: {
          ...process.env,
          NODE_ENV: 'test',
          DIR_OUTPUT: OUTPUT_DIR,
        },
      });

      // Wait for file operations to complete
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Assert
      const files = await fs.readdir(OUTPUT_DIR);
      expect(files.some((f) => f.endsWith('.html'))).toBe(true);
      expect(files.some((f) => f.endsWith('.pdf'))).toBe(false);
    });
  });

  describe('Error Handling', () => {
    test('should handle missing template file', async () => {
      // Arrange
      const command = `node ${CLI_PATH} generate -t non-existent.md -d ${DATA_PATH}`;

      // Act & Assert
      await expect(execAsync(command)).rejects.toThrow(/ENOENT/);
    });

    test('should handle missing data file', async () => {
      // Arrange
      const command = `node ${CLI_PATH} generate -t ${TEMPLATE_PATH} -d non-existent.csv`;

      // Act & Assert
      await expect(execAsync(command)).rejects.toThrow(/ENOENT/);
    });

    test('should handle invalid template format', async () => {
      // Arrange
      const command = `node ${CLI_PATH} generate -t ${TEMPLATE_PATH}.invalid`;

      // Act & Assert
      await expect(execAsync(command)).rejects.toThrow(
        /INPUT_VALIDATION_ERROR/
      );
    });

    test('should handle invalid data format', async () => {
      // Arrange
      const invalidDataPath = path.join(OUTPUT_DIR, 'invalid.csv');
      await fs.writeFile(invalidDataPath, 'invalid,csv\nformat');
      const command = `node ${CLI_PATH} generate -t ${TEMPLATE_PATH} -d ${invalidDataPath}`;

      // Act & Assert
      await expect(execAsync(command)).rejects.toThrow(/CSV_PARSING_ERROR/);
    });
  });

  describe('Input Validation', () => {
    test('should require template argument', async () => {
      // Arrange
      const command = `node ${CLI_PATH} generate -d ${DATA_PATH}`;

      // Act & Assert
      await expect(execAsync(command)).rejects.toThrow(/required.*template/i);
    });

    test('should require data argument', async () => {
      // Arrange
      const command = `node ${CLI_PATH} generate -t ${TEMPLATE_PATH}`;

      // Act & Assert
      await expect(execAsync(command)).rejects.toThrow(/required.*data/i);
    });

    test('should validate output format', async () => {
      // Arrange
      const command = `node ${CLI_PATH} generate -t ${TEMPLATE_PATH} -d ${DATA_PATH} --format invalid`;

      // Act & Assert
      await expect(execAsync(command)).rejects.toThrow(/invalid.*format/i);
    });
  });
});
