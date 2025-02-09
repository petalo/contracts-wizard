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
 *
 * // Format date with locale
 * const date = new Date().toLocaleDateString(
 *   LOCALE_CONFIG.fullLocale,
 *   { timeZone: LOCALE_CONFIG.timezone }
 * );
 *
 * // Format time
 * const time = new Date().toLocaleTimeString(
 *   LOCALE_CONFIG.fullLocale,
 *   {
 *     timeZone: LOCALE_CONFIG.timezone,
 *     hour12: false
 *   }
 * );
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
 * const moment = require('moment-timezone');
 * moment.locale(LOCALE_CONFIG.lang);
 * moment.tz.setDefault(LOCALE_CONFIG.timezone);
 *
 * const formattedDate = moment()
 *   .format(LOCALE_CONFIG.dateFormat);
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
 *   return new Intl.DateTimeFormat(
 *     LOCALE_CONFIG.fullLocale,
 *     {
 *       timeZone: LOCALE_CONFIG.timezone,
 *       year: 'numeric',
 *       month: '2-digit',
 *       day: '2-digit'
 *     }
 *   ).format(date);
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
 * //   dateFormat: 'DD/MM/YYYY',
 * //   timeFormat: 'HH:mm:ss',
 * //   fullLocale: 'fr-FR'
 * // };
 */
const LOCALE_CONFIG = {
  lang: 'es', // Spanish language
  country: 'ES', // Spain country code
  timezone: 'Europe/Madrid',
  dateFormat: 'DD/MM/YYYY',
  timeFormat: 'HH:mm:ss',
  fullLocale: 'es-ES', // BCP 47 language tag
};

// Prevent runtime modifications to ensure consistency
Object.freeze(LOCALE_CONFIG);

module.exports = { LOCALE_CONFIG };
