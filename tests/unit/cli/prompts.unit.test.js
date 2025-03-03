/**
 * @file Unit tests for CLI prompt functionality
 *
 * Tests cover:
 * - Hierarchical choices creation
 * - Template selection
 * - Input method selection
 * - Data file selection
 * - CSS file selection
 * - Error handling
 *
 * @module tests/unit/cli/prompts.unit.test
 */

const path = require('path');
const inquirer = require('inquirer');
const { AppError } = require('@/utils/common/errors');
const { listFiles } = require('@/utils/file-management/file-scanner');
const { display } = require('@/cli/display');
const { PATHS } = require('@/config/paths');
const {
  getRelativePath,
} = require('@/utils/file-management/get-relative-path');

// Module under test
const {
  selectMarkdownTemplate,
  selectInputMethod,
  selectDataFile,
  selectCssFile,
} = require('@/cli/prompts');

// Mock dependencies
jest.mock('inquirer');
jest.mock('@/utils/common/logger');
jest.mock('@/utils/file-management/file-scanner');
jest.mock('@/cli/display');
jest.mock('@/config/paths', () => ({
  PATHS: {
    templates: '/mock/templates',
    css: '/mock/css',
    csv: '/mock/csv',
  },
}));
jest.mock('@/utils/file-management/get-relative-path');
jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  existsSync: jest.fn().mockReturnValue(true),
}));

