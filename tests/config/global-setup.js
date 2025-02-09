/**
 * @file Global test setup
 *
 * This file is executed once before all test files.
 * It sets up the global test environment.
 */

const fs = require('fs/promises');
const path = require('path');

// Create necessary test directories
async function setup() {
  const dirs = [
    'tests/output',
    'tests/logs',
    'tests/__common__/fixtures/templates',
    'tests/__common__/fixtures/css',
    'tests/__common__/fixtures/csv',
    'tests/reports',
  ];

  for (const dir of dirs) {
    await fs.mkdir(dir, { recursive: true });
  }
}

module.exports = setup;
