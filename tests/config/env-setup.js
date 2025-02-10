/**
 * @file Environment setup for tests
 *
 * This file runs before any test file and ensures the environment
 * is properly configured for testing.
 */

// Store original env values
const originalEnv = { ...process.env };

// Force NODE_ENV to be 'test'
process.env.NODE_ENV = 'test';

// Store the test value
const TEST_ENV = 'test';

// Override dotenv config to ignore NODE_ENV
const dotenv = require('dotenv');
const originalConfig = dotenv.config;
dotenv.config = (options = {}) => {
  const result = originalConfig(options);
  if (result.parsed && result.parsed.NODE_ENV) {
    delete result.parsed.NODE_ENV;
  }
  return result;
};

// Create a proxy for process.env to handle NODE_ENV specially
process.env = new Proxy(
  { ...process.env },
  {
    get(target, prop) {
      if (prop === 'NODE_ENV') return TEST_ENV;
      return target[prop];
    },
    set(target, prop, value) {
      if (prop === 'NODE_ENV' && value !== TEST_ENV) {
        // Silently ignore attempts to change NODE_ENV
        return true;
      }
      target[prop] = value;
      return true;
    },
  }
);
