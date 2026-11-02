import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuthStore } from '../store/authStore';
import { getApiBaseUrl } from '../api/client';

export interface RealtimeMessage {
  id?: string;
  type: string;
  channel?: string;
  aggregateType?: string;
  aggregateId?: string;
  payload?: any;
  timestamp?: string;
}

export function getRealtimeWsUrl(): string {
  const httpUrl = getApiBaseUrl().replace(/\/api\/v1\/?$/, '');
  const isSecure = httpUrl.startsWith('https://');
  const baseWs = httpUrl.replace(/^https?:\/\//, isSecure ? 'wss://' : 'ws://');
  return `${baseWs}/realtime`;
}

export function useRealtime(onEvent?: (event: RealtimeMessage) => void) {
  const { token, isAuthenticated } = useAuthStore();
  const [isConnected, setIsConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<RealtimeMessage | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<any>(null);
  const cursorRef = useRef<string | null>(null);

  const connect = useCallback(() => {
    if (!isAuthenticated || !token) return;

    try {
      const wsUrl = new URL(getRealtimeWsUrl());
      wsUrl.searchParams.set('token', token);
      if (cursorRef.current) {
        wsUrl.searchParams.set('cursor', cursorRef.current);
      }

      const ws = new WebSocket(wsUrl.toString());
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
      };

      ws.onmessage = (messageEvent) => {
        try {
          const data: RealtimeMessage = JSON.parse(messageEvent.data);

          if (data.id) {
            cursorRef.current = data.id;
          }

          setLastEvent(data);
          if (onEvent) {
            onEvent(data);
          }

          // Dispatch window event for cross-component subscription
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('billionbiz_realtime', { detail: data }));
          }
        } catch (e) {
          console.warn('[Realtime] Failed to parse message', e);
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        wsRef.current = null;
        // Auto-reconnect after 3 seconds
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, 3000);
      };

      ws.onerror = (err) => {
        console.warn('[Realtime] WebSocket error:', err);
        ws.close();
      };
    } catch (err) {
      console.warn('[Realtime] Failed to initialize WebSocket', err);
    }
  }, [isAuthenticated, token, onEvent]);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect]);

  const sendPing = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ action: 'ping' }));
    }
  }, []);

  return {
    isConnected,
    lastEvent,
    sendPing
  };
}

