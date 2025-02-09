/**
 * @file Unified test environment configuration
 *
 * Sets up the testing environment with necessary mocks, configurations,
 * directory management, and global test utilities.
 *
 * Functions:
 * - createMockOptions: Creates mock CLI options
 * - createMockContext: Creates mock processing context
 * - expectAsyncError: Helper for testing async errors
 * - cleanDirectory: Helper to clean test directories
 *
 * Flow:
 * 1. Load environment variables
 * 2. Configure paths and directories
 * 3. Set up process.exit mock
 * 4. Initialize global test utilities
 * 5. Configure Jest timeouts
 * 6. Set up cleanup hooks
 *
 * @module config/test-setup
 */

const fs = require('fs');
const fsPromises = require('fs').promises;
const path = require('path');
const dotenv = require('dotenv');

// Configure module aliases before requiring any other modules
require('../../src/config/aliases').configureAliases();

const { logger } = require('../../src/utils/common/logger');
const { AppError } = require('../../src/utils/common/errors');
const { PATHS } = require('../../src/config/paths');

// Ensure we're in test environment
if (process.env.NODE_ENV !== 'test') {
  process.env.NODE_ENV = 'test';
  logger.warn('Forcing NODE_ENV to "test" in test environment');
}

// Verify .env.test exists
const envTestPath = path.resolve(process.cwd(), '.env.test');
if (!fs.existsSync(envTestPath)) {
  throw new Error('.env.test file is required for running tests');
}

// Load test environment variables with strict configuration
const result = dotenv.config({
  path: envTestPath,
  override: true,
  debug: process.env.DEBUG_TESTS === 'true',
});

if (result.error) {
  throw new Error(`Error loading .env.test: ${result.error.message}`);
}

// Verify critical test environment variables
const requiredTestEnvVars = [
  'NODE_ENV',
  'DEBUG_TESTS',
  'DIR_OUTPUT',
  'LATEST_LOG_PATH',
];

const missingVars = requiredTestEnvVars.filter(
  (varName) => !process.env[varName]
);
if (missingVars.length > 0) {
  throw new Error(
    `Missing required test environment variables: ${missingVars.join(', ')}`
  );
}

// Configure paths using the centralized PATHS configuration
const FIXTURES_DIR = path.join(__dirname, '../__common__/fixtures');
const INPUT_DIR = PATHS.templates;
const OUTPUT_DIR = path.resolve(
  process.cwd(),
  process.env.DIR_OUTPUT || 'tests/output'
);
const LOGS_DIR = path.resolve(
  process.cwd(),
  process.env.LATEST_LOG_PATH
    ? path.dirname(process.env.LATEST_LOG_PATH)
    : 'tests/logs'
);

// Configure test timeouts
const TEST_TIMEOUTS = {
  UNIT: 5000, // 5 seconds
  INTEGRATION: 10000, // 10 seconds
  E2E: 30000, // 30 seconds
};

// Silence logger during tests unless explicitly enabled
logger.silent = !process.env.DEBUG_TESTS;

// Mock process.exit
const originalProcessExit = process.exit;
process.exit = (code) => {
  if (process.env.ALLOW_PROCESS_EXIT) {
    originalProcessExit(code);
  }
  throw new Error(`Process.exit(${code}) was called`);
};

// Global mocks
jest.mock('../../src/utils/common/logger', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    silent: false,
  },
}));

// Directory management
/**
 * Configures test environment and global mocks
 *
 * Sets up the test environment with necessary mocks and
 * configurations before running the test suite.
 */
async function cleanDirectory(dir, preserveFixtures = false) {
  if (process.env.NODE_ENV !== 'test') return;

  // Define permanent and temporary test directories
  const PERMANENT_DIRS = [
    'tests/__common__/fixtures', // Permanent fixtures directory
  ].map((testDir) => path.resolve(process.cwd(), testDir));

  const TEMPORARY_DIRS = [
    'tests/output',
    'tests/logs',
    'tests/reports',
    'tests/coverage',
    'tests/temp',
  ].map((testDir) => path.resolve(process.cwd(), testDir));

  const absoluteDir = path.resolve(process.cwd(), dir);

  // Never clean permanent directories
  if (
    PERMANENT_DIRS.some((permanentDir) => absoluteDir.startsWith(permanentDir))
  ) {
    logger.info('Skipping cleanup of permanent directory:', {
      dir: absoluteDir,
    });
    return;
  }

  // Only clean allowed temporary directories
  if (!TEMPORARY_DIRS.some((tempDir) => absoluteDir.startsWith(tempDir))) {
    logger.warn('Attempted to clean non-temporary directory:', {
      dir: absoluteDir,
    });
    return;
  }

  try {
    await fsPromises.rm(dir, {
      recursive: true,
      force: true,
    });
    await fsPromises.mkdir(dir, { recursive: true });
  } catch (error) {
    // Ignore directory cleanup errors
    logger.warn('Error cleaning directory:', {
      dir,
      error: error.message,
    });
  }
}

