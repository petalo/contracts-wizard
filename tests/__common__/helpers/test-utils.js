/**
 * @fileoverview Common utilities for testing
 */

const path = require('path');
const resourceManager = require('./resource-manager');

/**
 * Cleans command output by removing ANSI colors, escape characters and timestamps
 * @param {string} output - Raw command output
 * @returns {string} Cleaned output string
 */
function cleanOutput(output) {
  if (!output) return '';

  // Convert to string if not already
  const stringOutput = String(output);

  return (
    stringOutput
      // Remove timestamps and other variable data
      .replace(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/g, '')
      .replace(/\[\d{2}\/\d{2}\/\d{4}, \d{2}:\d{2}:\d{2}\]/g, '')
      // Remove ANSI color codes
      // eslint-disable-next-line no-control-regex
      .replace(/\u001b\[[0-9;]*m/g, '')
      // Remove control characters while preserving newlines
      // eslint-disable-next-line no-control-regex
      .replace(/[\u0000-\u0009\u000B-\u001F\u007F-\u009F]/g, '')
      // Preserve log level indicators and error messages
      .replace(/\[(?!ERROR|DEBUG|INFO|WARN])/g, '')
      .replace(/(?<![ERROR|DEBUG|INFO|WARN])\]/g, '')
      // Clean up extra whitespace while preserving line structure
      .replace(/[ \t]+/g, ' ')
      .replace(/\n\s+/g, '\n')
      .trim()
  );
}

const getFixturePath = (type, filename) => {
  return path.join(__dirname, '..', 'fixtures', type, filename);
};

const loadFixture = async (type, filename) => {
  const fs = require('fs').promises;
  const filepath = getFixturePath(type, filename);
  return await fs.readFile(filepath, 'utf8');
};

async function withTimeout(promise, ms = 5000) {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(
        () => reject(new Error(`Operation timed out after ${ms}ms`)),
        ms
      ).unref();
    }),
  ]);
}

module.exports = {
  cleanOutput,
  getFixturePath,
  loadFixture,
  withTimeout,
  resourceManager,
};
