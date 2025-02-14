/**
 * @file Mock filesystem operations for testing
 *
 * Provides mock implementations of common fs operations to avoid
 * actual filesystem access during tests.
 */

const mockFiles = new Map();
const mockDirs = new Set();

const fsMock = {
  promises: {
    async readFile(path) {
      if (!mockFiles.has(path)) {
        const error = new Error(`ENOENT: no such file or directory '${path}'`);
        error.code = 'ENOENT';
        throw error;
      }
      return mockFiles.get(path);
    },

    async writeFile(path, content) {
      mockFiles.set(path, content);
      return Promise.resolve();
    },

    async mkdir(path, options = {}) {
      const { recursive = false } = options;

      // If recursive, create all parent directories
      if (recursive) {
        const parts = path.split('/');
        let currentPath = '';
        for (const part of parts) {
          currentPath = currentPath ? `${currentPath}/${part}` : part;
          if (!mockFiles.has(currentPath)) {
            mockFiles.set(currentPath, { type: 'directory' });
          }
        }
      } else {
        // If not recursive, verify parent exists
        const parent = path.split('/').slice(0, -1).join('/');
        if (parent !== '.' && !mockFiles.has(parent)) {
          const error = new Error(`ENOENT: no such directory '${parent}'`);
          error.code = 'ENOENT';
          throw error;
        }
        mockFiles.set(path, { type: 'directory' });
      }
      return Promise.resolve();
    },

    async readdir(path) {
      if (!mockDirs.has(path)) {
        const error = new Error(`ENOENT: no such directory '${path}'`);
        error.code = 'ENOENT';
        throw error;
      }
      return Array.from(mockFiles.keys())
        .filter((file) => file.startsWith(path))
        .map((file) => file.replace(`${path}/`, ''));
    },

    async rm(path, options) {
      if (options?.recursive) {
        for (const file of mockFiles.keys()) {
          if (file.startsWith(path)) {
            mockFiles.delete(file);
          }
        }
        mockDirs.delete(path);
      } else {
        mockFiles.delete(path);
      }
      return Promise.resolve();
    },
  },

  // Métodos para testing
  __reset() {
    mockFiles.clear();
    mockDirs.clear();
  },

  __setMockFiles(files) {
    for (const [path, content] of Object.entries(files)) {
      mockFiles.set(path, content);
    }
  },

  __setMockDirs(dirs) {
    for (const dir of dirs) {
      mockDirs.add(dir);
    }
  },
};

module.exports = fsMock;