// Ensure report directories exist
const reportDirs = [
  './reports',
  './reports/junit',
  './tests/temp',
  FIXTURES_DIR,
  INPUT_DIR,
  OUTPUT_DIR,
  LOGS_DIR,
];

reportDirs.forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Setup global test utilities
global.testUtils = {
  // Helper to create mock CLI options
  createMockOptions: (options = {}) => ({
    template: 'test-template.md',
    data: 'test-data.csv',
    css: 'test.css',
    ...options,
  }),

  // Helper to create mock context
  createMockContext: (context = {}) => ({
    templatePath: path.join(
      __dirname,
      '../__common__/fixtures/markdown/perfect/test-template.md'
    ),
    dataPath: path.join(
      __dirname,
      '../__common__/fixtures/csv/perfect/test-data.csv'
    ),
    cssPath: path.join(
      __dirname,
      '../__common__/fixtures/css/perfect/test.css'
    ),
    inputMethod: 'csv',
    ...context,
  }),

  // Helper for async error testing
  expectAsyncError: async (promise, errorType, errorCode) => {
    try {
      await promise;
      throw new Error('Expected error was not thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(errorType);
      if (errorCode && error instanceof AppError) {
        expect(error.error_code).toBe(errorCode);
      }
    }
  },

  // Helper to create test file paths
  getFixturePath: (type, category, filename) =>
    path.join(__dirname, '../__common__/fixtures', type, category, filename),

  // Helper to mock display functions
  createMockDisplay: () => ({
    header: jest.fn(),
    blank: jest.fn(),
    status: {
      success: jest.fn(),
      error: jest.fn(),
      warning: jest.fn(),
      info: jest.fn(),
    },
    path: jest.fn((p) => p),
  }),

  // Helper to create test data
  createTestData: (data = {}) => ({
    name: 'Test Name',
    email: 'test@example.com',
    phone: '555-0123',
    company: 'Test Company',
    position: 'Test Position',
    department: 'Test Department',
    notes: 'Test Notes',
    date: '2025-01-12',
    reference: 'TEST-001',
    ...data,
  }),

  // Helper to clean directories
  cleanDirectory,
};

// Configure dynamic timeouts based on test type
beforeEach(() => {
  const testPath = expect.getState().testPath;
  if (testPath.includes('/unit/')) {
    jest.setTimeout(TEST_TIMEOUTS.UNIT);
  } else if (testPath.includes('/integration/')) {
    jest.setTimeout(TEST_TIMEOUTS.INTEGRATION);
  } else if (testPath.includes('/e2e/')) {
    jest.setTimeout(TEST_TIMEOUTS.E2E);
  } else {
    jest.setTimeout(TEST_TIMEOUTS.UNIT);
  }
});

// Global setup and cleanup
beforeAll(async () => {
  await Promise.all([
    cleanDirectory(OUTPUT_DIR, true),
    cleanDirectory(LOGS_DIR, true),
  ]);
});

beforeEach(async () => {
  await cleanDirectory(INPUT_DIR, true);
  jest.clearAllMocks();
});

afterEach(async () => {
  await cleanDirectory(INPUT_DIR, true);
  jest.clearAllMocks();
  jest.clearAllTimers();
});

afterAll(async () => {
  await Promise.all([
    cleanDirectory(OUTPUT_DIR, true),
    cleanDirectory(LOGS_DIR, true),
  ]);
  process.removeAllListeners();
});

// Add custom matchers
expect.extend({
  toBeWithinRange(received, floor, ceiling) {
    const pass = received >= floor && received <= ceiling;
    if (pass) {
      return {
        message: () =>
          `expected ${received} not to be within range ${floor} - ${ceiling}`,
        pass: true,
      };
    } else {
      return {
        message: () =>
          `expected ${received} to be within range ${floor} - ${ceiling}`,
        pass: false,
      };
    }
  },

  toBeAppError(received, expectedCode) {
    const pass =
      received instanceof AppError &&
      (!expectedCode || received.error_code === expectedCode);
    if (pass) {
      return {
        message: () =>
          `expected error not to be AppError${expectedCode ? ` with code ${expectedCode}` : ''}`,
        pass: true,
      };
    } else {
      return {
        message: () =>
          `expected error to be AppError${expectedCode ? ` with code ${expectedCode}` : ''}`,
        pass: false,
      };
    }
  },
});
