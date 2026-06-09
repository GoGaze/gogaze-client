import { NextRequest } from 'next/server';
import { API_BASE_URL, authHeaders, relay, upstreamError } from '../config';

export async function GET(request: NextRequest) {
  try {
    const upstream = await fetch(`${API_BASE_URL}/devices/`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json', ...authHeaders(request) },
      cache: 'no-store',
    });
    return relay(upstream);
  } catch (error) {
    return upstreamError(error, 'GET /devices');
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const upstream = await fetch(`${API_BASE_URL}/devices/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders(request) },
      body: JSON.stringify(body),
    });
    return relay(upstream);
  } catch (error) {
    return upstreamError(error, 'POST /devices');
  }
}
