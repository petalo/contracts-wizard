# Handlebars & Markdown Demo

> A demonstration of template capabilities

## Basic Values

- Simple value: {{simple}}
- Missing value: {{missing}}
- Nested value: {{user.name}}
- Deep nested: {{company.address.street}}

## Helpers Demo

### Built-in Helpers

{{#if condition}}
  This is conditional
{{else}}
  This is the else branch
{{/if}}

{{#each items}}

- Item {{@index}}: {{this}}
{{/each}}

{{#with user}}
  Name: {{name}}
  Email: {{email}}
{{/with}}

### Nested Arrays with Missing Values

{{#each parent}}

### Group {{@index}}

{{#each child}}

- Child {{@index}}: {{this}}
{{/each}}

{{/each}}

### Custom Helpers

- Formatted date: {{formatDate date "DD/MM/YYYY"}}
- Years from now: {{addYears date 5}}
- Current date: {{now}}
- Empty value: {{emptyValue}}
- Array to Object: {{objectToArray object}}

### Text Formatting

**Bold text** and *italic text*

### Lists

1. Ordered item 1
2. Ordered item 2
   - Nested unordered
   - Another nested

### Code (h3)

```javascript
const hello = "world";
console.log(hello);
```

### Tables

| Header 1 | Header 2 |
| -------- | -------- |
| Cell 1   | Cell 2   |

### Links

[Link text](https://example.com)
![Image alt](image.jpg)

### Blockquotes (h3)
>
> Multiple
> Line
> Quote

### Horizontal Rule (h3)

---
