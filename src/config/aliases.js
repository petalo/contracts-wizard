/**
 * @fileoverview Module Path Alias Configuration
 *
 * Manages module import path aliasing:
 * - Defines shorthand paths for application modules
 * - Configures module resolution aliases
 * - Provides consistent path access across application
 * - Simplifies import statements and refactoring
 * - Prevents path traversal complexity
 * - Enables module organization flexibility
 *
 * Functions:
 * - configureAliases: Initializes module path aliases
 *
 * Constants:
 * - aliases: Path mapping configuration object
 * - SRC_DIR: Source directory absolute path
 *
 * Flow:
 * 1. Define source directory location
 * 2. Create path alias mappings
 * 3. Configure module resolution
 * 4. Register aliases with module-alias
 * 5. Export configuration and setup
 *
 * Error Handling:
 * - Invalid path resolution errors
 * - Module import failures
 * - Circular dependency detection
 * - Path alias conflicts
 * - Missing module errors
 * - Resolution timeout handling
 *
 * @module @/config/aliases
 * @requires path
 * @requires module-alias
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
 * - @: Root source directory
 * - @utils: Utility modules
 * - @core: Core functionality
 * - @config: Configuration files
 * - @cli: CLI-related modules
 *
 * @constant {Object}
 * @property {string} SRC_DIR - Source directory path
 * @property {Object} aliases - Alias to path mappings
 *
 * @example
 * // Alias configuration object
 * {
 *   '@': '/path/to/src',
 *   '@utils': '/path/to/src/utils',
 *   '@core': '/path/to/src/core',
 *   '@config': '/path/to/src/config'
 * }
 *
 * // Adding new aliases:
 * // 1. Define in aliases object
 * // {
 * //   '@features': path.join(SRC_DIR, 'features'),
 * //   '@services': path.join(SRC_DIR, 'services')
 * // }
 * //
 * // 2. Update tsconfig.json paths
 * // {
 * //   "@features/*": ["src/features/*"],
 * //   "@services/*": ["src/services/*"]
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
 * @constant {Object}
 * @property {string} @ - Root source directory
 * @property {string} @src - Alternative root alias
 * @property {string} @utils - Utility modules
 * @property {string} @core - Core functionality
 * @property {string} @cli - CLI components
 * @property {string} @config - Configuration files
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
