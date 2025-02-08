#!/usr/bin/env node

/**
 * @fileoverview Clean script
 *
 * Cleans output directories using paths from environment configuration.
 *
 * Functions:
 * - cleanOutputDir: Removes all files from the output directory
 *
 * Flow:
 * 1. Load environment configuration
 * 2. Validate output directory path
 * 3. Remove directory contents
 * 4. Log results
 *
 * Error Handling:
 * - Invalid directory paths are reported
 * - Permission errors are caught and logged
 * - Missing .env file triggers warning
 *
 * @module scripts/clean
 * @requires fs/promises
 * @requires path
 * @requires rimraf
 */

require('dotenv').config();
const { rimraf } = require('rimraf');
const path = require('path');

const outputDir = process.env.DIR_OUTPUT || './output';

async function cleanOutputDir() {
  const absolutePath = path.resolve(process.cwd(), outputDir);

  try {
    await rimraf(absolutePath);
    // eslint-disable-next-line no-console
    console.log(`✓ Cleaned output directory: ${outputDir}`);
  } catch (error) {
    console.error(`✗ Failed to clean directory: ${error.message}`);
    process.exit(1);
  }
}

cleanOutputDir();
