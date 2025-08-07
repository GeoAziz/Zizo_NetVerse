import axios from 'axios';
import { auth } from '@/lib/firebase'; // Import auth to get the token

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000/api/v1';

async function getAuthHeaders() {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('User is not authenticated.');
  }
  const token = await user.getIdToken();
  return {
    Authorization: `Bearer ${token}`,
  };
}

export async function listUsers() {
  const headers = await getAuthHeaders();
  const res = await axios.get(`${API_BASE}/users`, { headers });
  return res.data;
}

export async function assignRole(uid: string, role: string) {
  const headers = await getAuthHeaders();
  const res = await axios.post(`${API_BASE}/users/${uid}/role`, { role }, { headers });
  return res.data;
}
