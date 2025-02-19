/**
 * @file Tests for template field extraction functionality
 *
 * Tests the field extraction system's ability to:
 * - Extract simple fields
 * - Handle nested fields
 * - Process array fields
 * - Handle conditional blocks
 * - Process helper expressions
 * - Handle complex expressions
 * - Validate edge cases
 *
 * Functions Tested:
 * - extractTemplateFields: Main field extraction function
 *
 * Flow:
 * 1. Setup test environment
 * 2. Execute test cases
 * 3. Validate results
 * 4. Clean up
 *
 * Error Handling:
 * - Tests invalid inputs
 * - Verifies error cases
 * - Validates edge cases
 *
 * @module tests/unit/utils/templateProcessor/core/extract-fields.unit.test
 * @requires @/utils/template-processor/core/extract-fields
 */

const {
  extractTemplateFields,
  processNode,
  NODE_TYPES,
} = require('@utils/template-processor/core/extract-fields');

describe('Field Extraction', () => {
  test('should extract simple fields', async () => {
    const template = 'Hello {{name}}, your age is {{age}}';
    const fields = await extractTemplateFields(template);

    expect(fields).toContain('name');
    expect(fields).toContain('age');
    expect(fields).toHaveLength(2);
  });

  test('should extract nested fields', async () => {
    const template = '{{user.name}} lives in {{user.address.city}}';
    const fields = await extractTemplateFields(template);

    expect(fields).toContain('user.name');
    expect(fields).toContain('user.address.city');
    expect(fields).toHaveLength(2);
  });

  test('should extract array fields', async () => {
    const template = '{{#each items}}{{name}}{{/each}}';
    const fields = await extractTemplateFields(template);

    expect(fields).toContain('items');
    expect(fields).toContain('items.name');
    expect(fields).toHaveLength(2);
  });

  test('should handle conditional blocks', async () => {
    const template = '{{#if isActive}}Active{{else}}Inactive{{/if}}';
    const fields = await extractTemplateFields(template);

    expect(fields).toContain('isActive');
    expect(fields).toHaveLength(1);
  });

  test('should handle helper expressions', async () => {
    const template = '{{formatDate date "DD/MM/YYYY"}}';
    const fields = await extractTemplateFields(template);

    expect(fields).toContain('date');
    expect(fields).toHaveLength(1);
  });

  test('should handle nested helpers', async () => {
    const template = '{{#with user}}{{firstName}} {{lastName}}{{/with}}';
    const fields = await extractTemplateFields(template);

    expect(fields).toContain('user');
    expect(fields).toContain('user.firstName');
    expect(fields).toContain('user.lastName');
    expect(fields).toHaveLength(3);
  });

  test('should handle complex expressions', async () => {
    const template = `
      {{#each users}}
        {{#if isActive}}
          {{profile.name}} ({{profile.age}})
          {{#each profile.addresses}}
            {{street}}, {{city}}
          {{/each}}
        {{/if}}
      {{/each}}
    `;
    const fields = await extractTemplateFields(template);

    expect(fields).toContain('users');
    expect(fields).toContain('users.isActive');
    expect(fields).toContain('users.profile.name');
    expect(fields).toContain('users.profile.age');
    expect(fields).toContain('users.profile.addresses');
    expect(fields).toContain('users.profile.addresses.street');
    expect(fields).toContain('users.profile.addresses.city');
    expect(fields).toHaveLength(7);
  });

  test('should handle empty template', async () => {
    await expect(extractTemplateFields('')).rejects.toThrow(
      'No fields found in template'
    );
  });

  test('should handle template without fields', async () => {
    const template = 'Hello World!';
    await expect(extractTemplateFields(template)).rejects.toThrow(
      'No fields found in template'
    );
  });

  test('should handle duplicate fields', async () => {
    const template = '{{name}} {{age}} {{name}}';
    const fields = await extractTemplateFields(template);

    expect(fields).toContain('name');
    expect(fields).toContain('age');
    expect(fields).toHaveLength(2);
  });

  test('should handle whitespace in field names', async () => {
    const template = '{{ name }} {{  user.age  }}';
    const fields = await extractTemplateFields(template);

    expect(fields).toContain('name');
    expect(fields).toContain('user.age');
    expect(fields).toHaveLength(2);
  });

  test('should handle special characters in field names', async () => {
    const template = '{{userName}} {{data.specialKey}}';
    const fields = await extractTemplateFields(template);

    expect(fields).toContain('userName');
    expect(fields).toContain('data.specialKey');
    expect(fields).toHaveLength(2);
  });

  test('should extract fields from helper expressions', async () => {
    const template = `
      {{formatDate contract.signing.date "FULL"}}
      {{formatCurrency invoice.amount currency="EUR"}}
      {{#if (eq user.type "admin")}}
        {{user.permissions}}
      {{/if}}
      {{#with company.details}}
        {{name}} ({{formatDate foundedOn "YYYY"}})
      {{/with}}
    `;
    const fields = await extractTemplateFields(template);

    expect(fields).toContain('contract.signing.date');
    expect(fields).toContain('invoice.amount');
    expect(fields).toContain('user.type');
    expect(fields).toContain('user.permissions');
    expect(fields).toContain('company.details');
    expect(fields).toContain('company.details.name');
    expect(fields).toContain('company.details.foundedOn');
    expect(fields).toHaveLength(7);
  });

  test('should extract fields from nested helper expressions', async () => {
    const template = `
      {{#if (or (eq status.type "pending") (gt invoice.amount 1000))}}
        {{formatDate payment.dueDate "FULL"}}
      {{/if}}
    `;
    const fields = await extractTemplateFields(template);

    expect(fields).toContain('status.type');
    expect(fields).toContain('invoice.amount');
    expect(fields).toContain('payment.dueDate');
    expect(fields).toHaveLength(3);
  });

  test('should extract fields from helper hash arguments', async () => {
    const template = `
      {{formatNumber total precision=invoice.precision currency=user.preferences.currency}}
    `;
    const fields = await extractTemplateFields(template);

    expect(fields).toContain('total');
    expect(fields).toContain('invoice.precision');
    expect(fields).toContain('user.preferences.currency');
    expect(fields).toHaveLength(3);
  });

  describe('processNode', () => {
    test('should process MustacheStatement nodes', () => {
      const fields = new Set();
      const node = {
        type: NODE_TYPES.MUSTACHE,
        path: {
          type: NODE_TYPES.PATH,
          original: 'name',
          data: false,
          parts: ['name'],
        },
        params: [],
      };

      processNode(node, fields);
      expect(fields.has('name')).toBe(true);
    });

    test('should process BlockStatement nodes', () => {
      const fields = new Set();
      const node = {
        type: NODE_TYPES.BLOCK,
        path: {
          type: NODE_TYPES.PATH,
          original: 'each',
          parts: ['each'],
        },
        params: [
          {
            type: NODE_TYPES.PATH,
            original: 'items',
            data: false,
            parts: ['items'],
          },
        ],
        program: {
          body: [],
        },
      };

      processNode(node, fields);
      expect(fields.has('items')).toBe(true);
    });

    test('should handle nested contexts in each blocks', () => {
      const fields = new Set();
      const node = {
        type: NODE_TYPES.BLOCK,
        path: {
          type: NODE_TYPES.PATH,
          original: 'each',
          parts: ['each'],
        },
        params: [
          {
            type: NODE_TYPES.PATH,
            original: 'items',
            data: false,
            parts: ['items'],
          },
        ],
        program: {
          body: [
            {
              type: NODE_TYPES.MUSTACHE,
              path: {
                type: NODE_TYPES.PATH,
                original: 'name',
                data: false,
                parts: ['name'],
              },
              params: [],
            },
          ],
        },
      };

      processNode(node, fields);
      expect(fields.has('items')).toBe(true);
      expect(fields.has('items.name')).toBe(true);
    });
  });
});
