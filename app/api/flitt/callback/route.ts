import { NextResponse } from 'next/server';
import { getFlittConfig, verifyCallbackSignature } from '@/src/lib/flitt/client';
import { applyVerifiedPayload, reconcileOrder } from '@/src/lib/flitt/orders';

export const runtime = 'edge';

async function parseCallbackBody(request: Request): Promise<Record<string, unknown> | null> {
  const contentType = request.headers.get('content-type') ?? '';
  try {
    if (contentType.includes('application/json')) {
      return (await request.json()) as Record<string, unknown>;
    }
    const form = await request.formData();
    return Object.fromEntries(form.entries());
  } catch {
    return null;
  }
}

// Flitt server callback (host-to-host). Flitt retries on any non-200 response
// (2s, 60s, 5m, 10m, 1h, 24h), so once the update is verified and persisted
// the response is always 200 to stop the retry loop.
export async function POST(request: Request) {
  const config = getFlittConfig();
  if (!config) {
    console.error('Flitt callback received but FLITT_* env vars are not set');
    return NextResponse.json({ error: 'Flitt is not configured' }, { status: 500 });
  }

  const body = await parseCallbackBody(request);
  const orderId = typeof body?.order_id === 'string' ? body.order_id : null;
  if (!body || !orderId) {
    return NextResponse.json({ error: 'Missing order_id' }, { status: 400 });
  }

  // The paid-order notification email is sent from the customer's browser on
  // return from checkout (Web3Forms' free plan rejects server-side calls).
  try {
    // The callback payload is only trusted if its signature verifies. When it
    // doesn't (Flitt callback payloads vary in shape), the callback is treated
    // purely as a trigger and the authoritative, signed order status is
    // fetched from Flitt's status API instead — that response can't be forged.
    if (await verifyCallbackSignature(body, config.secretKey)) {
      await applyVerifiedPayload(body);
    } else {
      console.error('Flitt callback signature mismatch for order', orderId, '— falling back to status API');
      if ((await reconcileOrder(config, orderId)) === null) {
        return NextResponse.json({ error: 'Could not verify payment status' }, { status: 400 });
      }
    }
  } catch (error) {
    console.error('Flitt callback processing failed:', error);
    return NextResponse.json({ error: 'Order update failed' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
