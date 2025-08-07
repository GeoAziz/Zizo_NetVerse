import axios from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000/api/v1';

export async function startProxy() {
  const res = await axios.post(`${API_BASE}/proxy/start`);
  return res.data;
}

export async function stopProxy() {
  const res = await axios.post(`${API_BASE}/proxy/stop`);
  return res.data;
}

// Placeholder for future rule management endpoints
export async function fetchProxyRules() {
  // Replace with real endpoint when available
  return [
    { id: 'RULE-001', description: 'Block known C&C server IPs (ThreatFeed-A)', action: 'Block', status: 'Active' },
    { id: 'RULE-002', description: 'Allow outbound HTTPS on port 443 for finance dept', action: 'Allow', status: 'Active' },
    { id: 'RULE-003', description: 'Log all DNS requests to *.internal.local (Audit)', action: 'Log', status: 'Inactive' },
    { id: 'RULE-004', description: 'Rate limit connections to /login endpoint', action: 'Rate Limit', status: 'Active' },
  ];
}

export async function getProxyStatus() {
  // Replace with real endpoint when available
  return { status: 'active', message: 'Proxy engine is running.' };
}
