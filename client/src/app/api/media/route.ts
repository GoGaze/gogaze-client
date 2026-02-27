import { NextRequest, NextResponse } from 'next/server';
import { API_BASE_URL } from '../config';

// Route segment config for App Router
export const runtime = 'nodejs';
export const maxDuration = 600; // 10 minutes for large file uploads

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
  const uploadUrl = `${API_BASE_URL}/media/`;
  
  try {
    const formData = await request.formData();
    
    // Log the API URL being used (for debugging, but don't expose in production)
    console.log(`[Media Upload] Attempting to upload to: ${uploadUrl}`);
    
    // Create AbortController for timeout handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 600000); // 10 minutes timeout
    
    try {
      const response = await fetch(uploadUrl, {
        method: 'POST',
        body: formData,
        signal: controller.signal,
        // Don't set Content-Type header, let fetch set it automatically with boundary for FormData
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        // Handle 502 Bad Gateway specifically
        if (response.status === 502) {
          console.error(`[Media Upload] 502 Bad Gateway from backend at ${uploadUrl}`);
          return NextResponse.json(
            { 
              error: `Backend server at ${API_BASE_URL} is not responding. Please check if the API server is running and accessible.`,
              status: 502,
              apiUrl: process.env.NODE_ENV === 'development' ? API_BASE_URL : undefined // Only show in dev
            },
            { status: 502 }
          );
        }
        
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.detail || errorData.error || `HTTP error! status: ${response.status}`;
        
        console.error(`[Media Upload] Backend returned error ${response.status}:`, errorMessage);
        
        // Return appropriate status code
        return NextResponse.json(
          { error: errorMessage, status: response.status },
          { status: response.status >= 400 && response.status < 500 ? response.status : 500 }
        );
      }

      const data = await response.json();
      return NextResponse.json(data);
    } catch (fetchError) {
      clearTimeout(timeoutId);
      
      if (fetchError instanceof Error) {
        if (fetchError.name === 'AbortError') {
          console.error('[Media Upload] Request timeout after 10 minutes');
          return NextResponse.json(
            { error: 'Upload timeout: The file is too large or the server took too long to respond' },
            { status: 504 }
          );
        }
        
        // Check if it's a connection error
        const errorMsg = fetchError.message.toLowerCase();
        if (errorMsg.includes('econnrefused') || 
            errorMsg.includes('fetch failed') || 
            errorMsg.includes('networkerror') ||
            errorMsg.includes('failed to fetch')) {
          console.error(`[Media Upload] Connection error to ${uploadUrl}:`, fetchError.message);
          return NextResponse.json(
            { 
              error: `Cannot connect to backend server at ${API_BASE_URL}. Please check if the API server is running.`,
              status: 502,
              apiUrl: process.env.NODE_ENV === 'development' ? API_BASE_URL : undefined // Only show in dev
            },
            { status: 502 }
          );
        }
        
        console.error('[Media Upload] Unexpected fetch error:', fetchError);
        throw fetchError;
      }
      throw fetchError;
    }
  } catch (error) {
    console.error('[Media Upload] Error uploading media file:', error);
    
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Failed to upload media file';
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
