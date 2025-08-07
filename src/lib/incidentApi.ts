import axios from 'axios';
import { type GenerateIncidentReportInput } from '@/ai/flows/generate-incident-report';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000/api/v1';

// This function now calls the backend's AI analysis endpoint for incidents.
// The Genkit flow is on the Next.js server, but this simulates a more robust architecture
// where the frontend might call a dedicated backend for this.
export async function generateIncidentReport(incidentData: GenerateIncidentReportInput) {
  // In a real scenario, you might have a dedicated incident endpoint.
  // For this project, we'll use the ai/analyze-incident endpoint to trigger the flow.
  const res = await axios.post(`${API_BASE}/ai/analyze-incident`, { incident_data: incidentData });
  return res.data;
}
