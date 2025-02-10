/**
 * @file File Extension and Type Configuration
 *
 * Manages file extensions and type mappings for the application:
 * - Defines valid extensions for each file type
 * - Maps file types to their extensions
 * - Specifies output file formats
 * - Provides type aliases for consistent reference
 *
 * Constants:
 * - FILE_EXTENSIONS: Main configuration object
 *   - markdown: Template file extensions (.md, .markdown)
 *   - csv: Data file extensions (.csv)
 *   - css: Style file extensions (.css)
 *   - images: Supported image formats (.png, .jpg, .jpeg, .gif)
 *   - types: Type alias mapping for consistent reference
 *   - output: Generated file extensions (.html, .pdf)
 *
 * Flow:
 * 1. Define supported file extensions for each type
 * 2. Map file types to their allowed extensions
 * 3. Define output formats for generated files
 * 4. Create type aliases for consistent reference
 * 5. Freeze configuration for immutability
 *
 * Error Handling:
 * - Configuration is immutable after initialization
 * - Invalid file types are handled by consuming modules
 * - Extension validation is performed by file processors
 * - Unsupported extensions are rejected during validation
 *
 * @module @/config/fileExtensions
 * @exports FILE_EXTENSIONS File extension and type configuration
 *
 * @example
 * // Import configuration
 * const { FILE_EXTENSIONS } = require('@/config/fileExtensions');
 *
 * // Check if file is markdown
 * const isMarkdown = FILE_EXTENSIONS.markdown.includes('.md');
 *
 * // Get type for template files
 * const templateType = FILE_EXTENSIONS.types.TEMPLATE;
 *
 * // Access output format
 * const htmlExt = FILE_EXTENSIONS.output.html;
 *
 * // Validate file extension
 * const isValidImage = FILE_EXTENSIONS.images.includes(path.extname(filename));
 *
 * // Get all supported extensions
 * const allExtensions = [
 *   ...FILE_EXTENSIONS.markdown,
 *   ...FILE_EXTENSIONS.csv,
 *   ...FILE_EXTENSIONS.css,
 *   ...FILE_EXTENSIONS.images
 * ];
 */

/**
 * File extension and type configuration
 *
 * Comprehensive configuration object that defines:
 * - Valid file extensions for each type
 * - Type aliases for consistent reference
 * - Output file format extensions
 *
 * This configuration is frozen to prevent modifications
 * during runtime, ensuring consistent behavior across
 * the application.
 *
 * @constant {object}
 * @property {string[]} markdown - Valid markdown extensions (.md, .markdown)
 * @property {string[]} csv - Valid CSV data file extensions (.csv)
 * @property {string[]} css - Valid stylesheet extensions (.css)
 * @property {string[]} images - Valid image file extensions (.png, .jpg, .jpeg, .gif)
 * @property {object} types - Type alias mapping for consistent reference
 * @property {object} output - Output format extensions for generated files
 */
const FILE_EXTENSIONS = {
  // Valid file extensions for each type
  markdown: ['.md', '.markdown'],
  csv: ['.csv'],
  css: ['.css'],
  images: ['.png', '.jpg', '.jpeg', '.gif'],

  // Type aliases for consistent reference
  types: {
    TEMPLATE: 'markdown',
    CSV: 'csv',
    CSS: 'css',
    IMAGES: 'images',
  },

  // Output file format extensions
  output: {
    html: '.html',
    pdf: '.pdf',
    markdown: '.md',
  },
};

// Prevent runtime modifications to ensure consistency
Object.freeze(FILE_EXTENSIONS);
Object.freeze(FILE_EXTENSIONS.types);
Object.freeze(FILE_EXTENSIONS.output);

/**
 * File extensions configuration object
 * @exports fileExtensions Supported file extensions configuration
 */
module.exports = {
  FILE_EXTENSIONS,
};
