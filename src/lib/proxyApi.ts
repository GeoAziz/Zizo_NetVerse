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

// Placeholder for future rule management endpoints.
// This mock can be replaced when the backend API provides a real endpoint for rules.
export async function fetchProxyRules() {
  // In a real implementation, this would be:
  // const res = await axios.get(`${API_BASE}/proxy/rules`);
  // return res.data;

  // Returning mock data for now as the backend endpoint for listing rules isn't implemented.
  return [
    { id: 'RULE-001', description: 'Block known C&C server IPs (ThreatFeed-A)', action: 'Block', status: 'Active' },
    { id: 'RULE-002', description: 'Allow outbound HTTPS on port 443 for finance dept', action: 'Allow', status: 'Active' },
    { id: 'RULE-003', description: 'Log all DNS requests to *.internal.local (Audit)', action: 'Log', status: 'Inactive' },
    { id: 'RULE-004', description: 'Rate limit connections to /login endpoint', action: 'Rate Limit', status: 'Active' },
  ];
}

// Mocking status check. In a real scenario, this would hit a backend endpoint.
export async function getProxyStatus() {
    // In a real implementation, this might be:
    // const res = await axios.get(`${API_BASE}/proxy/status`);
    // return res.data;
    return { status: 'inactive' }; // Default to inactive
}
