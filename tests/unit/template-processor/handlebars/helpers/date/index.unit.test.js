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

const moment = require('moment-timezone');
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

    // Configure moment
    moment.locale(LOCALE_CONFIG.locale);
    moment.tz.setDefault(LOCALE_CONFIG.timezone);

    // Load Spanish locale
    require('moment/locale/es');
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
      const format = 'YYYY-MM-DD';
      const result = formatDate(date, format);
      expect(result.toString()).toBe(
        '<span class="imported-value" data-field="date">2024-01-29</span>'
      );
    });

    it('should format date with Spanish locale', () => {
      const date = '2024-01-29';
      const format = 'D [de] MMMM [de] YYYY';
      const result = formatDate(date, format);
      expect(result.toString()).toBe(
        '<span class="imported-value" data-field="date">29 de enero de 2024</span>'
      );
    });

    it('should handle predefined formats', () => {
      const date = '2024-01-29';
      const format = 'DEFAULT';
      extractValue.mockImplementation((val) => {
        if (val === 'DEFAULT') return 'DD/MM/YYYY';
        return val;
      });
      const result = formatDate(date, format);
      expect(result.toString()).toBe(
        '<span class="imported-value" data-field="date">29/01/2024</span>'
      );
    });

    it('should handle invalid date', () => {
      const result = formatDate('invalid-date');
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
        throw new Error('Extraction failed');
      });
      const result = formatDate('2024-01-29');
      expect(result.toString()).toBe(
        '<span class="missing-value" data-field="date">[[Error formatting date]]</span>'
      );
    });
  });

  describe('addYears', () => {
    it('should add years to date', () => {
      const date = '2024-01-29';
      const years = 1;
      const result = addYears(date, years);
      expect(result.toString()).toBe(
        '<span class="imported-value" data-field="date">29 de enero de 2025</span>'
      );
    });

    it('should handle negative years', () => {
      const date = '2024-01-29';
      const years = -1;
      const result = addYears(date, years);
      expect(result.toString()).toBe(
        '<span class="imported-value" data-field="date">29 de enero de 2023</span>'
      );
    });

    it('should handle leap years', () => {
      const date = '2024-02-29';
      const years = 1;
      const result = addYears(date, years);
      expect(result.toString()).toBe(
        '<span class="imported-value" data-field="date">28 de febrero de 2025</span>'
      );
    });

    it('should handle leap year to leap year', () => {
      const date = '2020-02-29';
      const years = 4;
      const result = addYears(date, years);
      expect(result.toString()).toBe(
        '<span class="imported-value" data-field="date">29 de febrero de 2024</span>'
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
      // Temporarily suppress moment warnings for this test
      const originalWarn = console.warn;
      console.warn = jest.fn();

      const result = addYears('invalid-date', 1);
      expect(result.toString()).toBe(
        '<span class="missing-value" data-field="date">[[Invalid date]]</span>'
      );

      // Restore console.warn
      console.warn = originalWarn;
    });

    it('should handle extraction errors', () => {
      extractValue.mockImplementation(() => {
        throw new Error('Extraction failed');
      });
      const result = addYears('2024-01-29', 1);
      expect(result.toString()).toBe(
        '<span class="missing-value" data-field="date">[[Error adding years to date]]</span>'
      );
    });
  });

  describe('now', () => {
    let mockDate;

    beforeEach(() => {
      // Mock Date to return a fixed value
      mockDate = new Date('2024-01-29T12:00:00.000Z');
      jest.spyOn(global, 'Date').mockImplementation(() => mockDate);
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should return current date with default format', () => {
      const result = now();
      expect(result.toString()).toBe(
        '<span class="imported-value" data-field="date">29/01/2024</span>'
      );
    });

    it('should return current date with custom format', () => {
      const format = 'YYYY-MM-DD';
      const result = now(format);
      expect(result.toString()).toBe(
        '<span class="imported-value" data-field="date">2024-01-29</span>'
      );
    });

    it('should return current date with Spanish locale', () => {
      const format = 'D [de] MMMM [de] YYYY';
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
        throw new Error('Extraction failed');
      });
      const result = now('YYYY-MM-DD');
      expect(result.toString()).toBe(
        '<span class="missing-value" data-field="date">[[Error getting current date]]</span>'
      );
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
      const template = handlebars.compile('{{formatDate date "DD/MM/YYYY"}}');
      const result = template({ date: '2024-01-29' });
      expect(result).toBe(
        '<span class="imported-value" data-field="date">29/01/2024</span>'
      );
    });

    it('should work in template with addYears', () => {
      const template = handlebars.compile('{{addYears date 1}}');
      const result = template({ date: '2024-01-29' });
      expect(result).toBe(
        '<span class="imported-value" data-field="date">29 de enero de 2025</span>'
      );
    });

    it('should work in template with now', () => {
      const mockDate = new Date('2024-01-29T12:00:00.000Z');
      jest.spyOn(global, 'Date').mockImplementation(() => mockDate);

      const template = handlebars.compile('{{now "DD/MM/YYYY"}}');
      const result = template({});
      expect(result).toBe(
        '<span class="imported-value" data-field="date">29/01/2024</span>'
      );

      jest.restoreAllMocks();
    });

    it('should handle nested helper calls', () => {
      // Mock extractValue to handle both simple values and SafeStrings
      extractValue.mockImplementation((val) => {
        console.log('extractValue called with:', val);
        if (val instanceof handlebars.SafeString) {
          const match = val.string.match(/data-field="date">([^<]+)<\/span>/);
          if (match && match[1]) {
            return match[1];
          }
        }
        return val;
      });

      console.log('Starting nested helper test');
      console.log('Creating template with nested helpers');
      const template = handlebars.compile(
        '{{formatDate (addYears date 1) "D [de] MMMM [de] YYYY"}}'
      );
      console.log('Template created');

      console.log('Executing template with date:', '2024-01-29');
      const result = template({ date: '2024-01-29' });
      console.log('Template execution result:', result);

      console.log(
        'Expected:',
        '<span class="imported-value" data-field="date">29 de enero de 2025</span>'
      );
      console.log('Received:', result);
      expect(result).toBe(
        '<span class="imported-value" data-field="date">29 de enero de 2025</span>'
      );

      jest.restoreAllMocks();
    });
  });
});
