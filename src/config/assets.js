/**
 * @file Static Asset Configuration
 *
 * Manages static resource configuration:
 * - Default image assets
 * - Logo specifications
 * - Asset naming conventions
 * - Resource path mapping
 * - Asset dimensions
 * - File size limits
 *
 * Constants:
 * - ASSETS_CONFIG: Static resource configuration object
 *   - logo: Logo specifications and paths
 *   - templates: Template file configuration
 *   - css: CSS file configuration
 *   - data: Data file configuration
 *   - output: Output file configuration
 *
 * Flow:
 * 1. Define asset specifications
 * 2. Configure resource paths
 * 3. Set default assets
 * 4. Define size constraints
 * 5. Ensure configuration immutability
 *
 * Error Handling:
 * - Asset path validation
 * - Resource existence checks
 * - Immutable configuration
 * - Invalid asset access
 * - Size limit validation
 * - Format verification
 *
 * @module @/config/assets
 * @requires path
 *
 * @example
 * // Import asset configuration
 * const { ASSETS_CONFIG } = require('@/config/assets');
 *
 * // Access logo configuration
 * const logoPath = ASSETS_CONFIG.logo.path;
 *
 * // Check template extensions
 * const isValidTemplate = (filename) =>
 *   ASSETS_CONFIG.templates.extensions.some(ext => filename.endsWith(ext));
 */

const path = require('path');

/**
 * Static asset configuration object
 *
 * Defines specifications and paths for static resources
 * used throughout the application, ensuring consistent
 * asset usage and management.
 *
 * Asset Types:
 * - Logo: Company branding assets
 * - Templates: Document templates
 * - CSS: Style sheets
 * - Data: CSV and other data files
 * - Output: Generated files
 *
 * @constant {object}
 * @property {object} logo - Logo configuration
 * @property {string} logo.path - Logo file path
 * @property {number} logo.maxSize - Maximum logo file size
 * @property {object} templates - Template configuration
 * @property {string} templates.path - Templates directory
 * @property {string[]} templates.extensions - Valid extensions
 * @property {object} css - CSS configuration
 * @property {string} css.path - CSS directory
 * @property {string[]} css.extensions - Valid extensions
 * @property {object} data - Data file configuration
 * @property {string} data.path - Data directory
 * @property {string[]} data.extensions - Valid extensions
 * @property {object} output - Output configuration
 * @property {string} output.path - Output directory
 */
const ASSETS_CONFIG = {
  // Logo configuration
  logo: {
    path: path.join(process.cwd(), 'assets', 'images'),
    maxSize: 500 * 1024, // 500KB
  },

  // Template configuration
  templates: {
    path: path.join(process.cwd(), 'templates'),
    extensions: ['.md', '.markdown'],
  },

  // CSS configuration
  css: {
    path: path.join(process.cwd(), 'assets', 'css'),
    extensions: ['.css'],
  },

  // Data configuration
  // prettier-ignore
  data: {
    path: path.join(process.cwd(), 'data'),
    extensions: ['.csv']
  },

  // Output configuration
  output: { path: path.join(process.cwd(), 'output') },
};

// Prevent runtime modifications to configuration
Object.freeze(ASSETS_CONFIG);
Object.freeze(ASSETS_CONFIG.logo);
Object.freeze(ASSETS_CONFIG.templates);
Object.freeze(ASSETS_CONFIG.css);
Object.freeze(ASSETS_CONFIG.data);
Object.freeze(ASSETS_CONFIG.output);

module.exports = { ASSETS_CONFIG };
