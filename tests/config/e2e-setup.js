/**
 * @file E2E test specific configuration and setup
 *
 * Configures the environment specifically for E2E tests, including:
 * - Browser setup
 * - Page configuration
 * - Test timeouts
 * - Custom E2E utilities
 */

const puppeteer = require('puppeteer');
const path = require('path');
const { logger } = require('../../src/utils/common/logger');

// E2E specific constants
const E2E_CONSTANTS = {
  VIEWPORT: {
    width: 1920,
    height: 1080,
  },
  NAVIGATION_TIMEOUT: 30000,
  WAIT_FOR_ELEMENT_TIMEOUT: 5000,
};

// Browser configuration
const BROWSER_CONFIG = {
  headless: 'new',
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-accelerated-2d-canvas',
    '--disable-gpu',
    '--window-size=1920,1080',
  ],
};

// E2E specific utilities
const e2eUtils = {
  // Launch browser with custom configuration
  launchBrowser: async () => {
    return puppeteer.launch(BROWSER_CONFIG);
  },

  // Create new page with default configuration
  createPage: async (browser) => {
    const page = await browser.newPage();
    await page.setViewport(E2E_CONSTANTS.VIEWPORT);
    await page.setDefaultNavigationTimeout(E2E_CONSTANTS.NAVIGATION_TIMEOUT);
    await page.setDefaultTimeout(E2E_CONSTANTS.WAIT_FOR_ELEMENT_TIMEOUT);
    return page;
  },

  // Wait for network to be idle
  waitForNetworkIdle: async (page, timeout = 5000) => {
    await page.waitForNetworkIdle({ timeout });
  },

  // Take screenshot on test failure
  takeScreenshot: async (page, name) => {
    const screenshotPath = path.join(
      process.cwd(),
      'reports',
      'screenshots',
      `${name}-${Date.now()}.png`
    );
    await page.screenshot({
      path: screenshotPath,
      fullPage: true,
    });
    logger.info(`Screenshot saved to: ${screenshotPath}`);
  },
};

// Add E2E utilities to global scope
global.e2eUtils = e2eUtils;

// Export constants for use in tests
module.exports = {
  E2E_CONSTANTS,
  BROWSER_CONFIG,
};
