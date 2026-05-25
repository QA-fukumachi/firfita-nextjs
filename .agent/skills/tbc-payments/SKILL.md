---
name: tbc-payments
description: |
  Use when integrating TBC Bank Checkout (e-commerce) payments — creating
  payments, handling redirects, processing callbacks, pre-authorization,
  cancellation, recurring payments, or anything touching api.tbcbank.ge
  or the /tpay/* endpoints.
---

# TBC Checkout integration

This skill bundles the API spec and behavior notes for TBC Bank's
e-commerce payment service.

## When implementing TBC integration:
1. Read `openapi.yaml` in this skill folder for endpoint shapes.
2. Read `gotchas.md` for behavior the spec doesn't capture
   (auth flow, callback verification, pre-auth two-step capture, etc).
3. Never invent endpoints or field names — if it's not in the spec, ask.

## Quick facts
- Base URL: `https://api.tbcbank.ge`, version `v1`
- Two headers required on most calls: `apikey` + `Authorization: Bearer`
- Token TTL 24h (cache it, don't refetch per payment)
- Amounts in major units (GEL, not tetri)

## Endpoints in scope
- POST /v1/tpay/access-token
- POST /v1/tpay/payments
- GET  /v1/tpay/payments/{payId}
- POST /v1/tpay/payments/{payId}/cancel
- POST /v1/tpay/payments/{payId}/completion

## Next.js implementation conventions

- All TBC code lives in `src/lib/tbc/`. Import via `@/lib/tbc/server`
  (it's marked `server-only`).
- NEVER use TBC types/client in `"use client"` components. The
  apikey and client_secret must never reach the browser.
- Use server actions for user-triggered flows (start checkout).
- Use route handlers under `src/app/api/tbc/` for TBC's webhooks.
- Webhook flow: parse → re-fetch status from TBC → act → return 200.
  Never trust the callback body alone.
- Token cache: [Vercel KV | Upstash | refetch each time — pick one]
- Order reconciliation key: `merchantPaymentId` = our internal order ID,
  stored on Order.tbc_pay_id as well.
- Env vars: TBC_APP_KEY, TBC_CLIENT_ID, TBC_CLIENT_SECRET, TBC_BASE_URL,
  TBC_CALLBACK_URL — all server-only, no NEXT_PUBLIC_ prefix.