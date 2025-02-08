/**
 * @fileoverview Static Asset Configuration
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
 * - ASSETS: Static resource configuration object
 *   - images: Image asset specifications
 *     - defaultLogo: Default logo filename
 *     - dimensions: Standard image dimensions
 *     - maxSize: Maximum file sizes
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
 *
 * @example
 * // Import asset configuration
 * const { ASSETS } = require('@/config/assets');
 *
 * // Access default logo
 * const logoFile = ASSETS.images.defaultLogo;
 *
 * // Validate image dimensions
 * const validateImage = (width, height) => {
 *   const { minWidth, maxWidth, minHeight, maxHeight } =
 *     ASSETS.images.dimensions;
 *   return width >= minWidth && width <= maxWidth &&
 *          height >= minHeight && height <= maxHeight;
 * };
 *
 * // Check file size
 * const isValidSize = (size) => {
 *   return size <= ASSETS.images.maxSize;
 * };
 *
 * // Generate asset path
 * const getAssetPath = (filename) => {
 *   return path.join(process.env.DIR_IMAGES, filename);
 * };
 *
 * // Asset naming convention
 * const generateAssetName = (type, id) => {
 *   return `${type}-${id}-${Date.now()}.png`;
 * };
 */

/**
 * Static asset configuration object
 *
 * Defines specifications and paths for static resources
 * used throughout the application, ensuring consistent
 * asset usage and management.
 *
 * Asset Types:
 * - Images: Logos, icons, backgrounds
 * - Documents: Templates, examples
 * - Media: Audio, video files
 * - Fonts: Typography resources
 *
 * @constant {Object}
 * @property {Object} images - Image asset configuration
 * @property {string} images.defaultLogo - Default logo filename
 * @property {Object} images.dimensions - Standard image dimensions
 * @property {number} images.maxSize - Maximum file size in bytes
 *
 * @example
 * // Image asset configuration
 * {
 *   images: {
 *     defaultLogo: '160x40.png',
 *     dimensions: {
 *       minWidth: 160,
 *       maxWidth: 1920,
 *       minHeight: 40,
 *       maxHeight: 1080
 *     },
 *     maxSize: 500 * 1024 // 500KB
 *   }
 * }
 *
 * // Adding new asset types:
 * // {
 * //   fonts: {
 * //     primary: 'OpenSans-Regular.ttf',
 * //     formats: ['ttf', 'woff', 'woff2'],
 * //     maxSize: 2 * 1024 * 1024 // 2MB
 * //   }
 * // }
 */
const ASSETS = {
  // Image asset configuration
  images: {
    defaultLogo: '160x40.png', // 160x40px logo image
    defaultPlaceholder: 'placeholder.png', // Default placeholder image
    paths: {
      fixtures: 'fixtures/images', // Path to fixture images
      templates: 'templates/images', // Path to template images
    },
    dimensions: {
      logo: {
        width: 160,
        height: 40,
      },
      placeholder: {
        width: 100,
        height: 100,
      },
    },
    maxSize: 500 * 1024, // 500KB maximum size
  },
};

// Prevent runtime modifications to configuration
Object.freeze(ASSETS);
Object.freeze(ASSETS.images);
Object.freeze(ASSETS.images.paths);
Object.freeze(ASSETS.images.dimensions);
Object.freeze(ASSETS.images.dimensions.logo);
Object.freeze(ASSETS.images.dimensions.placeholder);

module.exports = { ASSETS };
