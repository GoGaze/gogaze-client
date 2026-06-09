import { NextRequest, NextResponse } from 'next/server';
import { API_BASE_URL, authHeaders, relay, upstreamError } from '../../../config';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const body = await request.json();
    if (!body.device_id) {
      return NextResponse.json({ error: 'device_id is required' }, { status: 400 });
    }
    const upstream = await fetch(`${API_BASE_URL}/media/${id}/play/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders(request) },
      body: JSON.stringify(body),
    });
    return relay(upstream);
  } catch (error) {
    return upstreamError(error, `POST /media/${id}/play`);
  }
}
