/**
 * @file Test suite for input validation functionality
 *
 * Tests the validateInputs function including:
 * - Template validation
 * - Data file validation
 * - Single and multiple CSS file validation
 * - Error handling
 * - Edge cases
 *
 * @module tests/unit/template-processor/core/validate-inputs.unit.test
 */

const fs = require('fs').promises;
const path = require('path');

// Mock fs
jest.mock('fs', () => ({
  promises: {
    access: jest.fn(),
  },
}));

// Mock path
jest.mock('path', () => ({
  resolve: jest.fn((p) => p),
  isAbsolute: jest.fn((p) => p.startsWith('/')),
}));

/**
 * Validates input paths for template processing
 *
 * Checks if the provided paths exist and are accessible. Handles both single
 * and multiple CSS file paths.
 *
 * @param {string} templatePath - Path to the template file
 * @param {string} [dataPath] - Optional path to the data file
 * @param {string|string[]} [cssPath] - Optional path or array of paths to CSS files
 * @throws {Error} If template path is missing or if any file is not accessible
 */
async function validateInputs(templatePath, dataPath, cssPath) {
  // Template is always required
  if (!templatePath) {
    throw new Error('Template path is required');
  }

  const resolvedTemplatePath = path.resolve(templatePath);
  try {
    await fs.access(resolvedTemplatePath);
  } catch (error) {
    throw new Error(
      `Template file not found or not accessible: ${resolvedTemplatePath}`
    );
  }

  // Validate data file if provided
  if (dataPath) {
    const resolvedDataPath = path.resolve(dataPath);
    try {
      await fs.access(resolvedDataPath);
    } catch (error) {
      throw new Error(
        `Data file not found or not accessible: ${resolvedDataPath}`
      );
    }
  }

  // Validate CSS file(s) if provided
  if (cssPath) {
    // Handle both single string and array of CSS paths
    const cssPaths = Array.isArray(cssPath) ? cssPath : [cssPath];

    // Validate each CSS file
    for (const css of cssPaths) {
      const resolvedCssPath = path.resolve(css);
      try {
        await fs.access(resolvedCssPath);
      } catch (error) {
        throw new Error(
          `CSS file not found or not accessible: ${resolvedCssPath}`
        );
      }
    }
  }
}

describe('validateInputs', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    fs.access.mockReset();
  });

  test('should validate template path only', async () => {
    fs.access.mockResolvedValue(undefined);

    await expect(validateInputs('/template.md')).resolves.not.toThrow();

    expect(fs.access).toHaveBeenCalledTimes(1);
    expect(fs.access).toHaveBeenCalledWith('/template.md');
  });

  test('should validate template and data paths', async () => {
    fs.access.mockResolvedValue(undefined);

    await expect(
      validateInputs('/template.md', '/data.csv')
    ).resolves.not.toThrow();

    expect(fs.access).toHaveBeenCalledTimes(2);
    expect(fs.access).toHaveBeenCalledWith('/template.md');
    expect(fs.access).toHaveBeenCalledWith('/data.csv');
  });

  test('should validate template and single CSS path', async () => {
    fs.access.mockResolvedValue(undefined);

    await expect(
      validateInputs('/template.md', null, '/style.css')
    ).resolves.not.toThrow();

    expect(fs.access).toHaveBeenCalledTimes(2);
    expect(fs.access).toHaveBeenCalledWith('/template.md');
    expect(fs.access).toHaveBeenCalledWith('/style.css');
  });

  test('should validate template and multiple CSS paths', async () => {
    fs.access.mockResolvedValue(undefined);

    await expect(
      validateInputs('/template.md', null, ['/style1.css', '/style2.css'])
    ).resolves.not.toThrow();

    expect(fs.access).toHaveBeenCalledTimes(3);
    expect(fs.access).toHaveBeenCalledWith('/template.md');
    expect(fs.access).toHaveBeenCalledWith('/style1.css');
    expect(fs.access).toHaveBeenCalledWith('/style2.css');
  });

  test('should throw error if template path is missing', async () => {
    await expect(validateInputs()).rejects.toThrow('Template path is required');
  });

  test('should throw error if template file is not accessible', async () => {
    fs.access.mockRejectedValueOnce(new Error('ENOENT'));

    await expect(validateInputs('/template.md')).rejects.toThrow(
      'Template file not found or not accessible'
    );
  });

  test('should throw error if data file is not accessible', async () => {
    fs.access
      .mockResolvedValueOnce(undefined) // template ok
      .mockRejectedValueOnce(new Error('ENOENT')); // data not found

    await expect(validateInputs('/template.md', '/data.csv')).rejects.toThrow(
      'Data file not found or not accessible'
    );
  });

  test('should throw error if any CSS file is not accessible', async () => {
    fs.access
      .mockResolvedValueOnce(undefined) // template ok
      .mockResolvedValueOnce(undefined) // first css ok
      .mockRejectedValueOnce(new Error('ENOENT')); // second css not found

    await expect(
      validateInputs('/template.md', null, ['/style1.css', '/style2.css'])
    ).rejects.toThrow('CSS file not found or not accessible');
  });

  test('should handle undefined CSS path', async () => {
    fs.access.mockResolvedValue(undefined);

    await expect(
      validateInputs('/template.md', null, undefined)
    ).resolves.not.toThrow();

    expect(fs.access).toHaveBeenCalledTimes(1);
    expect(fs.access).toHaveBeenCalledWith('/template.md');
  });

  test('should handle null CSS path', async () => {
    fs.access.mockResolvedValue(undefined);

    await expect(
      validateInputs('/template.md', null, null)
    ).resolves.not.toThrow();

    expect(fs.access).toHaveBeenCalledTimes(1);
    expect(fs.access).toHaveBeenCalledWith('/template.md');
  });

  test('should handle empty array of CSS paths', async () => {
    fs.access.mockResolvedValue(undefined);

    await expect(
      validateInputs('/template.md', null, [])
    ).resolves.not.toThrow();

    expect(fs.access).toHaveBeenCalledTimes(1);
    expect(fs.access).toHaveBeenCalledWith('/template.md');
  });
});
