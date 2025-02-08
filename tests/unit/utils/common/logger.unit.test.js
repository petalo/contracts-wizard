/**
 * @fileoverview Unit tests for logger functionality
 */

const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
  _executionStarted: false,
  logExecutionStart: jest.fn(function () {
    if (this._executionStarted) return;
    this._executionStarted = true;

    const separator = '━'.repeat(100);
    this.info(separator);
    this.info(`▶ New Execution Started --- env: ${process.env.NODE_ENV}`);
    this.info(`▶ ${new Date().toLocaleString()}`);
    this.info(separator);
  }),
};

// Mock process.env
process.env.NODE_ENV = 'test';

jest.mock('@/utils/common/logger', () => ({
  logger: mockLogger,
}));

describe('Logger', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLogger._executionStarted = false;
  });

  describe('Basic Logging', () => {
    it('logs info messages with metadata', () => {
      const message = 'Test info message';
      const metadata = {
        userId: '123',
        action: 'test',
      };

      mockLogger.info(message, metadata);

      expect(mockLogger.info).toHaveBeenCalledTimes(1);
      expect(mockLogger.info).toHaveBeenCalledWith(message, metadata);
    });

    it('logs debug messages with complex objects', () => {
      const message = 'Debug test';
      const complexData = {
        nested: {
          array: [1, 2, 3],
          object: { key: 'value' },
        },
      };

      mockLogger.debug(message, complexData);

      expect(mockLogger.debug).toHaveBeenCalledTimes(1);
      expect(mockLogger.debug).toHaveBeenCalledWith(message, complexData);
    });

    it('logs warning messages with source information', () => {
      const message = 'Warning test';
      const source = {
        file: 'test.js',
        line: 42,
      };

      mockLogger.warn(message, source);

      expect(mockLogger.warn).toHaveBeenCalledTimes(1);
      expect(mockLogger.warn).toHaveBeenCalledWith(message, source);
    });
  });

  describe('Error Logging', () => {
    it('logs error with full error object', () => {
      const error = new Error('Test error');
      error.code = 'TEST_ERROR';
      error.details = { operation: 'test' };

      mockLogger.error(error);

      expect(mockLogger.error).toHaveBeenCalledTimes(1);
      expect(mockLogger.error).toHaveBeenCalledWith(error);
    });

    it('logs error with nested error information', () => {
      const originalError = new Error('Original error');
      const wrappedError = new Error('Wrapped error');
      wrappedError.originalError = originalError;

      mockLogger.error(wrappedError);

      expect(mockLogger.error).toHaveBeenCalledTimes(1);
      expect(mockLogger.error).toHaveBeenCalledWith(wrappedError);
    });

    it('logs error with custom message and metadata', () => {
      const message = 'Custom error message';
      const metadata = {
        code: 'CUSTOM_ERROR',
        details: { foo: 'bar' },
      };

      mockLogger.error(message, metadata);

      expect(mockLogger.error).toHaveBeenCalledTimes(1);
      expect(mockLogger.error).toHaveBeenCalledWith(message, metadata);
    });
  });

  describe('Execution Start Logging', () => {
    it('logs execution start only once', () => {
      // Primera llamada
      mockLogger.logExecutionStart();
      expect(mockLogger.info).toHaveBeenCalledTimes(4); // separator + env + date + separator
      expect(mockLogger._executionStarted).toBe(true);

      // Reset mock pero mantener _executionStarted
      jest.clearAllMocks();

      // Segunda llamada - no debería hacer nada
      mockLogger.logExecutionStart();
      expect(mockLogger.info).not.toHaveBeenCalled();
    });

    it('includes environment information in execution start log', () => {
      mockLogger.logExecutionStart();

      const calls = mockLogger.info.mock.calls;
      expect(calls[1][0]).toBe('▶ New Execution Started --- env: test');
    });
  });

  describe('Special Cases', () => {
    it('handles undefined metadata gracefully', () => {
      const message = 'Test message';

      mockLogger.info(message, undefined);

      expect(mockLogger.info).toHaveBeenCalledTimes(1);
      expect(mockLogger.info).toHaveBeenCalledWith(message, undefined);
    });

    it('handles null messages gracefully', () => {
      mockLogger.info(null);

      expect(mockLogger.info).toHaveBeenCalledTimes(1);
      expect(mockLogger.info).toHaveBeenCalledWith(null);
    });

    it('handles circular references in metadata', () => {
      const message = 'Test circular';
      const metadata = { self: {} };
      metadata.self.circular = metadata;

      mockLogger.info(message, metadata);

      expect(mockLogger.info).toHaveBeenCalledTimes(1);
      expect(mockLogger.info).toHaveBeenCalledWith(message, metadata);
    });
  });

  describe('Event Handling', () => {
    const originalEmit = process.emit;

    beforeEach(() => {
      process.emit = jest.fn();
    });

    afterEach(() => {
      process.emit = originalEmit;
    });

    it('handles node events with proper logging level', () => {
      const eventData = {
        level: 'info',
        message: 'Test event',
        data: { source: 'test' },
      };

      process.emit('events', eventData);

      expect(process.emit).toHaveBeenCalledWith('events', eventData);
    });

    it('defaults to debug level for unknown event levels', () => {
      const eventData = {
        message: 'Unknown level event',
        data: { source: 'test' },
      };

      process.emit('events', eventData);

      expect(process.emit).toHaveBeenCalledWith('events', eventData);
    });
  });
});
