#!/usr/bin/env node

/**
 * @file Version update script
 *
 * Updates version information across the project.
 * This script should be run before publishing a new version.
 *
 * Functions:
 * - getLatestVersions: Fetches latest versions of dependencies
 * - updateVersionConfig: Updates version configuration file
 * - updatePackageJson: Updates package.json with latest versions
 * - main: Orchestrates the version update process
 *
 * Flow:
 * 1. Fetch latest versions from npm and Node.js API
 * 2. Update version configuration file
 * 3. Update package.json dependencies
 * 4. Verify and log changes
 *
 * Error Handling:
 * - API request failures are caught and logged
 * - File write errors trigger descriptive messages
 * - Process exits with appropriate status code
 *
 * @module scripts/update-versions
 * @requires fs/promises
 * @requires path
 * @requires child_process
 */

const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');

// Helper for logging
const log = {
  // eslint-disable-next-line no-console
  info: (...args) => console.log(...args),
  // eslint-disable-next-line no-console
  success: (msg) => console.log(`✓ ${msg}`),
  // eslint-disable-next-line no-console
  error: (msg) => console.error(`✗ ${msg}`),
};

/**
 * Fetches latest versions of dependencies from npm and Node.js API
 *
 * @returns {Promise<{[key: string]: string}>} Latest versions of dependencies
 * @throws {Error} When version fetch fails
 */
async function getLatestVersions() {
  try {
    // Get latest versions from npm
    const deps = {
      puppeteer: execSync('npm view puppeteer version').toString().trim(),
      'markdown-it': execSync('npm view markdown-it version').toString().trim(),
    };

    // Get latest LTS Node.js version
    const nodeVersions = JSON.parse(
      execSync('curl -s https://nodejs.org/dist/index.json').toString()
    );
    const latestLTS = nodeVersions
      .find((v) => v.lts)
      ?.version?.replace('v', '');

    return {
      node: latestLTS || '16.0.0', // fallback if API fails
      ...deps,
    };
  } catch (error) {
    log.error('Failed to fetch latest versions:', error);
    process.exit(1);
  }
}

/**
 * Updates version configuration file with latest versions
 *
 * @param {{[key: string]: string}} versions - Latest dependency versions
 * @param {string} versions.node - Latest Node.js version
 * @param {string} versions.puppeteer - Latest Puppeteer version
 * @param {string} versions.markdown-it - Latest markdown-it version
 * @returns {Promise<void>}
 * @throws {Error} When file update fails
 */
async function updateVersionConfig(versions) {
  const configPath = path.join(__dirname, '../src/config/version.js');
  try {
    const content = `/**
 * @file Version configuration
 *
 * Centralizes version information and compatibility checks.
 * This file is auto-generated during the build process.
 * Last updated: ${new Date().toISOString()}
 *
 * Constants:
 * - VERSION: Main version configuration object
 *   - current: Current package version
 *   - requirements: Minimum version requirements
 *   - compatibility: Version compatibility matrix
 *
 * Flow:
 * 1. Load package.json
 * 2. Create version configuration object
 * 3. Freeze object to prevent modifications
 *
 * Error Handling:
 * - Throws if package.json cannot be read
 * - Object freezing prevents runtime modifications
 * - Version requirements enforce compatibility checks
 *
 * @module config/version
 * @requires fs
 * @requires path
 */
/* eslint-disable */

const fs = require('fs');
const path = require('path');

// Read package.json
const pkg = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../../package.json'), 'utf8')
);

// Version information
const VERSION = {
  // Application version from package.json
  current: pkg.version,

  // Minimum supported versions
  requirements: {
    node: pkg.engines.node.replace('>=', ''),
    npm: '6.0.0',
  },

  // Compatibility matrix
  compatibility: {
    node: {
      minimum: '14.0.0',
      recommended: '${versions.node}',
      tested: ['14.0.0', '16.0.0', '18.0.0', '20.0.0'],
    },
    puppeteer: {
      minimum: '22.0.0',
      recommended: '${versions.puppeteer}',
    },
    markdown: {
      minimum: '12.0.0',
      recommended: '${versions['markdown-it']}',
    },
  },
};

// Freeze to prevent modifications
Object.freeze(VERSION);
Object.freeze(VERSION.requirements);
Object.freeze(VERSION.compatibility);
Object.freeze(VERSION.compatibility.node);
Object.freeze(VERSION.compatibility.puppeteer);
Object.freeze(VERSION.compatibility.markdown);

module.exports = {
  VERSION,
};`;

    await fs.writeFile(configPath, content);
    log.success('Updated version configuration');
  } catch (error) {
    log.error('Failed to update version configuration:', error);
    process.exit(1);
  }
}

/**
 * Updates package.json with latest dependency versions
 *
 * @param {{[key: string]: string}} versions - Latest dependency versions
 * @param {string} versions.node - Latest Node.js version
 * @param {string} versions.puppeteer - Latest Puppeteer version
 * @param {string} versions.markdown-it - Latest markdown-it version
 * @returns {Promise<void>}
 * @throws {Error} When package.json update fails
 */
async function updatePackageJson(versions) {
  const pkgPath = path.join(__dirname, '../package.json');
  try {
    const pkg = JSON.parse(await fs.readFile(pkgPath, 'utf8'));

    // Update dependencies
    pkg.dependencies.puppeteer = `^${versions.puppeteer}`;
    pkg.dependencies['markdown-it'] = `^${versions['markdown-it']}`;

    // Update engines
    pkg.engines.node = `>=${pkg.engines.node.replace('>=', '')}`;

    await fs.writeFile(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
    log.success('Updated package.json');
  } catch (error) {
    log.error('Failed to update package.json:', error);
    process.exit(1);
  }
}

/**
 * Main function that orchestrates the version update process
 *
 * @returns {Promise<void>}
 */
async function main() {
  log.info('Fetching latest versions...');
  const versions = await getLatestVersions();

  log.info('Latest versions:', versions);

  await updateVersionConfig(versions);
  await updatePackageJson(versions);

  log.info('\nNext steps:');
  log.info('1. Review the changes');
  log.info('2. Run tests: npm test');
  log.info('3. Update version: npm version [major|minor|patch]');
  log.info('4. Publish: npm publish');
}

if (require.main === module) {
  main().catch((error) => {
    log.error('Script failed:', error);
    process.exit(1);
  });
}

module.exports = {
  getLatestVersions,
  updateVersionConfig,
  updatePackageJson,
};
