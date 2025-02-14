# Contracts Wizard <!-- omit in toc -->

A powerful document generation system that transforms Markdown templates and CSV data into professionally formatted contracts. Perfect for legal teams, freelancers, and businesses looking to streamline their document generation workflow.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D%2014.0.0-brightgreen.svg)](https://nodejs.org/)
[![ESLint](https://img.shields.io/badge/code_style-Shopify-5C6AC4)](https://github.com/Shopify/eslint-plugin-shopify)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com)
[![Contributions Welcome](https://img.shields.io/badge/contributions-welcome-brightgreen.svg?style=flat)](https://github.com/dwyl/esta/issues)

## Table of Contents <!-- omit in toc -->

- [✨ Features](#-features)
- [🚀 Quick Start](#-quick-start)
- [📝 Example Files](#-example-files)
- [📖 Installation](#-installation)
- [📖 Usage](#-usage)
- [🛠 Configuration](#-configuration)
- [🔄 Program Flow](#-program-flow)
- [🤝 Contributing](#-contributing)
- [📜 License](#-license)
- [🙏 Acknowledgments](#-acknowledgments)
- [📦 Release Process](#-release-process)

## ✨ Features

### Core Features

- **Template Processing**: Support for Markdown templates with Handlebars syntax
- **Multiple Output Formats**: Generate HTML and PDF documents with customizable styling
- **Interactive CLI**: User-friendly command-line interface with guided prompts
- **Data Management**: CSV-based data storage with validation and manual input options
- **Custom Styling**: Apply CSS styling to your documents with built-in responsive design
- **Date Handling**: Comprehensive date formatting and manipulation with full Spanish locale support and timezone configuration
- **Robust Logging**: Comprehensive logging system with rotation and debug support
- **Internal Links**: Automatic generation of clickable links in PDF table of contents that navigate to corresponding sections

### Advanced Features

- **Nested Fields**: Support for complex data structures using dot notation
- **Custom Helpers**: Built-in Handlebars helpers for common operations
- **Responsive Tables**: Automatic table wrapping for better mobile display
- **Accessibility**: Built-in image accessibility improvements
- **Missing Data Highlighting**: Visual indicators for missing or empty values
- **Error Recovery**: Graceful handling of missing files and invalid data
- **Extensible Design**: Easy to add new template helpers and output formats

## 🚀 Quick Start

1. Install globally:

   ```bash
   npm install -g @petalo/contracts-wizard
   ```

2. Create a new project:

   ```bash
   contracts-wizard init my-contracts
   cd my-contracts
   ```

3. Create and edit the `.env` file with your desired settings:

   ```bash
   cp .env.example .env
   ```

4. Run the setup script:

   ```bash
   npm run setup
   ```

5. Start using the wizard:

   ```bash
   contracts-wizard
   ```

## 📝 Example Files

The package includes example files in the `examples/` directory to help you get started:

- `office_lease_EN.example.md` - Example lease contract template
- `office_lease_EN.example.csv` - Example data for the lease contract (some values have been deleted or left empty to show the missing data highlighting)
- `contract.example.css` - Example CSS styling

These files are for reference only. To use them in your project, either:

- Run `npm run setup` to copy them to your working directories
- Create a new project with `contracts-wizard init` which will copy them automatically

The working directories for your files (by default) are:

- Templates → `templates/markdown/`
- CSS files → `templates/css/`
- CSV files → `data-csv/`

## 📖 Installation

There are two ways to install Contracts Wizard:

### 1. Global Installation (Recommended for users)

If you just want to use the tool to generate contracts:

```bash
# Install globally
npm install -g contracts-wizard

# Create a new project
contracts-wizard init my-contracts
cd my-contracts

# Copy the .env.example file and edit it with your desired settings
cp .env.example .env

# Start using
contracts-wizard
```

This installation:

- Provides the `contracts-wizard` command globally
- Creates a clean project structure
- Includes basic templates and examples

### 2. Local Installation (For development)

If you want to contribute to the project or customize it:

```bash
# Clone the repository
git clone https://github.com/petalo/contracts-wizard.git
cd contracts-wizard

# Install dependencies
npm install

# Configure the project
npm run setup

# Start in development mode
npm run dev
```

This installation:

- Provides full access to the source code
- Includes development tools
- Allows contributing to the project

### Prerequisites

Before installing Contracts Wizard, ensure you have:

- **Node.js**: >= 14.0.0

  ```bash
  node --version
  ```

- **npm**: >= 6.0.0

  ```bash
  npm --version
  ```

- **Git**: Latest version (for development)

  ```bash
  git --version
  ```

- **Memory**: Minimum 1GB RAM available
- **Disk Space**: At least 100MB free space
- **Operating System**: Windows 10+, macOS 10.15+, or Linux (Ubuntu 18.04+)

### System Requirements

- **CPU**: 1GHz or faster
- **Network**: Internet connection for initial setup
- **Browser**: For PDF preview (if needed)
  - Chrome/Chromium >= 85
  - Firefox >= 80

## 📖 Usage

### CLI Mode

Basic usage with examples:

```bash
# Generate contract from template and CSV
contracts-wizard generate -t contract.md -d input.csv

# Use custom styling
contracts-wizard generate -t contract.md -d input.csv -c style.css

# Use custom styling and highlight missing and imported values
contracts-wizard generate -t contract.md -d input.csv -c style.css --highlight

# Add a suffix to the generated filenames
contracts-wizard generate -t contract.md -d input.csv -c style.css --suffix client_name

# List available resources
contracts-wizard list templates
contracts-wizard list data
contracts-wizard list styles

# Get help
contracts-wizard --help
```

### Interactive Mode

The interactive mode guides you through the process:

```bash
# Start the wizard with no arguments
contracts-wizard
```

### Command Line Options

Options for the `generate` command:

| Option      | Short | Description                       | Example              |
| ----------- | ----- | --------------------------------- | -------------------- |
| --template  | -t    | Template file path                | -t contract.md       |
| --data      | -d    | CSV data file path                | -d input.csv         |
| --css       | -c    | CSS style file path               | -c style.css         |
| --output    | -o    | Output directory path             | -o ./output          |
| --suffix    |       | Add suffix to generated filenames | --suffix client_name |
| --highlight |       | Enable highlighting styles        | --highlight          |

Global options:

| Option    | Description                                | Example   |
| --------- | ------------------------------------------ | --------- |
| --help    | Show help                                  | --help    |
| --version | Show version                               | --version |
| --verbose | Enable verbose output (same as DEBUG=true) | --verbose |

### Available Commands

```bash
# Interactive mode (default)
contracts-wizard

# Generate contract (with options)
contracts-wizard generate -t template.md [-d data.csv] [-c style.css] [--suffix client]

# List available resources
contracts-wizard list templates  # List markdown templates
contracts-wizard list data      # List CSV data files
contracts-wizard list styles    # List CSS style files

# Initialize new project
contracts-wizard init my-project

# Show help for specific commands
contracts-wizard --help
contracts-wizard generate --help
contracts-wizard list --help
contracts-wizard init --help
```

### Creating Templates

Templates use Handlebars syntax with built-in helpers:

```handlebars
# {{title}}

This agreement is made on {{formatDate now "DD/MM/YYYY"}}
between {{client.name}} ("Client") and {{consultant.name}} ("Consultant").

## 1. Services

{{services}}

## 2. Term

From {{formatDate startDate "DD/MM/YYYY"}} to {{formatDate endDate "DD/MM/YYYY"}}

## 3. Compensation

{{currency compensation "EUR"}}

## 4. Signatures

{{#each signatures}}
- {{name}}: _________________
{{/each}}
```

### Data Input

CSV structure with examples:

```csv
key,value,comment
title,Consulting Agreement,Contract title
client.name,Acme Corp,Client company name
consultant.name,Jane Doe,Consultant full name
services,"Web development services",Description of services
startDate,2024-01-01,Contract start date
endDate,2024-12-31,Contract end date
compensation,10000,Monthly compensation
signatures.0.name,Client Representative,
signatures.1.name,Consultant,
```

### Handling Missing Data

The wizard handles missing data with:

1. Visual indicators with the name of the field inside double square brackets: `[[missing.field]]`
2. CSS styling for missing values (see `config/highlight.css`)
3. Validation warnings
4. Detailed logging

### Built-in Helpers

The system includes several built-in Handlebars helpers to format and manipulate data:

All helpers include:

- Consistent error handling through configuration
- Detailed debug logging with context
- HTML safety with proper escaping
- Type coercion where appropriate
- Full Spanish locale support
- Configurable styling and messages
- Comprehensive error reporting

#### Value Helpers

Available helpers in this category:

- `formatEmail`: Formats and validates email addresses with proper HTML links
- `lookup`: Accesses nested object properties safely
- `isEmpty`: Checks if a value is empty or undefined
- `extractValue`: (Internal) Extracts values from different data types

```handlebars
{{! Format email addresses }}
{{formatEmail user.email}}  {{! Formats and validates email addresses }}

{{! Extract values from complex objects }}
{{lookup object "deep.nested.property"}}

{{! Handle empty values }}
{{#if (isEmpty value)}}
  Value is empty
{{/if}}
```

#### Date Helpers

Available helpers in this category:

- `formatDate`: Formats dates with full Spanish locale support
- `addYears`: Adds a specified number of years to a date
- `now`: Returns the current date/time in the specified format

```handlebars
{{! Current date with Spanish locale and timezone support }}
{{now "D [de] MMMM [de] YYYY"}}  {{! Returns: "31 de enero de 2024" }}
{{now "YYYY-MM-DD HH:mm:ss Z"}}  {{! With timezone: "2024-01-31 15:30:00 +0100" }}

{{! Format specific dates with locale support }}
{{formatDate someDate "D [de] MMMM [de] YYYY"}}

{{! Add years to a date }}
{{addYears someDate 5}}

{{! Chain operations }}
{{formatDate (addYears now 1) "D [de] MMMM [de] YYYY"}}

{{! Predefined formats }}
{{formatDate date "DEFAULT"}}  {{! D [de] MMMM [de] YYYY }}
{{formatDate date "ISO"}}      {{! YYYY-MM-DD }}
{{formatDate date "FULL"}}     {{! D [de] MMMM [de] YYYY }}
{{formatDate date "SHORT"}}    {{! DD/MM/YYYY }}
{{formatDate date "TIME"}}     {{! HH:mm:ss }}
```

#### Number Formatting

Available helpers in this category:

- `formatNumber`: Formats numbers according to Spanish locale
- `formatCurrency`: Formats monetary values with currency symbols
- `currencySymbol`: Returns the symbol for a given currency code

```handlebars
{{! Basic number formatting - Spanish locale }}
{{formatNumber 1234.56}}  {{! -> "1.234,56" }}

{{! Currency formatting with symbol }}
{{formatNumber value style="currency" currency="EUR"}}  {{! -> "1.234,56 €" }}
{{currencySymbol "EUR"}}  {{! -> "€" }}

{{! Percentage formatting }}
{{formatNumber 0.1234 style="percent"}}  {{! -> "12,34 %" }}

{{! Custom decimal places }}
{{formatNumber value minimumFractionDigits=2 maximumFractionDigits=4}}

{{! Grouping options }}
{{formatNumber value useGrouping=true}}  {{! -> "1.234.567,89" }}
{{formatNumber value useGrouping=false}} {{! -> "1234567,89" }}
```

#### Logic Helpers

Available helpers in this category:

- `eq`: Compares values with type coercion for equality
- `and`: Performs logical AND operation on multiple values
- `not`: Performs logical NOT operation on a value

```handlebars
{{! Equality comparison with type coercion }}
{{#if (eq value1 value2)}}
  Values are equal
{{/if}}

{{! Logical AND operation }}
{{#if (and condition1 condition2)}}
  Both conditions are true
{{/if}}

{{! Logical NOT operation }}
{{#if (not condition)}}
  Condition is false
{{/if}}
```

#### Context Management

Available helpers in this category:

- `with`: Changes the context for a block of template
- `each`: Iterates over arrays and objects
- `log`: Outputs debug information to the console

```handlebars
{{! Using with for context changes }}
{{#with user}}
  Name: {{name}}
  Email: {{email}}
  {{#with address}}
    Street: {{street}}
    City: {{city}}
  {{/with}}
{{/with}}

{{! Accessing parent context }}
{{#with user}}
  {{name}} works at {{../company.name}}
{{/with}}
```

#### Error Handling

All helpers include consistent error handling:

```handlebars
{{! Missing values }}
{{formatDate invalid_date "SHORT"}}
{{! -> <span class="missing-value" data-field="date">[[Invalid date]]</span> }}

{{! Invalid operations }}
{{formatNumber "not-a-number"}}
{{! -> <span class="missing-value" data-field="number">[[Invalid number]]</span> }}

{{! Empty values }}
{{#if (eq undefined_value "test")}}
  {{! -> <span class="missing-value" data-field="undefined_value">(Empty value)</span> }}
{{/if}}
```

#### Helper Configuration

All helpers can be configured through `HANDLEBARS_CONFIG`:

```javascript
const HANDLEBARS_CONFIG = {
  emptyValue: {
    class: 'missing-value',
    importedClass: 'imported-value',
    template: '<span class="{class}" data-field="{key}">{value}</span>'
  },
  errorMessages: {
    invalidDate: '[[Invalid date]]',
    invalidEmail: '[[Invalid email]]',
    invalidNumber: '[[Invalid number]]',
    missingValue: '(Empty value)',
    processingError: '[Error processing {type}]'
  },
  dateFormats: {
    DEFAULT: 'D [de] MMMM [de] YYYY',
    ISO: 'YYYY-MM-DD',
    FULL: 'D [de] MMMM [de] YYYY',
    SHORT: 'DD/MM/YYYY',
    TIME: 'HH:mm:ss'
  },
  locale: 'es-ES',
  timezone: 'Europe/Madrid'
};
```

## 🛠 Configuration

### Project Structure

```text
contracts-wizard/
├── bin/              # CLI executable
├── src/              # Source code
│   ├── cli/          # CLI implementation
│   ├── config/       # Configuration files
│   ├── core/         # Core processing logic
│   └── utils/        # Utility functions
├── templates/        # Working template files
│   ├── markdown/     # Markdown templates
│   └── css/          # CSS styles
├── examples/         # Example files (reference only)
│   ├── markdown/     # Example templates
│   ├── css/          # Example styles
│   └── csv/          # Example data files
├── data-csv/         # Working CSV files
├── output_files/     # Generated contracts
├── logs/             # Application logs
├── scripts/          # Helper scripts
├── tests/            # Test files
├── docs/             # Documentation
└── package.json
```

### Environment Variables

The application uses environment variables for configuration. Create a `.env` file based on `.env.example`.

| Variable                 | Description                      | Default Value      | Options                     |
| ------------------------ | -------------------------------- | ------------------ | --------------------------- |
| NODE_ENV                 | Application environment          | development        | development/production/test |
| DEBUG                    | Enable console output            | false              | true/false                  |
| LOG_LEVEL                | File logging verbosity level     | info               | error/warn/info/debug       |
| LOG_DIR                  | Directory for log files          | logs               |                             |
| LOG_MAX_SIZE             | Maximum size before log rotation | 10MB               |                             |
| LOG_MAX_FILES            | Number of log files to keep      | 7                  |                             |
| TIMEZONE                 | Default timezone                 | UTC                |                             |
| LANGUAGE                 | Default language                 | en-US              |                             |
| DIR_OUTPUT               | Output directory for files       | output_files       |                             |
| DIR_TEMPLATES            | Templates directory              | templates/markdown |                             |
| DIR_CSS                  | CSS styles directory             | templates/css      |                             |
| DIR_IMAGES               | Images directory                 | templates/images   |                             |
| DIR_CSV                  | CSV data directory               | data-csv           |                             |
| DIR_REPORTS              | Reports directory                | reports            |                             |
| DIR_COVERAGE             | Test coverage directory          | coverage           |                             |
| DIR_TEST_LOGS            | Test logs directory              | tests-logs         |                             |
| DIR_TEST_OUTPUT          | Test output directory            | tests-output       |                             |
| CACHE_ENABLED            | Enable/disable caching           | true               |                             |
| CACHE_TTL                | Cache time-to-live (seconds)     | 1800               |                             |
| MAX_CONCURRENT_PROCESSES | Max concurrent processes         | 2                  |                             |
| RATE_LIMIT_WINDOW        | Rate limiting window (minutes)   | 15                 |                             |
| RATE_LIMIT_MAX_REQUESTS  | Max requests per window          | 50                 |                             |
| SESSION_TIMEOUT          | Session timeout (minutes)        | 15                 |                             |

### Configuration Files

All configuration files are located in `src/config/`. Here are the key files you can edit to customize the behavior:

| File                | Description                        | Key Settings                          |
| ------------------- | ---------------------------------- | ------------------------------------- |
| `aliases.js`        | Module path aliases                | Import path shortcuts                 |
| `appMetadata.js`    | Application information            | Version, author, repository           |
| `assets.js`         | Static assets configuration        | Images, fonts, resource paths         |
| `cheerioRules.js`   | HTML transformation rules          | List formatting, table responsiveness |
| `encoding.js`       | Character encoding settings        | Input/output file encodings           |
| `fileExtensions.js` | Allowed file extensions            | Template, data, and style extensions  |
| `htmlOptions.js`    | HTML output configuration          | Document structure, meta tags         |
| `locale.js`         | Localization settings              | Date formats, timezone, language      |
| `paths.js`          | Directory structure and file paths | Output, templates, and data paths     |
| `pdfOptions.js`     | PDF generation settings            | Page format, margins, headers         |
| `version.js`        | Version information                | Application version number            |

Example configurations:

#### Locale Settings (`locale.js`)

```javascript
module.exports = {
  defaultLocale: 'es-ES',
  defaultTimezone: 'Europe/Madrid',
  dateFormat: 'DD/MM/YYYY',
  currencyFormat: '0,0.00'
};
```

#### PDF Options (`pdfOptions.js`)

```javascript
module.exports = {
  format: 'A4',
  margin: { 
    top: '1cm', 
    right: '1cm', 
    bottom: '1cm', 
    left: '1cm' 
  },
  displayHeaderFooter: true,
  headerTemplate: customHeader,
  footerTemplate: customFooter,
  printBackground: true,
  preferCSSPageSize: true, // Respect CSS page size and margins
  tagged: true,            // Enable PDF tagging for better accessibility
  outline: true           // Generate document outline with internal links
};
```

The PDF generation includes several features for internal navigation:

- Table of contents entries are automatically converted to clickable links
- Links navigate directly to their corresponding sections in the PDF
- Document outline is generated for easy navigation
- PDF tagging improves accessibility and document structure

#### HTML Options (`htmlOptions.js`)

```javascript
module.exports = {
  doctype: 'html',
  language: 'en',
  meta: {
    charset: 'UTF-8',
    viewport: 'width=device-width, initial-scale=1.0'
  },
  minify: process.env.NODE_ENV === 'production'
};
```

#### File Extensions (`fileExtensions.js`)

```javascript
module.exports = {
  types: {
    markdown: 'markdown',
    csv: 'csv',
    css: 'css'
  },
  markdown: ['.md', '.markdown'],
  csv: ['.csv'],
  css: ['.css']
};
```

For more detailed configuration options, check the corresponding files in `src/config/`.

## 🤝 Contributing

We love your input! We want to make contributing to Contracts Wizard as easy and transparent as possible. Please see our [Development and Contributing Guide](CONTRIBUTING.md) for details on:

- Development setup
- Coding standards
- Testing guidelines
- Pull request process
- Release process

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Handlebars](https://handlebarsjs.com/) for templating
- [Commander.js](https://github.com/tj/commander.js/) for CLI
- [Puppeteer](https://pptr.dev/) for PDF generation
- [Inquirer.js](https://github.com/SBoudrias/Inquirer.js/) for interactive prompts
- All contributors and users of this project for their support and feedback

---

Made with ❤️ by the Contracts Wizard team

## 🔍 Troubleshooting

### Common Issues

1. **Installation Fails**

   ```bash
   # Clear npm cache
   npm cache clean --force
   # Retry installation
   npm install -g @petalo/contracts-wizard
   ```

2. **PDF Generation Fails**
   - Check Chrome/Chromium installation
   - Verify sufficient memory available
   - Check file permissions in output directory

3. **Missing Data Handling**
   - Verify CSV format matches template fields
   - Check for proper UTF-8 encoding
   - Validate date formats match locale settings

4. **Template Processing Issues**
   - Validate Handlebars syntax
   - Check for proper closing tags
   - Verify helper function usage

### Debug Mode

Enable debug mode for detailed logging:

```bash
DEBUG=true contracts-wizard generate -t template.md
```

Check logs at `logs/latest.log` for detailed error information.

### File Naming

By default, generated files follow this pattern:

```text
template.{md,html,pdf}
```

When files already exist, a revision number is added:

```text
template.rev.1.{md,html,pdf}
```

You can add a custom suffix to the filenames using the `--suffix` option:

```text
template.suffix.{md,html,pdf}
```

And with revisions:

```text
template.rev.1.suffix.{md,html,pdf}
```

This is particularly useful when generating multiple versions of the same template for different clients or purposes:

```bash
# Generate English version
contracts-wizard generate -t contract.md -d data_en.csv --suffix EN

# Generate Spanish version
contracts-wizard generate -t contract.md -d data_es.csv --suffix ES

# Generate client-specific version
contracts-wizard generate -t contract.md -d client_data.csv --suffix ClientName
```

The suffix will be added to all generated files (Markdown, HTML, and PDF) just before the file extension
