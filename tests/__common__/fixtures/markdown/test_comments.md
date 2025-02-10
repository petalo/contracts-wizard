# Test Template

## Personal Information

- Name: {{person.name}}
- Age: {{person.age}}

## Addresses

### Primary Address

{{#with (lookup addresses 0)}}

- Street: {{street}}
- City: {{city}}
{{/with}}

### Secondary Address

{{#with (lookup addresses 1)}}

- Street: {{street}}
- City: {{city}}
{{/with}}

## Items
{{#each items}}
{{@index}}. {{this}}
{{/each}}
