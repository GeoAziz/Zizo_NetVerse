/**
 * API Integration for Real Network Capture Data
 */

import axios from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000/api/v1';

/**
 * Get live device data from network capture
 */
export async function getDeviceData() {
  try {
    const res = await axios.get(`${API_BASE}/capture/devices`);
    return res.data;
  } catch (error) {
    console.error('Error fetching device data:', error);
    return null;
  }
}

/**
 * Get live traffic data from network capture
 */
export async function getTrafficData(timeRange?: string) {
  try {
    const params = timeRange ? { time_range: timeRange } : {};
    const res = await axios.get(`${API_BASE}/capture/traffic`, { params });
    return res.data;
  } catch (error) {
    console.error('Error fetching traffic data:', error);
    return null;
  }
}

/**
 * Get live threat events from threat feeds
 */
export async function getThreatData(filter?: { severity?: string; source?: string }) {
  try {
    const res = await axios.get(`${API_BASE}/threats/active`, { params: filter });
    return res.data;
  } catch (error) {
    console.error('Error fetching threat data:', error);
    return null;
  }
}

/**
 * Get capture status and configuration
 */
export async function getCaptureStatus() {
  try {
    const res = await axios.get(`${API_BASE}/capture/status`);
    return res.data;
  } catch (error) {
    console.error('Error fetching capture status:', error);
    return null;
  }
}

/**
 * Start network capture on specific interface
 */
export async function startCapture(interface_name?: string) {
  try {
    const res = await axios.post(`${API_BASE}/capture/start`, {
      interface: interface_name,
    });
    return res.data;
  } catch (error) {
    console.error('Error starting capture:', error);
    return null;
  }
}

/**
 * Stop network capture
 */
export async function stopCapture() {
  try {
    const res = await axios.post(`${API_BASE}/capture/stop`);
    return res.data;
  } catch (error) {
    console.error('Error stopping capture:', error);
    return null;
  }
}

/**
 * Get enriched device information
 */
export async function getEnrichedDevice(deviceId: string) {
  try {
    const res = await axios.get(`${API_BASE}/devices/${deviceId}/enriched`);
    return res.data;
  } catch (error) {
    console.error('Error fetching enriched device:', error);
    return null;
  }
}

/**
 * Get GeoIP information for IP address
 */
export async function getGeoIPData(ip: string) {
  try {
    const res = await axios.get(`${API_BASE}/enrichment/geoip`, { params: { ip } });
    return res.data;
  } catch (error) {
    console.error('Error fetching GeoIP data:', error);
    return null;
  }
}

/**
 * Get reputation score for IP/domain
 */
export async function getReputationData(ip: string) {
  try {
    const res = await axios.get(`${API_BASE}/enrichment/reputation`, {
      params: { ip },
    });
    return res.data;
  } catch (error) {
    console.error('Error fetching reputation data:', error);
    return null;
  }
}

/**
 * Sync visualization data with real backend data
 */
export async function syncVisualizationData() {
  try {
    const [devices, traffic, threats, status] = await Promise.all([
      getDeviceData(),
      getTrafficData(),
      getThreatData(),
      getCaptureStatus(),
    ]);

    return {
      devices: devices?.results || [],
      traffic: traffic?.results || [],
      threats: threats?.results || [],
      status,
    };
  } catch (error) {
    console.error('Error syncing visualization data:', error);
    return {
      devices: [],
      traffic: [],
      threats: [],
      status: null,
    };
  }
}

/**
 * Stream real-time data via WebSocket with fallback to polling
 */
export class RealtimeDataClient {
  private ws: WebSocket | null = null;
  private pollingInterval: NodeJS.Timeout | null = null;
  private callbacks: Map<string, (data: any) => void> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;

  async connect(wsUrl: string) {
    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('Real-time data connection established');
        this.reconnectAttempts = 0;
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          const callback = this.callbacks.get(data.type);
          if (callback) {
            callback(data);
          }
        } catch (error) {
          console.error('Error parsing real-time data:', error);
        }
      };

      this.ws.onerror = () => {
        console.error('WebSocket error, falling back to polling');
        this.startFallbackPolling();
      };

      this.ws.onclose = () => {
        console.log('WebSocket closed');
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++;
          setTimeout(() => this.connect(wsUrl), 1000 * Math.pow(2, this.reconnectAttempts));
        }
      };
    } catch (error) {
      console.error('Error connecting to real-time data:', error);
      this.startFallbackPolling();
    }
  }

  private startFallbackPolling() {
    if (this.pollingInterval) return;

    this.pollingInterval = setInterval(async () => {
      const data = await syncVisualizationData();
      this.callbacks.get('device_data')?.(data.devices);
      this.callbacks.get('traffic_data')?.(data.traffic);
      this.callbacks.get('threat_data')?.(data.threats);
    }, 5000);
  }

  on(eventType: string, callback: (data: any) => void) {
    this.callbacks.set(eventType, callback);
  }

  off(eventType: string) {
    this.callbacks.delete(eventType);
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  }
}
