# Scripts Documentation <!-- omit in toc -->

This directory contains utility scripts for managing the project lifecycle. Each script is designed to handle specific tasks in the development, testing, and deployment process.

- [Available Scripts](#available-scripts)
  - [`clean.js`](#cleanjs)
  - [`release.js`](#releasejs)
  - [`setup.js`](#setupjs)
  - [`update-docs.js`](#update-docsjs)
  - [`update-versions.js`](#update-versionsjs)
- [Common Features](#common-features)
- [Error Handling](#error-handling)
- [Environment Configuration](#environment-configuration)
- [Development](#development)

---

## Available Scripts

### `clean.js`

Cleans output directories and temporary files.

- Removes contents from the output directory specified in environment configuration
- Handles cleanup of temporary files and build artifacts
- Provides feedback on cleanup operations
- Usage: `npm run clean`

---

### `release.js`

Automates the release process.

- Validates repository state:
  - Ensures you're on main branch
  - Checks for uncommitted changes
  - Verifies local is up to date with remote
  - Validates required files exist
- Updates version numbers
- Runs tests
- Updates changelog automatically
- Creates version commit and tag
- Pushes changes to GitHub

Usage:

- Dry run (no changes): `npm run release -- --dry-run`
- Create major version: `npm run release -- major`
- Create minor version: `npm run release -- minor`
- Create patch version: `npm run release -- patch`
- Test major release: `npm run release -- major --dry-run`

Note: Actual publishing to npm and GitHub Release creation is handled by GitHub Actions workflow.

---

### `setup.js`

Sets up the project environment and structure.

- Creates required directories
- Initializes environment configuration
- Sets up Git hooks
- Generates documentation
- Copies example files
- Verifies setup integrity
- Options:
  - `--dry-run`: Show what would be done without making changes
  - `--verbose`: Show detailed output
- Usage:
  - Basic setup: `npm run setup`
  - Preview changes: `npm run setup --dry-run`
  - Detailed output: `npm run setup --verbose`
  - Combined options: `npm run setup --dry-run --verbose`

---

### `update-docs.js`

Updates JSDoc documentation across the project.

- Automatically updates file headers and documentation
- Ensures consistent documentation format
- Adds missing documentation sections
- Standardizes type annotations
- Validates JSDoc syntax
- Features:
  - Updates file headers with required sections
  - Converts type annotations to project standards
  - Adds missing documentation templates
  - Processes all JavaScript files in src/
  - Parallel file processing for performance
- Usage: `npm run docs:update`

Options:
- No flags required
- Processes all .js files in src/ directory
- Provides progress feedback
- Reports errors without stopping

Example output:
```bash
$ npm run docs:update

Processing src/cli/prompts.js
Updated src/cli/prompts.js
Processing src/config/paths.js
Updated src/config/paths.js
...
Documentation update complete
```

---

### `update-versions.js`

> **Note**: This script is automatically executed by `release.js` when creating a new release. You don't need to run it independently unless you specifically want to update versions without creating a release.

Updates version information across the project.

- Fetches latest versions of dependencies
- Updates version configuration file
- Updates package.json dependencies
- Verifies and logs changes
- Usage: `npm run version:update`

## Common Features

All scripts include:

- Error handling with descriptive messages
- Logging with success/error indicators
- Environment configuration support
- Dry-run capability where applicable

## Error Handling

Scripts will:

- Exit with status code 1 on error
- Provide detailed error messages
- Log operation results
- Clean up temporary files on failure

Example error messages:

- ✗ Failed to clean directory: Permission denied
- ✗ Setup failed: Git hooks not configured correctly
- ✗ Version update failed: Unable to fetch latest versions
- ✗ Repository validation failed: Not on main branch
- ✗ Release failed: Local main is not up to date with origin/main

## Environment Configuration

Scripts respect:

- `.env` configuration
- Project-specific paths
- Node.js environment settings

Example configuration values:

- DIR_OUTPUT=output_files
- DIR_TEMPLATES=templates/markdown
- DIR_CSV=data-csv
- LOG_ENABLED=true
- LOG_LEVEL=debug

## Development

When modifying these scripts:

- Maintain consistent error handling
- Update documentation comments
- Follow the established logging format
- Test with --dry-run when available

Standard logging format:

- info: (...args) => console.log(...args)
- success: (msg) => console.log(`✓ ${msg}`)
- error: (msg) => console.error(`✗ ${msg}`)
- verbose: (...args) => isVerbose && console.log('[verbose]', ...args)
- warning: (msg) => console.warn(`⚠ ${msg}`)
