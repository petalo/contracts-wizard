# Contributing to Contracts Wizard<!-- omit in toc -->

First off, thank you for considering contributing to Contracts Wizard! It's people like you that make Contracts Wizard such a great tool.

This document provides guidelines and steps for contributing. Please read it carefully.

## Table of Contents<!-- omit in toc -->

- [Development Setup](#development-setup)
- [Development Workflow](#development-workflow)
  - [Commit Message Format](#commit-message-format)
  - [Branch Naming Convention](#branch-naming-convention)
- [Testing Guidelines](#testing-guidelines)
  - [Test Structure](#test-structure)
  - [Coverage Requirements](#coverage-requirements)
- [Example Files](#example-files)
- [Code Style Guidelines](#code-style-guidelines)
- [Documentation Guidelines](#documentation-guidelines)
  - [File Overview Format](#file-overview-format)
  - [API Documentation](#api-documentation)
- [Security Guidelines](#security-guidelines)
- [Performance Guidelines](#performance-guidelines)
- [Pull Request Process](#pull-request-process)
- [Release Process](#release-process)
  - [Release Types](#release-types)
  - [Release Commands](#release-commands)
  - [Additional Options](#additional-options)
  - [Automated Workflows](#automated-workflows)
  - [Release Flow](#release-flow)
  - [Version Files](#version-files)

## Development Setup

1. Fork and clone the repository:

   ```bash
   git clone https://github.com/petalo/contracts-wizard.git
   cd contracts-wizard
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

   This will automatically:
   - Install all dependencies
   - Run the setup script
   - Configure git hooks from `.githooks/`
   - Create necessary directories
   - Copy example files

3. Verify the setup:

   ```bash
   # Check git hooks configuration
   git config core.hooksPath # Should output .githooks

   # Normal setup
   npm run setup

   # Dry run (no changes)
   npm run setup -- --dry-run

   # Verbose output
   npm run setup -- --verbose
   ```

4. Start development:

   ```bash
   npm run dev
   ```

Note: The project uses custom git hooks located in the `.githooks/` directory. These are automatically configured during setup, but if you need to manually configure them:

```bash
git config core.hooksPath .githooks
chmod +x .githooks/*
```

## Development Workflow

1. Create a feature branch:

   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes:
   - Write tests first (TDD approach)
   - Keep commits focused and atomic
   - Follow commit message conventions
   - Update documentation as needed

3. Run checks:

   ```bash
   npm run lint
   npm test
   ```

4. Push and create PR:

   ```bash
   git push origin feature/your-feature-name
   ```

### Commit Message Format

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```text
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

Types:

- feat: A new feature
- fix: A bug fix
- docs: Documentation only changes
- style: Changes that do not affect the meaning of the code
- refactor: A code change that neither fixes a bug nor adds a feature
- perf: A code change that improves performance
- test: Adding missing tests or correcting existing tests
- chore: Changes to the build process or auxiliary tools

### Branch Naming Convention

Use the following format for branch names:

- Features: `feature/<issue-number>-brief-description`
- Bug fixes: `fix/<issue-number>-brief-description`
- Documentation: `docs/<issue-number>-brief-description`
- Performance improvements: `perf/<issue-number>-brief-description`
- Refactoring: `refactor/<issue-number>-brief-description`

## Testing Guidelines

We use Jest for testing. Tests are organized in three categories:

1. Unit Tests (`tests/unit/`):
   - Test individual components and functions
   - Fast execution, no external dependencies

   ```bash
   npm run test:unit
   ```

2. Integration Tests (`tests/integration/`):
   - Test interactions between components
   - May require file system access

   ```bash
   npm run test:integration
   ```

3. End-to-End Tests (`tests/e2e/`):
   - Test complete workflows
   - Require all dependencies

   ```bash
   npm run test:e2e
   ```

### Test Structure

Follow this structure for test files:

```javascript
describe('Component/Function Name', () => {
  describe('Specific Functionality', () => {
    it('should do something specific', () => {
      // Arrange
      // Act
      // Assert
    });
  });
});
```

### Coverage Requirements

We aim for high test coverage to ensure code quality:

- Unit tests: Minimum 80% coverage
- Integration tests: Minimum 70% coverage
- End-to-end tests: Key user flows must be covered

Use `npm run test:coverage` to check current coverage levels.

## Example Files

The `examples/` directory contains reference files that demonstrate how to use the application. If you're adding new features:

1. Update or add example files in the appropriate subdirectory:
   - `examples/markdown/` for templates
   - `examples/css/` for styles
   - `examples/csv/` for data files

2. Use the `.example.` suffix in filenames (e.g., `contract.example.md`)

3. Update the examples README if needed

Note: The `examples/` directory is for reference only. The application reads files from the working directories defined in the `.env` file.

## Code Style Guidelines

We follow the Shopify ESLint configuration and use Prettier for formatting:

```bash
# Check style
npm run lint

# Fix style issues
npm run lint:fix

# Format code
npm run format
```

Style guidelines:

- Use single quotes for strings
- Use semicolons
- 2-space indentation
- Trailing commas in multiline objects/arrays
- Maximum line length of 80 characters
- Clear and descriptive variable names
- JSDoc comments for functions and classes

File naming conventions:

- Source files (`src/`): Use kebab-case (e.g., `file-name.js`)
- Test files (`tests/`): Use kebab-case (e.g., `component-name.test.js`)
- Example files (`examples/`): Use kebab-case with `.example.` suffix (e.g., `contract.example.md`)
- Configuration files: Use kebab-case (e.g., `prettier-config.js`)
- Documentation files: Use UPPERCASE for standard files (e.g., `README.md`, `CONTRIBUTING.md`, `LICENSE`)

These conventions are enforced by our pre-commit hooks (`.githooks/pre-commit`) and ESLint (`eslint.config.js`).

## Documentation Guidelines

We use JSDoc for API documentation:

```bash
# Generate documentation
npm run docs

# Clean and regenerate
npm run jsdoc:full
```

Documentation guidelines:

- Every file should have a file overview comment
- All exports should be documented
- Include examples for complex functionality
- Keep comments up to date with code changes

### File Overview Format

```javascript
/**
 * @fileoverview Brief description
 *
 * Detailed description of the file's purpose and functionality.
 *
 * Functions:
 * - functionName: description
 *
 * Flow:
 * 1. Step one
 * 2. Step two
 *
 * Error Handling:
 * - Error case one
 * - Error case two
 *
 * @module path/to/module
 * @requires dependency-name
 */
```

### API Documentation

- API documentation should be updated whenever a new feature is added or an existing one is modified.
- API documentation should be clear and concise, providing enough information for developers to understand how to use the feature.
- API documentation should be kept up-to-date with the code.

## Security Guidelines

- Never commit sensitive data (API keys, credentials, etc.)
- Use environment variables for configuration
- Validate all inputs and sanitize outputs
- Keep dependencies updated and regularly audit them
- Report security vulnerabilities privately to maintainers
- Follow OWASP security best practices

## Performance Guidelines

- Optimize resource usage and memory management
- Use caching appropriately
- Minimize network calls and optimize database queries
- Follow performance best practices for Node.js
- Include performance tests for critical paths
- Monitor and document performance metrics

## Pull Request Process

1. Update the README.md with details of changes to the interface
2. Update the documentation with any new information
3. Add or update tests as needed
4. Ensure all tests pass and code style is correct
5. Update the CHANGELOG.md with your changes
6. The PR will be merged once you have the sign-off of at least one maintainer

## Release Process

### Release Types

- **Patch (0.0.X)**: For bug fixes and minor changes
  - Updates version files
  - Commits changes locally
  - Changes included in next major/minor release
  - No GitHub release or npm publish

- **Minor (0.X.0)**: For new features and improvements
  - Updates version files
  - Creates git tag
  - Pushes to GitHub
  - Triggers GitHub release
  - Publishes to npm

- **Major (X.0.0)**: For breaking changes
  - Same process as minor
  - Requires careful changelog review
  - Breaking changes highlighted

### Release Commands

- Create patch: `node scripts/release.js --patch`
- Create minor: `node scripts/release.js --minor`
- Create major: `node scripts/release.js --major`

### Additional Options

- Preview changes: `node scripts/release.js --preview`
- List commits: `node scripts/release.js --list-commits`
- View changes: `node scripts/release.js --get-changes`
- Dry run: `node scripts/release.js --dry-run`

### Automated Workflows

The release process uses two GitHub Actions workflows:

1. **Release Workflow**
   - Triggered by new version tags
   - Creates GitHub release
   - Attaches changelog
   - Updates release notes

2. **Publish Workflow**
   - Triggered by major/minor releases
   - Publishes package to npm
   - Updates package documentation
   - Verifies npm package

### Release Flow

1. Local Development
   - Make changes
   - Commit with conventional commits
   - Push to main branch

2. Release Process
   - Run release command
   - Script validates repository
   - Updates version files
   - Generates changelog
   - Creates git tag
   - Pushes changes

3. Automated Publishing
   - GitHub Actions detect new tag
   - Create GitHub release
   - Publish to npm if major/minor
   - Update documentation

### Version Files

- package.json: Main version
- CHANGELOG.md: Release history
- src/config/version.js: Version metadata

---

Thank you for contributing to Contracts Wizard! 🎉
