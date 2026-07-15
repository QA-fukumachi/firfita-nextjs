import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/src/lib/supabase/server';
import { createCheckout, getFlittConfig, toMinorUnits } from '@/src/lib/flitt/client';
import {
  calculateTotal,
  getVinylPricing,
  SIZES,
  COLORS,
  DELIVERIES,
  EXPRESS_MAX_QUANTITY,
  type Size,
  type Color,
  type StickerType,
  type ManufacturingTime,
  type Delivery,
} from '@/src/lib/pricing';

export const runtime = 'edge';

interface OrderRequestBody {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  size?: string;
  color?: string;
  quantity?: number;
  stickerType?: string;
  stickerLink?: string;
  outerSleeve?: boolean;
  outerSleeveLink?: string;
  manufacturingTime?: string;
  delivery?: string;
  termsAccepted?: boolean;
  locale?: string;
}

function validationError(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

export async function POST(request: Request) {
  let body: OrderRequestBody;
  try {
    body = await request.json();
  } catch {
    return validationError('Invalid JSON body');
  }

  const firstName = body.firstName?.trim();
  const lastName = body.lastName?.trim() || null;
  const email = body.email?.trim();
  const phone = body.phone?.trim();

  if (!firstName) return validationError('First name is required');
  if (!email || !email.includes('@')) return validationError('A valid email is required');
  if (!phone) return validationError('Phone is required');
  if (!body.termsAccepted) return validationError('Terms must be accepted');

  if (!body.size || !SIZES.includes(body.size as Size)) return validationError('Invalid size');
  if (!body.color || !COLORS.includes(body.color as Color)) return validationError('Invalid color');
  const size = body.size as Size;
  const color = body.color as Color;

  const quantity = Number(body.quantity);
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 9999) {
    return validationError('Quantity must be between 1 and 9999');
  }

  const stickerType: StickerType = body.stickerType === 'custom' ? 'custom' : 'default';
  const stickerLink = stickerType === 'custom' ? body.stickerLink?.trim() : null;
  if (stickerType === 'custom' && !stickerLink) {
    return validationError('Sticker link is required for a custom sticker');
  }

  const outerSleeve = body.outerSleeve === true;
  const outerSleeveLink = outerSleeve ? body.outerSleeveLink?.trim() : null;
  if (outerSleeve && !outerSleeveLink) {
    return validationError('Outer sleeve design link is required');
  }

  const manufacturingTime: ManufacturingTime =
    body.manufacturingTime === 'express' ? 'express' : 'standard';
  if (manufacturingTime === 'express' && quantity > EXPRESS_MAX_QUANTITY) {
    return validationError(`Express manufacturing is only available for up to ${EXPRESS_MAX_QUANTITY} discs`);
  }

  if (!body.delivery || !DELIVERIES.includes(body.delivery as Delivery)) {
    return validationError('Invalid delivery option');
  }
  const delivery = body.delivery as Delivery;

  // Authoritative pricing — the client never sends amounts.
  const unitPrice = getVinylPricing(size, quantity).current;
  const totalPrice = calculateTotal({ size, color, quantity, stickerType, outerSleeve, delivery });

  // When Flitt credentials are configured the order goes through online
  // payment; otherwise it falls back to the original email-only flow.
  const flittConfig = getFlittConfig();
  const locale = body.locale === 'en' ? 'en' : 'ka';

  const supabase = getSupabaseAdmin();
  const { data: order, error: dbError } = await supabase
    .from('orders')
    .insert({
      status: flittConfig ? 'pending_payment' : 'received',
      payment_provider: flittConfig ? 'flitt' : null,
      first_name: firstName,
      last_name: lastName,
      email,
      phone,
      size,
      color,
      quantity,
      sticker_type: stickerType,
      sticker_link: stickerLink,
      outer_sleeve: outerSleeve,
      outer_sleeve_link: outerSleeveLink,
      manufacturing_time: manufacturingTime,
      delivery,
      unit_price: unitPrice,
      total_price: totalPrice,
      currency: 'GEL',
      terms_accepted_at: new Date().toISOString(),
    })
    .select('id')
    .single();

  if (dbError || !order) {
    console.error('Order insert failed:', dbError);
    return NextResponse.json({ error: 'Could not save the order, please try again.' }, { status: 500 });
  }

  if (flittConfig) {
    // Trailing slashes would produce double-slash callback URLs, which 404.
    const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin)
      .trim()
      .replace(/\/+$/, '');
    try {
      const checkout = await createCheckout(flittConfig, {
        orderId: order.id,
        amount: toMinorUnits(totalPrice),
        currency: 'GEL',
        description: `Firfita vinyl order ${order.id}`,
        serverCallbackUrl: `${siteUrl}/api/flitt/callback`,
        responseUrl: `${siteUrl}/api/flitt/return?locale=${locale}`,
        // 30 minutes to complete the payment; then Flitt expires the order
        // and its callback cancels it, so abandoned checkouts don't pile up
        // as pending_payment.
        lifetime: 1800,
      });

      if (checkout.paymentId) {
        const { error: payIdError } = await supabase
          .from('orders')
          .update({ flitt_payment_id: checkout.paymentId })
          .eq('id', order.id);
        if (payIdError) {
          console.error('Failed to store Flitt payment id:', payIdError);
        }
      }

      // The paid-order notification email is sent from the Flitt callback
      // once the payment is approved, not here.
      return NextResponse.json(
        { orderId: order.id, total: totalPrice, checkoutUrl: checkout.checkoutUrl },
        { status: 201 },
      );
    } catch (flittError) {
      console.error('Flitt checkout creation failed:', flittError);
      await supabase.from('orders').update({ status: 'failed' }).eq('id', order.id);
      return NextResponse.json(
        { error: 'Could not start the payment, please try again.' },
        { status: 502 },
      );
    }
  }

  // The notification email is sent from the client — Web3Forms' free plan
  // rejects server-side API calls.
  return NextResponse.json({ orderId: order.id, total: totalPrice }, { status: 201 });
}
