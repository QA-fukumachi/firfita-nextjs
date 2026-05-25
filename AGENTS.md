# Project: [firfita]

## TBC Bank payments integration

We integrate TBC Checkout (e-commerce) payments.

**Authoritative reference:** `docs/tbc-payments/openapi.yaml`

When implementing anything that touches TBC's API:
1. Read the relevant operation in `openapi.yaml` first.
2. Read `docs/tbc-payments/gotchas.md` for behavior not captured in the spec.
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