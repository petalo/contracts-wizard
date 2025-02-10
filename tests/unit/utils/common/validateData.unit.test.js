/**
 * @fileoverview Unit tests for data validation functionality
 */

const { validateData } = require('@/utils/common/validateData');

describe.skip('Data Validation', () => {
  test('should validate required fields', () => {
    const data = {
      name: 'Test',
      age: 25,
    };
    const schema = {
      type: 'object',
      required: ['name', 'age'],
      properties: {
        name: { type: 'string' },
        age: { type: 'number' },
      },
    };

    expect(() => validateData(data, schema)).not.toThrow();
  });

  test('should throw error for missing required fields', () => {
    const data = {
      name: 'Test',
    };
    const schema = {
      type: 'object',
      required: ['name', 'age'],
      properties: {
        name: { type: 'string' },
        age: { type: 'number' },
      },
    };

    expect(() => validateData(data, schema)).toThrow();
  });

  test('should validate field types', () => {
    const data = {
      name: 123,
      age: 'invalid',
    };
    const schema = {
      type: 'object',
      properties: {
        name: { type: 'string' },
        age: { type: 'number' },
      },
    };

    expect(() => validateData(data, schema)).toThrow();
  });

  test('should validate nested objects', () => {
    const data = {
      user: {
        name: 'Test',
        address: {
          street: '123 Main St',
          city: 'Test City',
        },
      },
    };
    const schema = {
      type: 'object',
      properties: {
        user: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            address: {
              type: 'object',
              properties: {
                street: { type: 'string' },
                city: { type: 'string' },
              },
            },
          },
        },
      },
    };

    expect(() => validateData(data, schema)).not.toThrow();
  });

  test('should validate array fields', () => {
    const data = {
      tags: ['tag1', 'tag2', 'tag3'],
    };
    const schema = {
      type: 'object',
      properties: {
        tags: {
          type: 'array',
          items: { type: 'string' },
        },
      },
    };

    expect(() => validateData(data, schema)).not.toThrow();
  });

  test('should handle null values', () => {
    const data = {
      name: null,
    };
    const schema = {
      type: 'object',
      properties: {
        name: { type: ['string', 'null'] },
      },
    };

    expect(() => validateData(data, schema)).not.toThrow();
  });
});
