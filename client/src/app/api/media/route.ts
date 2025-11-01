import { NextRequest, NextResponse } from 'next/server';

// Prefer server env, fall back to public env, then localhost
const API_BASE_URL =
  process.env.API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:8000/api';

export async function GET() {
  try {
    const response = await fetch(`${API_BASE_URL}/media/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching media files:', error);
    return NextResponse.json(
      { error: 'Failed to fetch media files' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    const response = await fetch(`${API_BASE_URL}/media/`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error uploading media file:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to upload media file' },
      { status: 500 }
    );
  }
}
