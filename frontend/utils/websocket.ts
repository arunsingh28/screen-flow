/**
 * WebSocket Reconnection Utility
 *
 * Handles WebSocket connection with automatic reconnection for production
 * Works with Cloudflare SSL proxy and handles 100-second timeout
 */

export interface WebSocketConfig {
  url: string;
  onMessage: (data: any) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Event) => void;
  reconnectInterval?: number; // milliseconds
  maxReconnectAttempts?: number;
  heartbeatInterval?: number; // milliseconds
}

export class ReconnectingWebSocket {
  private ws: WebSocket | null = null;
  private config: WebSocketConfig;
  private reconnectAttempts = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private isClosed = false;
  private isConnecting = false;

  constructor(config: WebSocketConfig) {
    this.config = {
      reconnectInterval: 3000, // 3 seconds
      maxReconnectAttempts: Infinity,
      heartbeatInterval: 30000, // 30 seconds (well before Cloudflare's 100s timeout)
      ...config,
    };
    this.connect();
  }

  private connect() {
    if (this.isClosed || this.isConnecting) return;

    this.isConnecting = true;

    try {
      // Determine WebSocket protocol based on page protocol
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';

      // Build WebSocket URL
      let wsUrl = this.config.url;
      if (!wsUrl.startsWith('ws://') && !wsUrl.startsWith('wss://')) {
        // If URL is relative, construct full URL
        const host = window.location.host;
        wsUrl = `${protocol}//${host}${wsUrl.startsWith('/') ? wsUrl : '/' + wsUrl}`;
      }

      console.log(`[WebSocket] Connecting to ${wsUrl}...`);
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('[WebSocket] Connected');
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.config.onConnect?.();
        this.startHeartbeat();
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          // Handle heartbeat response
          if (data.type === 'pong' || data.type === 'heartbeat') {
            console.log('[WebSocket] Heartbeat received');
            return;
          }

          this.config.onMessage(data);
        } catch (error) {
          console.error('[WebSocket] Failed to parse message:', error);
        }
      };

      this.ws.onerror = (error) => {
        console.error('[WebSocket] Error:', error);
        this.isConnecting = false;
        this.config.onError?.(error);
      };

      this.ws.onclose = (event) => {
        console.log(`[WebSocket] Disconnected (code: ${event.code}, reason: ${event.reason})`);
        this.isConnecting = false;
        this.stopHeartbeat();
        this.config.onDisconnect?.();

        // Attempt reconnection if not manually closed
        if (!this.isClosed && this.reconnectAttempts < (this.config.maxReconnectAttempts || Infinity)) {
          this.scheduleReconnect();
        }
      };
    } catch (error) {
      console.error('[WebSocket] Connection failed:', error);
      this.isConnecting = false;
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    this.reconnectAttempts++;
    const delay = Math.min(
      this.config.reconnectInterval! * Math.pow(1.5, this.reconnectAttempts - 1),
      30000 // Max 30 seconds
    );

    console.log(`[WebSocket] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})...`);

    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, delay);
  }

  private startHeartbeat() {
    if (!this.config.heartbeatInterval) return;

    this.stopHeartbeat();

    this.heartbeatTimer = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        console.log('[WebSocket] Sending heartbeat...');
        this.ws.send('ping');
      }
    }, this.config.heartbeatInterval);
  }

  private stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  public send(data: any) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(typeof data === 'string' ? data : JSON.stringify(data));
    } else {
      console.warn('[WebSocket] Cannot send - not connected');
    }
  }

  public close() {
    this.isClosed = true;

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    this.stopHeartbeat();

    if (this.ws) {
      this.ws.close(1000, 'Client closed connection');
      this.ws = null;
    }
  }

  public isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

/**
 * Hook for CV Processing WebSocket
 * Usage in React components
 */
export function useCVProcessingWebSocket(
  userId: string,
  onMessage: (data: any) => void,
  options?: Partial<WebSocketConfig>
) {
  const wsRef = React.useRef<ReconnectingWebSocket | null>(null);

  React.useEffect(() => {
    if (!userId) return;

    const ws = new ReconnectingWebSocket({
      url: `/api/v1/cv-processing/ws/${userId}`,
      onMessage,
      onConnect: () => {
        console.log('[CV Processing] WebSocket connected');
        options?.onConnect?.();
      },
      onDisconnect: () => {
        console.log('[CV Processing] WebSocket disconnected');
        options?.onDisconnect?.();
      },
      onError: (error) => {
        console.error('[CV Processing] WebSocket error:', error);
        options?.onError?.(error);
      },
      ...options,
    });

    wsRef.current = ws;

    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, [userId]);

  return wsRef;
}
