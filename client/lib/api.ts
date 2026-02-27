// API service layer for GoGaze server integration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
// WebSocket URL — configurable via env var, fallback to server IP
const WS_BASE_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://13.233.206.39';

export interface MediaFile {
  id: number;
  title: string;
  file: string;
  processed_file?: string;
  uploaded_at: string;
}

export interface PlayCommand {
  device_id: string;
}

export interface PlayResponse {
  status: string;
}

export interface StopCommand {
  device_id: string;
}

export interface StopResponse {
  status: string;
}

export interface WebSocketMessage {
  type: string;
  url?: string;
  [key: string]: unknown;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public response?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
    let errorData;
    
    try {
      errorData = await response.json();
      errorMessage = errorData.detail || errorData.message || errorMessage;
    } catch {
      // If response is not JSON, use the status text
    }
    
    throw new ApiError(errorMessage, response.status, errorData);
  }
  
  // Handle empty responses
  const text = await response.text();
  if (!text) {
    return {} as T;
  }
  
  try {
    return JSON.parse(text);
  } catch {
    return text as unknown as T;
  }
}

export class MediaApiService {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Get all media files
   */
  async getMediaFiles(): Promise<MediaFile[]> {
    const response = await fetch(`${this.baseUrl}/media/`);
    return handleResponse<MediaFile[]>(response);
  }

  /**
   * Get a specific media file by ID
   */
  async getMediaFile(id: number): Promise<MediaFile> {
    const response = await fetch(`${this.baseUrl}/media/${id}/`);
    return handleResponse<MediaFile>(response);
  }

  /**
   * Upload a new media file
   */
  async uploadMediaFile(title: string, file: File): Promise<MediaFile> {
    const formData = new FormData();
    formData.append('title', title);
    formData.append('file', file);

    const response = await fetch(`${this.baseUrl}/media/`, {
      method: 'POST',
      body: formData,
    });

    return handleResponse<MediaFile>(response);
  }

  /**
   * Update a media file
   */
  async updateMediaFile(id: number, updates: Partial<Pick<MediaFile, 'title'>>): Promise<MediaFile> {
    const response = await fetch(`${this.baseUrl}/media/${id}/`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });

    return handleResponse<MediaFile>(response);
  }

  /**
   * Delete a media file
   */
  async deleteMediaFile(id: number): Promise<void> {
    const response = await fetch(`${this.baseUrl}/media/${id}/`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new ApiError(`Failed to delete media file ${id}`, response.status);
    }
  }

  /**
   * Send play command to a device
   */
  async playMediaOnDevice(id: number, deviceId: string): Promise<PlayResponse> {
    const response = await fetch(`${this.baseUrl}/media/${id}/play/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ device_id: deviceId }),
    });

    return handleResponse<PlayResponse>(response);
  }

  /**
   * Send stop command to a device
   */
  async stopMediaOnDevice(id: number, deviceId: string): Promise<StopResponse> {
    const response = await fetch(`${this.baseUrl}/media/${id}/stop/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ device_id: deviceId }),
    });

    return handleResponse<StopResponse>(response);
  }
}

// WebSocket service for real-time device communication
export class WebSocketService {
  private socket: WebSocket | null = null;
  private deviceId: string;
  private onMessageCallback?: (message: WebSocketMessage) => void;
  private onConnectionChangeCallback?: (connected: boolean) => void;

  constructor(deviceId: string) {
    this.deviceId = deviceId;
  }

  /**
   * Connect to WebSocket
   */
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      const wsUrl = `${WS_BASE_URL}/ws/display/${this.deviceId}/`;
      
      try {
        this.socket = new WebSocket(wsUrl);
        
        this.socket.onopen = () => {
          console.log(`Connected to device ${this.deviceId}`);
          this.onConnectionChangeCallback?.(true);
          resolve();
        };
        
        this.socket.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            this.onMessageCallback?.(message);
          } catch (error) {
            console.error('Failed to parse WebSocket message:', error);
          }
        };
        
        this.socket.onclose = () => {
          console.log(`Disconnected from device ${this.deviceId}`);
          this.onConnectionChangeCallback?.(false);
        };
        
        this.socket.onerror = (error) => {
          console.error(`WebSocket error for device ${this.deviceId}:`, error);
          reject(error);
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Disconnect from WebSocket
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }

  /**
   * Set message handler
   */
  onMessage(callback: (message: WebSocketMessage) => void): void {
    this.onMessageCallback = callback;
  }

  /**
   * Set connection status handler
   */
  onConnectionChange(callback: (connected: boolean) => void): void {
    this.onConnectionChangeCallback = callback;
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.socket?.readyState === WebSocket.OPEN;
  }
}

// Create singleton instances
export const mediaApi = new MediaApiService();
export const createWebSocketService = (deviceId: string) => new WebSocketService(deviceId);

// Utility functions
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
};

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
    return `http://localhost:8000${filePath}`;
  }
  return filePath;
};
