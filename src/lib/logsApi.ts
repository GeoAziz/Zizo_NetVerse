import axios from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000/api/v1';

export async function fetchNetworkLogs() {
  const res = await axios.get(`${API_BASE}/logs/network`);
  return res.data;
}

export async function fetchLogsSummary() {
  const res = await axios.get(`${API_BASE}/logs/summary`);
  return res.data;
}

export async function fetchCaptureStatus() {
  const res = await axios.get(`${API_BASE}/capture/status`);
  return res.data;
}
