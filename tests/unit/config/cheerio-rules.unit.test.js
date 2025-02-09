/**
 * @file Unit tests for cheerio configuration rules
 */

const { CHEERIO_RULES } = require('@/config/cheerio-rules');

describe('Cheerio Rules Configuration', () => {
  test('should have valid XML mode configuration', () => {
    expect(CHEERIO_RULES.thresholds).toBeDefined();
    expect(typeof CHEERIO_RULES.thresholds.maxListItemsNoBreak).toBe('number');
  });

  test('should have valid selectors configuration', () => {
    expect(CHEERIO_RULES.selectors).toBeDefined();
    expect(CHEERIO_RULES.selectors.lists).toBe('ul, ol');
    expect(CHEERIO_RULES.selectors.tables).toBe('table');
    expect(CHEERIO_RULES.selectors.images).toBe('img:not([alt])');
  });

  test('should have valid classes configuration', () => {
    expect(CHEERIO_RULES.classes).toBeDefined();
    expect(CHEERIO_RULES.classes.noBreak).toBe('no-break');
    expect(CHEERIO_RULES.classes.tableResponsive).toBe('table-responsive');
  });

  test('should have transformation rules defined', () => {
    expect(CHEERIO_RULES.rules).toBeDefined();
    expect(typeof CHEERIO_RULES.rules.applyListTransformation).toBe('function');
    expect(typeof CHEERIO_RULES.rules.applyTableResponsive).toBe('function');
    expect(typeof CHEERIO_RULES.rules.applyImageAccessibility).toBe('function');
    expect(typeof CHEERIO_RULES.rules.applyAll).toBe('function');
  });
});
