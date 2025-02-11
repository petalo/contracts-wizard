# Test Template

Hello {{name}}!

## Test Values

- Value 1: {{value1}}
- Value 2: {{value2}}

## Formatted Values

- Date: {{formatDate date "DD/MM/YYYY"}}
- Number: {{formatNumber number}}
- Currency: {{formatNumber amount style="currency" currency="EUR"}}
- Percentage: {{formatNumber percent style="percent"}}

## Conditional Tests

{{#if showSection}}
This section is visible
{{else}}
This section is hidden
{{/if}}

## Array Tests

{{#each items}}

- Item {{@index}}: {{this}}
{{/each}}
