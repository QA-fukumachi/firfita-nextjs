# TBC Checkout — behavior notes

## Auth flow
1. POST /v1/tpay/access-token with form-encoded client_id/client_secret
   → returns access_token (Bearer, 24h TTL)
2. Cache it. Don't re-fetch on every payment.
3. Include in BOTH headers: `apikey: <app-key>` AND
   `Authorization: Bearer <access_token>`.

## Create payment — important fields not obvious from the schema
- `amount.currency`: GEL, USD, EUR
- `amount.total`: number, major units
- `returnurl`: where the user lands after paying (your order page)
- `callbackUrl`: server-to-server webhook (different from returnurl!)
- `methods`: array of int IDs limiting which payment methods show
  (5/7/8 in the example — see TBC's "Payment Methods" doc page)
- `preAuth: true`: authorize only, capture later via /completion
- `saveCard: true` + `saveCardToDate: "MMYY"`: enable recurring on
  this card; returns a recId you persist for later /payments/execution
- `merchantPaymentId`: your own order ID, echoed back — use this for
  reconciliation
- `language`: "EN" / "KA"
- `expirationMinutes`: how long the checkout link stays valid

## Response — what to do with it
The 200 response includes `links[]`. Find the one with `rel: "approval_url"`
and redirect the user there. The `rel: "self"` one is for polling status.

## Status values
Created → Processing → Succeeded | Failed
Treat anything other than Succeeded as not-paid until confirmed.

## Callback handling
TBC POSTs to your callbackUrl when status changes. Do NOT trust the
body alone — re-fetch /v1/tpay/payments/{payId} to verify status
server-side before fulfilling the order.

## Pre-auth flow
1. Create payment with `preAuth: true`
2. User pays → status becomes Succeeded (but funds only held)
3. Call POST /v1/tpay/payments/{payId}/completion with the final amount
   to capture (can be ≤ original)

## Missing from this spec (fetch from developers.tbcbank.ge if needed)
- POST /v1/tpay/payments/execution (recurring)
- POST /v1/tpay/payments/{recId}/delete (cancel saved card)
- Result code table (developers.tbcbank.ge/docs/result-code)
- Full payment-methods ID table (developers.tbcbank.ge/docs/payment-methods)

## Next.js / serverless specifics
- Token in-memory cache survives only within a warm execution.
  For consistent caching across requests, use a shared store
  (Vercel KV, Redis, DB).
- Webhook callbacks may arrive BEFORE the user is redirected back
  (TBC's network is fast, the user's browser isn't). Handle both
  orderings — return page should query DB, not assume callback ran.
- TBC may retry callbacks on non-200. Make the handler idempotent:
  check if the order is already marked paid before fulfilling again.