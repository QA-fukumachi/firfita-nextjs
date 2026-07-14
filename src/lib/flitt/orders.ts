// Applies a verified Flitt payment status to our orders table. Shared by the
// server callback (the primary signal) and the browser-return route (a
// secondary reconciliation pass, since customers can abandon the checkout
// without any callback ever firing).

import { getSupabaseAdmin } from '@/src/lib/supabase/server';
import { getVerifiedOrderStatus, type FlittConfig } from './client';

/**
 * Maps a Flitt order_status to our order status, or null when no transition
 * is needed (created/processing are intermediate; reversed is a refund of an
 * already-paid order and is handled manually for now).
 */
export function mapOrderStatus(orderStatus: string): 'paid' | 'failed' | 'cancelled' | null {
  switch (orderStatus) {
    case 'approved':
      return 'paid';
    case 'declined':
      return 'failed';
    case 'expired':
      return 'cancelled';
    default:
      return null;
  }
}

/**
 * Persists the status from a VERIFIED Flitt payload. Only orders still in
 * pending_payment are transitioned, so replayed or late updates can never
 * downgrade a finalized order. Throws on database errors.
 */
export async function applyVerifiedPayload(payload: Record<string, unknown>): Promise<void> {
  const orderId = typeof payload.order_id === 'string' ? payload.order_id : null;
  const orderStatus = typeof payload.order_status === 'string' ? payload.order_status : null;
  if (!orderId || !orderStatus) return;

  const newStatus = mapOrderStatus(orderStatus);
  if (!newStatus) return;

  // Never write an empty payment id: the column is UNIQUE, so a second empty
  // string would violate the constraint and wedge the callback in retries.
  const paymentId =
    payload.payment_id != null && String(payload.payment_id) !== ''
      ? String(payload.payment_id)
      : null;

  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from('orders')
    .update({
      status: newStatus,
      ...(paymentId ? { flitt_payment_id: paymentId } : {}),
      ...(newStatus === 'paid' ? { paid_at: new Date().toISOString() } : {}),
    })
    .eq('id', orderId)
    .eq('status', 'pending_payment');

  if (error) {
    throw new Error(`Order ${orderId} update failed: ${error.message}`);
  }
}

/**
 * Fetches the authoritative status from Flitt, applies it, and returns the
 * Flitt order_status (or null when the order is unknown / unverifiable).
 */
export async function reconcileOrder(
  config: FlittConfig,
  orderId: string,
): Promise<string | null> {
  const payload = await getVerifiedOrderStatus(config, orderId);
  if (!payload) return null;
  await applyVerifiedPayload(payload);
  return typeof payload.order_status === 'string' ? payload.order_status : null;
}
