/**
 * @file Interactive CLI Prompt System
 *
 * Provides a comprehensive system for interactive user input:
 * - Template selection (Markdown, CSS)
 * - Data input method selection
 * - File selection with filtering
 * - Input validation and error handling
 *
 * Functions:
 * - createHierarchicalChoices: Hierarchical file choice display
 * - selectMarkdownTemplate: Template file selection
 * - selectInputMethod: Data input method choice
 * - selectDataFile: CSV data file selection
 * - selectCssFile: Style sheet selection
 *
 * Dependencies:
 * - inquirer: Interactive CLI prompts
 * - path: File path manipulation
 * - fileScanner: File system operations
 * - display: CLI output formatting
 *
 * Flow:
 * 1. Scan available files
 * 2. Format selection choices
 * 3. Present interactive prompt
 * 4. Validate selection
 * 5. Return validated path
 *
 * Error Handling:
 * - Empty file list detection
 * - Invalid selection prevention
 * - File access validation
 * - Path resolution errors
 * - User cancellation handling
 *
 * @module @/cli/prompts
 * @requires inquirer - Interactive CLI prompts
 * @requires path - Path manipulation utilities
 * @requires @/utils/common/errors - Error handling
 * @requires @/utils/file-management/file-scanner - File operations
 * @requires @/cli/display - CLI output formatting
 * @exports selectMarkdownTemplate - Template selection function
 * @exports selectInputMethod - Input method selection function
 * @exports selectDataFile - Data file selection function
 * @exports selectCssFile - Style selection function
 *
 * @example
 * // Select template and input method
 * const { selectMarkdownTemplate, selectInputMethod } = require('@/cli/prompts');
 *
 * const template = await selectMarkdownTemplate();
 * const method = await selectInputMethod();
 *
 * if (method === 'csv') {
 *   const dataFile = await selectDataFile(template);
 * }
 */

const path = require('path');
const inquirer = require('inquirer');
const { logger } = require('@/utils/common/logger');
const { AppError } = require('@/utils/common/errors');
const { listFiles } = require('@/utils/file-management/file-scanner');
const { display } = require('@/cli/display');
const { PATHS } = require('@/config/paths');
const {
  getRelativePath,
} = require('@/utils/file-management/get-relative-path');

/**
 * Creates hierarchical choices for file selection
 *
 * Organizes files into directory groups for better visualization:
 * 1. Groups files by directory
 * 2. Adds visual separators for directories
 * 3. Sorts files within each group
 *
 * @param {string[]} files - List of file paths (relative)
 * @param {object} [options] - Configuration options
 * @param {boolean} [options.showIcons=true] - Whether to show directory icons
 * @param {boolean} [options.sortByPath=true] - Whether to sort by directory path first
 * @param {boolean} [options.rootDirLabel=true] - Whether to show root directory label
 * @returns {Array} Formatted choices for inquirer
 */
function createHierarchicalChoices(files, options = {}) {
  // prettier-ignore
  const {
    showIcons = true,
    sortByPath = true,
    rootDirLabel = true
  } = options;

  // Optionally pre-sort files
  if (sortByPath) {
    files.sort((a, b) => {
      const pathA = path.dirname(a);
      const pathB = path.dirname(b);
      if (pathA === pathB) {
        return a.localeCompare(b);
      }
      return pathA.localeCompare(pathB);
    });
  }

  // Sort files by directory
  const filesByDirectory = {};
  files.forEach((file) => {
    const dirName = path.dirname(file);
    const baseName = path.basename(file);

    if (!filesByDirectory[dirName]) {
      filesByDirectory[dirName] = [];
    }

    filesByDirectory[dirName].push({
      name: baseName,
      value: file,
    });
  });

  // Create hierarchical choices array
  const choices = [];

  // First add files in the root directory (with group separator if requested)
  if (filesByDirectory['.']) {
    // Add separator for root directory if rootDirLabel is enabled
    if (rootDirLabel) {
      const dirIcon = showIcons ? '📂 ' : '';
      choices.push(new inquirer.Separator(`\n${dirIcon}./`));

      // Add files with indentation
      const filesInRoot = filesByDirectory['.']
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((file) => ({
          name: `   ${file.name}`,
          value: file.value,
        }));

      choices.push(...filesInRoot);
    } else {
      // Original behavior if no root label is wanted
      filesByDirectory['.'].sort((a, b) => a.name.localeCompare(b.name));
      choices.push(...filesByDirectory['.']);
    }

    delete filesByDirectory['.'];
  }

  // Then add each directory as a group
  Object.keys(filesByDirectory)
    .sort((a, b) => a.localeCompare(b))
    .forEach((dir) => {
      // Add a separator for the directory name
      const dirIcon = showIcons ? '📂 ' : '';
      choices.push(new inquirer.Separator(`\n${dirIcon}${dir}`));

      // Add the directory's files with indentation
      const filesInDir = filesByDirectory[dir]
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((file) => ({
          name: `   ${file.name}`,
          value: file.value,
        }));

      choices.push(...filesInDir);
    });

  return choices;
}

