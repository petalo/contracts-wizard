/**
 * @fileoverview Unit tests for debug logging initialization
 */

const { initializeDebugger } = require('@/utils/common/logDebugStarter');

describe.skip('Log Debug Starter', () => {
  let originalEnv;
  let mockDebug;

  beforeEach(() => {
    originalEnv = { ...process.env };
    mockDebug = jest.fn();
    jest.mock('debug', () => mockDebug);
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.resetModules();
  });

  test('should initialize debug logger with namespace', () => {
    process.env.DEBUG = 'app:*';
    const namespace = 'app:test';

    initializeDebugger(namespace);

    expect(mockDebug).toHaveBeenCalledWith(namespace);
  });

  test('should handle empty namespace', () => {
    expect(() => initializeDebugger('')).toThrow();
  });

  test('should handle invalid namespace', () => {
    expect(() => initializeDebugger(123)).toThrow();
  });

  test('should respect DEBUG environment variable', () => {
    process.env.DEBUG = 'app:test';
    const namespace = 'app:other';

    initializeDebugger(namespace);

    expect(mockDebug).toHaveBeenCalledWith(namespace);
  });

  test('should handle disabled debugging', () => {
    delete process.env.DEBUG;
    const namespace = 'app:test';

    initializeDebugger(namespace);

    expect(mockDebug).toHaveBeenCalledWith(namespace);
  });
});
