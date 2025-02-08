# Purchase Ticket - {{ ticketNumber }}

**Date:** {{ date }}  
**Store:** {{ storeName }}  
**Cashier:** {{ cashierName }}

## Purchased Items
{{#each items}}
- {{name}} - ${{price}}{{#if (and (not (eq name "")) (eq onSale "true"))}} (ON SALE!){{/if}}
{{/each}}

## Payment Details
- Subtotal: ${{ subtotal }}
- Tax ({{ taxRate }}%): ${{ taxAmount }}
- **Total:** ${{ total }}

## Customer Loyalty
{{#if (eq isMember "true")}}
- Member Points Earned: {{ pointsEarned }}
- Current Balance: {{ pointsBalance }}
{{else}}
- Join our loyalty program today and start earning points!
{{/if}}

## Store Hours
{{#each businessHours}}
- {{day}}: {{hours}}
{{/each}}

---
Thank you for shopping with us!  
Receipt ID: {{ receiptId }}
