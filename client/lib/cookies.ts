// lib/session helpers
//
// The Firebase ID token is stored in an HttpOnly cookie set by the server
// (/api/auth/session) — it is never readable by client-side JS, so XSS cannot
// steal it. These helpers just sync the token to / from that endpoint.

/** Persist the current Firebase ID token into the HttpOnly session cookie. */
export async function syncSession(token: string): Promise<void> {
  await fetch('/api/auth/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  });
}

/** Clear the session cookie (logout). */
export async function clearSession(): Promise<void> {
  try {
    await fetch('/api/auth/session', { method: 'DELETE' });
  } catch (error) {
    console.error('Failed to clear session:', error);
  }
}
