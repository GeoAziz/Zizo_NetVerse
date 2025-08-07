import axios from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000/api/v1';

export async function getDevice(deviceId: string) {
    const res = await axios.get(`${API_BASE}/devices/${deviceId}`);
    return res.data;
}

export async function controlDevice(action: 'shutdown' | 'isolate' | 'block', deviceId: string) {
    const res = await axios.post(`${API_BASE}/control/${action}-device`, { device_id: deviceId });
    return res.data;
}
