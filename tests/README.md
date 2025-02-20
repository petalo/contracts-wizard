# Test Directory Structure

This directory contains all test-related files and configurations for the project.

## Directory Structure

```text
tests/
├── __common__/            # Shared code between all test types
│   ├── helpers/          # Test helper functions and utilities
│   ├── fixtures/         # Test fixtures and sample data
│   ├── mocks/           # Shared mock implementations
│   └── utils/           # General utilities for testing
├── unit/                # Unit tests (fast, isolated)
├── integration/         # Integration tests (component interaction)
├── e2e/                # End-to-end tests (full system)
├── config/             # Test configuration and setup
│   ├── test-setup.js   # Main test configuration
│   ├── e2e-setup.js    # E2E specific setup
│   ├── global-setup.js # Global Jest setup
│   └── timeouts.js     # Test timeout configurations
├── coverage/           # Coverage reports
├── reports/            # Test reports (JUnit, HTML)
└── environment.js      # Environment configuration
```

## Test Types

### Unit Tests (`unit/`)

- Fast, isolated tests for individual components
- One-to-one mapping with source files
- Default timeout: 5 seconds
- Coverage threshold: 80% (global), 90% (core)

### Integration Tests (`integration/`)

- Tests multiple components working together
- Focus on component interactions
- Default timeout: 10 seconds
- Includes template processing, CSV parsing, etc.

### E2E Tests (`e2e/`)

- Full system tests
- Tests complete workflows
- Default timeout: 30 seconds
- Includes PDF generation, CLI operations

## Shared Code (`__common__/`)

### Helpers (`__common__/helpers/`)

- `cli-test-utils.js`: CLI testing utilities
- `resource-manager.js`: Resource management helpers
- `test-utils.js`: General test utilities
- `fs-mock.js`: File system mocking
- `log-utils.js`: Logging utilities
- `pdf-test-helper.js`: PDF testing utilities

### Fixtures (`__common__/fixtures/`)

- Sample templates
- Test data files
- Expected output files

### Mocks (`__common__/mocks/`)

- Mock implementations
- Test doubles
- Fake services

### Utils (`__common__/utils/`)

- `files-scanner.js`: File scanning utilities
- `list-files.js`: File listing utilities

## Configuration (`config/`)

### Main Configuration Files

- `test-setup.js`: Core test configuration and utilities
  - Environment setup
  - Global test utilities
  - Custom matchers
  - Directory management

- `global-setup.js`: Global Jest configuration
  - Jest global setup
  - Test environment initialization
  - Global mocks and stubs

- `e2e-setup.js`: E2E testing configuration
  - Browser setup
  - Page configuration
  - Screenshot utilities
  - Network handling

- `timeouts.js`: Timeout configurations
  - Default timeouts by test type
  - Custom timeout utilities
  - Async operation limits

## Reports

### Coverage Reports (`coverage/`)

- HTML coverage report
- LCOV report
- JSON coverage data
- Text summary

### Test Reports (`reports/`)

- JUnit XML reports (`reports/junit/`)
- HTML test reports (`reports/html/`)
- Failure screenshots (E2E tests)

## Available Scripts

```bash
# Main test commands
npm test                    # Run all tests
npm run test:unit          # Run unit tests
npm run test:integration   # Run integration tests
npm run test:e2e          # Run E2E tests

# Watch mode
npm run test:watch         # Watch mode for all tests
npm run test:watch:unit    # Watch mode for unit tests
npm run test:watch:integration # Watch mode for integration tests

# Coverage
npm run test:coverage      # Generate coverage report
npm run test:watch:coverage # Watch mode with coverage

# Other utilities
npm run test:clean        # Clean test reports and coverage
npm run test:clear        # Clear Jest cache
npm run test:ci           # Run tests in CI mode
npm run test:debug        # Run tests in debug mode
```

## Environment Variables

Test configuration can be customized through environment variables in `.env.test`:

- `NODE_ENV=test`: Test environment
- `DEBUG_TESTS`: Enable debug logging in tests
- `INPUT_PATH`: Custom input directory path
- `OUTPUT_PATH`: Custom output directory path
- `LOGS_PATH`: Custom logs directory path

## Best Practices

1. **Test Organization**
   - Keep tests close to source files
   - Use descriptive test names
   - Follow AAA pattern (Arrange, Act, Assert)

2. **File Naming**
   - Unit tests: `*.unit.test.js`
   - Integration tests: `*.integration.test.js`
   - E2E tests: `*.e2e.test.js`

3. **Code Coverage**
   - Maintain minimum coverage thresholds
   - Focus on meaningful tests over coverage percentage
   - Document uncovered edge cases

4. **Performance**
   - Keep unit tests fast
   - Use mocks appropriately
   - Optimize E2E test execution
