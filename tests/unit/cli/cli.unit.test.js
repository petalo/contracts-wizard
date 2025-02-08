/**
 * @fileoverview Unit tests for CLI functionality
 *
 * Tests cover:
 * 1. Command-line argument mode
 * 2. Interactive prompt mode
 * 3. Error handling for both modes
 */

const inquirer = require('inquirer');
const path = require('path');
const {
  handleListCommand,
  validateListType,
  createNewDataTemplate,
} = require('@/cli/commands');
const {
  selectMarkdownTemplate,
  selectInputMethod,
  selectDataFile,
  selectCssFile,
} = require('@/cli/prompts');
const { listFiles } = require('@/utils/file-management/file-scanner');
const { AppError } = require('@/utils/common/errors');
const {
  generateCsvTemplate,
} = require('@/utils/template-processor/generators/csv');
const { PATHS } = require('@/config/paths');
const {
  getRelativePath,
} = require('@/utils/file-management/get-relative-path');

// Mock dependencies
jest.mock('inquirer');
jest.mock('@/utils/file-management/file-scanner');
jest.mock('@/utils/template-processor/generators/csv');
jest.mock('@/config/paths', () => ({
  PATHS: {
    templates: 'templates',
    data: 'data-csv',
    css: 'templates/css',
    csv: 'data-csv',
    markdown: 'templates/markdown',
  },
}));

describe('CLI Functionality', () => {
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Setup default mock implementations
    listFiles.mockResolvedValue([
      'templates/markdown/template1.md',
      'templates/markdown/template2.md',
      'data-csv/template1-data.csv',
      'templates/css/styles.css',
    ]);

    generateCsvTemplate.mockResolvedValue('data-csv/template1-data.csv');
  });

  describe('Command-line Mode', () => {
    describe('List Command', () => {
      test('should list markdown templates', async () => {
        await handleListCommand('markdown');
        expect(listFiles).toHaveBeenCalledWith('markdown');
      });

      test('should list CSV files', async () => {
        await handleListCommand('csv');
        expect(listFiles).toHaveBeenCalledWith('csv');
      });

      test('should list CSS files', async () => {
        await handleListCommand('css');
        expect(listFiles).toHaveBeenCalledWith('css');
      });

      test('should throw error for invalid list type', async () => {
        await expect(handleListCommand('invalid')).rejects.toThrow(AppError);
      });
    });

    describe('Template Creation', () => {
      test('should create template from valid markdown file', async () => {
        listFiles.mockResolvedValue(['templates/markdown/template1.md']);
        generateCsvTemplate.mockResolvedValue('data-csv/data.csv');

        const result = await createNewDataTemplate(
          'templates/markdown/template1.md'
        );
        expect(result).toBe('data-csv/data.csv');
        expect(generateCsvTemplate).toHaveBeenCalledWith(
          'templates/markdown/template1.md'
        );
      });

      test('should throw error for non-existent template', async () => {
        listFiles.mockResolvedValueOnce([]);
        const templatePath = 'templates/markdown/non-existent.md';
        await expect(createNewDataTemplate(templatePath)).rejects.toThrow(
          AppError
        );
      });

      test('should throw error for invalid file extension', async () => {
        const templatePath = 'templates/markdown/invalid.txt';
        await expect(createNewDataTemplate(templatePath)).rejects.toThrow(
          AppError
        );
      });
    });

    describe('Type Validation', () => {
      test('should validate markdown type', () => {
        expect(() => validateListType('markdown')).not.toThrow();
      });

      test('should validate csv type', () => {
        expect(() => validateListType('csv')).not.toThrow();
      });

      test('should validate css type', () => {
        expect(() => validateListType('css')).not.toThrow();
      });

      test('should throw error for invalid type', () => {
        expect(() => validateListType('invalid')).toThrow(AppError);
      });
    });
  });

  describe('Interactive Mode', () => {
    describe('Template Selection', () => {
      test('should prompt for markdown template selection', async () => {
        const templatePath = 'templates/markdown/template1.md';
        const fileName = path.basename(templatePath);
        listFiles.mockResolvedValue([templatePath]);
        inquirer.prompt.mockResolvedValue({
          template: path.join(PATHS.templates, templatePath),
        });

        const result = await selectMarkdownTemplate();

        expect(inquirer.prompt).toHaveBeenCalledWith([
          expect.objectContaining({
            type: 'list',
            name: 'template',
            choices: [
              expect.objectContaining({
                name: fileName,
                value: path.join(PATHS.templates, templatePath),
              }),
            ],
          }),
        ]);
        expect(result).toBe(path.join(PATHS.templates, templatePath));
      });

      test('should handle no available templates', async () => {
        listFiles.mockResolvedValueOnce([]);
        await expect(selectMarkdownTemplate()).rejects.toThrow(AppError);
      });
    });

    describe('Input Method Selection', () => {
      test('should prompt for input method', async () => {
        inquirer.prompt.mockResolvedValue({ method: 'csv' });

        const result = await selectInputMethod();

        expect(inquirer.prompt).toHaveBeenCalledWith(
          expect.arrayContaining([
            expect.objectContaining({
              type: 'list',
              name: 'method',
            }),
          ])
        );
        expect(result).toBe('csv');
      });
    });

    describe('Data File Selection', () => {
      test('should prompt for CSV file selection', async () => {
        const csvPath = 'data-csv/template1-data.csv';
        const fileName = path.basename(csvPath);
        listFiles.mockResolvedValue([csvPath]);
        inquirer.prompt.mockResolvedValue({
          file: path.join(PATHS.csv, csvPath),
        });

        const result = await selectDataFile('templates/markdown/template1.md');

        expect(inquirer.prompt).toHaveBeenCalledWith([
          expect.objectContaining({
            type: 'list',
            name: 'file',
            choices: [
              expect.objectContaining({
                name: fileName,
                value: path.join(PATHS.csv, csvPath),
              }),
            ],
          }),
        ]);
        expect(result).toBe(path.join(PATHS.csv, csvPath));
      });

      test('should handle no available data files', async () => {
        listFiles.mockResolvedValueOnce([]);
        await expect(
          selectDataFile('templates/markdown/template1.md')
        ).rejects.toThrow(AppError);
      });
    });

    describe('CSS File Selection', () => {
      test('should prompt for CSS file selection', async () => {
        const cssPath = 'templates/css/styles.css';
        const fileName = path.basename(cssPath);
        listFiles.mockResolvedValue([cssPath]);
        inquirer.prompt.mockResolvedValue({
          style: path.join(PATHS.css, cssPath),
        });

        const result = await selectCssFile();

        expect(inquirer.prompt).toHaveBeenCalledWith([
          expect.objectContaining({
            type: 'list',
            name: 'style',
            choices: [
              expect.objectContaining({
                name: fileName,
                value: path.join(PATHS.css, cssPath),
              }),
              expect.objectContaining({
                name: 'Skip CSS',
                value: '',
              }),
            ],
          }),
        ]);
        expect(result).toBe(path.join(PATHS.css, cssPath));
      });

      test('should handle no available CSS files', async () => {
        listFiles.mockResolvedValueOnce([]);
        await expect(selectCssFile()).rejects.toThrow(AppError);
      });

      test('should allow skipping CSS selection', async () => {
        listFiles.mockResolvedValue(['templates/css/styles.css']);
        inquirer.prompt.mockResolvedValue({ style: '' });
        const result = await selectCssFile();
        expect(result).toBe('');
      });
    });
  });
});