describe('CLI Prompt System', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getRelativePath.mockImplementation((path) => path);
    display.blank = jest.fn();
    display.status = { info: jest.fn() };
  });

  describe('Template Selection', () => {
    test('should select a markdown template successfully', async () => {
      // Arrange
      const mockTemplates = ['template1.md', 'subdir/template2.md'];

      listFiles.mockResolvedValue(mockTemplates);
      inquirer.prompt.mockResolvedValue({ template: 'template1.md' });

      // Act
      const result = await selectMarkdownTemplate();

      // Assert
      expect(listFiles).toHaveBeenCalledWith('markdown');
      expect(inquirer.prompt).toHaveBeenCalled();
      expect(result).toBe(path.join('/mock/templates', 'template1.md'));
    });

    test('should handle absolute template paths', async () => {
      // Arrange
      const absolutePath = '/absolute/path/to/template.md';

      listFiles.mockResolvedValue(['template.md']);
      inquirer.prompt.mockResolvedValue({ template: absolutePath });

      // Act
      const result = await selectMarkdownTemplate();

      // Assert
      expect(result).toBe(absolutePath);
    });

    test('should throw error when no templates exist', async () => {
      // Arrange
      listFiles.mockResolvedValue([]);

      // Act & Assert
      await expect(selectMarkdownTemplate()).rejects.toThrow(
        'No markdown templates found'
      );
    });
  });

  describe('Input Method Selection', () => {
    test('should select CSV file input method', async () => {
      // Arrange
      inquirer.prompt.mockResolvedValue({ method: 'csv' });

      // Act
      const result = await selectInputMethod();

      // Assert
      expect(result).toBe('csv');
      expect(inquirer.prompt).toHaveBeenCalled();
    });

    test('should select create new CSV file method', async () => {
      // Arrange
      inquirer.prompt.mockResolvedValue({ method: 'create' });

      // Act
      const result = await selectInputMethod();

      // Assert
      expect(result).toBe('create');
    });

    test('should select no data method', async () => {
      // Arrange
      inquirer.prompt.mockResolvedValue({ method: 'none' });

      // Act
      const result = await selectInputMethod();

      // Assert
      expect(result).toBe('none');
    });
  });

  describe('Data File Selection', () => {
    test('should filter and select CSV files by template name', async () => {
      // Arrange
      const templatePath = '/templates/contract.md';
      const csvFiles = [
        'contract_data.csv',
        'contract_client.csv',
        'other.csv',
      ];

      listFiles.mockResolvedValue(csvFiles);
      inquirer.prompt.mockResolvedValue({ file: 'contract_data.csv' });

      // Act
      const result = await selectDataFile(templatePath);

      // Assert
      expect(listFiles).toHaveBeenCalledWith('csv');
      expect(inquirer.prompt).toHaveBeenCalled();
      expect(result).toBe(path.join('/mock/csv', 'contract_data.csv'));
    });

    test('should throw error when no matching CSV files exist', async () => {
      // Arrange
      const templatePath = '/templates/unique.md';

      listFiles.mockResolvedValue(['other.csv', 'different.csv']);

      // Act & Assert
      await expect(selectDataFile(templatePath)).rejects.toThrow(
        'No CSV files found for template'
      );
    });

    test('should handle absolute CSV file paths', async () => {
      // Arrange
      const templatePath = '/templates/contract.md';
      const absolutePath = '/absolute/path/to/data.csv';

      listFiles.mockResolvedValue(['contract_data.csv']);
      inquirer.prompt.mockResolvedValue({ file: absolutePath });

      // Act
      const result = await selectDataFile(templatePath);

      // Assert
      expect(result).toBe(absolutePath);
    });
  });

  describe('CSS File Selection', () => {
    test('should select a CSS file successfully', async () => {
      // Arrange
      const cssFiles = ['style.css', 'theme/dark.css'];

      listFiles.mockResolvedValue(cssFiles);
      inquirer.prompt.mockResolvedValue({ style: 'style.css' });

      // Act
      const result = await selectCssFile();

      // Assert
      expect(listFiles).toHaveBeenCalledWith('css');
      expect(inquirer.prompt).toHaveBeenCalled();
      expect(result).toBe(path.join('/mock/css', 'style.css'));
    });

    test('should handle skipping CSS selection', async () => {
      // Arrange
      listFiles.mockResolvedValue(['style.css']);
      inquirer.prompt.mockResolvedValue({ style: '' });

      // Act
      const result = await selectCssFile();

      // Assert
      expect(result).toBe('');
    });

    test('should throw error when no CSS files exist', async () => {
      // Arrange
      listFiles.mockResolvedValue([]);

      // Act & Assert
      await expect(selectCssFile()).rejects.toThrow('No CSS files found');
    });

    test('should handle absolute CSS file paths', async () => {
      // Arrange
      const absolutePath = '/absolute/path/to/style.css';

      listFiles.mockResolvedValue(['style.css']);
      inquirer.prompt.mockResolvedValue({ style: absolutePath });

      // Act
      const result = await selectCssFile();

      // Assert
      expect(result).toBe(absolutePath);
    });
  });

  describe('Hierarchical Choices Creation', () => {
    // To test the internal createHierarchicalChoices function, we need
    // to make it accessible for tests. There are several ways to do this:

    // Option 1: Make it public in the original module
    // Option 2: Use rewire to access private functions
    // Option 3: Infer its behavior through public functions

    // We'll use option 3 in this case

    test('should create hierarchical structure with root and subdirectories', async () => {
      // Arrange
      const mockFiles = [
        'root.md',
        'subdir/file1.md',
        'subdir/file2.md',
        'another/deep/file.md',
      ];

      // Need to ensure inquirer.Separator creates objects with type='separator'
      // so we can filter them out later
      const originalSeparator = inquirer.Separator;
      inquirer.Separator = jest.fn().mockImplementation(function (message) {
        this.type = 'separator';
        this.line = message || '';
        return this;
      });

      listFiles.mockResolvedValue(mockFiles);

      // Capturar las opciones pasadas a inquirer
      let capturedChoices;
      inquirer.prompt.mockImplementation((options) => {
        capturedChoices = options[0].choices;
        return Promise.resolve({ template: 'root.md' });
      });

      // Act
      await selectMarkdownTemplate();

      // Restore original implementation after test
      inquirer.Separator = originalSeparator;

      // Assert

      // Verificar que hay separadores para directorios
      const separators = capturedChoices.filter(
        (choice) => choice.type === 'separator'
      );
      expect(separators.length).toBeGreaterThan(0);

      // Verificar que los archivos de la raíz tienen indentación
      const rootFiles = capturedChoices.filter(
        (choice) =>
          typeof choice === 'object' && 'name' in choice && 'value' in choice
      );
      expect(rootFiles.some((file) => file.value === 'root.md')).toBe(true);

      // Verificar que el total de elementos es correcto (archivos + separadores)
      const nonSeparatorItems = capturedChoices.filter(
        (choice) => !choice.type
      );
      expect(nonSeparatorItems.length).toBe(mockFiles.length);
    });
  });

  describe('Error Handling', () => {
    test('should propagate errors from listFiles', async () => {
      // Arrange
      const mockError = new Error('File scanning failed');
      listFiles.mockRejectedValue(mockError);

      // Act & Assert
      await expect(selectMarkdownTemplate()).rejects.toThrow(
        'File scanning failed'
      );
    });

    test('should handle inquirer prompt rejection', async () => {
      // Arrange
      listFiles.mockResolvedValue(['template.md']);
      inquirer.prompt.mockRejectedValue(new Error('User cancelled'));

      // Act & Assert
      await expect(selectMarkdownTemplate()).rejects.toThrow('User cancelled');
    });
  });
});
