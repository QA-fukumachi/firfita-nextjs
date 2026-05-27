# BOG Payments Gotchas

## 1. Authentication
BOG requires a two-step authentication process.
1. You must use Basic Auth (`Basic base64(client_id:client_secret)`) and send a POST to the OAuth token endpoint (`grant_type=client_credentials`).
2. The endpoint returns a JWT `access_token` which must be sent as a `Bearer` token in the `Authorization` header for all subsequent API requests.

## 2. Order Creation
- The order creation request returns an `id` (this is the BOG order_id) and a link object (`_links.redirect.href`).
- You MUST redirect the user to this `href` so they can complete the payment.
- Amounts should be in major units (e.g. GEL, not Tetri).
- If the `redirect_urls` are provided, the user will be redirected to these URLs after the payment is processed. If left blank, they will stay on the BOG receipt page.

## 3. Callbacks (Webhooks)
- The BOG payment system sends an asynchronous POST callback to your `callback_url` when the payment completes.
- It sends the `event` as `"order_payment"`.
- It includes a `Callback-Signature` header that you must verify using the BOG Public Key (provided in their docs).
- You MUST return HTTP 200 OK immediately after receiving the callback.
- If verification fails or you miss a callback, you should query the GET `/receipt/{order_id}` endpoint to sync status.

## 4. Status Keys
- `created`: Request created.
- `processing`: User is paying.
- `completed`: Successfully paid.
- `rejected`: Payment failed.
