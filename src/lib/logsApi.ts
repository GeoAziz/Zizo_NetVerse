
import { apiClient, handleApiCall, ApiError } from './apiClient';

export interface NetworkLog {
  id: string;
  timestamp: string;
  protocol: string;
  source_ip: string;
  source_port: number;
  dest_ip: string;
  dest_port: number;
  action: string;
  bytes_sent: number;
  bytes_received: number;
}

export interface LogsSummary {
  total_packets: number;
  total_bytes: number;
  protocol_breakdown: Record<string, number>;
  top_ips: Array<{ ip: string; count: number }>;
  time_range: {
    start: string;
    end: string;
  };
}

type BackendLogsSummary = {
  total_packets?: number;
  time_range?: {
    start?: string;
    end?: string;
  };
  protocols?: Record<string, number>;
  protocol_breakdown?: Record<string, number>;
  top_source_ips?: Record<string, number>;
  top_ips?: Array<{ ip: string; count: number }>;
};

export interface CaptureStatus {
  capturing: boolean;
  interface: string;
  packets_captured: number;
  started_at: string;
  uptime_seconds: number;
}

/**
 * Fetch network logs with optional filtering
 */
export async function fetchNetworkLogs(filters?: {
  limit?: number;
  offset?: number;
  protocol?: string;
  source_ip?: string;
}): Promise<{ logs: NetworkLog[]; total: number }> {
  try {
    const response = await handleApiCall<any>(
      apiClient.get('/logs/network', { params: filters }),
      'Failed to fetch network logs'
    );

    if (Array.isArray(response)) {
      return {
        logs: response as NetworkLog[],
        total: response.length,
      };
    }

    if (response && Array.isArray(response.logs)) {
      return {
        logs: response.logs,
        total: typeof response.total === 'number' ? response.total : response.logs.length,
      };
    }

    return { logs: [], total: 0 };
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(500, 'NETWORK_LOGS_ERROR', 'Failed to fetch network logs', error);
  }
}

/**
 * Get aggregated logs summary
 */
export async function fetchLogsSummary(timeRange?: {
  start?: string;
  end?: string;
}): Promise<LogsSummary> {
  try {
    const summary = await handleApiCall<BackendLogsSummary>(
      apiClient.get('/logs/summary', { params: timeRange }),
      'Failed to fetch logs summary'
    );

    const protocolBreakdown = summary.protocol_breakdown || summary.protocols || {};
    const topIps = Array.isArray(summary.top_ips)
      ? summary.top_ips
      : Object.entries(summary.top_source_ips || {}).map(([ip, count]) => ({ ip, count }));

    return {
      total_packets: summary.total_packets || 0,
      total_bytes: 0,
      protocol_breakdown: protocolBreakdown,
      top_ips: topIps,
      time_range: {
        start: summary.time_range?.start || '',
        end: summary.time_range?.end || '',
      },
    };
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(500, 'LOGS_SUMMARY_ERROR', 'Failed to fetch logs summary', error);
  }
}

/**
 * Get current packet capture status
 */
export async function fetchCaptureStatus(): Promise<CaptureStatus> {
  try {
    return await handleApiCall(
      apiClient.get('/capture/status'),
      'Failed to fetch capture status'
    );
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(500, 'CAPTURE_STATUS_ERROR', 'Failed to fetch capture status', error);
  }
}

/**
 * Start packet capture
 */
export async function startCapture(networkInterface?: string): Promise<CaptureStatus> {
  try {
    return await handleApiCall(
      apiClient.post('/capture/start', null, {
        params: networkInterface ? { interface: networkInterface } : undefined,
      }),
      'Failed to start packet capture'
    );
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(500, 'CAPTURE_START_ERROR', 'Failed to start packet capture', error);
  }
}

/**
 * Stop packet capture
 */
export async function stopCapture(): Promise<{ status: string; packets_captured: number }> {
  try {
    return await handleApiCall(
      apiClient.post('/capture/stop', {}),
      'Failed to stop packet capture'
    );
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(500, 'CAPTURE_STOP_ERROR', 'Failed to stop packet capture', error);
  }
}
