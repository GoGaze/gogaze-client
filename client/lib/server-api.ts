// Server-side API functions for SSR
const API_BASE_URL =
  process.env.API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:8000/api';

export interface MediaFile {
  id: number;
  title: string;
  file: string;
  processed_file?: string;
  uploaded_at: string;
}

export async function getMediaFiles(): Promise<MediaFile[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/media/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      // Add cache control for better performance
      next: { revalidate: 60 }, // Revalidate every 60 seconds
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching media files:', error);
    // Return empty array on error to prevent page crashes
    return [];
  }
}

export async function getMediaFile(id: number): Promise<MediaFile | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/media/${id}/`, {
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
    console.error('Error fetching media file:', error);
    return null;
  }
}

export const getFileType = (filename: string): 'video' | 'image' | 'other' => {
  const extension = filename.split('.').pop()?.toLowerCase();
  
  const videoExtensions = ['mp4', 'mov', 'avi', 'mkv', 'webm', 'flv', 'wmv'];
  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'];
  
  if (videoExtensions.includes(extension || '')) return 'video';
  if (imageExtensions.includes(extension || '')) return 'image';
  return 'other';
};

export const getMediaFileUrl = (filePath: string): string => {
  // Convert Django media URL to full URL
  if (filePath.startsWith('/media/')) {
    return `${process.env.API_BASE_URL?.replace('/api', '') || 'http://localhost:8000'}${filePath}`;
  }
  return filePath;
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
};
