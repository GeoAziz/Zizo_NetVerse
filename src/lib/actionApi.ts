import axios from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000/api/v1';

/**
 * Device Actions
 */
export async function quarantineDevice(deviceId: string, reason: string) {
  const res = await axios.post(`${API_BASE}/control/quarantine-device`, {
    device_id: deviceId,
    reason,
  });
  return res.data;
}

export async function deepAnalyzeDevice(deviceId: string) {
  const res = await axios.post(`${API_BASE}/ai/analyze-device`, {
    device_id: deviceId,
  });
  return res.data;
}

/**
 * Threat Actions
 */
export async function blockThreat(threatId: string, reason: string) {
  const res = await axios.post(`${API_BASE}/control/block-threat`, {
    threat_id: threatId,
    reason,
  });
  return res.data;
}

export async function reportThreat(threatId: string, description: string) {
  const res = await axios.post(`${API_BASE}/threats/report`, {
    threat_id: threatId,
    description,
  });
  return res.data;
}

export async function mitigateThreat(threatId: string, sourceIp: string, targetIp: string) {
  const res = await axios.post(`${API_BASE}/control/mitigate-threat`, {
    threat_id: threatId,
    source_ip: sourceIp,
    target_ip: targetIp,
  });
  return res.data;
}

export async function sendToVirusTotal(ip: string) {
  const res = await axios.post(`${API_BASE}/enrichment/virustotal-lookup`, {
    ip,
  });
  return res.data;
}

/**
 * Firewall Actions
 */
export async function blockIp(ip: string, protocol?: string, port?: number) {
  const res = await axios.post(`${API_BASE}/control/block-ip`, {
    ip,
    protocol,
    port,
  });
  return res.data;
}

export async function blockPort(port: number, protocol?: string) {
  const res = await axios.post(`${API_BASE}/control/block-port`, {
    port,
    protocol,
  });
  return res.data;
}