/**
 * Prompts for markdown template selection
 *
 * Presents an interactive list of available markdown templates:
 * 1. Scans for .md template files
 * 2. Formats file names for display
 * 3. Handles template selection
 * 4. Validates chosen template
 *
 * @async
 * @returns {Promise<string>} Full path to selected template
 * @throws {AppError} If no templates exist or selection fails
 * @example
 * // Select a markdown template
 * const template = await selectMarkdownTemplate();
 * console.log(`Selected template: ${template}`);
 */
async function selectMarkdownTemplate() {
  const templates = await listFiles('markdown');
  if (templates.length === 0) {
    throw new AppError('No markdown templates found', 'TEMPLATE_NOT_FOUND');
  }

  logger.debug('Available templates', {
    templates,
    templatesDir: PATHS.templates,
    isTemplatesDirAbsolute: path.isAbsolute(PATHS.templates),
    baseDir: process.cwd(),
    context: 'templates',
    filename: 'prompts.js',
  });

  const choices = createHierarchicalChoices(templates);

  const { template } = await inquirer.prompt([
    {
      type: 'list',
      name: 'template',
      message: 'Select a template:',
      choices: choices,
      pageSize: 15,
    },
  ]);

  // If the template path is already absolute, use it directly
  const fullPath = path.isAbsolute(template)
    ? template
    : path.join(PATHS.templates, template);

  logger.debug('Selected template', {
    template,
    fullPath,
    displayPath: getRelativePath(fullPath),
    exists: require('fs').existsSync(fullPath),
    basePath: PATHS.templates,
    isAbsolute: path.isAbsolute(fullPath),
    isTemplateAbsolute: path.isAbsolute(template),
    isTemplatesDirAbsolute: path.isAbsolute(PATHS.templates),
    context: 'templates',
    filename: 'prompts.js',
  });

  return fullPath;
}

/**
 * Prompts for data input method selection
 *
 * Presents options for providing template data:
 * 1. Use existing CSV file
 * 2. Create new CSV file
 * 3. No data (generate template without variables)
 *
 * The selection determines the next workflow step:
 * - 'csv': Proceed to file selection
 * - 'create': Start new file creation
 * - 'none': Skip data input
 *
 * @async
 * @returns {Promise<string>} Selected method ('csv'|'create'|'none')
 * @example
 * // Choose input method
 * const method = await selectInputMethod();
 * if (method === 'csv') {
 *   // Handle existing file
 * } else if (method === 'create') {
 *   // Handle automatic creation
 * } else {
 *   // Handle no data input
 * }
 */
async function selectInputMethod() {
  const { method } = await inquirer.prompt([
    {
      type: 'list',
      name: 'method',
      message: 'How would you like to provide the data?',
      choices: [
        {
          name: 'Use existing CSV file',
          value: 'csv',
        },
        {
          name: 'Create new CSV file',
          value: 'create',
        },
        {
          name: 'No data (generate template without variables)',
          value: 'none',
        },
      ],
    },
  ]);

  return method;
}

