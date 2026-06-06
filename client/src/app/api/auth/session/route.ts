import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE } from '../../config';

// Token lifetime mirrors a Firebase ID token (~1 hour). The client refreshes
// and re-POSTs before this elapses.
const MAX_AGE_SECONDS = 60 * 60;

/**
 * Establish a session: store the Firebase ID token in an HttpOnly, Secure,
 * SameSite=Strict cookie. The token is never exposed to client-side JS, so XSS
 * cannot exfiltrate it.
 */
export async function POST(request: NextRequest) {
  let token: string | undefined;
  try {
    const body = await request.json();
    token = body?.token;
  } catch {
    // fall through to 400
  }

  if (!token || typeof token !== 'string') {
    return NextResponse.json({ error: 'token is required' }, { status: 400 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: MAX_AGE_SECONDS,
  });
  return res;
}

/** Clear the session cookie (logout). */
export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(SESSION_COOKIE);
  return res;
}
