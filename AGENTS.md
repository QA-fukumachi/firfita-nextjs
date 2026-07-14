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
## Flitt payments integration (active)

We integrate Flitt hosted checkout (https://docs.flitt.com) — supports cards
(TBC, Bank of Georgia), Google Pay, and Apple Pay. This is the currently
active payment provider; TBC/BOG direct integrations are prepared but not live.

### Quick facts
- Checkout endpoint: `POST https://pay.flitt.com/api/checkout/url`
- Auth is a request `signature`: `sha1(secret_key|<param values sorted by param name>)`,
  `|`-joined, empty params skipped, lowercase hex. `signature` and
  `response_signature_string` are excluded from the signed string.
- Amounts at the Flitt API boundary are in MINOR units (tetri) — convert from
  the project's GEL major units with `toMinorUnits` in `src/lib/flitt/client.ts`.
- Test creds in `.env.local` (`FLITT_MERCHANT_ID`, `FLITT_SECRET_KEY`);
  empty creds disable the payment flow (orders fall back to email-only).

### Project conventions
- Client lives in `src/lib/flitt/client.ts`
- Flitt `payment_id` is stored on `Order.flitt_payment_id`
- Our callback handler is at `POST /api/flitt/callback` (signed, authoritative)
- Browser return URL is `/api/flitt/return` (informational only, redirects to
  the order page with `?payment=success|failed`)