/**
 * Prompts for CSV data file selection
 *
 * Presents filtered list of CSV files for template:
 * 1. Extracts template name from path
 * 2. Filters CSV files by template name
 * 3. Displays matching files
 * 4. Handles file selection
 *
 * @async
 * @param {string} templatePath - Source template path
 * @returns {Promise<string>} Selected data file path
 * @throws {AppError} If no matching files exist
 * @example
 * // Select data file for template
 * const template = 'templates/contract.md';
 * const dataFile = await selectDataFile(template);
 * // Shows only CSV files containing 'contract'
 */
async function selectDataFile(templatePath) {
  // Extract just the filename without the directory path and extension
  const templateName = path.basename(templatePath, '.md');

  logger.debug('Looking for CSV files', {
    templatePath,
    templateName,
    extractedFrom: path.basename(templatePath, '.md'),
    context: 'csv',
    filename: 'prompts.js',
  });

  const files = await listFiles('csv');
  logger.debug('Found CSV files', {
    allFiles: files,
    count: files.length,
    context: 'csv',
    filename: 'prompts.js',
  });

  // Filter CSV files that match the template name
  const dataFiles = files.filter((file) => {
    const csvName = path.basename(file);
    const matches = csvName.includes(templateName);
    logger.debug('Checking CSV file', {
      file,
      csvName,
      templateName,
      matches,
      context: 'csv',
      filename: 'prompts.js',
    });
    return matches;
  });

  if (dataFiles.length === 0) {
    logger.error('No matching CSV files found', {
      templateName,
      availableFiles: files,
    });
    throw new AppError(
      `No CSV files found for template "${templateName}". Use 'list data' command to see available files.`,
      'DATA_NOT_FOUND'
    );
  }

  display.blank();
  display.status.info(
    `Found ${dataFiles.length} CSV file(s) for template "${templateName}"`
  );

  const choices = createHierarchicalChoices(dataFiles);

  const { file } = await inquirer.prompt([
    {
      type: 'list',
      name: 'file',
      message: 'Select a CSV file:',
      choices: choices,
      pageSize: 15,
    },
  ]);

  // Ensure absolute path
  const fullPath = path.isAbsolute(file) ? file : path.join(PATHS.csv, file);

  logger.debug('Selected CSV file', {
    selected: file,
    fullPath,
    displayPath: getRelativePath(fullPath),
    exists: require('fs').existsSync(fullPath),
    basePath: PATHS.csv,
    context: 'csv',
    filename: 'prompts.js',
  });

  return fullPath;
}

/**
 * Prompts for CSS style file selection
 *
 * Presents available CSS files for styling:
 * 1. Scans for CSS files
 * 2. Formats file names for display
 * 3. Handles style selection
 * 4. Validates chosen file
 *
 * @async
 * @returns {Promise<string|null>} Selected CSS path or null
 * @throws {AppError} If no CSS files exist
 * @example
 * // Select CSS file for styling
 * const cssFile = await selectCssFile();
 * if (cssFile) {
 *   console.log(`Using style: ${cssFile}`);
 * }
 */
async function selectCssFile() {
  const styles = await listFiles('css');
  if (styles.length === 0) {
    throw new AppError('No CSS files found', 'CSS_NOT_FOUND');
  }

  logger.debug('Available CSS files', {
    styles,
    cssDir: PATHS.css,
    context: 'css',
    filename: 'prompts.js',
  });

  display.blank();

  const choices = createHierarchicalChoices(styles);

  // Add "Skip CSS" option
  choices.push(new inquirer.Separator()); // Add a separator line
  choices.push({
    name: 'Skip CSS',
    value: '',
  });

  const { style } = await inquirer.prompt([
    {
      type: 'list',
      name: 'style',
      message: 'Select a CSS file:',
      choices: choices,
      pageSize: 15,
    },
  ]);

  // If empty string was selected, return it
  if (!style) {
    return '';
  }

  // Ensure absolute path
  const fullPath = path.isAbsolute(style) ? style : path.join(PATHS.css, style);

  logger.debug('Selected CSS file', {
    selected: style,
    fullPath,
    displayPath: getRelativePath(fullPath),
    exists: require('fs').existsSync(fullPath),
    basePath: PATHS.css,
    context: 'css',
    filename: 'prompts.js',
  });

  return fullPath;
}

module.exports = {
  selectMarkdownTemplate,
  selectInputMethod,
  selectDataFile,
  selectCssFile,
};
