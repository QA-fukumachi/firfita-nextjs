import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/src/lib/supabase/server';
import { createCheckout, getFlittConfig, toMinorUnits } from '@/src/lib/flitt/client';
import {
  calculateTotal,
  getVinylPricing,
  SIZES,
  COLORS,
  type Size,
  type Color,
  type StickerType,
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

  // Authoritative pricing — the client never sends amounts.
  const unitPrice = getVinylPricing(size, quantity).current;
  const totalPrice = calculateTotal({ size, color, quantity, stickerType, outerSleeve });

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
      });

      const { error: payIdError } = await supabase
        .from('orders')
        .update({ flitt_payment_id: checkout.paymentId })
        .eq('id', order.id);
      if (payIdError) {
        console.error('Failed to store Flitt payment id:', payIdError);
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

  // Notification email. The order is already saved, so a failure here must
  // not fail the request — it is logged and the order stays in the database.
  const web3formsKey = process.env.WEB3FORMS_ACCESS_KEY;
  if (web3formsKey) {
    try {
      const emailResponse = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          access_key: web3formsKey,
          subject: `New Order ${order.id} - Firfita`,
          'Order ID': order.id,
          'First Name': firstName,
          'Last Name': lastName ?? '',
          'Email': email,
          'Phone': phone,
          'Size': size,
          'Color': color,
          'Quantity': quantity,
          'Outer Sleeve': outerSleeve ? `Yes (${outerSleeveLink})` : 'No',
          'Center Sticker': stickerType === 'custom' ? `Custom (${stickerLink})` : 'Firfita Default',
          'Total Price': `${totalPrice} GEL`,
        }),
      });
      if (!emailResponse.ok) {
        console.error('Web3Forms notification failed:', await emailResponse.text());
      }
    } catch (emailError) {
      console.error('Web3Forms notification failed:', emailError);
    }
  } else {
    console.error('WEB3FORMS_ACCESS_KEY is not set; skipping order notification email');
  }

  return NextResponse.json({ orderId: order.id, total: totalPrice }, { status: 201 });
}
