// Server-side API functions for SSR
// Re-export types from the main api module for consistency
export type { MediaFile } from './api';

const API_BASE_URL =
  process.env.API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:8000/api';

export async function getMediaFiles() {
  try {
    const response = await fetch(`${API_BASE_URL}/media/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      next: { revalidate: 60 },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching media files:', error);
    return [];
  }
}
