/**
 * @fileoverview Mock filesystem operations for testing
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
      if (options.recursive) {
        // Si es recursive, crear todos los directorios padre
        const parts = path.split('/');
        let currentPath = '';
        for (const part of parts) {
          if (part) {
            currentPath += '/' + part;
            mockDirs.add(currentPath);
          }
        }
      } else {
        // Si no es recursive, verificar que el padre existe
        const parentDir = path.split('/').slice(0, -1).join('/');
        if (parentDir && !mockDirs.has(parentDir)) {
          const error = new Error(`ENOENT: no such directory '${parentDir}'`);
          error.code = 'ENOENT';
          throw error;
        }
        mockDirs.add(path);
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
