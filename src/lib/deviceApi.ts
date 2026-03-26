import { apiClient, handleApiCall, ApiError } from './apiClient';

export interface Device {
  id: string;
  ip: string;
  mac: string;
  hostname: string;
  os: string;
  status: 'online' | 'offline' | 'unknown';
  open_ports?: number[];
  services?: string[];
  alerts?: string[];
  enrichment?: {
    geoip?: Record<string, any>;
    virustotal?: Record<string, any>;
    tor_exit_node?: boolean;
  };
  first_seen?: string;
  last_seen?: string;
}

export interface DeviceDiscoveryResponse {
  status: string;
  discovery_complete: boolean;
  network: string;
  devices_found: number;
  devices: Device[];
}

export interface DeviceScanResponse {
  status: string;
  device: Device;
}

export interface ControlResponse {
  status: string;
  message: string;
  device_id?: string;
}

/**
 * Discover devices on a network using ARP/ICMP
 */
export async function discoverDevices(
  networkRange: string = '192.168.1.0/24',
  detailedScan: boolean = false
): Promise<DeviceDiscoveryResponse> {
  try {
    return await handleApiCall(
      apiClient.post('/device-manager/discover', null, {
        params: {
          network_range: networkRange,
          detailed_scan: detailedScan,
        },
      }),
      `Failed to discover devices on network ${networkRange}`
    );
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(
      500,
      'DEVICE_DISCOVERY_ERROR',
      'Failed to discover devices',
      error
    );
  }
}

/**
 * Perform a detailed scan on a specific device
 */
export async function scanDevice(
  deviceIp: string,
  scanType: 'basic' | 'detailed' | 'aggressive' = 'detailed'
): Promise<DeviceScanResponse> {
  try {
    return await handleApiCall(
      apiClient.post(`/device-manager/scan/${deviceIp}`, null, {
        params: { scan_type: scanType },
      }),
      `Failed to scan device ${deviceIp}`
    );
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(
      500,
      'DEVICE_SCAN_ERROR',
      `Failed to scan device ${deviceIp}`,
      error
    );
  }
}

/**
 * Get detailed information about a discovered device
 */
export async function getDevice(deviceId: string): Promise<{ status: string; device: Device }> {
  try {
    return await handleApiCall(
      apiClient.get(`/device-manager/device/${deviceId}`),
      `Failed to retrieve device ${deviceId}`
    );
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(
      500,
      'DEVICE_RETRIEVAL_ERROR',
      'Failed to retrieve device information',
      error
    );
  }
}

/**
 * Get basic device info (legacy endpoint)
 */
export async function getDeviceInfo(deviceId: string): Promise<Device> {
  try {
    const response = await getDevice(deviceId);
    return response.device;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(500, 'DEVICE_INFO_ERROR', 'Failed to get device info', error);
  }
}

/**
 * Control a device - shutdown
 */
export async function shutdownDevice(deviceId: string): Promise<ControlResponse> {
  try {
    return await handleApiCall(
      apiClient.post('/control/shutdown-device', {
        device_id: deviceId,
      }),
      `Failed to send shutdown command to device ${deviceId}`
    );
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(
      500,
      'DEVICE_SHUTDOWN_ERROR',
      'Failed to shutdown device',
      error
    );
  }
}

/**
 * Control a device - isolate from network
 */
export async function isolateDevice(deviceId: string): Promise<ControlResponse> {
  try {
    return await handleApiCall(
      apiClient.post('/control/isolate-device', {
        device_id: deviceId,
      }),
      `Failed to isolate device ${deviceId}`
    );
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(500, 'DEVICE_ISOLATE_ERROR', 'Failed to isolate device', error);
  }
}

/**
 * Control a device - block at firewall
 */
export async function blockDevice(deviceId: string): Promise<ControlResponse> {
  try {
    return await handleApiCall(
      apiClient.post('/control/block-device', {
        device_id: deviceId,
      }),
      `Failed to block device ${deviceId}`
    );
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(500, 'DEVICE_BLOCK_ERROR', 'Failed to block device', error);
  }
}

/**
 * Generic device control action
 */
export async function controlDevice(
  action: 'shutdown' | 'isolate' | 'block',
  deviceId: string
): Promise<ControlResponse> {
  switch (action) {
    case 'shutdown':
      return shutdownDevice(deviceId);
    case 'isolate':
      return isolateDevice(deviceId);
    case 'block':
      return blockDevice(deviceId);
    default:
      throw new ApiError(400, 'INVALID_ACTION', `Unknown device action: ${action}`);
  }
}
