import axios from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000/api/v1';

export async function enrichIp(ip: string) {
  const res = await axios.post(`${API_BASE}/ai/analyze-packet`, { packet_data: { source_ip: ip } });
  return res.data;
}

export async function getThreatFeeds() {
  const res = await axios.get(`${API_BASE}/threat-feeds/list`);
  return res.data;
}

export async function uploadThreatFeed(file: File) {
  const formData = new FormData();
  formData.append('file', file);
  const res = await axios.post(`${API_BASE}/threat-feeds/upload`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
}
