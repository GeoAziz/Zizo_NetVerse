/**
 * WebSocket Client for real-time visualization data streams
 * Handles network devices, WAN traffic, and threat events
 */

export type MessageType = 'device_update' | 'wan_traffic' | 'threat_event' | 'connection_update' | 'connection_lost' | 'reconnect';

export interface WebSocketMessage {
  type: MessageType;
  data: any;
  timestamp: number;
}

export interface DeviceUpdate {
  id: string;
  name: string;
  ip: string;
  mac: string;
  status: 'online' | 'offline' | 'suspicious';
  type: 'router' | 'pc' | 'server' | 'mobile' | 'iot';
  position?: { x: number; y: number; z: number };
  traffic_in: number;
  traffic_out: number;
  threat_level: 'low' | 'medium' | 'high' | 'critical';
}

export interface WANTraffic {
  id: string;
  source_ip: string;
  source_country: string;
  source_lat: number;
  source_lon: number;
  dest_ip: string;
  dest_country: string;
  dest_lat: number;
  dest_lon: number;
  bytes: number;
  protocol: string;
  threat_score: number;
  timestamp: number;
}

export interface ThreatEvent {
  id: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  source_ip: string;
  source_country: string;
  source_lat: number;
  source_lon: number;
  target_ip: string;
  target_country: string;
  target_lat: number;
  target_lon: number;
  description: string;
  timestamp: number;
}

export interface ConnectionUpdate {
  source_id: string;
  target_id: string;
  bandwidth: number;
  packets: number;
  status: 'active' | 'idle' | 'suspicious';
}

export type MessageHandler = (message: WebSocketMessage) => void;

export class WebSocketClient {
  private ws: WebSocket | null = null;
  private url: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectInterval = 3000;
  private messageHandlers: Map<MessageType, Set<MessageHandler>> = new Map();
  private isManualClose = false;

  constructor(url?: string) {
    // Default to localhost development server pointing to correct backend WebSocket endpoint
    this.url = url || (typeof window !== 'undefined' 
      ? `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.hostname}:${window.location.port || (window.location.protocol === 'https:' ? '443' : '8000')}/api/v1/ws/logs/network`
      : 'ws://localhost:8000/api/v1/ws/logs/network');
  }

  /**
   * Connect to the WebSocket server
   */
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.isManualClose = false;
        this.ws = new WebSocket(this.url);

        this.ws.onopen = () => {
          console.log('WebSocket connected');
          this.reconnectAttempts = 0;
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error('Failed to parse WebSocket message:', error);
          }
        };

        this.ws.onclose = () => {
          if (!this.isManualClose) {
            this.attemptReconnect();
          }
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          reject(error);
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Attempt to reconnect with exponential backoff
   */
  private attemptReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.min(
        this.reconnectInterval * Math.pow(2, this.reconnectAttempts - 1),
        30000
      );
      
      console.log(`WebSocket reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);
      
      setTimeout(() => {
        this.connect().catch(() => {
          // Retry
        });
      }, delay);
    } else {
      this.notifyHandlers({
        type: 'connection_lost',
        data: { reason: 'Max reconnect attempts reached' },
        timestamp: Date.now(),
      });
    }
  }

  /**
   * Subscribe to a message type
   */
  subscribe(type: MessageType, handler: MessageHandler): () => void {
    if (!this.messageHandlers.has(type)) {
      this.messageHandlers.set(type, new Set());
    }
    
    this.messageHandlers.get(type)!.add(handler);

    // Return unsubscribe function
    return () => {
      const handlers = this.messageHandlers.get(type);
      if (handlers) {
        handlers.delete(handler);
      }
    };
  }

  /**
   * Handle incoming messages
   */
  private handleMessage(message: WebSocketMessage): void {
    this.notifyHandlers(message);
  }

  /**
   * Notify all subscribed handlers
   */
  private notifyHandlers(message: WebSocketMessage): void {
    const handlers = this.messageHandlers.get(message.type);
    if (handlers) {
      handlers.forEach((handler) => {
        try {
          handler(message);
        } catch (error) {
          console.error('Error in WebSocket message handler:', error);
        }
      });
    }
  }

  /**
   * Send a message to the server
   */
  send(type: string, data: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, data, timestamp: Date.now() }));
    } else {
      console.warn('WebSocket is not connected');
    }
  }

  /**
   * Disconnect from the server
   */
  disconnect(): void {
    this.isManualClose = true;
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
}

// Singleton instance
let wsClient: WebSocketClient | null = null;

export function getWebSocketClient(): WebSocketClient {
  if (!wsClient) {
    wsClient = new WebSocketClient();
  }
  return wsClient;
}

export function createWebSocketClient(url?: string): WebSocketClient {
  return new WebSocketClient(url);
}
