# Quick Handlebars & Markdown Test

<div class="col-1">

## Basic Values

<div class="explanation">
Demonstration of different types of value access: simple, nested, and missing values.
</div>

- Simple value: {{simple}}

<div class="explanation">Direct access to a simple value</div>
- Missing value: {{missing}}
<div class="explanation">Behavior when a value doesn't exist in the CSV</div>
- Nested value: {{user.name}}
<div class="explanation">Accessing values using dot notation (user.name)</div>
- Deep nested: {{company.address.street}}
<div class="explanation">Accessing deeply nested values (company.address.street)</div>

### Nested Arrays with Missing Values

<div class="explanation">
Demonstration of handling nested arrays with missing values at different levels
</div>

{{#each parent}}

### Group {{@index}}

<div class="explanation">Group {{@index}}: some children might be missing</div>

{{#each child}}

- Child {{@index}}: {{this}}
{{/each}}

{{/each}}

</div>

<div class="col-2">

## Helpers Demo

### Built-in Helpers

<div class="explanation">
Demonstration of Handlebars built-in helpers
</div>

{{#if condition}}
  This is conditional
{{else}}
  This is the else branch
{{/if}}
<div class="explanation">The 'if' helper for conditional rendering</div>

{{#each items}}

- Item {{@index}}: {{this}}
{{/each}}

<div class="explanation">The 'each' helper for iterating arrays, using @index</div>

{{#with user}}
  Name: {{name}}
  Email: {{email}}
{{/with}}
<div class="explanation">The 'with' helper for changing variable context</div>

### Custom Helpers

<div class="explanation">
Demonstration of custom helpers for data formatting and manipulation
</div>

### Multiple Conditions Example

<div class="explanation">
Demonstration of handling multiple conditions with if/else
</div>

{{#if (eq status 0)}}
  Status is 0: Initial state
{{else if (eq status 1)}}
  Status is 1: Processing
{{else}}
  Status is something else: {{status}}
{{/if}}

<div class="explanation">Using the eq helper to compare values and show different messages based on status</div>

- Formatted date: {{formatDate date "DD/MM/YYYY"}}

<div class="explanation">Custom helper for date formatting (formatDate date "DD/MM/YYYY")</div>

- Years from now: {{addYears date 5}}

<div class="explanation">Custom helper for date calculations (addYears date 5)</div>

- Current date (ISO): {{now "ISO"}}

<div class="explanation">Helper that returns the current date in ISO format (now)</div>

- Current date (formatted): {{now "DD/MM/YYYY"}}

<div class="explanation">Helper that returns the current date with custom format (now "DD/MM/YYYY")</div>
- Current date (long): {{now "dddd, DD [de] MMMM [de] YYYY"}}

<div class="explanation">Helper that returns the current date in long format with localization (now "dddd, DD [de] MMMM [de] YYYY")</div>

- Current time: {{now "HH:mm:ss"}}

<div class="explanation">Helper that returns the current time (now "HH:mm:ss")</div>

</div>

<div class="col-3">

### Text Formatting

<div class="explanation">
Demonstration of basic text formatting in Markdown
</div>

**Bold text** and *italic text*

### Lists

<div class="explanation">
Demonstration of ordered and nested lists
</div>

1. Ordered item 1
2. Ordered item 2
   - Nested unordered
   - Another nested

### Code (h3)

<div class="explanation">
Demonstration of code blocks with syntax highlighting
</div>

```javascript
const hello = "world";
console.log(hello);
```

### Tables

<div class="explanation">
Demonstration of tables in Markdown
</div>

| Header 1 | Header 2 |
| -------- | -------- |
| Cell 1   | Cell 2   |

### Links

<div class="explanation">
Demonstration of links and images
</div>

[Link text](https://example.com)

<div class="explanation">Link to https://example.com</div>

<img src="../../fixtures/images/160x40.png" alt="stretched image" width="320" height="10">

<div class="explanation">Image alt: image.jpg</div>

### Blockquotes (h3)

<div class="explanation">
Demonstration of block quotes
</div>

>
> Multiple
> Line
> Quote

### Horizontal Rule (h3)

<div class="explanation">
Demonstration of horizontal rule
</div>

---

### Validation Test Cases

<div class="explanation">
These are test cases that should trigger the validation error styles:
</div>

- Undefined value: {{undefined_value}}

<div class="explanation">{{undefined_value}}</div>

- Empty handlebars: {{empty_value}}

<div class="explanation">{{empty_value}}</div>

- Null value: {{null_value}}

<div class="explanation">{{null_value}}</div>

- Unprocessed handlebars: {{raw_value}}

<div class="explanation">{{raw_value}}</div>

</div>

<script src="../__common__/fixtures/js/quick.example.validation.js"></script>
