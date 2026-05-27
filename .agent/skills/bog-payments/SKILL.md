---
name: bog-payments
description: Use when integrating Bank of Georgia (BOG) e-commerce payments.
---

# Bank of Georgia Payments Integration

This skill folder provides resources for integrating Bank of Georgia's payment API.

## Files
- `openapi.yaml`: The OpenAPI spec detailing endpoints for authentication, creating orders, and retrieving payment details.
- `gotchas.md`: Important behavioral quirks, edge cases, and testing details for the BOG API.

## Instructions
1. Review `openapi.yaml` for request/response structures.
2. Carefully read `gotchas.md` for undocumented quirks or specific requirements.
3. Make sure to generate the TypeScript types from `openapi.yaml` (usually a script is in package.json) to use the correct types in the implementation.
