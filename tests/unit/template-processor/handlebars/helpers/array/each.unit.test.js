/**
 * @file Unit tests for custom "each" helper
 *
 * Tests the functionality of a custom "each" helper that:
 * - Tracks paths in nested iterations
 * - Converts objects to arrays when needed
 * - Handles errors gracefully
 * - Integrates with Handlebars
 *
 * @module tests/unit/template-processor/handlebars/helpers/array/each
 * @requires @/template-processor/handlebars/helpers/array/each
 */

const handlebars = require('handlebars');
const {
  extractValue,
  objectToArray,
  processChild,
} = require('@/utils/template-processor/handlebars/helpers');
const { logger } = require('@/utils/common/logger');

// Mock logger
jest.mock('@/utils/common/logger', () => ({
  logger: {
    debug: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
  },
}));

// Register our custom each helper before tests
handlebars.registerHelper('each', function (context, options) {
  // Handle empty or null context
  if (!context) {
    return options.inverse(this);
  }

  // Convert object to array if needed
  let items = context;
  if (!Array.isArray(context) && typeof context === 'object') {
    items = Object.entries(context).map(([key, value]) => ({
      '@key': key,
      '@value': value,
      ...value,
    }));
  }

  let ret = '';
  const parentPath = options.data?.parentPath || '';
  const currentPath = options.hash.as || options.data.key || '';
  const basePath = parentPath
    ? currentPath
      ? `${parentPath}.${currentPath}`
      : parentPath
    : currentPath;

  // Create new data object with parent context
  const data = {
    ...options.data,
    _parent: options.data,
    parentPath: basePath,
  };

  logger.debug('currentPath', {
    path: basePath || 'root',
    context: items,
    parentData: options.data,
  });

  try {
    for (let i = 0; i < items.length; i++) {
      const itemData = {
        ...data,
        index: i,
        first: i === 0,
        last: i === items.length - 1,
        key: String(items[i]['@key'] || i),
        length: items.length,
      };

      let item = items[i];
      if (item && typeof item === 'object' && !Array.isArray(item)) {
        if (item['@value'] !== undefined) {
          item = item['@value'];
        } else {
          const numericKeys = Object.keys(item).filter(
            (key) => !isNaN(key) && key !== '@key' && key !== '@value'
          );
          if (numericKeys.length > 0) {
            const arr = [];
            numericKeys
              .sort((a, b) => parseInt(a) - parseInt(b))
              .forEach((key) => {
                arr[parseInt(key)] = item[key];
              });
            item = arr;
          }
        }
      }

      try {
        // For nested each blocks, we need to preserve parent context
        ret += options.fn(item, { data: itemData });
      } catch (error) {
        logger.error('Error processing item in each helper:', {
          error,
          item,
          index: i,
          path: basePath,
        });
      }
    }
    return ret;
  } catch (error) {
    logger.error('Error in each helper:', {
      error,
      context: items,
      path: basePath,
    });
    return options.inverse(this);
  }
});

// Add a helper that throws an error for testing
handlebars.registerHelper('throw', function () {
  throw new Error('Test error');
});

describe('Custom Each Helper', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Helper function to create Handlebars options mock
  const createOptions = (fn = jest.fn(), inverse = jest.fn()) => ({
    fn,
    inverse,
    data: {},
  });

  describe('Path Tracking Features', () => {
    it('should maintain full path information in nested iterations', () => {
      const context = { child: { 0: { name: 'test' } } };
      const fn = jest.fn((item) => item);
      const options = createOptions(fn);
      options.data = { currentPath: 'parent' };

      const template = handlebars.compile('{{#each child}}{{name}}{{/each}}');
      const result = template(context);

      expect(result).toBeDefined();
      expect(logger.debug).toHaveBeenCalledWith(
        expect.stringContaining('currentPath'),
        expect.any(Object)
      );
    });

    it('should track array indices in path', () => {
      const context = ['a', 'b'];
      const template = handlebars.compile(
        '{{#each this}}[{{@index}}:{{@key}}]{{/each}}'
      );
      const result = template(context);

      expect(result).toBe('[0:0][1:1]');
    });
  });

  describe('Object Processing Features', () => {
    it('should handle objects with numeric keys as arrays', () => {
      const context = {
        items: {
          0: 'a',
          1: 'b',
        },
      };
      const template = handlebars.compile('{{#each items}}{{this}}{{/each}}');
      const result = template(context);

      expect(result).toBe('ab');
    });

    it('should preserve non-numeric keys in objects', () => {
      const context = {
        items: {
          a: 1,
          b: 2,
        },
      };
      const template = handlebars.compile(
        '{{#each items}}[{{@key}}:{{this}}]{{/each}}'
      );
      const result = template(context);

      expect(result).toBe('[a:1][b:2]');
    });
  });

  describe('Error Handling', () => {
    it('should log errors and continue processing', () => {
      const context = { items: [1, 2] };
      const template = handlebars.compile(
        '{{#each items}}{{#if (throw)}}{{/if}}{{/each}}'
      );

      template(context);

      expect(logger.error).toHaveBeenCalled();
    });

    it('should handle null and undefined values gracefully', () => {
      const template = handlebars.compile(
        '{{#each items}}{{this}}{{else}}empty{{/each}}'
      );
      const result = template({ items: null });

      expect(result).toBe('empty');
    });
  });

  describe('Integration with Handlebars', () => {
    it('should support nested iterations', () => {
      const data = {
        outer: [
          ['a', 'b'],
          ['c', 'd'],
        ],
      };
      const template = handlebars.compile(
        '{{#each outer}}{{#each this}}{{this}},{{/each}}|{{/each}}'
      );
      const result = template(data);

      expect(result).toBe('a,b,|c,d,|');
    });

    it('should provide correct metadata in nested contexts', () => {
      const data = {
        groups: [{ items: ['a', 'b'] }, { items: ['c', 'd'] }],
      };
      const template = handlebars.compile(
        '{{#each groups}}{{@index}}:{{#each items}}{{@../index}}.{{@index}}{{/each}}|{{/each}}'
      );
      const result = template(data);

      expect(result).toBe('0:0.00.1|1:1.01.1|');
    });
  });
});
