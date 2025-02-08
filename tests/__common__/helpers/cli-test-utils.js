const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const { logger } = require('@/utils/common/logger');

const FIXTURES_DIR = path.join(__dirname, '..', 'fixtures');
const INPUT_DIR = path.join(FIXTURES_DIR, 'input');
const OUTPUT_DIR = path.join(FIXTURES_DIR, 'output');

async function createTestFiles({
  templateContent = '',
  cssContent = '',
  templatePath,
  dataPath,
  cssPath,
}) {
  // Ensure directories exist
  try {
    await fs.mkdir(FIXTURES_DIR, {
      recursive: true,
    });
    await fs.mkdir(INPUT_DIR, {
      recursive: true,
    });
    await fs.mkdir(OUTPUT_DIR, {
      recursive: true,
    });

    // Generate file paths if not provided
    templatePath = templatePath || path.join(INPUT_DIR, 'example-contract.md');
    dataPath = dataPath || path.join(INPUT_DIR, 'example-contract.yml');
    cssPath = cssPath || path.join(INPUT_DIR, 'contract.css');

    // Ensure content is string
    templateContent = String(templateContent || '');
    cssContent = String(cssContent || '');

    // Write files sequentially to avoid race conditions
    await fs.writeFile(templatePath, templateContent);
    await fs.writeFile(cssPath, cssContent);

    return {
      templatePath,
      dataPath,
      cssPath,
    };
  } catch (error) {
    logger.error('Error creating test files:', {
      error,
      templatePath,
      dataPath,
      cssPath,
    });
    throw error;
  }
}

async function executeCliCommand({ template, data, css }) {
  const CLI_PATH = path.join(process.cwd(), 'src', 'index.js');
  const command = `node ${CLI_PATH} -t "${template}" -d "${data}" -c "${css}"`;

  return new Promise((resolve, reject) => {
    const child = exec(command, {
      timeout: 30000,
      maxBuffer: 1024 * 1024 * 10,
      env: {
        ...process.env,
        NODE_ENV: 'test',
        DEBUG: 'true',
      },
    });

    let stdout = '';
    let stderr = '';

    child.stdout?.on('data', (data) => {
      stdout += data;
      // Only write to stdout if DEBUG_TESTS is enabled
      if (process.env.DEBUG_TESTS) {
        process.stdout.write(data);
      }
    });

    child.stderr?.on('data', (data) => {
      stderr += data;
      // Only write to stderr if DEBUG_TESTS is enabled
      if (process.env.DEBUG_TESTS) {
        process.stderr.write(data);
      }
    });

    child.on('error', (err) => {
      child.removeAllListeners();
      const error = new Error(stderr || err.message);
      error.stdout = stdout;
      error.stderr = stderr;
      reject(error);
    });

    child.on('close', (code) => {
      child.removeAllListeners();

      // Check for error conditions
      const hasError =
        code !== 0 ||
        stderr.toLowerCase().includes('error') ||
        stdout.toLowerCase().includes('error');

      if (!hasError) {
        resolve({
          stdout,
          stderr,
          code,
        });
      } else {
        const error = new Error(stderr || stdout);
        error.code = code;
        error.stdout = stdout;
        error.stderr = stderr;
        reject(error);
      }
    });
  });
}

async function validatePdfOutput(pdfPath) {
  const stats = await fs.stat(pdfPath);
  return stats.isFile() && stats.size >= 100;
}

module.exports = {
  createTestFiles,
  executeCliCommand,
  validatePdfOutput,
};
