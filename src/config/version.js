/**
 * @fileoverview Version configuration
 *
 * Centralizes version information and compatibility checks.
 * This file is auto-generated during the build process.
 * Last updated: 2025-02-06T14:10:35.759Z
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
      recommended: '${versions.marked}',
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
};