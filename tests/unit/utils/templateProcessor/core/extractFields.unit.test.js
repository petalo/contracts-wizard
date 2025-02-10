/**
 * @fileoverview Unit tests for template field extraction
 */

const {
  extractFields,
} = require('@/utils/templateProcessor/core/extractFields');

describe.skip('Extract Fields Utility', () => {
  test('should extract simple fields', () => {
    const template = 'Hello {{name}}, your age is {{age}}';
    const fields = extractFields(template);

    expect(fields).toContain('name');
    expect(fields).toContain('age');
  });

  test('should extract nested fields', () => {
    const template = '{{user.name}} lives in {{user.address.city}}';
    const fields = extractFields(template);

    expect(fields).toContain('user.name');
    expect(fields).toContain('user.address.city');
  });

  test('should extract array fields', () => {
    const template = '{{#each items}}{{this.name}}{{/each}}';
    const fields = extractFields(template);

    expect(fields).toContain('items');
    expect(fields).toContain('items.name');
  });

  test('should handle conditional blocks', () => {
    const template = '{{#if isActive}}Active{{else}}Inactive{{/if}}';
    const fields = extractFields(template);

    expect(fields).toContain('isActive');
  });

  test('should handle helper expressions', () => {
    const template = '{{formatDate date "DD/MM/YYYY"}}';
    const fields = extractFields(template);

    expect(fields).toContain('date');
  });

  test('should handle nested helpers', () => {
    const template = '{{#with user}}{{formatName firstName lastName}}{{/with}}';
    const fields = extractFields(template);

    expect(fields).toContain('user');
    expect(fields).toContain('user.firstName');
    expect(fields).toContain('user.lastName');
  });

  test('should handle complex expressions', () => {
    const template = `
      {{#each users}}
        {{#if isActive}}
          {{#with profile}}
            {{formatName firstName lastName}}
            {{#each addresses}}
              {{street}}, {{city}}
            {{/each}}
          {{/with}}
        {{/if}}
      {{/each}}
    `;
    const fields = extractFields(template);

    expect(fields).toContain('users');
    expect(fields).toContain('users.isActive');
    expect(fields).toContain('users.profile');
    expect(fields).toContain('users.profile.firstName');
    expect(fields).toContain('users.profile.lastName');
    expect(fields).toContain('users.profile.addresses');
    expect(fields).toContain('users.profile.addresses.street');
    expect(fields).toContain('users.profile.addresses.city');
  });

  test('should handle empty template', () => {
    const fields = extractFields('');
    expect(fields).toHaveLength(0);
  });

  test('should handle template without fields', () => {
    const template = 'Hello World!';
    const fields = extractFields(template);
    expect(fields).toHaveLength(0);
  });
});
