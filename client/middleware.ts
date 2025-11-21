// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const AUTH_TOKEN_COOKIE = 'auth_token';
const PUBLIC_ROUTES = ['/login'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Allow public routes
  if (PUBLIC_ROUTES.includes(pathname)) {
    return NextResponse.next();
  }
  
  // Check for auth token in cookies
  const authTokenCookie = request.cookies.get(AUTH_TOKEN_COOKIE);
  const authToken = authTokenCookie?.value;
  
  // Debug logging (remove in production)
  if (process.env.NODE_ENV === 'development') {
    console.log('[Middleware] Path:', pathname);
    console.log('[Middleware] Has token:', !!authToken);
    console.log('[Middleware] Token value:', authToken ? 'present' : 'missing');
    console.log('[Middleware] All cookies:', request.cookies.getAll().map(c => `${c.name}=${c.value.substring(0, 20)}...`));
  }
  
  // If no token and not on a public route, redirect to login
  if (!authToken) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }
  
  // Allow access if token exists
  return NextResponse.next();
}

// Configure which routes to run middleware on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

