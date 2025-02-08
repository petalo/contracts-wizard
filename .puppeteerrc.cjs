const { join } = require('path');

/**
 * @type {import("puppeteer").Configuration}
 */
module.exports = {
  // Use the Chrome managed by Puppeteer
  chrome: {
    skipDownload: false,
  },
  // Cache Chrome in a local directory to avoid permission issues
  cacheDirectory: join(__dirname, '.cache', 'puppeteer'),
};
