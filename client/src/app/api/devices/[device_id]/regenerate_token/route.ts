import { NextRequest } from 'next/server';
import { API_BASE_URL, authHeaders, relay, upstreamError } from '../../../config';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ device_id: string }> },
) {
  const { device_id } = await params;
  try {
    const upstream = await fetch(
      `${API_BASE_URL}/devices/${device_id}/regenerate_token/`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders(request) },
      },
    );
    return relay(upstream);
  } catch (error) {
    return upstreamError(error, `POST /devices/${device_id}/regenerate_token`);
  }
}
