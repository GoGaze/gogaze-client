import { NextRequest, NextResponse } from 'next/server';
import { API_BASE_URL, authHeaders, relay, upstreamError } from '../config';

// Route segment config for App Router
export const runtime = 'nodejs';
export const maxDuration = 600; // 10 minutes for large file uploads

export async function GET(request: NextRequest) {
  try {
    const upstream = await fetch(`${API_BASE_URL}/media/`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json', ...authHeaders(request) },
      cache: 'no-store',
    });
    return relay(upstream);
  } catch (error) {
    return upstreamError(error, 'GET /media');
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 600000); // 10 min
    try {
      const upstream = await fetch(`${API_BASE_URL}/media/`, {
        method: 'POST',
        body: formData,
        signal: controller.signal,
        // Forward auth only; let fetch set the multipart Content-Type/boundary.
        headers: { ...authHeaders(request) },
      });
      clearTimeout(timeoutId);
      return relay(upstream);
    } catch (fetchError) {
      clearTimeout(timeoutId);
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        // 504 so the upload page shows a timeout message (502 -> "backend down").
        return NextResponse.json(
          { error: 'Upload timed out — the file may be too large or the connection too slow.' },
          { status: 504 },
        );
      }
      throw fetchError;
    }
  } catch (error) {
    return upstreamError(error, 'POST /media');
  }
}
