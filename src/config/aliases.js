/**
 * @file Module alias configuration
 *
 * Configures module aliases for easier imports:
 * - src/ -> '@'
 * - src/ -> '@src'
 * - src/utils/ -> '@utils'
 * - src/core/ -> '@core'
 * - src/cli/ -> '@cli'
 * - src/config/ -> '@config'
 *
 * @module config/aliases
 * @requires module-alias
 * @requires path
 *
 * @example
 * // Import and configure aliases
 * const { configureAliases } = require('@/config/aliases');
 * configureAliases();
 *
 * // Use configured aliases in imports
 * const utils = require('@utils/common');
 * const core = require('@core/workflow');
 * const config = require('@config/paths');
 *
 * // Resolve aliased path
 * const resolvedPath = require.resolve('@utils/common');
 *
 * // Dynamic imports with aliases
 * const module = await import('@utils/templateProcessor');
 *
 * // TypeScript path resolution
 * // tsconfig.json:
 * // {
 * //   "compilerOptions": {
 * //     "paths": {
 * //       "@/*": ["src/*"],
 * //       "@utils/*": ["src/utils/*"],
 * //       "@core/*": ["src/core/*"]
 * //     }
 * //   }
 * // }
 */

/**
 * Module path alias configuration
 *
 * Defines the mapping between alias prefixes and
 * their corresponding directory paths, enabling
 * simplified and maintainable import statements.
 *
 * Alias Structure:
 * - src: Root source directory
 * - utils: Utility modules
 * - core: Core functionality
 * - config: Configuration files
 * - cli: CLI-related modules
 *
 * @constant {object}
 * @property {string} SRC_DIR - Source directory path
 * @property {object} aliases - Alias to path mappings
 *
 * @example
 * // Alias configuration object
 * {
 *   'src': '/path/to/src',
 *   'utils': '/path/to/src/utils',
 *   'core': '/path/to/src/core',
 *   'config': '/path/to/src/config'
 * }
 *
 * // Adding new aliases:
 * // 1. Define in aliases object
 * // {
 * //   'features': path.join(SRC_DIR, 'features'),
 * //   'services': path.join(SRC_DIR, 'services')
 * // }
 * //
 * // 2. Update tsconfig.json paths
 * // {
 * //   "features/*": ["src/features/*"],
 * //   "services/*": ["src/services/*"]
 * // }
 */

const path = require('path');

/**
 * Source directory absolute path
 *
 * Base directory for all application modules,
 * used as reference for alias paths.
 *
 * @constant {string}
 */
const SRC_DIR = path.resolve(__dirname, '..');

/**
 * Module path alias mappings
 *
 * Maps shorthand aliases to absolute paths for:
 * - Root source directory
 * - Utility modules
 * - Core functionality
 * - CLI components
 * - Configuration files
 *
 * @constant {object}
 * @property {string} '@' Root source directory
 * @property {string} '@src' Alternative root alias
 * @property {string} '@utils' Utility modules
 * @property {string} '@core' Core functionality
 * @property {string} '@cli' CLI components
 * @property {string} '@config' Configuration files
 */
const aliases = {
  '@': SRC_DIR,
  '@src': SRC_DIR,
  '@utils': path.join(SRC_DIR, 'utils'),
  '@core': path.join(SRC_DIR, 'core'),
  '@cli': path.join(SRC_DIR, 'cli'),
  '@config': path.join(SRC_DIR, 'config'),
};

// Prevent runtime modifications
Object.freeze(aliases);

module.exports = {
  aliases,
  /**
   * Configures module path aliases
   *
   * Sets up module resolution to use defined aliases,
   * allowing shorthand imports throughout the application.
   * Must be called before any aliased imports are used.
   *
   * @function
   * @example
   * // Initialize aliases
   * configureAliases();
   *
   * // Now aliases can be used
   * const logger = require('@utils/common/logger');
   */
  configureAliases: () => {
    require('module-alias').addAliases(aliases);
  },
};
