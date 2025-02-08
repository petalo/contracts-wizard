/**
 * @jest-environment node
 */

const handlebars = require('handlebars');
const {
  eachHelper,
  objectToArray,
  processChild,
} = require('@/utils/template-processor/handlebars/helpers/array/each');
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

describe.skip('Array Helpers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('objectToArray', () => {
    it('should return array as is', () => {
      const input = [1, 2, 3];
      expect(objectToArray(input)).toEqual(input);
    });

    it('should convert object with numeric keys to array', () => {
      const input = { 0: 'first', 1: 'second', 2: 'third' };
      expect(objectToArray(input)).toEqual(['first', 'second', 'third']);
    });

    it('should handle gaps in numeric keys', () => {
      const input = { 0: 'first', 2: 'third' };
      expect(objectToArray(input)).toEqual(['first', '', 'third']);
    });

    it('should return empty array for empty object', () => {
      expect(objectToArray({})).toEqual([]);
    });

    it('should return object as is if no numeric keys', () => {
      const input = { a: 1, b: 2 };
      expect(objectToArray(input)).toEqual(input);
    });

    it('should handle null input', () => {
      expect(objectToArray(null)).toBeNull();
    });

    it('should handle undefined input', () => {
      expect(objectToArray(undefined)).toBeUndefined();
    });

    it('should handle mixed numeric and non-numeric keys', () => {
      const input = { 0: 'first', a: 'alpha', 1: 'second' };
      expect(objectToArray(input)).toEqual(['first', 'second']);
    });
  });

  describe('processChild', () => {
    it('should process object with child array', () => {
      const input = { child: ['a', 'b', 'c'] };
      expect(processChild(input)).toEqual({ child: ['a', 'b', 'c'] });
    });

    it('should convert child object with numeric keys', () => {
      const input = { child: { 0: 'a', 1: 'b' } };
      expect(processChild(input)).toEqual({ child: ['a', 'b'] });
    });

    it('should handle nested child objects', () => {
      const input = {
        child: {
          0: { child: { 0: 'nested' } },
        },
      };
      expect(processChild(input)).toEqual({
        child: [{ child: ['nested'] }],
      });
    });

    it('should return input as is if no child property', () => {
      const input = { name: 'test' };
      expect(processChild(input)).toEqual(input);
    });

    it('should handle null input', () => {
      expect(processChild(null)).toBeNull();
    });

    it('should handle undefined input', () => {
      expect(processChild(undefined)).toBeUndefined();
    });
  });

  describe('eachHelper', () => {
    // Helper function to create Handlebars options mock
    const createOptions = (fn = jest.fn(), inverse = jest.fn()) => ({
      fn,
      inverse,
      data: {},
    });

    it('should iterate over array', () => {
      const context = ['a', 'b', 'c'];
      const fn = jest.fn((item) => item);
      const options = createOptions(fn);

      eachHelper(context, options);

      expect(fn).toHaveBeenCalledTimes(3);
      expect(fn).toHaveBeenNthCalledWith(1, 'a', expect.any(Object));
      expect(fn).toHaveBeenNthCalledWith(2, 'b', expect.any(Object));
      expect(fn).toHaveBeenNthCalledWith(3, 'c', expect.any(Object));
    });

    it('should provide correct data for array iteration', () => {
      const context = ['a', 'b'];
      const fn = jest.fn();
      const options = createOptions(fn);
      options.data = { root: {} };

      eachHelper(context, options);

      const firstCall = fn.mock.calls[0][1];
      expect(firstCall.data).toEqual(
        expect.objectContaining({
          index: 0,
          first: true,
          last: false,
          key: '0',
        })
      );

      const secondCall = fn.mock.calls[1][1];
      expect(secondCall.data).toEqual(
        expect.objectContaining({
          index: 1,
          first: false,
          last: true,
          key: '1',
        })
      );
    });

    it('should handle object with child property', () => {
      const context = { child: ['a', 'b'] };
      const fn = jest.fn((item) => item);
      const options = createOptions(fn);

      eachHelper(context, options);

      expect(fn).toHaveBeenCalledTimes(2);
      expect(fn).toHaveBeenNthCalledWith(1, 'a', expect.any(Object));
      expect(fn).toHaveBeenNthCalledWith(2, 'b', expect.any(Object));
    });

    it('should handle empty array', () => {
      const context = [];
      const fn = jest.fn();
      const inverse = jest.fn(() => 'empty');
      const options = createOptions(fn, inverse);

      const result = eachHelper(context, options);

      expect(fn).not.toHaveBeenCalled();
      expect(inverse).toHaveBeenCalled();
      expect(result).toBe('empty');
    });

    it('should handle null context', () => {
      const context = null;
      const fn = jest.fn();
      const inverse = jest.fn(() => 'empty');
      const options = createOptions(fn, inverse);

      const result = eachHelper(context, options);

      expect(fn).not.toHaveBeenCalled();
      expect(inverse).toHaveBeenCalled();
      expect(result).toBe('empty');
    });

    it('should handle regular object iteration', () => {
      const context = { a: 1, b: 2 };
      const fn = jest.fn((item) => item);
      const options = createOptions(fn);

      eachHelper(context, options);

      expect(fn).toHaveBeenCalledTimes(2);
      expect(fn).toHaveBeenNthCalledWith(1, 1, expect.any(Object));
      expect(fn).toHaveBeenNthCalledWith(2, 2, expect.any(Object));
    });

    it('should provide correct data for object iteration', () => {
      const context = { a: 1, b: 2 };
      const fn = jest.fn();
      const options = createOptions(fn);
      options.data = { root: {} };

      eachHelper(context, options);

      const firstCall = fn.mock.calls[0][1];
      expect(firstCall.data).toEqual(
        expect.objectContaining({
          key: 'a',
          index: 0,
          first: true,
          last: false,
        })
      );

      const secondCall = fn.mock.calls[1][1];
      expect(secondCall.data).toEqual(
        expect.objectContaining({
          key: 'b',
          index: 1,
          first: false,
          last: true,
        })
      );
    });

    it('should handle nested paths correctly', () => {
      const context = { child: { 0: { name: 'test' } } };
      const fn = jest.fn((item) => item);
      const options = createOptions(fn);
      options.data = { currentPath: 'parent' };

      eachHelper(context, options);

      const call = fn.mock.calls[0][1];
      expect(call.data.currentPath).toBe('parent.0');
    });

    it('should handle errors gracefully', () => {
      const context = { problematic: true };
      const fn = jest.fn(() => {
        throw new Error('Test error');
      });
      const options = createOptions(fn);

      const result = eachHelper(context, options);

      expect(result).toBe('');
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('Integration with Handlebars', () => {
    beforeEach(() => {
      handlebars.registerHelper('each', eachHelper);
    });

    afterEach(() => {
      handlebars.unregisterHelper('each');
    });

    it('should work with array in template', () => {
      const template = handlebars.compile('{{#each items}}{{this}},{{/each}}');
      const result = template({ items: ['a', 'b', 'c'] });
      expect(result).toBe('a,b,c,');
    });

    it('should work with object with numeric keys', () => {
      const template = handlebars.compile('{{#each items}}{{this}},{{/each}}');
      const result = template({ items: { 0: 'a', 1: 'b' } });
      expect(result).toBe('a,b,');
    });

    it('should handle empty values with else block', () => {
      const template = handlebars.compile(
        '{{#each items}}{{this}}{{else}}empty{{/each}}'
      );
      const result = template({ items: [] });
      expect(result).toBe('empty');
    });

    it('should handle nested iterations', () => {
      const template = handlebars.compile(
        '{{#each outer}}{{#each this}}{{this}},{{/each}}|{{/each}}'
      );
      const data = {
        outer: [
          ['a', 'b'],
          ['c', 'd'],
        ],
      };
      const result = template(data);
      expect(result).toBe('a,b,|c,d,|');
    });

    it('should handle @index and @key in template', () => {
      const template = handlebars.compile(
        '{{#each items}}[{{@index}}:{{@key}}]{{/each}}'
      );
      const result = template({ items: { a: 1, b: 2 } });
      expect(result).toBe('[0:a][1:b]');
    });
  });
});
