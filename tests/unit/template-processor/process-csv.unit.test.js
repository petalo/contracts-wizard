/**
 * @jest-environment node
 */

const {
  processCsvData,
  validateCsvStructure,
  initializeDataFromFields,
  processDataLines,
  setNestedValue,
} = require('../../../src/utils/template-processor/core/process-csv');
const {
  extractTemplateFields,
} = require('../../../src/utils/template-processor/core/template-utils');
const fs = require('fs/promises');
const { AppError } = require('../../../src/utils/common/errors');
const { readFile } = require('fs');

jest.mock('fs/promises');
jest.mock('../../../src/utils/common/logger');
jest.mock('../../../src/utils/template-processor/core/template-utils');

describe.skip('CSV Processing', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('initializeDataFromFields', () => {
    it('should initialize simple fields with empty values', () => {
      const fields = ['name', 'age', 'email'];
      const result = initializeDataFromFields(fields);
      expect(result).toEqual({
        name: '',
        age: '',
        email: '',
      });
    });

    it('should initialize nested fields correctly', () => {
      const fields = ['person.name', 'person.age', 'address.street'];
      const result = initializeDataFromFields(fields);
      expect(result).toEqual({
        person: {
          name: '',
          age: '',
        },
        address: {
          street: '',
        },
      });
    });

    it('should handle array fields properly', () => {
      const fields = ['items.0', 'items.1', 'items.2'];
      const result = initializeDataFromFields(fields);
      expect(result).toEqual({
        items: ['', '', ''],
      });
    });

    it('should handle mixed nested arrays and objects', () => {
      const fields = ['users.0.name', 'users.0.age', 'users.1.name'];
      const result = initializeDataFromFields(fields);
      expect(result).toEqual({
        users: [
          {
            name: '',
            age: '',
          },
          { name: '' },
        ],
      });
    });
  });

  describe('validateCsvStructure', () => {
    it('should validate correct CSV structure', () => {
      const lines = ['key,value,comment', 'name,John,User name'];
      expect(validateCsvStructure(lines)).toBe(true);
    });

    it('should reject empty CSV', () => {
      const lines = [];
      expect(validateCsvStructure(lines)).toBe(false);
    });

    it('should reject CSV without key column', () => {
      const lines = ['value,comment', 'John,User name'];
      expect(validateCsvStructure(lines)).toBe(false);
    });

    it('should reject CSV without value column', () => {
      const lines = ['key,comment', 'name,User name'];
      expect(validateCsvStructure(lines)).toBe(false);
    });
  });

  describe('setNestedValue', () => {
    it('should set simple values', () => {
      const obj = {};
      setNestedValue(obj, 'name', 'John');
      expect(obj).toEqual({ name: 'John' });
    });

    it('should set nested object values', () => {
      const obj = {};
      setNestedValue(obj, 'person.name', 'John');
      expect(obj).toEqual({ person: { name: 'John' } });
    });

    it('should set array values', () => {
      const obj = {};
      setNestedValue(obj, 'items.0', 'first');
      setNestedValue(obj, 'items.2', 'third');
      expect(obj).toEqual({ items: ['first', '', 'third'] });
    });

    it('should handle mixed nested arrays and objects', () => {
      const obj = {};
      setNestedValue(obj, 'users.0.name', 'John');
      setNestedValue(obj, 'users.0.age', '30');
      expect(obj).toEqual({
        users: [
          {
            name: 'John',
            age: '30',
          },
        ],
      });
    });
  });

  describe('processDataLines', () => {
    it('should process simple key-value pairs', async () => {
      const lines = ['key,value', 'name,John', 'age,30'];
      const templateFields = ['name', 'age'];
      const result = await processDataLines(lines, templateFields);
      expect(result).toEqual({
        name: 'John',
        age: '30',
      });
    });

    it('should handle nested fields', async () => {
      const lines = ['key,value', 'person.name,John', 'person.age,30'];
      const templateFields = ['person.name', 'person.age'];
      const result = await processDataLines(lines, templateFields);
      expect(result).toEqual({
        person: {
          name: 'John',
          age: '30',
        },
      });
    });

    it('should handle array fields', async () => {
      const lines = ['key,value', 'items.0,first', 'items.1,second'];
      const templateFields = ['items.0', 'items.1'];
      const result = await processDataLines(lines, templateFields);
      expect(result).toEqual({
        items: ['first', 'second'],
      });
    });

    it('should handle empty values', async () => {
      const lines = ['key,value', 'name,', 'age,30'];
      const templateFields = ['name', 'age'];
      const result = await processDataLines(lines, templateFields);
      expect(result).toEqual({
        name: '',
        age: '30',
      });
    });
  });

  describe('processCsvData', () => {
    beforeEach(() => {
      fs.readFile.mockReset();
    });

    it('should process valid CSV file', async () => {
      const csvContent = 'key,value\nname,John\nage,30';
      const expectedFields = ['name', 'age'];

      fs.readFile.mockResolvedValueOnce(Buffer.from(csvContent));

      const result = await processCsvData('data.csv', expectedFields);

      expect(result).toEqual({
        name: 'John',
        age: '30',
      });

      expect(fs.readFile).toHaveBeenCalledTimes(1);
    });

    it('should handle missing template fields', async () => {
      const csvContent = 'key,value\nname,John\nage,30';
      const expectedFields = ['name', 'missing'];

      fs.readFile.mockResolvedValueOnce(Buffer.from(csvContent));

      const result = await processCsvData('data.csv', expectedFields);

      expect(result).toEqual({
        name: 'John',
        age: '30',
        missing: '',
      });

      expect(fs.readFile).toHaveBeenCalledTimes(1);
    });

    it('should handle invalid CSV', async () => {
      const csvContent = 'invalid,csv\nno,key,column';
      const expectedFields = ['field1', 'field2'];

      fs.readFile.mockResolvedValueOnce(Buffer.from(csvContent));

      await expect(processCsvData('data.csv', expectedFields)).rejects.toThrow(
        AppError
      );

      expect(fs.readFile).toHaveBeenCalledTimes(1);
    });

    it('should handle complex nested data', async () => {
      const csvContent = `key,value
person.name,John
person.age,30
addresses.0.street,Main St
addresses.0.city,NY
addresses.1.street,Second St
addresses.1.city,LA`;
      const expectedFields = [
        'person.name',
        'person.age',
        'addresses.0.street',
        'addresses.0.city',
        'addresses.1.street',
        'addresses.1.city',
      ];

      fs.readFile.mockResolvedValueOnce(Buffer.from(csvContent));

      const result = await processCsvData('data.csv', expectedFields);

      expect(result).toEqual({
        person: {
          name: 'John',
          age: '30',
        },
        addresses: [
          {
            street: 'Main St',
            city: 'NY',
          },
          {
            street: 'Second St',
            city: 'LA',
          },
        ],
      });

      expect(fs.readFile).toHaveBeenCalledTimes(1);
    });

    it('should handle string representation of empty array', async () => {
      const csvContent = 'key,value\nitems,[]';
      const expectedFields = ['items'];

      fs.readFile.mockResolvedValueOnce(Buffer.from(csvContent));

      const result = await processCsvData('data.csv', expectedFields);

      expect(result).toEqual({
        items: '[]',
      });
    });

    it('should handle array fields with gaps', async () => {
      const csvContent = `key,value
items.0,First
items.2,Third`;
      const expectedFields = ['items.0', 'items.1', 'items.2'];

      fs.readFile.mockResolvedValueOnce(Buffer.from(csvContent));

      const result = await processCsvData('data.csv', expectedFields);

      expect(result).toEqual({
        items: ['First', '', 'Third'],
      });
      expect(Array.isArray(result.items)).toBe(true);
    });
  });
});
