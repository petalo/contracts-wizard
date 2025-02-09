/**
 * @file Test utilities for handling logs
 *
 * Provides utilities for managing and reading logs during tests
 *
 * @module tests/setup/helpers/log-utils
 */

const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

const BASE_DIR = process.cwd();
const LOG_DIR = path.dirname(
  process.env.LATEST_LOG_PATH || path.join(BASE_DIR, 'logs/logging-latest.log')
);

/**
 * Get the path to the latest log file
 * @returns {string} Path to the latest log file
 */
const getLatestLogPath = () => {
  return (
    process.env.LATEST_LOG_PATH ||
    path.join(BASE_DIR, 'logs/logging-latest.log')
  );
};

/**
 * Get the path to the full log history file
 * @returns {string} Path to the full log history file
 */
const getFullLogPath = () => {
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
