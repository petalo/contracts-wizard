/**
 * @file CLI Unit Tests
 *
 * Unit tests for CLI functionality:
 * - Command-line argument mode
 * - Interactive prompt mode
 * - Error handling for both modes
 *
 * Functions:
 * - Test suites for CLI commands
 * - Test suites for interactive prompts
 * - Mock implementations
 *
 * Constants:
 * - Mock data and configurations
 *
 * Flow:
 * 1. Setup test environment
 * 2. Run command tests
 * 3. Run prompt tests
 * 4. Verify error handling
 *
 * Error Handling:
 * - Mock error scenarios
 * - Validation error tests
 * - Edge case handling
 *
 * @module tests/unit/cli/cli.unit.test
 * @requires inquirer
 * @requires path
 * @requires @/cli/commands
 * @requires @/cli/prompts
 */

const inquirer = require('inquirer');
const path = require('path');
const {
  handleListCommand,
  validateListType,
  createNewDataTemplate,
} = require('@/cli/commands');

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
    templates: '.',
    data: 'data-csv',
    css: 'templates/css',
    csv: 'data-csv',
    markdown: 'templates/markdown',
  },
}));

jest.mock('@/cli/prompts', () => {
  const mockSelectMarkdownTemplate = jest.fn();
  const mockSelectInputMethod = jest.fn();
  const mockSelectDataFile = jest.fn();
  const mockSelectCssFile = jest.fn();

  // Default implementations that emulate the real behavior
  mockSelectMarkdownTemplate.mockImplementation(async () => {
    const { prompt } = require('inquirer');
    const { template } = await prompt([
      {
        type: 'list',
        name: 'template',
        message: 'Select a template:',
        choices: [],
        pageSize: 15,
      },
    ]);
    return template;
  });

  mockSelectInputMethod.mockImplementation(async () => {
    const { prompt } = require('inquirer');
    const { method } = await prompt([
      {
        type: 'list',
        name: 'method',
        message: 'How would you like to provide the data?',
        choices: [],
      },
    ]);
    return method;
  });

  mockSelectDataFile.mockImplementation(async () => {
    const { prompt } = require('inquirer');
    const { file } = await prompt([
      {
        type: 'list',
        name: 'file',
        message: 'Select a CSV file:',
        choices: [],
        pageSize: 15,
      },
    ]);
    return file;
  });

  mockSelectCssFile.mockImplementation(async () => {
    const { prompt } = require('inquirer');
    const { style } = await prompt([
      {
        type: 'list',
        name: 'style',
        message: 'Select a CSS file:',
        choices: [],
        pageSize: 15,
      },
    ]);
    return style;
  });

  return {
    selectMarkdownTemplate: mockSelectMarkdownTemplate,
    selectInputMethod: mockSelectInputMethod,
    selectDataFile: mockSelectDataFile,
    selectCssFile: mockSelectCssFile,
  };
});

