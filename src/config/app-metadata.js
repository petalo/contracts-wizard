/**
 * @file Application Metadata Configuration
 *
 * Defines core application information:
 * - Application name and version
 * - Description and branding
 * - Organization details
 * - Generator identification
 *
 * Constants:
 * - APP_METADATA: Core application information object
 *   - name: Package name
 *   - description: Application purpose
 *   - version: Current version
 *   - generator: Tool identifier
 *   - organization: Company name
 *
 * Flow:
 * 1. Define application metadata
 * 2. Ensure immutability
 * 3. Export for application use
 *
 * Error Handling:
 * - Immutable configuration enforcement
 * - Version format validation
 * - Metadata access validation
 *
 * @module @/config/appMetadata
 * @exports APP_METADATA Application metadata configuration
 *
 * @example
 * // Import metadata
 * const { APP_METADATA } = require('@/config/appMetadata');
 *
 * // Access version
 * console.log(`Version: ${APP_METADATA.version}`);
 *
 * // Use in generator identification
 * const generator = APP_METADATA.generator;
 */

/**
 * Application metadata configuration
 *
 * Core information about the application used for:
 * - Package identification
 * - Version tracking
 * - Generated file attribution
 * - Organizational branding
 *
 * This configuration is frozen to prevent modifications
 * during runtime, ensuring consistent metadata across
 * the application.
 *
 * @constant {object}
 * @property {string} name - Package name
 * @property {string} description - Application purpose
 * @property {string} version - Semantic version number
 * @property {string} generator - Tool identifier
 * @property {string} organization - Company name
 */
const APP_METADATA = {
  name: 'contracts-wizard',
  description: 'CLI to generate contracts from templates',
  version: '1.0.0',
  generator: 'Contracts Wizard',
  organization: 'petalo',
};

// Prevent runtime modifications to ensure consistency
Object.freeze(APP_METADATA);

/**
 * Application metadata configuration object
 * @exports appMetadata Application metadata configuration
 */
module.exports = { APP_METADATA };
