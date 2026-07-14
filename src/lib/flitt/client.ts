// Flitt hosted checkout client (https://docs.flitt.com).
// Signature scheme (docs.flitt.com/api/building-signature/):
//   sha1( secret_key | <param values sorted by param name, empty values skipped> )
// joined with "|", lowercase hex. `signature` and `response_signature_string`
// are never part of the signed string.
//
// Flitt amounts are in MINOR units (tetri) — the project convention is GEL
// major units, so callers must convert via `toMinorUnits`.

const FLITT_CHECKOUT_URL = 'https://pay.flitt.com/api/checkout/url';

export interface FlittConfig {
  merchantId: number;
  secretKey: string;
}

/** Returns null when the Flitt env vars are not set (payment flow disabled). */
export function getFlittConfig(): FlittConfig | null {
  const merchantId = Number(process.env.FLITT_MERCHANT_ID);
  const secretKey = process.env.FLITT_SECRET_KEY;
  if (!Number.isInteger(merchantId) || merchantId <= 0 || !secretKey) return null;
  return { merchantId, secretKey };
}

export function toMinorUnits(amountGel: number): number {
  return Math.round(amountGel * 100);
}

async function sha1Hex(input: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(input));
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function buildSignature(
  params: Record<string, unknown>,
  secretKey: string,
): Promise<string> {
  const values = Object.keys(params)
    .filter((key) => key !== 'signature' && key !== 'response_signature_string')
    .sort()
    .map((key) => params[key])
    .filter((value) => value !== undefined && value !== null && String(value) !== '')
    .map((value) => String(value));
  return sha1Hex([secretKey, ...values].join('|'));
}

export interface CreateCheckoutParams {
  orderId: string;
  /** Amount in minor units (tetri). */
  amount: number;
  currency: string;
  description: string;
  serverCallbackUrl: string;
  responseUrl: string;
}

export interface FlittCheckout {
  checkoutUrl: string;
  paymentId: string;
}

export async function createCheckout(
  config: FlittConfig,
  params: CreateCheckoutParams,
): Promise<FlittCheckout> {
  const request: Record<string, unknown> = {
    merchant_id: config.merchantId,
    order_id: params.orderId,
    amount: params.amount,
    currency: params.currency,
    order_desc: params.description,
    server_callback_url: params.serverCallbackUrl,
    response_url: params.responseUrl,
  };
  request.signature = await buildSignature(request, config.secretKey);

  const response = await fetch(FLITT_CHECKOUT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ request }),
  });

  if (!response.ok) {
    throw new Error(`Flitt checkout request failed with HTTP ${response.status}`);
  }

  const body = (await response.json()) as {
    response: {
      response_status: string;
      checkout_url?: string;
      payment_id?: string | number;
      error_message?: string;
      error_code?: string | number;
    };
  };

  const result = body.response;
  if (result.response_status !== 'success' || !result.checkout_url) {
    throw new Error(
      `Flitt checkout creation failed: ${result.error_code ?? ''} ${result.error_message ?? 'unknown error'}`,
    );
  }

  return { checkoutUrl: result.checkout_url, paymentId: String(result.payment_id ?? '') };
}

/** Verifies the signature of a callback / response payload from Flitt. */
export async function verifyCallbackSignature(
  payload: Record<string, unknown>,
  secretKey: string,
): Promise<boolean> {
  const received = payload.signature;
  if (typeof received !== 'string' || !received) return false;
  const expected = await buildSignature(payload, secretKey);
  return expected === received.toLowerCase();
}

const FLITT_STATUS_URL = 'https://pay.flitt.com/api/status/order_id';

/**
 * Fetches the authoritative order status from Flitt and verifies the
 * response signature. Returns null when the order is unknown to Flitt or
 * the response fails verification. Used as the source of truth when a
 * callback payload can't be verified directly.
 */
export async function getVerifiedOrderStatus(
  config: FlittConfig,
  orderId: string,
): Promise<Record<string, unknown> | null> {
  const request: Record<string, unknown> = {
    merchant_id: config.merchantId,
    order_id: orderId,
  };
  request.signature = await buildSignature(request, config.secretKey);

  const response = await fetch(FLITT_STATUS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ request }),
  });
  if (!response.ok) {
    console.error(`Flitt status request failed with HTTP ${response.status}`);
    return null;
  }

  const body = (await response.json()) as { response?: Record<string, unknown> };
  const payload = body.response;
  if (!payload || payload.response_status !== 'success') {
    console.error('Flitt status request rejected:', payload?.error_message ?? 'no response');
    return null;
  }
  if (!(await verifyCallbackSignature(payload, config.secretKey))) {
    console.error('Flitt status response failed signature verification for order', orderId);
    return null;
  }
  return payload;
}