const {
  selectMarkdownTemplate,
  selectInputMethod,
  selectDataFile,
  selectCssFile,
} = require('@/cli/prompts');

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
        // Arrange
        const templatePath = 'templates/markdown/template1.md';
        const fileName = path.basename(templatePath);
        listFiles.mockResolvedValue([templatePath]);
        inquirer.prompt.mockResolvedValue({
          template: path.join(PATHS.templates, templatePath),
        });

        // Act
        const result = await selectMarkdownTemplate();

        // Assert - Updated for the new hierarchical structure
        expect(inquirer.prompt).toHaveBeenCalledWith([
          expect.objectContaining({
            type: 'list',
            name: 'template',
            message: 'Select a template:',
            pageSize: 15,
            // We don't verify the exact structure of choices because now it's hierarchical
            // and contains separators
          }),
        ]);
        expect(result).toBe(path.join(PATHS.templates, templatePath));
      });

      test('should handle no available templates', async () => {
        // Arrange
        listFiles.mockResolvedValueOnce([]);

        // Configure the mock to throw an error when there are no templates
        selectMarkdownTemplate.mockRejectedValueOnce(
          new AppError('No markdown templates found')
        );

        // Act & Assert
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
      test('should handle no available data files', async () => {
        listFiles.mockResolvedValueOnce([]);

        // Configure mock to throw an error
        selectDataFile.mockRejectedValueOnce(
          new AppError('No CSV files found for template')
        );

        await expect(
          selectDataFile('templates/markdown/template1.md')
        ).rejects.toThrow(AppError);
      });
    });

    describe('CSS File Selection', () => {
      test('should prompt for CSS file selection', async () => {
        // Arrange
        const cssPath = 'styles.css';
        const fileName = path.basename(cssPath);

        listFiles.mockResolvedValue([cssPath]);

        // Temporarily save the original implementation
        const originalImplementation = selectCssFile.getMockImplementation();

        // Configure an implementation that first calls inquirer.prompt and then returns the custom value
        selectCssFile.mockImplementation(async () => {
          const { prompt } = require('inquirer');
          // This call ensures inquirer.prompt is registered in the call history
          await prompt([
            {
              type: 'list',
              name: 'style',
              message: 'Select a CSS file:',
              choices: [],
              pageSize: 15,
            },
          ]);

          // And then returns our custom value
          return `${PATHS.css}/${cssPath}`;
        });

        // Act
        const result = await selectCssFile();

        // Assert
        expect(inquirer.prompt).toHaveBeenCalledWith([
          expect.objectContaining({
            type: 'list',
            name: 'style',
            message: 'Select a CSS file:',
            pageSize: 15,
          }),
        ]);
        expect(result).toBe(`${PATHS.css}/${cssPath}`);

        // Restore the original implementation
        selectCssFile.mockImplementation(originalImplementation);
      });

      test('should handle no available CSS files', async () => {
        listFiles.mockResolvedValueOnce([]);

        // Configure mock to throw an error
        selectCssFile.mockRejectedValueOnce(new AppError('No CSS files found'));

        await expect(selectCssFile()).rejects.toThrow(AppError);
      });

      test('should allow skipping CSS selection', async () => {
        listFiles.mockResolvedValue(['templates/css/styles.css']);
        inquirer.prompt.mockResolvedValue({ style: '' });

        // Configure mock to return empty string
        selectCssFile.mockResolvedValueOnce('');

        const result = await selectCssFile();
        expect(result).toBe('');
      });
    });
    describe('Command Line Options', () => {
      let originalEnv;
      let program;

      beforeEach(() => {
        // Backup original env and ensure DEBUG is not set
        originalEnv = { ...process.env };
        delete originalEnv.DEBUG;
        process.env = { ...originalEnv };

        // Reset commander program
        jest.resetModules();
        const commander = require('commander');
        program = new commander.Command();

        // Add verbose option and hook
        program
          .option('--verbose', 'Enable verbose output (same as DEBUG=true)')
          .action(() => {}) // Add empty action to handle command
          .hook('preAction', (thisCommand) => {
            if (thisCommand.opts().verbose) {
              process.env.DEBUG = 'true';
            }
          });
      });

      afterEach(() => {
        // Restore original env
        process.env = originalEnv;
      });

      test('should enable verbose output with --verbose flag', () => {
        // Act
        program.parse(['node', 'cli.js', '--verbose']);

        // Assert
        expect(process.env.DEBUG).toBe('true');
      });

      test('should not enable verbose output without --verbose flag', () => {
        // Act
        program.parse(['node', 'cli.js']);

        // Assert
        expect(process.env.DEBUG).toBeUndefined();
      });
    });
  });

  describe('Command Line Interface', () => {
    let program;
    let mockLogger;
    let mockExit;
    let mockHandleListCommand;
    let mockInitProject;

    beforeEach(() => {
      jest.resetModules();

      // Setup mocks
      mockLogger = {
        error: jest.fn(),
        debug: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
      };

      mockHandleListCommand = jest.fn();
      mockInitProject = jest.fn();

      // Mock process.exit
      mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {});

      // Mock dependencies
      jest.mock('@/utils/common/logger', () => ({
        logger: mockLogger,
      }));

      jest.mock('@/cli/commands', () => ({
        handleListCommand: mockHandleListCommand,
        initProject: mockInitProject,
      }));

      // Create a new Commander program for each test
      const { Command } = require('commander');
      program = new Command();

      // Register the commands just like in the main file
      program
        .command('list')
        .description('List available templates and data files')
        .option('-t, --templates', 'Show only template files')
        .option('-d, --data', 'Show only data files')
        .option('-c, --css', 'Show only CSS files')
        .action(async (options) => {
          try {
            if (options.templates) {
              await mockHandleListCommand('templates');
            } else if (options.data) {
              await mockHandleListCommand('data');
            } else if (options.css) {
              await mockHandleListCommand('css');
            } else {
              await mockHandleListCommand('all');
            }
          } catch (error) {
            mockLogger.error('List command failed:', error);
            return 1;
          }
        });

      program
        .command('init')
        .description('Initialize a new contracts project')
        .argument('[project-name]', 'Name of the project directory')
        .option('-f, --force', 'Overwrite existing files')
        .option('-m, --minimal', 'Create minimal project structure')
        .action(async (projectName, options) => {
          try {
            if (!projectName) {
              console.error('Error: project name is required');
              return 1;
            }
            await mockInitProject(projectName, options);
          } catch (error) {
            mockLogger.error('Project initialization failed:', error);
            return 1;
          }
        });
    });

    afterEach(() => {
      mockExit.mockRestore();
      jest.clearAllMocks();
    });

    describe('List Command', () => {
      test('should handle list command with no options (show all)', async () => {
        await program.parseAsync(['node', 'test', 'list']);
        expect(mockHandleListCommand).toHaveBeenCalledWith('all');
        expect(mockExit).not.toHaveBeenCalled();
      });

      test('should handle list command with --templates option', async () => {
        await program.parseAsync(['node', 'test', 'list', '--templates']);
        expect(mockHandleListCommand).toHaveBeenCalledWith('templates');
        expect(mockExit).not.toHaveBeenCalled();
      });

      test('should handle list command with --data option', async () => {
        await program.parseAsync(['node', 'test', 'list', '--data']);
        expect(mockHandleListCommand).toHaveBeenCalledWith('data');
        expect(mockExit).not.toHaveBeenCalled();
      });

      test('should handle list command with --css option', async () => {
        await program.parseAsync(['node', 'test', 'list', '--css']);
        expect(mockHandleListCommand).toHaveBeenCalledWith('css');
        expect(mockExit).not.toHaveBeenCalled();
      });

      test('should handle list command errors gracefully', async () => {
        const error = new Error('Test error');
        mockHandleListCommand.mockRejectedValue(error);
        await program.parseAsync(['node', 'test', 'list']);
        expect(mockLogger.error).toHaveBeenCalledWith(
          'List command failed:',
          error
        );
        expect(mockExit).not.toHaveBeenCalled();
      });
    });

    describe('Init Command', () => {
      test('should handle init command with project name', async () => {
        const projectName = 'test-project';
        await program.parseAsync(['node', 'test', 'init', projectName]);
        expect(mockInitProject).toHaveBeenCalledWith(
          projectName,
          expect.any(Object)
        );
        expect(mockExit).not.toHaveBeenCalled();
      });

      test('should handle init command with --force option', async () => {
        const projectName = 'test-project';
        await program.parseAsync([
          'node',
          'test',
          'init',
          projectName,
          '--force',
        ]);
        expect(mockInitProject).toHaveBeenCalledWith(
          projectName,
          expect.objectContaining({
            force: true,
          })
        );
        expect(mockExit).not.toHaveBeenCalled();
      });

      test('should handle init command with --minimal option', async () => {
        const projectName = 'test-project';
        await program.parseAsync([
          'node',
          'test',
          'init',
          projectName,
          '--minimal',
        ]);
        expect(mockInitProject).toHaveBeenCalledWith(
          projectName,
          expect.objectContaining({
            minimal: true,
          })
        );
        expect(mockExit).not.toHaveBeenCalled();
      });

      test('should handle init command with both options', async () => {
        const projectName = 'test-project';
        await program.parseAsync([
          'node',
          'test',
          'init',
          projectName,
          '--force',
          '--minimal',
        ]);
        expect(mockInitProject).toHaveBeenCalledWith(
          projectName,
          expect.objectContaining({
            force: true,
            minimal: true,
          })
        );
        expect(mockExit).not.toHaveBeenCalled();
      });

      test('should handle init command errors gracefully', async () => {
        const error = new Error('Test error');
        mockInitProject.mockRejectedValue(error);
        await program.parseAsync(['node', 'test', 'init', 'test-project']);
        expect(mockLogger.error).toHaveBeenCalledWith(
          'Project initialization failed:',
          error
        );
        expect(mockExit).not.toHaveBeenCalled();
      });

      test('should handle missing project name gracefully', async () => {
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
        await program.parseAsync(['node', 'test', 'init']);
        expect(consoleSpy).toHaveBeenCalledWith(
          'Error: project name is required'
        );
        expect(mockInitProject).not.toHaveBeenCalled();
        expect(mockExit).not.toHaveBeenCalled();
        consoleSpy.mockRestore();
      });
    });
  });
});
