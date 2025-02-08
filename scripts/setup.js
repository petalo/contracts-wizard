#!/usr/bin/env node
/* eslint-disable no-console */

/**
 * @fileoverview Project setup script
 *
 * Creates necessary directories, initializes configurations,
 * and validates the project structure. This script is designed to:
 * 1. Check system requirements (Node.js, Git, npm versions)
 * 2. Create required directories if they don't exist
 * 3. Set up environment configuration
 * 4. Configure Git hooks
 * 5. Generate project documentation
 * 6. Verify the setup is correct
 *
 * Functions:
 * - createDirectories: Creates required project directories
 * - setupEnvironment: Sets up environment configuration
 * - setupGitHooks: Configures git hooks
 * - generateDocs: Generates project documentation
 * - checkSystemRequirements: Validates system dependencies
 * - cleanupOldFiles: Removes old build artifacts
 * - verifyWritePermissions: Checks directory permissions
 * - copyExampleFiles: Copies example files to working directories
 * - verifySetup: Validates the complete setup
 * - installDependencies: Installs project dependencies
 * - checkMissingDependencies: Checks for missing dependencies
 *
 * Flow:
 * 1. Parse command line arguments
 * 2. Check system requirements
 * 3. Create directories and setup environment
 * 4. Configure git hooks
 * 5. Copy example files
 * 6. Generate documentation
 * 7. Verify setup
 *
 * Error Handling:
 * - Directory creation errors are caught
 * - Permission issues are detected
 * - System requirement checks fail gracefully
 * - Setup verification provides detailed error messages
 *
 * Usage:
 * ```bash
 * # Normal setup
 * npm run setup
 *
 * # Dry run (no changes)
 * npm run setup -- --dry-run
 *
 * # Verbose output
 * npm run setup -- --verbose
 * ```
 *
 * @module @/scripts/setup
 * @requires fs/promises
 * @requires fs
 * @requires path
 * @requires dotenv
 * @requires child_process
 */

const fs = require('fs/promises');
const fsSync = require('fs');
const path = require('path');
const { execSync } = require('child_process');
require('dotenv').config();

// Parse command line arguments
const isDryRun =
  process.argv.includes('--dry-run') || process.argv.includes('-d');
const isVerbose =
  process.argv.includes('--verbose') || process.argv.includes('-v');

// Simulation functions for dry run
const simulate = {
  mkdir: async (path) => {
    if (isDryRun) {
      return Promise.resolve();
    }
    return fs.mkdir(path, { recursive: true });
  },
  writeFile: async (path, content) => {
    if (isDryRun) {
      return Promise.resolve();
    }
    return fs.writeFile(path, content);
  },
  execSync: (command, options = {}) => {
    if (isDryRun) {
      return '';
    }
    return execSync(command, options);
  },
  unlink: async (path) => {
    if (isDryRun) {
      return Promise.resolve();
    }
    return fs.unlink(path);
  },
};

// Helper for logging
const log = {
  info: (...args) => console.log(...args),
  success: (msg) => console.log(`✓ ${msg}`),
  warning: (msg) => console.log(`○ ${msg}`),
  error: (msg) => console.error(`✗ ${msg}`),
  verbose: (...args) => isVerbose && console.log('[verbose]', ...args),
  dryRun: (...args) => isDryRun && console.log('[dry-run]', ...args),
  debug: (...args) => isVerbose && console.log('[debug]', ...args),
};

