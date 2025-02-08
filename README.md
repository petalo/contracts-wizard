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

| Option     | Short | Description         | Example        |
| ---------- | ----- | ------------------- | -------------- |
| --template | -t    | Template file path  | -t contract.md |
| --data     | -d    | CSV data file path  | -d input.csv   |
| --css      | -c    | CSS style file path | -c style.css   |

Global options:

| Option    | Description  | Example   |
| --------- | ------------ | --------- |
| --help    | Show help    | --help    |
| --version | Show version | --version |

### Available Commands

```bash
# Interactive mode (default)
contracts-wizard

# Generate contract (with options)
contracts-wizard generate -t template.md [-d data.csv] [-c style.css]

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
signatures[0].name,Client Representative,
signatures[1].name,Consultant,
```

### Handling Missing Data

The wizard handles missing data with:

1. Visual indicators in red: `[[missing.field]]`
2. CSS styling for missing values (see `examples/css/missing-data.css`)
3. Validation warnings
4. Detailed logging

### Available Helpers

Built-in Handlebars helpers:

#### Value Comparison

```handlebars
{{eq value1 value2}}
```

Compares two values for equality with type coercion:

- Case-insensitive string comparison
- HTML-wrapped content extraction
- Numeric values with type coercion
- Boolean values and their string representations
- Proper handling of null/undefined values with configurable error messages

#### Object Lookup

```handlebars
{{lookup object "property"}}
```

Extracts values from:

- Nested objects
- HTML-wrapped content
- SafeString instances
- Objects with string properties
- Handles missing or invalid values with configurable error messages

#### Date Formatting

```handlebars
{{formatDate date "DD/MM/YYYY"}}
{{addYears date 1}}
{{now "YYYY-MM-DD"}}
```

Date manipulation and formatting with:

- Full Spanish locale support
- Configurable timezone handling
- Predefined date formats from configuration
- Consistent error handling for invalid dates
- HTML wrapping with configurable classes
- Support for chained operations

Example with predefined formats:

```handlebars
{{! Using predefined formats from configuration }}
{{formatDate date "DEFAULT"}}  {{! D [de] MMMM [de] YYYY }}
{{formatDate date "ISO"}}      {{! YYYY-MM-DD }}
{{formatDate date "FULL"}}     {{! D [de] MMMM [de] YYYY }}
{{formatDate date "SHORT"}}    {{! DD/MM/YYYY }}
{{formatDate date "TIME"}}     {{! HH:mm:ss }}

{{! Chaining operations }}
{{formatDate (addYears now 1) "FULL"}}
```

#### Empty Value Handling

All helpers now use consistent empty value handling from configuration:

```handlebars
{{! Missing or invalid values }}
<span class="missing-value" data-field="fieldName">[[fieldName]]</span>

{{! Successfully imported values }}
<span class="imported-value" data-field="fieldName">value</span>
```

The styling and messages are configurable through `HANDLEBARS_CONFIG`:

```javascript
const HANDLEBARS_CONFIG = {
  emptyValue: {
    class: 'missing-value',
    importedClass: 'imported-value',
    template: '<span class="{class}" data-field="{key}">{value}</span>'
  },
  errorMessages: {
    invalidDate: '[[Invalid date]]',
    missingValue: '(Empty value)',
    processingError: '[Error processing {type}]'
  },
  dateFormats: {
    DEFAULT: 'D [de] MMMM [de] YYYY',
    ISO: 'YYYY-MM-DD',
    FULL: 'D [de] MMMM [de] YYYY',
    SHORT: 'DD/MM/YYYY',
    TIME: 'HH:mm:ss'
  }
};
```

#### Examples

```handlebars
{{! Value comparison with error handling }}
{{#if (eq user.age 18)}}
  User is 18 years old
{{else}}
  {{! Will show configured error message if age is missing }}
{{/if}}

{{! Date formatting with predefined formats }}
Created on: {{now "SHORT"}}
Expires on: {{formatDate (addYears startDate 1) "FULL"}}
Today is: {{now "DEFAULT"}}

{{! Error handling }}
{{#if (eq undefined_value "test")}}
  {{! Will show: <span class="missing-value" data-field="undefined_value">(Empty value)</span> }}
{{/if}}

{{formatDate invalid_date "SHORT"}}
{{! Will show: <span class="missing-value" data-field="date">[[Invalid date]]</span> }}
```

All helpers include:

- Consistent error handling through configuration
- Detailed debug logging
- HTML safety with proper escaping
- Type coercion where appropriate
- Locale support for dates and numbers
- Configurable styling and messages

