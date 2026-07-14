import { NextResponse } from 'next/server';

export const runtime = 'edge';

// Flitt sends the payer's browser back to response_url with the payment
// result. This can arrive as a POST (form or JSON) or a plain GET, so a page
// component can't receive it — this route absorbs it and redirects to the
// order page, which shows the outcome from the `payment` query param.
// The result shown here is informational only; the order status is decided
// exclusively by the signed server callback.

const LOCALES = ['en', 'ka'];

function resolveRedirect(request: Request, orderStatus: string | null): NextResponse {
  const url = new URL(request.url);
  const localeParam = url.searchParams.get('locale');
  const locale = localeParam && LOCALES.includes(localeParam) ? localeParam : 'ka';
  const payment = orderStatus === 'approved' ? 'success' : 'failed';
  return NextResponse.redirect(new URL(`/${locale}/order?payment=${payment}`, url.origin), 303);
}

export async function POST(request: Request) {
  let orderStatus: string | null = null;
  const contentType = request.headers.get('content-type') ?? '';
  try {
    if (contentType.includes('application/json')) {
      const body = (await request.json()) as Record<string, unknown>;
      if (typeof body.order_status === 'string') orderStatus = body.order_status;
    } else {
      const form = await request.formData();
      const value = form.get('order_status');
      if (typeof value === 'string') orderStatus = value;
    }
  } catch {
    // Unparseable body — fall through and report as failed.
  }
  return resolveRedirect(request, orderStatus);
}

export async function GET(request: Request) {
  const orderStatus = new URL(request.url).searchParams.get('order_status');
  return resolveRedirect(request, orderStatus);
}
