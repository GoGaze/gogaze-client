// Shared server-side API configuration + helpers for route handlers.
import { NextRequest, NextResponse } from 'next/server';

export const API_BASE_URL =
  process.env.API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:8000/api';

export const SESSION_COOKIE = 'session';

/**
 * Build the Authorization header for the upstream Django call by reading the
 * HttpOnly session cookie. The browser sends this cookie automatically on
 * same-origin requests, so client JS never has to handle the token.
 */
export function authHeaders(request: NextRequest): Record<string, string> {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/**
 * Faithfully relay an upstream Response to the browser — preserving the status
 * code and body instead of collapsing everything into a 500.
 */
export async function relay(upstream: Response): Promise<NextResponse> {
  // 204/205/304 are null-body statuses — the Response constructor throws if
  // given ANY body (even ''). Django returns 204 on DELETE, so this matters.
  if (upstream.status === 204 || upstream.status === 205 || upstream.status === 304) {
    return new NextResponse(null, { status: upstream.status });
  }
  const body = await upstream.text();
  const contentType = upstream.headers.get('content-type') ?? 'application/json';
  return new NextResponse(body, {
    status: upstream.status,
    headers: { 'content-type': contentType },
  });
}

/**
 * Translate a thrown fetch/network error into a clean 502 (backend
 * unreachable) without leaking internals in production.
 */
export function upstreamError(error: unknown, context: string): NextResponse {
  console.error(`[proxy] ${context}:`, error);
  const detail =
    process.env.NODE_ENV === 'development' && error instanceof Error
      ? error.message
      : undefined;
  return NextResponse.json(
    { error: 'Could not reach the backend server.', detail },
    { status: 502 },
  );
}
