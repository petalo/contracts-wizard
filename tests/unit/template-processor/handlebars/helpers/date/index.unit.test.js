/**
 * @file Tests for date formatting helpers
 *
 * Tests cover:
 * - Basic date formatting
 * - Locale handling
 * - Error cases
 * - Edge cases
 * - Timezone handling
 */

const { DateTime } = require('luxon');
const handlebars = require('handlebars');
const {
  formatDate,
  addYears,
  now,
} = require('@/utils/template-processor/handlebars/helpers/date');
const { LOCALE_CONFIG } = require('@/config/locale');
const { HANDLEBARS_CONFIG } = require('@/config/handlebars-config');
const {
  extractValue,
} = require('@/utils/template-processor/handlebars/helpers/value/extract-handlebars-values');

// Mock dependencies
jest.mock('@/utils/common/logger');
jest.mock(
  '@/utils/template-processor/handlebars/helpers/value/extract-handlebars-values'
);

// Mock LOCALE_CONFIG
jest.mock('@/config/locale', () => ({
  LOCALE_CONFIG: {
    locale: 'es',
    lang: 'es',
    timezone: 'Europe/Madrid',
    country: 'ES',
    fullLocale: 'es-ES',
  },
}));

describe('Date Helpers', () => {
  let originalTZ;
  let originalEnv;

  beforeEach(() => {
    // Store original environment
    originalTZ = process.env.TZ;
    originalEnv = { ...process.env };

    // Set timezone and other environment variables
    process.env = {
      ...process.env,
      TZ: LOCALE_CONFIG.timezone,
    };

    // Reset all mocks
    jest.clearAllMocks();

    // Mock extractValue to return input by default
    extractValue.mockImplementation((val) => val);

    // Configure Luxon
    DateTime.local().setLocale(LOCALE_CONFIG.locale);
    DateTime.local().setZone(LOCALE_CONFIG.timezone);
  });

  afterEach(() => {
    // Restore original settings
    process.env = originalEnv;
    process.env.TZ = originalTZ;
  });

  describe('formatDate', () => {
    it('should format date with default format', () => {
      const date = '2024-01-29';
      const result = formatDate(date);
      expect(result.toString()).toBe(
        '<span class="imported-value" data-field="date">29/01/2024</span>'
      );
    });

    it('should format date with custom format', () => {
      const date = '2024-01-29';
      const format = 'yyyy-MM-dd';
      const result = formatDate(date, format);
      expect(result.toString()).toBe(
        '<span class="imported-value" data-field="date">2024-01-29</span>'
      );
    });

    it('should format date with Spanish locale', () => {
      const date = '2024-01-29';
      const format = 'd "de" MMMM "de" yyyy';
      const result = formatDate(date, format);
      expect(result.toString()).toBe(
        '<span class="imported-value" data-field="date">29 de enero de 2024</span>'
      );
    });

    it('should handle predefined formats', () => {
      const date = '2024-01-29';
      const format = 'DEFAULT';
      const result = formatDate(date, format);
      expect(result.toString()).toBe(
        '<span class="imported-value" data-field="date">29/01/2024</span>'
      );
    });

    it('should handle invalid date', () => {
      const date = 'invalid-date';
      const result = formatDate(date);
      expect(result.toString()).toBe(
        '<span class="missing-value" data-field="date">[[Invalid date]]</span>'
      );
    });

    it('should handle undefined date', () => {
      const result = formatDate(undefined);
      expect(result.toString()).toBe(
        '<span class="missing-value" data-field="date">[[Invalid date]]</span>'
      );
    });

    it('should handle null date', () => {
      const result = formatDate(null);
      expect(result.toString()).toBe(
        '<span class="missing-value" data-field="date">[[Invalid date]]</span>'
      );
    });

    it('should handle empty string date', () => {
      const result = formatDate('');
      expect(result.toString()).toBe(
        '<span class="missing-value" data-field="date">[[Invalid date]]</span>'
      );
    });

    it('should handle extraction errors', () => {
      extractValue.mockImplementation(() => {
        throw new Error('Extraction error');
      });
      const result = formatDate('2024-01-29');
      expect(result.toString()).toBe(
        '<span class="missing-value" data-field="date">[[Error formatting date]]</span>'
      );
    });

    it('should handle DateTime objects directly', () => {
      const date = DateTime.fromISO('2024-01-29');
      const format = 'yyyy-MM-dd';
      const result = formatDate(date, format);
      expect(result.toString()).toBe(
        '<span class="imported-value" data-field="date">2024-01-29</span>'
      );
    });

    it('should handle dates with different timezones', () => {
      const date = '2024-01-29T12:00:00.000Z';
      const format = 'HH:mm:ss';
      const result = formatDate(date, format);
      expect(result.toString()).toBe(
        '<span class="imported-value" data-field="date">13:00:00</span>'
      );
    });

    it('should handle dates with time component', () => {
      const date = '2024-01-29T15:30:45';
      const format = 'HH:mm:ss';
      const result = formatDate(date, format);
      expect(result.toString()).toBe(
        '<span class="imported-value" data-field="date">15:30:45</span>'
      );
    });

    it('should handle HTML-wrapped input dates', () => {
      const date = '<span>2024-01-29</span>';
      const result = formatDate(date);
      expect(result.toString()).toBe(
        '<span class="imported-value" data-field="date">29/01/2024</span>'
      );
    });

    it('should handle HTML-wrapped formats', () => {
      const date = '2024-01-29';
      const format = '<span>yyyy-MM-dd</span>';
      const result = formatDate(date, format);
      expect(result.toString()).toBe(
        '<span class="imported-value" data-field="date">2024-01-29</span>'
      );
    });

    it('should handle raw option', () => {
      const date = '2024-01-29';
      const options = { hash: { raw: true } };
      const result = formatDate(date, options);
      expect(result).toBe('29/01/2024');
    });
  });

  describe('addYears', () => {
    it('should add years to date', () => {
      const date = '2024-01-29';
      const years = 1;
      const result = addYears(date, years);
      expect(result.toString()).toBe(
        '<span class="imported-value" data-field="date">29/01/2025</span>'
      );
    });

    it('should handle negative years', () => {
      const date = '2024-01-29';
      const years = -1;
      const result = addYears(date, years);
      expect(result.toString()).toBe(
        '<span class="imported-value" data-field="date">29/01/2023</span>'
      );
    });

    it('should handle leap years', () => {
      const date = '2024-02-29';
      const years = 1;
      const result = addYears(date, years);
      expect(result.toString()).toBe(
        '<span class="imported-value" data-field="date">28/02/2025</span>'
      );
    });

    it('should handle leap year to leap year', () => {
      const date = '2024-02-29';
      const years = 4;
      const result = addYears(date, years);
      expect(result.toString()).toBe(
        '<span class="imported-value" data-field="date">29/02/2028</span>'
      );
    });

    it('should handle undefined date', () => {
      const result = addYears(undefined, 1);
      expect(result.toString()).toBe(
        '<span class="missing-value" data-field="date">[[Invalid date]]</span>'
      );
    });

    it('should handle undefined years', () => {
      const result = addYears('2024-01-29', undefined);
      expect(result.toString()).toBe(
        '<span class="missing-value" data-field="date">[[Invalid date]]</span>'
      );
    });

    it('should handle invalid date', () => {
      const result = addYears('invalid-date', 1);
      expect(result.toString()).toBe(
        '<span class="missing-value" data-field="date">[[Invalid date]]</span>'
      );
    });

    it('should handle extraction errors', () => {
      extractValue.mockImplementation(() => {
        throw new Error('Extraction error');
      });
      const result = addYears('2024-01-29', 1);
      expect(result.toString()).toBe(
        '<span class="missing-value" data-field="date">[[Error adding years to date]]</span>'
      );
    });

    it('should handle HTML-wrapped years value', () => {
      const date = '2024-01-29';
      const years = '<span>1</span>';
      const result = addYears(date, years);
      expect(result.toString()).toBe(
        '<span class="imported-value" data-field="date">29/01/2025</span>'
      );
    });

    it('should handle decimal years', () => {
      const date = '2024-01-29';
      const years = '1.5';
      const result = addYears(date, years);
      expect(result.toString()).toBe(
        '<span class="imported-value" data-field="date">29/01/2025</span>'
      );
    });

    it('should handle string years', () => {
      const date = '2024-01-29';
      const years = '1';
      const result = addYears(date, years);
      expect(result.toString()).toBe(
        '<span class="imported-value" data-field="date">29/01/2025</span>'
      );
    });

    it('should handle invalid years value', () => {
      const date = '2024-01-29';
      const years = 'invalid';
      const result = addYears(date, years);
      expect(result.toString()).toBe(
        '<span class="missing-value" data-field="date">[[Invalid date]]</span>'
      );
    });

    it('should handle raw option', () => {
      const date = '2024-01-29';
      const years = 1;
      const options = { hash: { raw: true } };
      const result = addYears(date, years, options);
      expect(result).toBe('29/01/2025');
    });
  });

  describe('now', () => {
    it('should return current date with default format', () => {
      const result = now();
      expect(result.toString()).toBe(
        '<span class="imported-value" data-field="date">29/01/2024</span>'
      );
    });

    it('should return current date with custom format', () => {
      const format = 'yyyy-MM-dd';
      const result = now(format);
      expect(result.toString()).toBe(
        '<span class="imported-value" data-field="date">2024-01-29</span>'
      );
    });

    it('should return current date with Spanish locale', () => {
      const format = 'd "de" MMMM "de" yyyy';
      const result = now(format);
      expect(result.toString()).toBe(
        '<span class="imported-value" data-field="date">29 de enero de 2024</span>'
      );
    });

    it('should handle time formats', () => {
      const format = 'HH:mm:ss';
      const result = now(format);
      expect(result.toString()).toBe(
        '<span class="imported-value" data-field="date">13:00:00</span>'
      );
    });

    it('should handle extraction errors', () => {
      extractValue.mockImplementation(() => {
        throw new Error('Extraction error');
      });
      const result = now('yyyy-MM-dd');
      expect(result.toString()).toBe(
        '<span class="missing-value" data-field="date">[[Error getting current date]]</span>'
      );
    });

    it('should handle format as options object', () => {
      const options = { hash: { format: 'yyyy-MM-dd' } };
      const result = now(options);
      expect(result.toString()).toBe(
        '<span class="imported-value" data-field="date">29/01/2024</span>'
      );
    });

    it('should handle HTML-wrapped format', () => {
      const format = '<span>yyyy-MM-dd</span>';
      const result = now(format);
      expect(result.toString()).toBe(
        '<span class="imported-value" data-field="date">2024-01-29</span>'
      );
    });

    it('should handle predefined formats', () => {
      const format = 'DEFAULT';
      const result = now(format);
      expect(result.toString()).toBe(
        '<span class="imported-value" data-field="date">29/01/2024</span>'
      );
    });

    it('should handle raw option', () => {
      const options = { hash: { raw: true } };
      const result = now(options);
      expect(result.toFormat('dd/MM/yyyy')).toBe('29/01/2024');
    });
  });

  describe('Handlebars integration', () => {
    beforeEach(() => {
      // Register helpers with Handlebars
      handlebars.registerHelper('formatDate', formatDate);
      handlebars.registerHelper('addYears', addYears);
      handlebars.registerHelper('now', now);
    });

    afterEach(() => {
      // Unregister helpers
      handlebars.unregisterHelper('formatDate');
      handlebars.unregisterHelper('addYears');
      handlebars.unregisterHelper('now');
    });

    it('should work in template with formatDate', () => {
      const template = handlebars.compile('{{formatDate "2024-01-29"}}');
      const result = template({});
      expect(result).toBe(
        '<span class="imported-value" data-field="date">29/01/2024</span>'
      );
    });

    it('should work in template with addYears', () => {
      const template = handlebars.compile('{{addYears "2024-01-29" 1}}');
      const result = template({});
      expect(result).toBe(
        '<span class="imported-value" data-field="date">29/01/2025</span>'
      );
    });

    it('should work in template with now', () => {
      const template = handlebars.compile('{{now}}');
      const result = template({});
      expect(result).toBe(
        '<span class="imported-value" data-field="date">29/01/2024</span>'
      );
    });

    it('should handle nested helper calls', () => {
      const template = handlebars.compile(
        '{{formatDate (addYears "2024-01-29" 1)}}'
      );
      const result = template({});
      expect(result).toBe(
        '<span class="imported-value" data-field="date">29/01/2025</span>'
      );
    });

    it('should work with nested helpers', () => {
      const template = handlebars.compile('{{formatDate (addYears (now) 1)}}');
      const result = template({});
      expect(result).toContain('2025');
    });

    it('should preserve context in block helpers', () => {
      const template = handlebars.compile(
        '{{#each dates}}{{formatDate this}}{{/each}}'
      );
      const data = {
        dates: ['2024-01-29', '2024-02-29'],
      };
      const result = template(data);
      expect(result).toBe(
        '<span class="imported-value" data-field="date">29/01/2024</span>' +
          '<span class="imported-value" data-field="date">29/02/2024</span>'
      );
    });

    it('should handle dynamic formats', () => {
      const template = handlebars.compile('{{formatDate date format}}');
      const data = {
        date: '2024-01-29',
        format: 'yyyy-MM-dd',
      };
      const result = template(data);
      expect(result).toBe(
        '<span class="imported-value" data-field="date">2024-01-29</span>'
      );
    });

    it('should handle subexpressions in format', () => {
      const template = handlebars.compile(
        '{{formatDate date (addYears "2024-01-29" 1)}}'
      );
      const data = {
        date: '2024-01-29',
      };
      const result = template(data);
      expect(result).toBe(
        '<span class="imported-value" data-field="date">29/01/2024</span>'
      );
    });
  });
});
