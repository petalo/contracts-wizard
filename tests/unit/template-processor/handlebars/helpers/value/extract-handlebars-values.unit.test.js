const {
  extractValue,
  convertToBoolean,
} = require('@/utils/template-processor/handlebars/helpers/value/extract-handlebars-values');
const handlebars = require('handlebars');
const { logger } = require('@/utils/common/logger');

// Mock dependencies
jest.mock('@/utils/common/logger');
jest.mock('handlebars', () => ({
  SafeString: jest.fn(function (str) {
    this.string = str;
    this.toString = () => str;
  }),
  escapeExpression: jest.fn((str) => str),
}));

describe('extractValue', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('null and undefined handling', () => {
    it('should handle null value', () => {
      expect(extractValue(null)).toBeNull();
    });

    it('should handle undefined value', () => {
      expect(extractValue(undefined)).toBeNull();
    });

    it('should handle string "null"', () => {
      expect(extractValue('null')).toBeNull();
      expect(extractValue('NULL')).toBeNull();
    });
  });

  describe('string handling', () => {
    it('should preserve empty string', () => {
      expect(extractValue('')).toBe('');
    });

    it('should preserve whitespace in strings', () => {
      expect(extractValue('  test  ')).toBe('  test  ');
    });

    it('should handle special characters', () => {
      expect(extractValue('!@#$%^&*()')).toBe('!@#$%^&*()');
    });
  });

  describe('number handling', () => {
    it('should handle zero', () => {
      expect(extractValue(0)).toBe(0);
    });

    it('should handle positive numbers', () => {
      expect(extractValue(42)).toBe(42);
    });

    it('should handle negative numbers', () => {
      expect(extractValue(-42)).toBe(-42);
    });

    it('should handle numeric strings', () => {
      expect(extractValue('42')).toBe(42);
    });
  });

  describe('boolean handling', () => {
    it('should handle true', () => {
      expect(extractValue(true)).toBe(true);
    });

    it('should handle false', () => {
      expect(extractValue(false)).toBe(false);
    });

    it('should handle string "true"', () => {
      expect(extractValue('true')).toBe(true);
    });

    it('should handle string "false"', () => {
      expect(extractValue('false')).toBe(false);
    });
  });

  describe('SafeString handling', () => {
    it('should extract value from SafeString', () => {
      const safeStr = new handlebars.SafeString('test');
      expect(extractValue(safeStr)).toBe('test');
    });

    it('should handle missing-value in SafeString', () => {
      const safeStr = new handlebars.SafeString(
        '<span class="missing-value">[[test]]</span>'
      );
      expect(extractValue(safeStr)).toBe('');
    });

    it('should handle imported-value in SafeString', () => {
      const safeStr = new handlebars.SafeString(
        '<span class="imported-value" data-field="test">value</span>'
      );
      expect(extractValue(safeStr)).toBe('value');
    });

    it('should preserve spaces in imported-value', () => {
      const safeStr = new handlebars.SafeString(
        '<span class="imported-value" data-field="test">  spaced value  </span>'
      );
      expect(extractValue(safeStr)).toBe('  spaced value  ');
    });
  });

  describe('error handling', () => {
    it('should handle errors gracefully', () => {
      const badValue = {
        toString: () => {
          throw new Error('Bad value');
        },
      };
      expect(extractValue(badValue)).toBeNull();
      expect(logger.error).toHaveBeenCalled();
    });
  });
});
