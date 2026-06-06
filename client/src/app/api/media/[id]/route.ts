import { NextRequest } from 'next/server';
import { API_BASE_URL, authHeaders, relay, upstreamError } from '../../config';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const upstream = await fetch(`${API_BASE_URL}/media/${id}/`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json', ...authHeaders(request) },
      cache: 'no-store',
    });
    return relay(upstream);
  } catch (error) {
    return upstreamError(error, `GET /media/${id}`);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const body = await request.json();
    const upstream = await fetch(`${API_BASE_URL}/media/${id}/`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...authHeaders(request) },
      body: JSON.stringify(body),
    });
    return relay(upstream);
  } catch (error) {
    return upstreamError(error, `PATCH /media/${id}`);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const upstream = await fetch(`${API_BASE_URL}/media/${id}/`, {
      method: 'DELETE',
      headers: { ...authHeaders(request) },
    });
    return relay(upstream);
  } catch (error) {
    return upstreamError(error, `DELETE /media/${id}`);
  }
}
