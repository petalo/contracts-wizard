/**
 * @file Test utilities for handling logs
 *
 * Provides utilities for managing and reading logs during tests
 *
 * @module tests/setup/helpers/log-utils
 */

const fs = require('fs').promises;
const path = require('path');

// Load test environment variables if in test mode
if (process.env.NODE_ENV !== 'test') {
  require('dotenv').config({ path: '.env.test' });
} else {
  require('dotenv').config();
}

// Log paths should be different in test environment
const BASE_DIR = process.cwd();
const LOG_DIR =
  process.env.NODE_ENV === 'test'
    ? path.join(BASE_DIR, 'tests/log')
    : path.dirname(path.join(BASE_DIR, 'logs/latest.log'));

/**
 * Get the path to the latest log file
 * @returns {string} Path to the latest log file
 */
const getLatestLogPath = () => {
  if (process.env.NODE_ENV === 'test') {
    return path.join(BASE_DIR, 'tests/logs/latest.log');
  }
  return process.env.LATEST_LOG_PATH || path.join(BASE_DIR, 'logs/latest.log');
};

/**
 * Get the path to the full log history file
 * @returns {string} Path to the full log history file
 */
const getFullLogPath = () => {
  if (process.env.NODE_ENV === 'test') {
    return path.join(BASE_DIR, 'tests/logs/history.log');
  }
  return (
    process.env.FULL_LOG_PATH || path.join(BASE_DIR, 'logs/logging-history.log')
  );
};

/**
 * Ensure the log directory exists
 */
const ensureLogDirectory = async () => {
  try {
    await fs.mkdir(LOG_DIR, {
      recursive: true,
    });
  } catch (error) {
    console.error('Error creating log directory:', error);
    throw error;
  }
};

/**
 * Read the latest log file
 * @returns {Promise<string>} Content of the latest log file
 */
const readLatestLog = async () => {
  try {
    await ensureLogDirectory();
    const content = await fs.readFile(getLatestLogPath(), 'utf8');
    return content || '';
  } catch (error) {
    if (error.code === 'ENOENT') {
      return '';
    }
    throw error;
  }
};

/**
 * Clear all logs
 */
const clearLogs = async () => {
  try {
    await ensureLogDirectory();
    await Promise.all([
      fs.writeFile(getLatestLogPath(), ''),
      fs.writeFile(getFullLogPath(), ''),
    ]);
  } catch (error) {
    console.error('Error clearing logs:', error);
    throw error;
  }
};

module.exports = {
  getLatestLogPath,
  getFullLogPath,
  readLatestLog,
  clearLogs,
  ensureLogDirectory,
};
