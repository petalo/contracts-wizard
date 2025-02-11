/**
 * @fileoverview Unit tests for template utility functions
 */

const {
  templateUtils,
} = require('@/utils/template-processor/core/template-utils');

describe.skip('Template Utils', () => {
  test('should validate template path', () => {
    const validPath = 'template.md';
    expect(() => templateUtils.validateTemplatePath(validPath)).not.toThrow();
  });

  test('should throw error for invalid template path', () => {
    const invalidPath = '';
    expect(() => templateUtils.validateTemplatePath(invalidPath)).toThrow();
  });

  test('should validate template content', () => {
    const validContent = '# Title\n{{content}}';
    expect(() =>
      templateUtils.validateTemplateContent(validContent)
    ).not.toThrow();
  });

  test('should throw error for empty template content', () => {
    const emptyContent = '';
    expect(() => templateUtils.validateTemplateContent(emptyContent)).toThrow();
  });

  test('should extract frontmatter', () => {
    const template = `---
title: Test
version: 1.0
---
# Content`;
    const frontmatter = templateUtils.extractFrontmatter(template);
    expect(frontmatter).toEqual({
      title: 'Test',
      version: '1.0',
    });
  });

  test('should handle template without frontmatter', () => {
    const template = '# Content';
    const frontmatter = templateUtils.extractFrontmatter(template);
    expect(frontmatter).toEqual({});
  });

  test('should validate frontmatter', () => {
    const validFrontmatter = {
      title: 'Test',
      version: '1.0',
    };
    expect(() =>
      templateUtils.validateFrontmatter(validFrontmatter)
    ).not.toThrow();
  });

  test('should throw error for invalid frontmatter', () => {
    const invalidFrontmatter = {
      title: '',
      version: null,
    };
    expect(() =>
      templateUtils.validateFrontmatter(invalidFrontmatter)
    ).toThrow();
  });

  test('should process template variables', () => {
    const template = 'Hello {{name}}!';
    const data = { name: 'World' };
    const result = templateUtils.processVariables(template, data);
    expect(result).toBe('Hello World!');
  });

  test('should handle missing variables', () => {
    const template = 'Hello {{name}}!';
    const data = {};
    const result = templateUtils.processVariables(template, data);
    expect(result).toBe('Hello !');
  });

  test('should process nested variables', () => {
    const template = 'Hello {{user.name}}!';
    const data = { user: { name: 'World' } };
    const result = templateUtils.processVariables(template, data);
    expect(result).toBe('Hello World!');
  });

  test('should handle array variables', () => {
    const template = '{{#each items}}{{this}},{{/each}}';
    const data = { items: ['a', 'b', 'c'] };
    const result = templateUtils.processVariables(template, data);
    expect(result).toBe('a,b,c,');
  });
});
