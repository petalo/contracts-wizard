/**
 * @fileoverview Custom Jest resolver to handle dynamic imports and ESM modules
 *
 * This resolver is used to handle dynamic imports and ESM modules in Jest tests.
 * It ensures that modules like Prettier, which use dynamic imports, can be properly
 * resolved and transformed during testing.
 */

module.exports = (path, options) => {
  // Call the default resolver
  return options.defaultResolver(path, {
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
