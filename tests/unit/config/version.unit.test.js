/**
 * @file Version configuration tests
 */

const { VERSION } = require('../../../src/config/version');

describe.skip('Version Configuration', () => {
  it('should have valid version information', () => {
    expect(VERSION).toBeDefined();
    expect(VERSION.current).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it('should have valid requirements', () => {
    expect(VERSION.requirements).toBeDefined();
    expect(VERSION.requirements.node).toBeDefined();
    expect(VERSION.requirements.npm).toBeDefined();
  });

  it('should have valid compatibility matrix', () => {
    expect(VERSION.compatibility).toBeDefined();
    expect(VERSION.compatibility.node).toBeDefined();
    expect(VERSION.compatibility.puppeteer).toBeDefined();
    expect(VERSION.compatibility.markdown).toBeDefined();
  });

  it('should be frozen to prevent modifications', () => {
    expect(() => {
      VERSION.current = '9.9.9';
    }).toThrow();

    expect(() => {
      VERSION.requirements.node = '99.0.0';
    }).toThrow();

    expect(() => {
      VERSION.compatibility.node.minimum = '99.0.0';
    }).toThrow();
  });
});
