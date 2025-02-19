/**
 * @file Tests for CSV template generation functionality
 *
 * Tests the CSV generation system's ability to:
 * - Generate CSV from template fields
 * - Handle empty templates
 * - Process complex field structures
 * - Handle errors appropriately
 *
 * Functions Tested:
 * - generateCsvTemplate: Main CSV generation function
 * - generateCsvStructure: CSV structure generator
 * - formatCsvContent: CSV content formatter
 *
 * Flow:
 * 1. Setup test environment
 * 2. Execute test cases
 * 3. Validate results
 * 4. Clean up
 *
 * Error Handling:
 * - Tests invalid inputs
 * - Verifies error cases
 * - Validates edge cases
 *
 * @module tests/unit/template-processor/generators/csv.unit.test
 * @requires @/utils/template-processor/generators/csv
 */

const path = require('path');
const os = require('os');

// Create mock functions
const mockFs = {
  writeFile: jest.fn(),
  readFile: jest.fn(),
  mkdir: jest.fn(),
  readdir: jest.fn(),
  unlink: jest.fn(),
  rm: jest.fn(),
};

// Mock dependencies that don't need TEST_TEMP_DIR
jest.mock('fs/promises', () => mockFs);
jest.mock('@/utils/common/logger', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));
jest.mock('@/config/file-extensions', () => ({
  FILE_EXTENSIONS: {
    markdown: ['.md'],
    csv: ['.csv'],
  },
}));
jest.mock('@/config/encoding', () => ({
  ENCODING_CONFIG: {
    default: 'utf8',
  },
}));
jest.mock('@/utils/template-processor/core/extract-fields', () => ({
  extractTemplateFields: jest.fn(),
}));

