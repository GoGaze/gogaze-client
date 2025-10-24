import { useState, useEffect, useCallback } from 'react';
import { MediaFile, mediaApi, ApiError } from '../api';

export interface UseMediaReturn {
  mediaFiles: MediaFile[];
  loading: boolean;
  error: string | null;
  uploadFile: (title: string, file: File) => Promise<MediaFile>;
  updateFile: (id: number, updates: Partial<Pick<MediaFile, 'title'>>) => Promise<MediaFile>;
  deleteFile: (id: number) => Promise<void>;
  playOnDevice: (id: number, deviceId: string) => Promise<void>;
  refresh: () => Promise<void>;
}

export function useMedia(): UseMediaReturn {
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMediaFiles = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const files = await mediaApi.getMediaFiles();
      setMediaFiles(files);
    } catch (err) {
      const errorMessage = err instanceof ApiError 
        ? err.message 
        : 'Failed to fetch media files';
      setError(errorMessage);
      console.error('Error fetching media files:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const uploadFile = useCallback(async (title: string, file: File): Promise<MediaFile> => {
    try {
      setError(null);
      const newFile = await mediaApi.uploadMediaFile(title, file);
      setMediaFiles(prev => [newFile, ...prev]);
      return newFile;
    } catch (err) {
      const errorMessage = err instanceof ApiError 
        ? err.message 
        : 'Failed to upload file';
      setError(errorMessage);
      throw err;
    }
  }, []);

  const updateFile = useCallback(async (id: number, updates: Partial<Pick<MediaFile, 'title'>>): Promise<MediaFile> => {
    try {
      setError(null);
      const updatedFile = await mediaApi.updateMediaFile(id, updates);
      setMediaFiles(prev => 
        prev.map(file => file.id === id ? updatedFile : file)
      );
      return updatedFile;
    } catch (err) {
      const errorMessage = err instanceof ApiError 
        ? err.message 
        : 'Failed to update file';
      setError(errorMessage);
      throw err;
    }
  }, []);

  const deleteFile = useCallback(async (id: number): Promise<void> => {
    try {
      setError(null);
      await mediaApi.deleteMediaFile(id);
      setMediaFiles(prev => prev.filter(file => file.id !== id));
    } catch (err) {
      const errorMessage = err instanceof ApiError 
        ? err.message 
        : 'Failed to delete file';
      setError(errorMessage);
      throw err;
    }
  }, []);

  const playOnDevice = useCallback(async (id: number, deviceId: string): Promise<void> => {
    try {
      setError(null);
      await mediaApi.playMediaOnDevice(id, deviceId);
    } catch (err) {
      const errorMessage = err instanceof ApiError 
        ? err.message 
        : 'Failed to play media on device';
      setError(errorMessage);
      throw err;
    }
  }, []);

  const refresh = useCallback(async () => {
    await fetchMediaFiles();
  }, [fetchMediaFiles]);

  useEffect(() => {
    fetchMediaFiles();
  }, [fetchMediaFiles]);

  return {
    mediaFiles,
    loading,
    error,
    uploadFile,
    updateFile,
    deleteFile,
    playOnDevice,
    refresh,
  };
}
