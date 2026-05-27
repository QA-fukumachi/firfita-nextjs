# Project: [firfita]

## TBC Bank payments integration

We integrate TBC Checkout (e-commerce) payments.

**Authoritative reference:** `.agent/skills/tbc-payments/openapi.yaml`

When implementing anything that touches TBC's API:
1. Read the relevant operation in `.agent/skills/tbc-payments/openapi.yaml` first.
2. Read `.agent/skills/tbc-payments/gotchas.md` for behavior not captured in the spec.
3. Do not invent endpoints, parameter names, or response shapes. If
   something isn't in the spec, ask before guessing.

### Quick facts
- Base URL: `https://api.tbcbank.ge`
- API version: `v1`
- Every request needs an `apikey` header (developer app key)
- Most endpoints also need `Authorization: Bearer <token>` from
  `/v1/tpay/access-token`
- Token TTL: 24 hours (`expires_in: 86400`)
- Sandbox creds in `.env.local`, production in vault

### Project conventions
- TBC `payId` is stored on `Order.tbc_pay_id`
- Our callback handler is at `POST /api/tbc/callback`
- All amounts are in major units (GEL, not tetri)

## Bank of Georgia (BOG) payments integration

We integrate Bank of Georgia Checkout payments.

**Authoritative reference:** `.agent/skills/bog-payments/openapi.yaml`

When implementing anything that touches BOG's API:
1. Read the relevant operation in `.agent/skills/bog-payments/openapi.yaml` first.
2. Read `.agent/skills/bog-payments/gotchas.md` for behavior not captured in the spec.
3. Do not invent endpoints, parameter names, or response shapes. If
   something isn't in the spec, ask before guessing.

### Quick facts
- Base URL: `https://api.bog.ge/payments/v1`
- Auth URL: `https://oauth2.bog.ge/auth/realms/bog/protocol/openid-connect/token`
- All requests need `Authorization: Bearer <token>` obtained via Basic Auth on the Auth URL.
- Sandbox creds in `.env.local`, production in vault

### Project conventions
- BOG `order_id` is stored on `Order.bog_order_id`
- Our callback handler is at `POST /api/bog/callback`
- All amounts are in major units (GEL, not tetri)