describe('CSV Generation', () => {
  let TEST_TEMP_DIR;
  let fs;
  let AppError;
  let generateCsvTemplate;
  let generateCsvStructure;
  let formatCsvContent;
  let logger;
  let extractTemplateFields;

  beforeAll(async () => {
    // Create temp directory path
    TEST_TEMP_DIR = path.join(
      os.tmpdir(),
      `contracts-wizard-test-${Date.now()}`
    );

    // Use jest.isolateModules to create a fresh module environment
    await jest.isolateModules(async () => {
      // Mock paths dynamically
      jest.doMock('@/config/paths', () => ({
        PATHS: {
          csv: TEST_TEMP_DIR,
        },
      }));

      // Import dependencies after mocking
      fs = require('fs').promises;
      AppError = require('@/utils/common/errors').AppError;
      const csvModule = require('@/utils/template-processor/generators/csv');
      generateCsvTemplate = csvModule.generateCsvTemplate;
      generateCsvStructure = csvModule.generateCsvStructure;
      formatCsvContent = csvModule.formatCsvContent;
      logger = require('@/utils/common/logger').logger;
      extractTemplateFields =
        require('@/utils/template-processor/core/extract-fields').extractTemplateFields;
    });

    // Create temp directory
    await fs.mkdir(TEST_TEMP_DIR, { recursive: true });
  });

  // Clean up temp directory after tests
  afterAll(async () => {
    try {
      await fs.rm(TEST_TEMP_DIR, {
        recursive: true,
        force: true,
      });
    } catch (error) {
      console.warn('Failed to clean up temp directory:', error);
    }
  });

  // Clean up any files created during each test
  afterEach(async () => {
    try {
      const files = await fs.readdir(TEST_TEMP_DIR);
      await Promise.all(
        files.map((file) =>
          fs.unlink(path.join(TEST_TEMP_DIR, file)).catch(() => {})
        )
      );
    } catch (error) {
      console.warn('Failed to clean up test files:', error);
    }
  });

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();

    // Reset fs mock implementations
    Object.values(mockFs).forEach((mock) => mock.mockReset());
  });

  describe('generateCsvStructure', () => {
    test('should generate CSV structure from fields', () => {
      const fields = ['name', 'email', 'age'];
      const result = generateCsvStructure(fields);
      const expected =
        'name,,Field: name\nemail,,Field: email\nage,,Field: age';
      expect(result).toBe(expected);
    });

    test('should handle empty fields array', () => {
      const fields = [];
      const result = generateCsvStructure(fields);
      expect(result).toBe('');
    });

    test('should handle nested fields', () => {
      const fields = ['user.name', 'user.address.city'];
      const result = generateCsvStructure(fields);
      const expected =
        'user.name,,Field: user.name\nuser.address.city,,Field: user.address.city';
      expect(result).toBe(expected);
    });
  });

  describe('formatCsvContent', () => {
    test('should add headers to CSV structure', () => {
      const structure = 'name,,Field: name';
      const result = formatCsvContent(structure);
      const expected = 'key,value,comment\nname,,Field: name';
      expect(result).toBe(expected);
    });

    test('should handle empty structure', () => {
      const result = formatCsvContent('');
      expect(result).toBe('key,value,comment\n');
    });
  });

  describe('generateCsvTemplate', () => {
    test('should generate CSV template file', async () => {
      // Arrange
      const mockFields = ['name', 'email', 'age'];
      const mockTemplatePath = 'test-template.md';

      mockFs.mkdir.mockResolvedValue(undefined);
      mockFs.writeFile.mockResolvedValue(undefined);
      mockFs.readFile.mockResolvedValue('mock template content');
      extractTemplateFields.mockResolvedValue(mockFields);

      // Act
      const result = await generateCsvTemplate(mockTemplatePath);

      // Assert
      expect(path.basename(result)).toMatch(
        /test-template-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}.*\.csv$/
      );
      expect(mockFs.mkdir).toHaveBeenCalledWith(TEST_TEMP_DIR, {
        recursive: true,
      });
      expect(mockFs.writeFile).toHaveBeenCalledTimes(1);
      expect(mockFs.writeFile.mock.calls[0][1]).toBe(
        'key,value,comment\nname,,Field: name\nemail,,Field: email\nage,,Field: age'
      );

      // Verify logging
      expect(logger.debug).toHaveBeenCalledWith(
        'Starting CSV template generation',
        expect.any(Object)
      );
      expect(logger.info).toHaveBeenCalledWith(
        'CSV template generated successfully',
        expect.any(Object)
      );
    });

    test('should handle template without fields', async () => {
      // Arrange
      mockFs.readFile.mockResolvedValue('mock template content');
      extractTemplateFields.mockResolvedValue([]);

      // Act & Assert
      await expect(generateCsvTemplate('templates/test.md')).rejects.toThrow(
        'No fields found in template'
      );
      expect(mockFs.writeFile).not.toHaveBeenCalled();

      // Verify logging
      expect(logger.error).toHaveBeenCalledWith(
        'No fields found in template',
        expect.any(Object)
      );
    });

    test('should handle template extraction error', async () => {
      // Arrange
      const extractionError = new Error('Failed to extract template fields');
      mockFs.readFile.mockResolvedValue('mock template content');
      extractTemplateFields.mockRejectedValue(extractionError);

      // Act & Assert
      await expect(generateCsvTemplate('templates/test.md')).rejects.toThrow(
        'Failed to extract template fields'
      );
      expect(mockFs.writeFile).not.toHaveBeenCalled();

      // Verify logging
      expect(logger.error).toHaveBeenCalledWith(
        'Template field extraction failed with unexpected error',
        expect.any(Object)
      );
    });

    test('should handle file write error', async () => {
      // Arrange
      const mockFields = ['name'];
      const mockTemplatePath = 'error-template.md';
      const writeError = new Error('Failed to write file');

      mockFs.mkdir.mockResolvedValue(undefined);
      mockFs.readFile.mockResolvedValue('mock template content');
      mockFs.writeFile.mockRejectedValue(writeError);
      extractTemplateFields.mockResolvedValue(mockFields);

      // Act & Assert
      await expect(generateCsvTemplate(mockTemplatePath)).rejects.toThrow(
        'Failed to write CSV template'
      );
      expect(mockFs.writeFile).toHaveBeenCalledTimes(1);

      // Verify logging
      expect(logger.error).toHaveBeenCalledWith(
        'Failed to write CSV file',
        expect.any(Object)
      );
    });
  });
});
