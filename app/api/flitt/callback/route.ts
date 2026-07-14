import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/src/lib/supabase/server';
import { getFlittConfig, verifyCallbackSignature } from '@/src/lib/flitt/client';

export const runtime = 'edge';

// Flitt server callback (host-to-host). Flitt retries on any non-200 response
// (2s, 60s, 5m, 10m, 1h, 24h), so once the callback is authenticated we always
// answer 200 — even for orders we can't act on — to stop the retry loop.
export async function POST(request: Request) {
  const config = getFlittConfig();
  if (!config) {
    console.error('Flitt callback received but FLITT_* env vars are not set');
    return NextResponse.json({ error: 'Flitt is not configured' }, { status: 500 });
  }

  let payload: Record<string, unknown>;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!(await verifyCallbackSignature(payload, config.secretKey))) {
    console.error('Flitt callback signature mismatch for order', payload.order_id);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const orderId = typeof payload.order_id === 'string' ? payload.order_id : null;
  const orderStatus = typeof payload.order_status === 'string' ? payload.order_status : null;
  if (!orderId || !orderStatus) {
    return NextResponse.json({ error: 'Missing order_id or order_status' }, { status: 400 });
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
  const { data: order, error: updateError } = await supabase
    .from('orders')
    .update({
      status: newStatus,
      flitt_payment_id: String(payload.payment_id ?? ''),
      ...(newStatus === 'paid' ? { paid_at: new Date().toISOString() } : {}),
    })
    .eq('id', orderId)
    .eq('status', 'pending_payment')
    .select('id, first_name, last_name, email, phone, size, color, quantity, sticker_type, sticker_link, outer_sleeve, outer_sleeve_link, total_price')
    .maybeSingle();

  if (updateError) {
    console.error('Flitt callback: order update failed:', updateError);
    return NextResponse.json({ error: 'Database update failed' }, { status: 500 });
  }
  if (!order) {
    // Unknown order id or already finalized — acknowledge to stop retries.
    return NextResponse.json({ ok: true });
  }

  if (newStatus === 'paid') {
    await sendPaidOrderNotification(order);
  }

  return NextResponse.json({ ok: true });
}

// Same pattern as app/api/orders/route.ts: the status change is already
// persisted, so a notification failure is logged, never surfaced to Flitt.
async function sendPaidOrderNotification(order: {
  id: string;
  first_name: string;
  last_name: string | null;
  email: string;
  phone: string;
  size: string;
  color: string;
  quantity: number;
  sticker_type: string;
  sticker_link: string | null;
  outer_sleeve: boolean;
  outer_sleeve_link: string | null;
  total_price: number;
}) {
  const web3formsKey = process.env.WEB3FORMS_ACCESS_KEY;
  if (!web3formsKey) {
    console.error('WEB3FORMS_ACCESS_KEY is not set; skipping paid order notification email');
    return;
  }
  try {
    const emailResponse = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        access_key: web3formsKey,
        subject: `PAID Order ${order.id} - Firfita`,
        'Order ID': order.id,
        'First Name': order.first_name,
        'Last Name': order.last_name ?? '',
        'Email': order.email,
        'Phone': order.phone,
        'Size': order.size,
        'Color': order.color,
        'Quantity': order.quantity,
        'Outer Sleeve': order.outer_sleeve ? `Yes (${order.outer_sleeve_link})` : 'No',
        'Center Sticker': order.sticker_type === 'custom' ? `Custom (${order.sticker_link})` : 'Firfita Default',
        'Total Price': `${order.total_price} GEL`,
      }),
    });
    if (!emailResponse.ok) {
      console.error('Web3Forms paid notification failed:', await emailResponse.text());
    }
  } catch (emailError) {
    console.error('Web3Forms paid notification failed:', emailError);
  }
}
