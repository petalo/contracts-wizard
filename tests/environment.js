/**
 * @file Custom test environment
 *
 * Provides a custom Jest test environment that:
 * - Manages test resources
 * - Handles cleanup
 * - Tracks test execution
 *
 * @module tests/environment
 * @requires jest-environment-node
 * @requires tests/helpers/resource-manager
 */
const { TestEnvironment } = require('jest-environment-node');
const resourceManager = require('./helpers/resource-manager');
/**
 * Custom test environment class
 *
 * Extends Jest's node environment to provide:
 * - Resource management
 * - Test lifecycle hooks
 * - Cleanup handling
 *
 * @example
 * // Jest will use this environment automatically
 * // when configured in jest.config.js
 * testEnvironment: './tests/environment.js'
 */
class CustomEnvironment extends TestEnvironment {
  /**
   * Creates a new test environment instance
   *
   * @param {object} config Environment configuration
   * @param {object} context Test context
   */
  constructor(config, context) {
    super(config, context);
    this.testPath = context.testPath;
  }

  async setup() {
    await super.setup();
    await resourceManager.init();
    this.global.resourceManager = resourceManager;
  }

  async teardown() {
    await resourceManager.cleanup();
    await super.teardown();
  }

  /**
   * Gets the VM context for test execution
   *
   * @returns {object} VM context
   */
  getVmContext() {
    return super.getVmContext();
  }

  /**
   * Handles test lifecycle events
   *
   * @param {object} event Test event
   */
  async handleTestEvent(event) {
    if (event.name === 'test_start') {
      await resourceManager.reset();
    }
    if (event.name === 'test_done') {
      await resourceManager.cleanup();
    }
  }
}

module.exports = CustomEnvironment;
