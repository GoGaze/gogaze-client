import { useState, useEffect, useCallback, useRef } from 'react';
import { WebSocketService, WebSocketMessage } from '../api';

export interface UseWebSocketReturn {
  connected: boolean;
  connecting: boolean;
  error: string | null;
  connect: (deviceId: string) => Promise<void>;
  disconnect: () => void;
  sendMessage: (message: WebSocketMessage) => void;
  lastMessage: WebSocketMessage | null;
}

export function useWebSocket(): UseWebSocketReturn {
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  
  const webSocketServiceRef = useRef<WebSocketService | null>(null);

  const connect = useCallback(async (deviceId: string) => {
    try {
      setConnecting(true);
      setError(null);
      
      // Disconnect existing connection if any
      if (webSocketServiceRef.current) {
        webSocketServiceRef.current.disconnect();
      }
      
      const wsService = new WebSocketService(deviceId);
      webSocketServiceRef.current = wsService;
      
      // Set up message handler
      wsService.onMessage((message) => {
        setLastMessage(message);
      });
      
      // Set up connection change handler
      wsService.onConnectionChange((isConnected) => {
        setConnected(isConnected);
        if (!isConnected) {
          setConnecting(false);
        }
      });
      
      await wsService.connect();
      setConnecting(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect to device');
      setConnecting(false);
      console.error('WebSocket connection error:', err);
    }
  }, []);

  const disconnect = useCallback(() => {
    if (webSocketServiceRef.current) {
      webSocketServiceRef.current.disconnect();
      webSocketServiceRef.current = null;
    }
    setConnected(false);
    setConnecting(false);
    setError(null);
  }, []);

  const sendMessage = useCallback((message: WebSocketMessage) => {
    if (webSocketServiceRef.current && webSocketServiceRef.current.isConnected()) {
      // Note: The current WebSocketService doesn't have a send method
      // This would need to be implemented if bidirectional communication is needed
      console.warn('Send message not implemented in WebSocketService', message);
    } else {
      console.warn('WebSocket not connected');
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    connected,
    connecting,
    error,
    connect,
    disconnect,
    sendMessage,
    lastMessage,
  };
}
