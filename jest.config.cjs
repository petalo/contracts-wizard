/**
 * @type {import('@jest/types').Config.InitialOptions}
 * Jest configuration file that defines all testing parameters and settings
 */
module.exports = {
  // Specifies the root directories where Jest should look for test files
  roots: ['<rootDir>/src', '<rootDir>/tests'],

  // Defines patterns to match test files
  testMatch: [
    '<rootDir>/tests/**/*.test.js',
    '<rootDir>/tests/**/*.spec.js',
    '<rootDir>/tests/unit/**/*.unit.test.js',
    '<rootDir>/tests/integration/**/*.integration.test.js',
    '<rootDir>/tests/e2e/**/*.e2e.test.js',
  ],

  collectCoverageFrom: [
    'src/**/*.js',
    '!src/index.js',
    '!src/**/*.d.ts',
    '!src/**/types.js',
    '!src/**/*.config.js',
    '!src/**/__mocks__/**',
  ],

  // Coverage configuration
  coverageDirectory: '<rootDir>/tests/coverage',
  coverageReporters: ['text', 'html', 'lcov', 'json'],
  coverageThreshold: {
    global: {
      statements: 80,
      branches: 80,
      functions: 80,
      lines: 80,
    },
  },

  // Defines how files should be transformed
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': [
      'babel-jest',
      { configFile: './babel.config.cjs' },
    ],
  },

  // Specifies which node_modules should not be ignored during transformation
  transformIgnorePatterns: [
    'node_modules/(?!(@puppeteer|puppeteer-core|debug|prettier|@prettier|@babel/runtime)/)',
  ],

  // Module resolution settings
  moduleDirectories: ['node_modules', 'src', 'tests'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@utils/(.*)$': '<rootDir>/src/utils/$1',
    '^@config/(.*)$': '<rootDir>/src/config/$1',
    '^@tests/(.*)$': '<rootDir>/tests/$1',
    '^@src/(.*)$': '<rootDir>/src/$1',
    '^@core/(.*)$': '<rootDir>/src/core/$1',
    '^@cli/(.*)$': '<rootDir>/src/cli/$1',
    '^@common/(.*)$': '<rootDir>/src/utils/common/$1',
    '^@test/(.*)$': '<rootDir>/tests/$1',
    '^@test-utils/(.*)$': '<rootDir>/tests/__common__/utils/$1',
    '^@test-helpers/(.*)$': '<rootDir>/tests/__common__/helpers/$1',
    '^@test-mocks/(.*)$': '<rootDir>/tests/__common__/mocks/$1',
    '^@test-fixtures/(.*)$': '<rootDir>/tests/__common__/fixtures/$1',
  },

  reporters: [
    'default',
    [
      'jest-junit',
      {
        outputDirectory: '<rootDir>/tests/reports/junit',
        outputName: 'junit.xml',
        classNameTemplate: '{filepath}',
        titleTemplate: '{title}',
        ancestorSeparator: ' › ',
        usePathForSuiteName: true,
      },
    ],
    [
      'jest-html-reporter',
      {
        outputPath: '<rootDir>/tests/reports/html/test-report.html',
        pageTitle: 'Test Report',
        includeFailureMsg: true,
        includeSuiteFailure: true,
      },
    ],
  ],

  // Test environment configuration
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/tests/config/test-setup.js'],

  // Test execution settings
  testTimeout: 30000,
  verbose: true,
  detectOpenHandles: true,
  forceExit: false,
  maxConcurrency: 8,
  maxWorkers: '50%',

  // Ensure Jest globals are available
  injectGlobals: true,

  // Global variables available during tests
  globals: {
    NODE_ENV: 'test',
  },

  // Module resolution settings
  moduleFileExtensions: ['js', 'json', 'node'],

  // Enable experimental features
  resolver: '<rootDir>/tests/config/jest-resolver.js',
};
