import { NextResponse } from 'next/server';
import { getFlittConfig } from '@/src/lib/flitt/client';
import { reconcileOrder } from '@/src/lib/flitt/orders';

export const runtime = 'edge';

// Flitt sends the payer's browser back to response_url with the payment
// result. This can arrive as a POST (form or JSON) or a plain GET, so a page
// component can't receive it — this route absorbs it and redirects to the
// order page, which shows the outcome from the `payment` query param.
//
// The banner never trusts the browser-supplied payload: the order status is
// reconciled against Flitt's signed status API. That also settles orders the
// server callback missed (e.g. a checkout the customer cancelled out of).

const LOCALES = ['en', 'ka'];

function redirectToOrderPage(request: Request, payment: 'success' | 'failed'): NextResponse {
  const url = new URL(request.url);
  const localeParam = url.searchParams.get('locale');
  const locale = localeParam && LOCALES.includes(localeParam) ? localeParam : 'ka';
  return NextResponse.redirect(new URL(`/${locale}/order?payment=${payment}`, url.origin), 303);
}

async function extractOrderId(request: Request): Promise<string | null> {
  const fromQuery = new URL(request.url).searchParams.get('order_id');
  if (fromQuery) return fromQuery;

  const contentType = request.headers.get('content-type') ?? '';
  try {
    if (contentType.includes('application/json')) {
      const body = (await request.json()) as Record<string, unknown>;
      return typeof body.order_id === 'string' ? body.order_id : null;
    }
    const form = await request.formData();
    const value = form.get('order_id');
    return typeof value === 'string' ? value : null;
  } catch {
    return null;
  }
}

async function handleReturn(request: Request): Promise<NextResponse> {
  const config = getFlittConfig();
  const orderId = await extractOrderId(request);

  let orderStatus: string | null = null;
  if (config && orderId) {
    try {
      orderStatus = await reconcileOrder(config, orderId);
    } catch (error) {
      console.error('Flitt return: reconciliation failed:', error);
    }
  }

  return redirectToOrderPage(request, orderStatus === 'approved' ? 'success' : 'failed');
}

export async function POST(request: Request) {
  return handleReturn(request);
}

export async function GET(request: Request) {
  return handleReturn(request);
}
