import createMiddleware from 'next-intl/middleware';
import {routing} from './src/i18n/routing';

export default createMiddleware(routing);

export const config = {
  // Match all pathnames except API routes, Next internals, and files with an
  // extension, so unprefixed default-locale paths (e.g. /order) are handled.
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)']
};

export const runtime = 'experimental-edge';
