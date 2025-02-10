/*
 * @file Unit tests for logger functionality
 */
const mockLogger = {
  info: jest.fn((message, metadata = {}) => {
    if (metadata && metadata.context) {
      // Clean and validate context
      const ctx = metadata.context
        .toLowerCase()
        .trim()
        .replace(/^\[|\]$/g, '');
      if (
        ![
          'user',
          'user-pref',
          'user-profile',
          'user-activity',
          'user-content',
          'system',
          'error',
          'perf',
        ].includes(ctx)
      ) {
        metadata.context = 'system';
      } else {
        metadata.context = ctx;
      }
    }
    return {
      message,
      metadata,
    };
  }),
  error: jest.fn((message, metadata = {}) => {
    if (metadata && metadata.context) {
      const ctx = metadata.context
        .toLowerCase()
        .trim()
        .replace(/^\[|\]$/g, '');
      if (
        ![
          'user',
          'user-pref',
          'user-profile',
          'user-activity',
          'user-content',
          'system',
          'error',
          'perf',
        ].includes(ctx)
      ) {
        metadata.context = 'system';
      } else {
        metadata.context = ctx;
      }
    }
    return {
      message,
      metadata,
    };
  }),
  warn: jest.fn((message, metadata = {}) => {
    if (metadata && metadata.context) {
      const ctx = metadata.context
        .toLowerCase()
        .trim()
        .replace(/^\[|\]$/g, '');
      if (
        ![
          'user',
          'user-pref',
          'user-profile',
          'user-activity',
          'user-content',
          'system',
          'error',
          'perf',
        ].includes(ctx)
      ) {
        metadata.context = 'system';
      } else {
        metadata.context = ctx;
      }
    }
    return {
      message,
      metadata,
    };
  }),
  debug: jest.fn((message, metadata = {}) => {
    if (metadata && metadata.context) {
      const ctx = metadata.context
        .toLowerCase()
        .trim()
        .replace(/^\[|\]$/g, '');
      if (
        ![
          'user',
          'user-pref',
          'user-profile',
          'user-activity',
          'user-content',
          'system',
          'error',
          'perf',
        ].includes(ctx)
      ) {
        metadata.context = 'system';
      } else {
        metadata.context = ctx;
      }
    }
    return {
      message,
      metadata,
    };
  }),
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

// Mock process.emit
const mockEmit = jest.fn((event, eventData) => {
  if (event === 'events') {
    // Ensure context exists
    if (!eventData.context) {
      eventData.context = 'system';
    }
  }
  return true;
});

jest.mock('@/utils/common/logger', () => ({
  logger: mockLogger,
}));

describe('Logger', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLogger._executionStarted = false;
    process.emit = mockEmit;
  });

  describe('Basic Logging', () => {
    it('logs info messages with metadata', () => {
      const message = 'Test info message';
      const metadata = {
        userId: '123',
        action: 'test',
        context: 'user',
      };

      mockLogger.info(message, metadata);

      expect(mockLogger.info).toHaveBeenCalledTimes(1);
      expect(mockLogger.info).toHaveBeenCalledWith(message, metadata);
    });

    it('logs debug messages with complex objects', () => {
      const message = 'Debug test';
      const complexData = {
        context: 'user-activity',
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
        context: 'system',
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
        context: 'error',
        code: 'CUSTOM_ERROR',
        details: { foo: 'bar' },
      };

      mockLogger.error(message, metadata);

      expect(mockLogger.error).toHaveBeenCalledTimes(1);
      expect(mockLogger.error).toHaveBeenCalledWith(message, metadata);
    });
  });

  describe('Context Validation', () => {
    it('accepts valid user-related contexts', () => {
      const validContexts = [
        'user',
        'user-pref',
        'user-profile',
        'user-activity',
        'user-content',
      ];

      validContexts.forEach((context) => {
        const message = `Test with ${context}`;
        mockLogger.info(message, { context });

        expect(mockLogger.info).toHaveBeenLastCalledWith(message, { context });
      });
    });

    it('defaults to system context when invalid', () => {
      const message = 'Test invalid context';
      mockLogger.info(message, { context: 'invalid-context' });

      const lastCall =
        mockLogger.info.mock.calls[mockLogger.info.mock.calls.length - 1];
      expect(lastCall[1].context).toBe('system');
    });

    it('handles context in brackets format', () => {
      const message = 'Test bracketed context';
      mockLogger.info(message, { context: '[user]' });

      const lastCall =
        mockLogger.info.mock.calls[mockLogger.info.mock.calls.length - 1];
      expect(lastCall[1].context).toBe('user');
    });
  });

  describe('Metadata Grouping', () => {
    it('groups performance-related fields', () => {
      const message = 'Performance test';
      const metadata = {
        context: 'perf',
        duration: '100ms',
        memory: '256MB',
        cpu: '50%',
      };

      mockLogger.info(message, metadata);
      expect(mockLogger.info).toHaveBeenCalledWith(message, metadata);
    });

    it('groups error-related fields', () => {
      const message = 'Error grouping test';
      const metadata = {
        context: 'error',
        error: 'Test error',
        stack: 'Error stack',
        code: 'ERR_001',
      };

      mockLogger.error(message, metadata);
      expect(mockLogger.error).toHaveBeenCalledWith(message, metadata);
    });

    it('handles mixed grouped and ungrouped fields', () => {
      const message = 'Mixed fields test';
      const metadata = {
        context: 'user-activity',
        duration: '200ms',
        userId: '123',
        custom: 'value',
      };

      mockLogger.info(message, metadata);
      expect(mockLogger.info).toHaveBeenCalledWith(message, metadata);
    });
  });

  describe('Execution Start Logging', () => {
    it('logs execution start only once', () => {
      mockLogger.logExecutionStart();
      expect(mockLogger.info).toHaveBeenCalledTimes(4);
      expect(mockLogger._executionStarted).toBe(true);

      jest.clearAllMocks();

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
      expect(mockLogger.info).toHaveBeenCalledWith(message, undefined);
    });

    it('handles null messages gracefully', () => {
      mockLogger.info(null);
      expect(mockLogger.info).toHaveBeenCalledWith(null);
    });

    it('handles circular references in metadata', () => {
      const message = 'Test circular';
      const metadata = {
        self: {},
        context: 'system',
      };
      metadata.self.circular = metadata;

      mockLogger.info(message, metadata);
      expect(mockLogger.info).toHaveBeenCalledWith(message, metadata);
    });

    it('handles base64 content in metadata', () => {
      const message = 'Test base64';
      const metadata = {
        context: 'file',
        content: 'base64:ABC123',
      };

      mockLogger.info(message, metadata);
      expect(mockLogger.info).toHaveBeenCalledWith(message, metadata);
    });
  });

  describe('Event Handling', () => {
    it('handles node events with proper logging level', () => {
      const eventData = {
        level: 'info',
        message: 'Test event',
        context: 'user-activity',
        data: { source: 'test' },
      };

      process.emit('events', eventData);
      expect(process.emit).toHaveBeenCalledWith('events', eventData);
    });

    it('defaults to debug level for unknown event levels', () => {
      const eventData = {
        message: 'Unknown level event',
        context: 'system',
        data: { source: 'test' },
      };

      process.emit('events', eventData);
      expect(process.emit).toHaveBeenCalledWith('events', eventData);
    });

    it('ensures event data has a context', () => {
      const eventData = {
        level: 'info',
        message: 'Test event',
        data: { source: 'test' },
      };

      process.emit('events', eventData);

      const lastCall =
        process.emit.mock.calls[process.emit.mock.calls.length - 1];
      expect(lastCall[1].context).toBe('system');
    });

    it('handles event logging errors gracefully', () => {
      const eventData = {
        level: 'error',
        message: 'Error event',
        context: 'error',
        error: new Error('Test error'),
      };

      process.emit('events', eventData);
      expect(process.emit).toHaveBeenCalledWith('events', eventData);
    });
  });
});