### Built-in Helpers

The system includes several built-in Handlebars helpers to format and manipulate data:

#### Date Helpers

```handlebars
{{! Current date with Spanish locale }}
{{now "D [de] MMMM [de] YYYY"}}  {{! Returns: "31 de enero de 2024" }}

{{! Format specific dates with locale support }}
{{formatDate someDate "D [de] MMMM [de] YYYY"}}

{{! Add years to a date }}
{{addYears someDate 5}}

{{! Chain operations }}
{{formatDate (addYears now 1) "D [de] MMMM [de] YYYY"}}
```

The date helpers include:

- Full Spanish locale support (months, days, etc.)
- Timezone configuration (default: Europe/Madrid)
- Consistent formatting across all date operations
- Proper handling of undefined values and edge cases
- Debug logging for troubleshooting

#### Number Formatting

The system automatically formats numbers according to the Spanish locale (configurable in `LOCALE_CONFIG`). You can use the `formatNumber` helper explicitly for more control:

```handlebars
{{! Basic number formatting - adds thousands separator and decimal comma }}
{{formatNumber 1234.56}}  -> "1.234,56"

{{! Currency formatting }}
{{formatNumber value style="currency" currency="EUR"}}  -> "1.234,56 €"

{{! Percentage formatting }}
{{formatNumber 0.1234 style="percent"}}  -> "12,34 %"

{{! Custom decimal places }}
{{formatNumber value minimumFractionDigits=2 maximumFractionDigits=4}}
```

The helper handles:

- Thousands separator (punto)
- Decimal separator (coma)
- Currency symbols with proper spacing
- Percentage formatting
- Custom decimal places
- Invalid or empty values

Note: Numbers in the template are automatically formatted - you don't need to use `formatNumber` unless you want specific formatting options.

#### Other Helpers

- `eq`: Compare values with type coercion

  ```handlebars
  {{#if (eq value 0)}}
  ```

- `lookup`: Access nested object properties

  ```handlebars
  {{lookup object "property"}}
  ```

### Using the `with` Helper

The `with` helper is used to change the context within a block, making it easier to access nested properties without repeating the parent object name. It's particularly useful when working with deeply nested objects.

#### Basic Usage

```handlebars
{{#with user}}
  Name: {{name}}
  Email: {{email}}
  Address: {{address.street}}, {{address.city}}
{{/with}}
```

Instead of writing:

```handlebars
Name: {{user.name}}
Email: {{user.email}}
Address: {{user.address.street}}, {{user.address.city}}
```

#### Key Features

1. **Context Change**: Inside the `with` block, `this` refers to the specified object
2. **Nested Properties**: Access child properties directly without parent reference
3. **Fallback Handling**: If the object is undefined, the block is skipped
4. **Combining with Other Helpers**: Can be used with `if`, `each`, etc.

#### Advanced Examples

```handlebars
{{! Nested with blocks }}
{{#with user}}
  {{#with address}}
    Street: {{street}}
    City: {{city}}
    Country: {{country}}
  {{/with}}
{{/with}}

{{! With + if combination }}
{{#with user}}
  {{#if address}}
    {{#with address}}
      Full Address: {{street}}, {{city}}
    {{/with}}
  {{else}}
    No address provided
  {{/if}}
{{/with}}

{{! With + each combination }}
{{#with company}}
  Company: {{name}}
  {{#each employees}}
    - {{name}} ({{position}})
  {{/each}}
{{/with}}
```

#### Best Practices

1. **Depth Control**: Avoid nesting more than 2-3 levels deep for readability
2. **Fallback Content**: Use `else` to handle undefined cases:

   ```handlebars
   {{#with user}}
     {{name}}
   {{else}}
     User not found
   {{/with}}
   ```

3. **Context Clarity**: Comment blocks when using multiple nested `with` statements
4. **Performance**: Use `with` when accessing multiple properties of the same object

#### Common Pitfalls

1. **Accessing Parent Context**: Use `../` to access parent context:

   ```handlebars
   {{#with user}}
     {{name}} works at {{../company.name}}
   {{/with}}
   ```

2. **Undefined Objects**: The block is skipped if the object is undefined:

   ```handlebars
   {{#with undefinedObject}}
     This won't be rendered
   {{else}}
     Fallback content
   {{/with}}
   ```

3. **This Reference**: Inside `with`, `this` refers to the new context:

   ```handlebars
   {{#with user}}
     {{this.name}} {{! same as just {{name}} }}
   {{/with}}
   ```

## �� Configuration

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

Check logs at `logs/logging-latest.log` for detailed error information.
