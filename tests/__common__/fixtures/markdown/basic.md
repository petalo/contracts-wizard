# Quick Handlebars & Markdown Test

This is a test template with some {{variable}} placeholders.

## Fields

- Name: {{name}}
- Age: {{age}}
- Email: {{email}}

## List Example

{{#each items}}
- Item {{@index}}: {{this}}
{{/each}}

## Missing Values Test

{{missing_field}}