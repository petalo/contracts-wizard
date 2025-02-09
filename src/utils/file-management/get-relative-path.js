/**
 * @file Path Conversion Utility
 *
 * Converts absolute file paths to project-relative paths, handling
 * cross-platform path separators and providing consistent path formatting
 * across different operating systems.
 *
 * Functions:
 * - getRelativePath: Converts absolute paths to project-relative paths
 *
 * Constants:
 * - None
 *
 * Flow:
 * 1. Validate input path for null/undefined
 * 2. Get current project root path
 * 3. Normalize path separators (convert backslashes to forward slashes)
 * 4. Compare normalized paths
 * 5. Remove project root prefix if path is under project
 * 6. Return processed path
 *
 * Error Handling:
 * - Returns empty string for null/undefined paths
 * - Returns original path if not under project root
 * - Handles cross-platform path separator differences
 * - Preserves original path if no conversion possible
 *
 * @module @/utils/fileManagement/getRelativePath
 * @requires process - Node.js process information
 * @exports getRelativePath Path conversion utility
 */

/**
 * Converts an absolute file path to a path relative to the project root
 *
 * Processes file paths to create consistent relative paths by:
 * 1. Validating input
 * 2. Normalizing path separators
 * 3. Comparing with project root
 * 4. Extracting relative portion
 *
 * Edge cases:
 * - Returns '' for null/undefined input
 * - Returns original path if not under project root
 * - Handles both Unix and Windows path separators
 * - Preserves path case sensitivity
 *
 * @param {string} filepath - The absolute file path to convert
 * @returns {string} The path relative to project root, original path if not under root, or empty string if invalid
 *
 * @example
 * // Unix systems
 * getRelativePath('/project/root/src/file.js')     // Returns: 'src/file.js'
 * getRelativePath(null)                            // Returns: ''
 * getRelativePath('/different/path/file.js')       // Returns: '/different/path/file.js'
 *
 * // Windows systems
 * getRelativePath('C:\\project\\root\\src\\file.js') // Returns: 'src/file.js'
 * getRelativePath('D:\\other\\path\\file.js')        // Returns: 'D:/other/path/file.js'
 */
function getRelativePath(filepath) {
  if (!filepath) return '';
  const projectRoot = process.cwd();
  // Convert both paths to use forward slashes for consistency
  const normalizedPath = filepath.replace(/\\/g, '/');
  const normalizedRoot = projectRoot.replace(/\\/g, '/');
  // Remove the project root path to get the relative path
  if (normalizedPath.startsWith(normalizedRoot)) {
    return normalizedPath.slice(normalizedRoot.length + 1);
  }
  return normalizedPath;
}

module.exports = {
  getRelativePath,
};
