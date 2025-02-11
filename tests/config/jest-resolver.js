/**
 * @file Custom Jest resolver to handle dynamic imports and ESM modules
 *
 * This resolver is used to handle dynamic imports and ESM modules in Jest tests.
 * It ensures that modules like Prettier, which use dynamic imports, can be properly
 * resolved and transformed during testing.
 */

const path = require('path');

module.exports = (request, options) => {
  // Handle module aliases
  if (request.startsWith('@/')) {
    const relativePath = request.substring(2);
    return path.resolve(options.rootDir, 'src', relativePath);
  }

  if (request.startsWith('@utils/')) {
    const relativePath = request.substring(7);
    return path.resolve(options.rootDir, 'src/utils', relativePath);
  }

  if (request.startsWith('@config/')) {
    const relativePath = request.substring(8);
    return path.resolve(options.rootDir, 'src/config', relativePath);
  }

  if (request.startsWith('@tests/')) {
    const relativePath = request.substring(7);
    return path.resolve(options.rootDir, 'tests', relativePath);
  }

  if (request.startsWith('@src/')) {
    const relativePath = request.substring(5);
    return path.resolve(options.rootDir, 'src', relativePath);
  }

  if (request.startsWith('@core/')) {
    const relativePath = request.substring(6);
    return path.resolve(options.rootDir, 'src/core', relativePath);
  }

  if (request.startsWith('@cli/')) {
    const relativePath = request.substring(5);
    return path.resolve(options.rootDir, 'src/cli', relativePath);
  }

  if (request.startsWith('@common/')) {
    const relativePath = request.substring(8);
    return path.resolve(options.rootDir, 'src/utils/common', relativePath);
  }

  if (request.startsWith('@test/')) {
    const relativePath = request.substring(6);
    return path.resolve(options.rootDir, 'tests', relativePath);
  }

  if (request.startsWith('@test-utils/')) {
    const relativePath = request.substring(12);
    return path.resolve(
      options.rootDir,
      'tests/__common__/utils',
      relativePath
    );
  }

  if (request.startsWith('@test-helpers/')) {
    const relativePath = request.substring(14);
    return path.resolve(
      options.rootDir,
      'tests/__common__/helpers',
      relativePath
    );
  }

  if (request.startsWith('@test-mocks/')) {
    const relativePath = request.substring(12);
    return path.resolve(
      options.rootDir,
      'tests/__common__/mocks',
      relativePath
    );
  }

  if (request.startsWith('@test-fixtures/')) {
    const relativePath = request.substring(14);
    return path.resolve(
      options.rootDir,
      'tests/__common__/fixtures',
      relativePath
    );
  }

  // Call the default resolver for other cases
  return options.defaultResolver(request, {
    ...options,
    // Enable package.json exports
    packageFilter: (pkg) => {
      if (pkg.type === 'module') {
        pkg.type = 'commonjs';
        // If the package has exports, prefer the require condition
        if (pkg.exports) {
          const exports = pkg.exports;
          Object.keys(exports).forEach((key) => {
            if (typeof exports[key] === 'object' && exports[key].require) {
              exports[key] = exports[key].require;
            }
          });
        }
      }
      return pkg;
    },
  });
};
