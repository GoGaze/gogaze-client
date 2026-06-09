// API service layer for GoGaze server integration.
// Client calls go through the SAME-ORIGIN Next proxy (/api), which forwards the
// HttpOnly session cookie to Django — so the browser never handles the token.
const CLIENT_API_BASE = '/api';
// Origin used to resolve relative Django /media/ paths (local-storage mode).
const API_ORIGIN_SOURCE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
// WebSocket URL — configurable via env var.
const WS_BASE_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000';

const isDev = process.env.NODE_ENV !== 'production';
const wsLog = (...args: unknown[]) => {
  if (isDev) console.log(...args);
};

export interface MediaFile {
  id: number;
  title: string;
  file: string;
  processed_file?: string;
  transcode_status?: 'pending' | 'processing' | 'completed' | 'failed';
  file_size_display?: string;
  uploaded_at: string;
  // Playback stats
  total_play_count?: number;
  total_play_seconds?: number;
  total_play_duration_display?: string;
  is_currently_playing?: boolean;
}

export interface PlaybackSession {
  id: number;
  media_file: number;
  device_id: string;
  started_at: string;
  stopped_at: string | null;
  stop_reason: string | null;
  duration_seconds: number;
  duration_display: string;
}

export interface PlaybackStats {
  media_id: number;
  title: string;
  total_play_count: number;
  total_play_seconds: number;
  total_play_duration_display: string;
  is_currently_playing: boolean;
  sessions: PlaybackSession[];
}

export interface Device {
  id: number;
  device_id: string;
  name: string;
  is_online: boolean;
  last_seen: string | null;
  created_at: string;
}

// Returned by registerDevice — `token` is surfaced exactly once, on creation.
export interface DeviceWithToken extends Device {
  token: string;
}

export interface PlayCommand {
  device_id: string;
}

export interface PlayResponse {
  status: string;
  session_id?: number;
  started_at?: string;
}

export interface StopCommand {
  device_id: string;
}

export interface StopResponse {
  status: string;
  sessions_stopped?: number;
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
      errorMessage =
        errorData.detail || errorData.error || errorData.message || errorMessage;
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

  constructor(baseUrl: string = CLIENT_API_BASE) {
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
  async stopMediaOnDevice(id: number, deviceId: string, reason: string = 'manual'): Promise<StopResponse> {
    const response = await fetch(`${this.baseUrl}/media/${id}/stop/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ device_id: deviceId, reason }),
    });

    return handleResponse<StopResponse>(response);
  }

  /**
   * Get playback stats for a media file
   */
  async getPlaybackStats(id: number): Promise<PlaybackStats> {
    const response = await fetch(`${this.baseUrl}/media/${id}/playback_stats/`);
    return handleResponse<PlaybackStats>(response);
  }

  /**
   * Get playback sessions for a media file
   */
  async getPlaybackSessions(id: number): Promise<PlaybackSession[]> {
    const response = await fetch(`${this.baseUrl}/media/${id}/playback_sessions/`);
    return handleResponse<PlaybackSession[]>(response);
  }

  // ---------- Devices ----------

  async getDevices(): Promise<Device[]> {
    const response = await fetch(`${this.baseUrl}/devices/`);
    return handleResponse<Device[]>(response);
  }

  async registerDevice(deviceId: string, name: string): Promise<DeviceWithToken> {
    const response = await fetch(`${this.baseUrl}/devices/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ device_id: deviceId, name }),
    });
    return handleResponse<DeviceWithToken>(response);
  }

  async deleteDevice(deviceId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/devices/${deviceId}/`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new ApiError(`Failed to delete device ${deviceId}`, response.status);
    }
  }

  async regenerateDeviceToken(deviceId: string): Promise<{ device_id: string; token: string }> {
    const response = await fetch(
      `${this.baseUrl}/devices/${deviceId}/regenerate_token/`,
      { method: 'POST' },
    );
    return handleResponse<{ device_id: string; token: string }>(response);
  }
}

// WebSocket service for real-time device communication, with automatic
// reconnection (exponential backoff) and a keep-alive heartbeat.
export class WebSocketService {
  private socket: WebSocket | null = null;
  private deviceId: string;
  private token: string | null = null;
  private onMessageCallback?: (message: WebSocketMessage) => void;
  private onConnectionChangeCallback?: (connected: boolean) => void;
  private reconnectAttempts = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private shouldReconnect = false;
  private readonly maxReconnectDelay = 30000;

  constructor(deviceId: string) {
    this.deviceId = deviceId;
  }

  /** Connect (optionally with the device token), enabling auto-reconnect. */
  connect(token?: string): Promise<void> {
    if (token !== undefined) this.token = token;
    this.shouldReconnect = true;
    return this.open();
  }

  private open(): Promise<void> {
    return new Promise((resolve, reject) => {
      const query = this.token ? `?token=${encodeURIComponent(this.token)}` : '';
      const wsUrl = `${WS_BASE_URL}/ws/display/${this.deviceId}/${query}`;
      try {
        const socket = new WebSocket(wsUrl);
        this.socket = socket;

        socket.onopen = () => {
          wsLog(`Connected to device ${this.deviceId}`);
          this.reconnectAttempts = 0;
          this.startHeartbeat();
          this.onConnectionChangeCallback?.(true);
          resolve();
        };
        socket.onmessage = (event) => {
          try {
            this.onMessageCallback?.(JSON.parse(event.data));
          } catch (error) {
            console.error('Failed to parse WebSocket message:', error);
          }
        };
        socket.onclose = () => {
          wsLog(`Disconnected from device ${this.deviceId}`);
          this.stopHeartbeat();
          this.onConnectionChangeCallback?.(false);
          this.scheduleReconnect();
        };
        socket.onerror = (error) => {
          console.error(`WebSocket error for device ${this.deviceId}`);
          reject(error);
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  private scheduleReconnect(): void {
    if (!this.shouldReconnect) return;
    const delay = Math.min(1000 * 2 ** this.reconnectAttempts, this.maxReconnectDelay);
    this.reconnectAttempts += 1;
    wsLog(`Reconnecting to ${this.deviceId} in ${delay}ms`);
    this.reconnectTimer = setTimeout(() => {
      this.open().catch(() => {
        /* onclose will schedule the next attempt */
      });
    }, delay);
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      if (this.socket?.readyState === WebSocket.OPEN) {
        this.socket.send(JSON.stringify({ type: 'ping' }));
      }
    }, 30000);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  send(message: WebSocketMessage): void {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket not connected, cannot send message');
    }
  }

  disconnect(): void {
    this.shouldReconnect = false;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.stopHeartbeat();
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }

  onMessage(callback: (message: WebSocketMessage) => void): void {
    this.onMessageCallback = callback;
  }

  onConnectionChange(callback: (connected: boolean) => void): void {
    this.onConnectionChangeCallback = callback;
  }

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
  if (!filePath) return filePath;
  // Absolute (e.g. S3) URLs are already complete.
  if (/^https?:\/\//.test(filePath)) return filePath;
  // Resolve a relative Django /media/ path against the API origin (parsed
  // properly, so hosts containing "api" aren't corrupted by string replace).
  if (filePath.startsWith('/media/')) {
    try {
      return `${new URL(API_ORIGIN_SOURCE).origin}${filePath}`;
    } catch {
      return filePath;
    }
  }
  return filePath;
};