// Get directories from environment or use defaults
const REQUIRED_DIRS = [
  process.env.DIR_OUTPUT || './output_files',
  process.env.DIR_TEMPLATES || './templates/markdown',
  process.env.DIR_CSS || './templates/css',
  process.env.DIR_IMAGES || './templates/images',
  process.env.DIR_CSV || './data-csv',
  './logs',
  './.githooks',
].map((dir) => dir.replace(/^\.\//, '')); // Remove leading ./ for consistency

const ENV_TEMPLATE = `# Environment Configuration
NODE_ENV=development # Sets the application environment (development/production/test)
DEBUG=false          # Debug mode configuration ['true', 'false', 'trace', 'debug', 'info', 'warn', 'error']

# Logging Configuration
LOG_ENABLED=true                        # Enable or disable application logging
LOG_LEVEL=info                          # Sets logging verbosity level ['error', 'warn', 'info', 'debug', 'trace']
LOG_FILE=logging.log                    # Main log file name
LATEST_LOG_PATH=logs/logging-latest.log # Path to store the most recent log file
FULL_LOG_PATH=logs/history-%DATE%.log   # Path pattern for historical log files with date
LOG_MAX_SIZE=10MB                       # Maximum size of each log file before rotation
LOG_MAX_FILES=7                         # Number of log files to keep before deletion

# Locale Settings
TIMEZONE=UTC   # Application timezone setting
LANGUAGE=en-US # Default language/locale for the application

# Directory Configuration
DIR_OUTPUT=output_files          # Directory for generated output files
DIR_TEMPLATES=templates/markdown # Directory for markdown template files
DIR_CSS=templates/css            # Directory for CSS style files
DIR_CSV=data-csv                 # Directory for CSV data files
DIR_IMAGES=templates/images      # Directory for image assets
DIR_REPORTS=reports              # Directory for generated reports
DIR_COVERAGE=coverage            # Directory for test coverage reports

# Test Directories
DIR_TEST_LOGS=tests-logs     # Directory for test log files
DIR_TEST_OUTPUT=tests-output # Directory for test output files

# Performance Settings
CACHE_ENABLED=true         # Enable/disable application caching
CACHE_TTL=1800             # Cache time-to-live in seconds
MAX_CONCURRENT_PROCESSES=2 # Maximum number of concurrent processes

# Security Settings
RATE_LIMIT_WINDOW=15       # Rate limiting window in minutes
RATE_LIMIT_MAX_REQUESTS=50 # Maximum requests per window
SESSION_TIMEOUT=15         # Session timeout in minutes`;

async function createDirectories() {
  log.info('Creating required directories...');
  for (const dir of REQUIRED_DIRS) {
    const fullPath = path.join(process.cwd(), dir);
    try {
      if (isDryRun) {
        log.dryRun(`Would create directory: ${dir}`);
        continue;
      }
      await simulate.mkdir(fullPath);
      log.success(`Created ${dir}`);
    } catch (error) {
      if (error.code !== 'EEXIST') {
        log.error(`Error creating ${dir}: ${error.message}`);
      } else {
        log.warning(`Directory ${dir} already exists`);
      }
    }
  }
}

async function setupEnvironment() {
  log.info('\nSetting up environment...');
  const envPath = path.join(process.cwd(), '.env');
  try {
    const exists =
      !isDryRun &&
      (await fs
        .access(envPath)
        .then(() => true)
        .catch(() => false));
    if (!exists) {
      if (isDryRun) {
        log.dryRun('Would create .env file');
        log.verbose('With content:', ENV_TEMPLATE);
      } else {
        await simulate.writeFile(envPath, ENV_TEMPLATE);
        log.success('Created .env file');
      }
    } else {
      log.warning('.env file already exists');
    }
  } catch (error) {
    log.error(`Error creating .env file: ${error.message}`);
  }
}

async function setupGitHooks(options = {}) {
  log.info('\nSetting up Git hooks...');
  try {
    if (!options.dryRun) {
      // Configure git to use our custom hooks directory
      execSync('git config core.hooksPath .githooks');
      // Make hooks executable
      execSync('chmod +x .githooks/*');
    }
    log.success('Git hooks configured');
  } catch (error) {
    log.error('Failed to configure git hooks:', error);
    throw error;
  }
}

async function generateDocs() {
  log.info('\nGenerating documentation...');
  try {
    if (isDryRun) {
      log.dryRun('Would generate JSDoc documentation');
    } else {
      simulate.execSync('npm run jsdoc:full', { stdio: 'inherit' });
      log.success('Generated JSDoc documentation');
    }
  } catch (error) {
    log.error(`Error generating documentation: ${error.message}`);
  }
}

async function checkSystemRequirements() {
  log.info('Checking system requirements...');
  try {
    // Check Node.js version
    const nodeVersion = process.version;
    const requiredVersion = '14.0.0';
    if (nodeVersion.replace('v', '') < requiredVersion) {
      throw new Error(`Node.js ${requiredVersion} or higher is required`);
    }
    log.success(`Node.js version: ${nodeVersion}`);

    // Check Git installation
    const gitVersion = simulate.execSync('git --version', { encoding: 'utf8' });
    log.success(`Git version: ${gitVersion.trim()}`);

    // Check npm installation
    const npmVersion = simulate.execSync('npm --version', { encoding: 'utf8' });
    log.success(`npm version: ${npmVersion.trim()}`);
  } catch (error) {
    log.error(`System requirements check failed: ${error.message}`);
    process.exit(1);
  }
}

async function cleanupOldFiles() {
  log.info('\nCleaning up old files...');
  const pathsToClean = [
    'docs',
    'coverage',
    'logs/*.log',
    'output_files/*',
    '.eslintcache',
  ];

  for (const pattern of pathsToClean) {
    try {
      if (isDryRun) {
        log.dryRun(`Would clean: ${pattern}`);
      } else {
        simulate.execSync(`rimraf ${pattern}`, { stdio: 'ignore' });
        log.success(`Cleaned ${pattern}`);
      }
    } catch (error) {
      log.warning(`Nothing to clean in ${pattern}`);
    }
  }
}

async function verifyWritePermissions() {
  log.info('\nVerifying write permissions...');
  for (const dir of REQUIRED_DIRS) {
    try {
      // Ensure directory exists
      await simulate.mkdir(path.join(process.cwd(), dir), { recursive: true });

      const testFile = path.join(process.cwd(), dir, '.write-test');
      if (isDryRun) {
        log.dryRun(`Would verify write permissions for: ${dir}`);
        continue;
      }
      await simulate.writeFile(testFile, '');
      await simulate.unlink(testFile);
      log.success(`Write permission OK for ${dir}`);
    } catch (error) {
      log.error(`Write permission denied for ${dir}`);
      throw error;
    }
  }
}

async function copyExampleFiles() {
  log.info('\nCopying example files...');
  const examples = [
    // Markdown templates

    [
      'tests/__common__/fixtures/markdown/office_lease_EN.example.md',
      'templates/markdown/office_lease_EN.example.md',
    ],
    [
      'tests/__common__/fixtures/markdown/ticket.example.md',
      'templates/markdown/ticket.example.md',
    ],
    // CSS templates

    [
      'tests/__common__/fixtures/css/contract.example.css',
      'templates/css/contract.example.css',
    ],
    [
      'tests/__common__/fixtures/css/ticket.example.css',
      'templates/css/ticket.example.css',
    ],
    // CSV examples
    [
      'tests/__common__/fixtures/csv/office_lease_EN.example.csv',
      'data-csv/office_lease_EN.example.TechstartSolutions.csv',
    ],
    [
      'tests/__common__/fixtures/csv/office_lease_EN.example.some.empty.fields.csv',
      'data-csv/office_lease_EN.example.some.empty.fields.csv',
    ],
    [
      'tests/__common__/fixtures/csv/ticket.example.csv',
      'data-csv/ticket.example.csv',
    ],
    [
      'tests/__common__/fixtures/csv/ticket.example.some.empty.fields.csv',
      'data-csv/ticket.example.some.empty.fields.csv',
    ],
  ];

  for (const [src, dest] of examples) {
    try {
      if (isDryRun) {
        log.dryRun(`Would copy ${src} to ${dest}`);
        continue;
      }

      // Ensure destination directory exists
      const destDir = path.dirname(dest);
      await simulate.mkdir(path.join(process.cwd(), destDir), {
        recursive: true,
      });

      const srcPath = path.join(process.cwd(), src);
      const destPath = path.join(process.cwd(), dest);

      // Check if source exists before copying
      try {
        await fs.access(srcPath);
        await simulate.writeFile(destPath, await fs.readFile(srcPath));
        log.success(`Copied ${dest}`);
      } catch (error) {
        if (error.code === 'ENOENT') {
          log.warning(`Source file ${src} not found - skipping`);
        } else {
          throw error;
        }
      }
    } catch (error) {
      if (error.code !== 'EEXIST') {
        log.error(`Error copying ${src}: ${error.message}`);
      } else {
        log.warning(`File ${dest} already exists`);
      }
    }
  }
}

async function verifySetup() {
  log.info('\nVerifying setup...');
  try {
    if (isDryRun) {
      log.dryRun('Would verify:');
      log.dryRun('- Environment configuration');
      log.dryRun('- Required directories');
      log.dryRun('- Git hooks configuration');
      log.dryRun('- Documentation generation');
      log.dryRun('- Core project files');
      return;
    }

    // Verify environment
    require('dotenv').config();
    log.success('Environment loaded');

    // Verify directories
    for (const dir of REQUIRED_DIRS) {
      await fs.access(path.join(process.cwd(), dir));
    }
    log.success('Directories created');

    // Verify git hooks
    const hooksPath = simulate.execSync('git config core.hooksPath', {
      encoding: 'utf8',
    });
    if (hooksPath.trim() !== '.githooks') {
      throw new Error('Git hooks not configured correctly');
    }
    log.success('Git hooks configured');

    // Verify documentation
    try {
      await fs.access(path.join(process.cwd(), 'docs'));
      log.success('Documentation generated');
    } catch (error) {
      log.error('Documentation not found');
      throw error;
    }

    try {
      await fs.access(path.join(process.cwd(), 'package.json'));
      log.success('Package configuration loaded');
    } catch (error) {
      log.error('package.json not found');
      throw error;
    }

    // Verify basic project structure
    const requiredFiles = [
      '.env',
      '.markdownlint.jsonc',
      '.prettierrc',
      '.puppeteerrc.cjs',
      'babel.config.cjs',
      'eslint.config.js',
      'jest.config.cjs',
      'package.json',
      'src/config/index.js',
      'bin/contracts-wizard.js',
    ];

    for (const file of requiredFiles) {
      await fs.access(path.join(process.cwd(), file));
    }
    log.success('Core project files verified');
  } catch (error) {
    log.error(`Setup verification failed: ${error.message}`);
    throw error;
  }
}

/**
 * Verify that all required dependencies are installed
 *
 * @returns {string[]} List of missing dependencies
 */
function checkMissingDependencies() {
  // Get dependencies from package.json
  const packageJson = require(path.join(process.cwd(), 'package.json'));
  const prodDeps = Object.keys(packageJson.dependencies || {});
  const devDeps = Object.keys(packageJson.devDependencies || {});

  // Critical dependencies that must be installed
  const criticalDeps = [
    // Production dependencies
    'handlebars',
    'puppeteer',
    'winston',
    'commander',
    'csv-parse',
    'inquirer',
    'marked',

    // Development dependencies
    'eslint',
    'jest',
    'jsdoc',
    'cross-env',
    'prettier',
  ];

  const missingDeps = [];
  const nodeModulesPath = path.join(process.cwd(), 'node_modules');

  for (const dep of criticalDeps) {
    const depPath = path.join(nodeModulesPath, dep);
    try {
      // Check if the dependency is in package.json first
      if (!prodDeps.includes(dep) && !devDeps.includes(dep)) {
        missingDeps.push(dep);
        continue;
      }

      // Then verify the installation
      try {
        // Try to require the package
        require(dep);
      } catch (requireError) {
        try {
          // If require fails, check if the directory exists
          const stat = fsSync.statSync(depPath);
          if (!stat.isDirectory()) {
            missingDeps.push(dep);
          }
        } catch (statError) {
          missingDeps.push(dep);
        }
      }
    } catch (error) {
      log.debug(`Error checking dependency ${dep}:`, error.message);
      missingDeps.push(dep);
    }
  }

  // Log the state for debugging
  if (missingDeps.length > 0) {
    log.debug('Dependencies check:', {
      inPackageJson: {
        prod: prodDeps,
        dev: devDeps,
      },
      missing: missingDeps,
      nodeModulesExists: fsSync.existsSync(nodeModulesPath),
    });
  }

  return missingDeps;
}

/**
 * Install or update project dependencies
 *
 * @returns {Promise<void>}
 */
async function installDependencies() {
  try {
    // Skip if running from postinstall to avoid infinite loop
    if (process.env.npm_lifecycle_event === 'postinstall') {
      log.info('Skipping dependency installation during postinstall');
      return;
    }

    log.info('Installing dependencies...');

    // Verify npm is available
    simulate.execSync('npm --version', { stdio: 'ignore' });

    // Clean npm cache if it exists
    if (!isDryRun) {
      log.info('Cleaning npm cache...');
      simulate.execSync('npm cache clean --force', { stdio: 'ignore' });
    }

    // Install dependencies
    const installCmd = 'npm install --no-package-lock';
    if (isDryRun) {
      log.info(`Would run: ${installCmd}`);
    } else {
      log.info('Installing project dependencies...');

      // First install the main dependencies
      simulate.execSync(installCmd, {
        stdio: 'inherit',
        env: {
          ...process.env,
          SKIP_POSTINSTALL: 'true',
        },
      });

      // Then install any missing dependencies specifically
      const missingDeps = checkMissingDependencies();
      if (missingDeps.length > 0) {
        log.info(`Installing missing dependencies: ${missingDeps.join(', ')}`);

        // Separar dependencias de producción y desarrollo
        const packageJson = require(path.join(process.cwd(), 'package.json'));
        const prodDeps = missingDeps.filter((dep) =>
          Object.keys(packageJson.dependencies || {}).includes(dep)
        );
        const devDeps = missingDeps.filter((dep) =>
          Object.keys(packageJson.devDependencies || {}).includes(dep)
        );

        // Instalar dependencias de producción
        if (prodDeps.length > 0) {
          simulate.execSync(`npm install ${prodDeps.join(' ')} --save`, {
            stdio: 'inherit',
            env: {
              ...process.env,
              SKIP_POSTINSTALL: 'true',
            },
          });
        }

        // Instalar dependencias de desarrollo
        if (devDeps.length > 0) {
          simulate.execSync(`npm install ${devDeps.join(' ')} --save-dev`, {
            stdio: 'inherit',
            env: {
              ...process.env,
              SKIP_POSTINSTALL: 'true',
            },
          });
        }

        // Final verification - more tolerant
        const finalCheck = checkMissingDependencies();
        if (finalCheck.length > 0) {
          log.warning(
            'Some dependencies might not be fully installed yet, but continuing anyway:',
            finalCheck.join(', ')
          );
        }
      }
    }

    log.success('Dependencies setup completed');
  } catch (error) {
    log.error('Failed to install dependencies:', error.message);
    throw error;
  }
}

async function main() {
  const options = {
    dryRun: process.argv.includes('--dry-run'),
    verbose: process.argv.includes('--verbose'),
  };

  log.info(
    `🚀 Starting project setup${options.dryRun ? ' (DRY RUN)' : ''}...\n`
  );
  if (options.dryRun) {
    log.info('No changes will be made to your system\n');
  }

  try {
    await checkSystemRequirements();
    await cleanupOldFiles();
    await verifyWritePermissions();
    await createDirectories();
    await setupEnvironment();
    await installDependencies();
    await setupGitHooks(options);
    await copyExampleFiles();
    await generateDocs();
    await verifySetup();

    if (options.dryRun) {
      log.info(
        '\n✨ Dry run completed successfully! This is what would happen in a real run.'
      );
    } else {
      log.info('\n✨ Setup complete! Next steps:');
      log.info('1. Review and modify the .env file if needed');
      log.info('2. Check the generated documentation in docs/');
      log.info('3. Review the project structure');
      log.info('\nFor development:');
      log.info('- Run npm run test:unit for unit tests');
      log.info('- Run npm run test:integration for integration tests');
      log.info('- Run npm run test:e2e for end-to-end tests');
      log.info('- Run npm run lint to check code style');
    }
  } catch (error) {
    log.error(
      `\n❌ ${options.dryRun ? 'Dry run' : 'Setup'} failed: ${error.message}`
    );
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch((error) => {
    log.error('Setup failed:', error);
    process.exit(1);
  });
}

module.exports = {
  createDirectories,
  setupEnvironment,
  setupGitHooks,
  generateDocs,
  checkSystemRequirements,
  cleanupOldFiles,
  verifyWritePermissions,
  verifySetup,
  installDependencies,
  checkMissingDependencies,
};
