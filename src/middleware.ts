import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

export default createMiddleware(routing);

export const config = {
  // Match all pathnames except for
  // - API routes
  // - _next (Next.js internals)
  // - Static files (images, fonts, etc.)
  matcher: [
    // Match root
    '/',
    // Match locale paths
    '/(en|es)/:path*',
    // Match all paths that need locale redirect (excluding static files and internals)
    '/((?!api|_next|_vercel|.*\\..*).*)',
  ],
};
