// Server-side API helpers for Server Components.
import { cookies } from 'next/headers';
import type { MediaFile } from './api';

export type { MediaFile } from './api';

const API_BASE_URL =
  process.env.API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:8000/api';

/**
 * Fetch the current user's media. Forwards the HttpOnly session cookie to
 * Django and THROWS on failure so the page's error boundary can render a real
 * error state (previously this swallowed errors and returned [], which looked
 * identical to "no media" during an outage).
 */
export async function getMediaFiles(): Promise<MediaFile[]> {
  const cookieStore = await cookies();
  const token = cookieStore.get('session')?.value;

  const response = await fetch(`${API_BASE_URL}/media/`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    // Per-user, auth'd data — never cache.
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Failed to load media (HTTP ${response.status})`);
  }

  return response.json();
}
