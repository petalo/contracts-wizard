/**
 * @file Mock implementation of puppeteer for testing PDF generation
 *
 * This mock simulates the basic functionality needed for PDF generation:
 * - Browser launch and close
 * - Page creation and manipulation
 * - PDF generation
 */

const MockPage = {
  setContent: async () => Promise.resolve(),
  setViewport: async () => Promise.resolve(),
  pdf: async () => Promise.resolve(Buffer.from('Mock PDF content')),
  evaluate: async () => Promise.resolve(true),
  waitForSelector: async () => Promise.resolve(),
};

const MockBrowser = {
  newPage: async () => Promise.resolve(MockPage),
  close: async () => Promise.resolve(),
};

module.exports = {
  launch: async () => Promise.resolve(MockBrowser),
};
