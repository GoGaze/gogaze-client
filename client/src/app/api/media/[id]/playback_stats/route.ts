import { NextRequest } from 'next/server';
import { API_BASE_URL, authHeaders, relay, upstreamError } from '../../../config';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const upstream = await fetch(`${API_BASE_URL}/media/${id}/playback_stats/`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json', ...authHeaders(request) },
      cache: 'no-store',
    });
    return relay(upstream);
  } catch (error) {
    return upstreamError(error, `GET /media/${id}/playback_stats`);
  }
}
