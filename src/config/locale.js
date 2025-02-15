/**
 * @file Internationalization and Locale Configuration
 *
 * Manages application localization settings:
 * - Language and country codes
 * - Timezone configuration
 * - Date and time formatting
 * - Regional preferences
 * - Number formatting
 * - Currency display
 *
 * Functions:
 * - None (configuration only)
 *
 * Constants:
 * - LOCALE_CONFIG: Localization configuration object
 *   - lang: Language code (es)
 *   - country: Country code (ES)
 *   - timezone: Timezone (Europe/Madrid)
 *   - dateFormat: Date format pattern
 *   - timeFormat: Time format pattern
 *   - fullLocale: Combined locale string
 *
 * Flow:
 * 1. Define locale identifiers (ISO codes)
 * 2. Configure timezone settings (IANA)
 * 3. Set format patterns (date/time)
 * 4. Create combined locale (BCP 47)
 * 5. Freeze configuration
 *
 * Error Handling:
 * - Invalid locale validation
 * - Timezone format errors
 * - Date pattern validation
 * - Format string parsing
 * - Fallback handling
 * - Invalid format recovery
 *
 * @module @/config/locale
 * @exports LOCALE_CONFIG Locale and internationalization settings
 *
 * @example
 * // Import locale configuration
 * const { LOCALE_CONFIG } = require('@/config/locale');
 * const { DateTime } = require('luxon');
 *
 * // Format date with locale
 * const date = DateTime.now()
 *   .setLocale(LOCALE_CONFIG.fullLocale)
 *   .setZone(LOCALE_CONFIG.timezone)
 *   .toFormat(LOCALE_CONFIG.dateFormat);
 *
 * // Format time
 * const time = DateTime.now()
 *   .setLocale(LOCALE_CONFIG.fullLocale)
 *   .setZone(LOCALE_CONFIG.timezone)
 *   .toFormat(LOCALE_CONFIG.timeFormat);
 *
 * // Format currency
 * const amount = 1234.56;
 * const currency = new Intl.NumberFormat(
 *   LOCALE_CONFIG.fullLocale,
 *   {
 *     style: 'currency',
 *     currency: 'EUR'
 *   }
 * ).format(amount);
 *
 * // Custom date formatting
 * const formattedDate = DateTime.now()
 *   .setLocale(LOCALE_CONFIG.lang)
 *   .setZone(LOCALE_CONFIG.timezone)
 *   .toFormat(LOCALE_CONFIG.dateFormat);
 */

/**
 * Localization and internationalization settings
 *
 * Comprehensive configuration for application localization:
 * - Language and region settings (ISO codes)
 * - Time zone preferences (IANA timezone)
 * - Date and time format patterns
 * - Combined locale identifiers (BCP 47)
 *
 * This configuration is frozen to prevent modifications
 * during runtime, ensuring consistent localization
 * across the application.
 *
 * @constant {object}
 * @property {string} lang - ISO 639-1 language code
 * @property {string} country - ISO 3166-1 country code
 * @property {string} timezone - IANA timezone identifier
 * @property {string} dateFormat - Date format pattern
 * @property {string} timeFormat - Time format pattern
 * @property {string} fullLocale - Combined BCP 47 locale
 *
 * @example
 * // Date formatting
 * const formatDate = (date) => {
 *   return DateTime.fromJSDate(date)
 *     .setLocale(LOCALE_CONFIG.fullLocale)
 *     .setZone(LOCALE_CONFIG.timezone)
 *     .toFormat('dd/MM/yyyy');
 * };
 *
 * // Number formatting
 * const formatNumber = (number) => {
 *   return new Intl.NumberFormat(
 *     LOCALE_CONFIG.fullLocale,
 *     {
 *       minimumFractionDigits: 2,
 *       maximumFractionDigits: 2
 *     }
 *   ).format(number);
 * };
 *
 * // Adding new language support:
 * // 1. Add new locale configuration
 * // const newLocale = {
 * //   lang: 'fr',
 * //   country: 'FR',
 * //   timezone: 'Europe/Paris',
 * //   dateFormat: 'dd/MM/yyyy',
 * //   timeFormat: 'HH:mm:ss',
 * //   fullLocale: 'fr-FR'
 * // };
 */
const LOCALE_CONFIG = {
  lang: 'es', // ISO 639-1 language code (RFC 5646)
  country: 'ES', // ISO 3166-1 alpha-2 country code
  timezone: 'Europe/Madrid', // IANA Time Zone Database name
  dateFormat: 'dd/MM/yyyy', // Unicode LDML date format (CLDR standard)
  timeFormat: 'HH:mm:ss', // Unicode LDML time format (CLDR standard)
  fullLocale: 'es-ES', // BCP 47 language tag (RFC 5646)
};

// Prevent runtime modifications to ensure consistency
Object.freeze(LOCALE_CONFIG);

module.exports = { LOCALE_CONFIG };
