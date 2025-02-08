const { TestEnvironment } = require('jest-environment-node');
const resourceManager = require('./helpers/resource-manager');

class CustomEnvironment extends TestEnvironment {
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

  getVmContext() {
    return super.getVmContext();
  }

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
