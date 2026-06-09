import { NextRequest } from 'next/server';
import { API_BASE_URL, authHeaders, relay, upstreamError } from '../../config';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ device_id: string }> },
) {
  const { device_id } = await params;
  try {
    const upstream = await fetch(`${API_BASE_URL}/devices/${device_id}/`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json', ...authHeaders(request) },
      cache: 'no-store',
    });
    return relay(upstream);
  } catch (error) {
    return upstreamError(error, `GET /devices/${device_id}`);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ device_id: string }> },
) {
  const { device_id } = await params;
  try {
    const upstream = await fetch(`${API_BASE_URL}/devices/${device_id}/`, {
      method: 'DELETE',
      headers: { ...authHeaders(request) },
    });
    return relay(upstream);
  } catch (error) {
    return upstreamError(error, `DELETE /devices/${device_id}`);
  }
}
