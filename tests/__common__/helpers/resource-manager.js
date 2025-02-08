const { EventEmitter } = require('events');
const path = require('path');
const fs = require('fs/promises');

class ResourceManager {
  constructor() {
    this.processes = new Set();
    this.fileOperations = new Set();
    this.eventEmitter = new EventEmitter();
    this.isShuttingDown = false;

    // Define test directories
    this.testDirectories = [
      'tests/output',
      'tests/__common__/fixtures',
      'tests/logs',
      'tests/reports',
      'tests/coverage',
      'tests/temp',
    ].map((dir) => path.resolve(process.cwd(), dir));
  }

  isTestDirectory(filepath) {
    const absolutePath = path.resolve(process.cwd(), filepath);
    return this.testDirectories.some((dir) => absolutePath.startsWith(dir));
  }

  registerProcess(process) {
    if (this.isShuttingDown) return;

    this.processes.add(process);

    const cleanup = () => {
      this.processes.delete(process);
      process.removeAllListeners();
    };

    process.once('exit', cleanup);
    process.once('error', cleanup);
    process.once('close', cleanup);
  }

  async executeOperation(operation, filepath) {
    if (this.isShuttingDown) return;

    // Only allow operations on test directories
    if (filepath && !this.isTestDirectory(filepath)) {
      console.warn('Attempted operation on non-test directory:', filepath);
      return;
    }

    const promise = operation();
    this.fileOperations.add(promise);

    try {
      const result = await Promise.race([
        promise,
        new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error('Operation timed out')),
            5000
          ).unref()
        ),
      ]);
      return result;
    } finally {
      this.fileOperations.delete(promise);
    }
  }

  async cleanup() {
    this.isShuttingDown = true;

    // Only clean up test directories
    const testCleanup = this.testDirectories.map(async (dir) => {
      try {
        const files = await fs.readdir(dir);
        await Promise.all(files.map((file) => fs.unlink(path.join(dir, file))));
      } catch (error) {
        // Ignore cleanup errors
      }
    });

    await Promise.all(testCleanup);

    // Kill all registered processes
    for (const process of this.processes) {
      try {
        process.kill();
      } catch (error) {
        // Ignore process kill errors
      }
    }
    this.processes.clear();
    this.fileOperations.clear();
    this.isShuttingDown = false;
  }

  async init() {
    this.isShuttingDown = false;
    await this.cleanup();
  }

  async reset() {
    await this.cleanup();
  }
}

const resourceManager = new ResourceManager();

// Handle process termination
process.on('exit', () => {
  resourceManager.cleanup().catch(() => {});
});

process.on('SIGTERM', () => {
  resourceManager.cleanup().catch(() => {});
});

process.on('SIGINT', () => {
  resourceManager.cleanup().catch(() => {});
});

module.exports = resourceManager;
