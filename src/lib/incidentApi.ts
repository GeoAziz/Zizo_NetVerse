import axios from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000/api/v1';

export async function generateIncidentReport(incidentData: any) {
  const res = await axios.post(`${API_BASE}/ai/analyze-incident`, { incident_data: incidentData });
  return res.data;
}
