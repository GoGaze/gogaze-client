// src/middleware.ts
// NOTE: with a `src/` directory, Next.js looks for middleware HERE (next to
// the app/ dir), not at the project root.
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const SESSION_COOKIE = 'session';

/**
 * Best-effort token check at the edge: decode the JWT and verify it has not
 * expired. The signature is verified server-side by Django on every API call;
 * this just avoids serving the app shell to an obviously stale/expired session.
 */
function isTokenLive(token: string): boolean {
  try {
    const payload = token.split('.')[1];
    if (!payload) return false;
    const b64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = b64 + '='.repeat((4 - (b64.length % 4)) % 4);
    const claims = JSON.parse(atob(padded));
    return typeof claims.exp === 'number' && claims.exp * 1000 > Date.now();
  } catch {
    return false;
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE)?.value;

  if (!token || !isTokenLive(token)) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  // Gate the authenticated app routes. `/` is a client-side splash that
  // redirects by auth state; `/login`, `/display/*`, API and static assets are
  // intentionally not gated here.
  matcher: [
    '/dashboard/:path*',
    '/gallery/:path*',
    '/upload/:path*',
    '/devices/:path*',
    '/settings/:path*',
  ],
};
