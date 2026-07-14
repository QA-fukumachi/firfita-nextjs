import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/src/lib/supabase/server';
import {
  getFlittConfig,
  getVerifiedOrderStatus,
  verifyCallbackSignature,
} from '@/src/lib/flitt/client';

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
// (2s, 60s, 5m, 10m, 1h, 24h), so once the callback is authenticated we always
// answer 200 — even for orders we can't act on — to stop the retry loop.
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

  // The callback payload is only trusted if its signature verifies. When it
  // doesn't (Flitt callback payloads vary in shape), the callback is treated
  // purely as a trigger and the authoritative, signed order status is fetched
  // from Flitt's status API instead — that response cannot be forged.
  let payload: Record<string, unknown> | null = null;
  if (await verifyCallbackSignature(body, config.secretKey)) {
    payload = body;
  } else {
    console.error('Flitt callback signature mismatch for order', orderId, '— falling back to status API');
    payload = await getVerifiedOrderStatus(config, orderId);
  }
  if (!payload) {
    return NextResponse.json({ error: 'Could not verify payment status' }, { status: 400 });
  }

  const orderStatus = typeof payload.order_status === 'string' ? payload.order_status : null;
  if (!orderStatus) {
    return NextResponse.json({ error: 'Missing order_status' }, { status: 400 });
  }

  // Intermediate statuses (created, processing) need no action.
  const newStatus =
    orderStatus === 'approved' ? 'paid'
    : orderStatus === 'declined' || orderStatus === 'expired' ? 'failed'
    : null;
  if (!newStatus) {
    return NextResponse.json({ ok: true });
  }

  const supabase = getSupabaseAdmin();

  // Only transition orders that are still awaiting payment, so a late or
  // replayed callback can never downgrade a paid order.
  // The paid-order notification email is sent from the customer's browser on
  // return from checkout (Web3Forms' free plan rejects server-side calls).
  const { error: updateError } = await supabase
    .from('orders')
    .update({
      status: newStatus,
      flitt_payment_id: String(payload.payment_id ?? ''),
      ...(newStatus === 'paid' ? { paid_at: new Date().toISOString() } : {}),
    })
    .eq('id', orderId)
    .eq('status', 'pending_payment');

  if (updateError) {
    console.error('Flitt callback: order update failed:', updateError);
    return NextResponse.json({ error: 'Database update failed' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
