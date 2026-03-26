import { apiClient, handleApiCall, ApiError } from './apiClient';
import { type GenerateIncidentReportInput } from '@/ai/flows/generate-incident-report';

export interface IncidentReport {
  incident_id: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  incident_type: string;
  timestamp?: string;
  affected_assets: string[];
  threat_indicators: Array<{
    indicator_type: string;
    value: string;
    severity: string;
    confidence: number;
    source?: string;
  }>;
  recommendations: string[];
  immediate_actions: string[];
  long_term_actions: string[];
  detection_method: string;
  confidence_score: number;
}

export interface IncidentResponse {
  status: string;
  incident_id: string;
  generated_at: string;
  report_content: IncidentReport;
}

/**
 * Generate an AI-assisted incident report by calling the backend
 * This integrates with the backend's AI analysis system
 */
export async function generateIncidentReport(
  incidentData: GenerateIncidentReportInput | IncidentReport
): Promise<IncidentResponse> {
  try {
    // Map input to backend schema if needed
    const payload: IncidentReport = {
      incident_id: (incidentData as any).incident_id || `INC-${Date.now()}`,
      title: (incidentData as any).title || 'Unnamed Incident',
      description: (incidentData as any).description || '',
      severity: (incidentData as any).severity || 'medium',
      incident_type: (incidentData as any).incident_type || 'unknown',
      affected_assets: (incidentData as any).affected_assets || [],
      threat_indicators: (incidentData as any).threat_indicators || [],
      recommendations: (incidentData as any).recommendations || [],
      immediate_actions: (incidentData as any).immediate_actions || [],
      long_term_actions: (incidentData as any).long_term_actions || [],
      detection_method: (incidentData as any).detection_method || '',
      confidence_score: (incidentData as any).confidence_score || 0.9,
    };

    return await handleApiCall(
      apiClient.post('/ai-analysis/incident-report', payload),
      'Failed to generate incident report'
    );
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(
      500,
      'INCIDENT_GENERATION_ERROR',
      'Failed to generate incident report',
      error
    );
  }
}

/**
 * Retrieve a previously generated incident report
 */
export async function getIncidentReport(incidentId: string): Promise<IncidentResponse> {
  try {
    return await handleApiCall(
      apiClient.get(`/ai-analysis/incident-report/${incidentId}`),
      `Failed to retrieve incident ${incidentId}`
    );
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(
      500,
      'INCIDENT_RETRIEVAL_ERROR',
      'Failed to retrieve incident report',
      error
    );
  }
}

/**
 * List all incident reports with optional severity filter
 */
export async function listIncidents(severity?: string): Promise<{ incidents: IncidentResponse[] }> {
  try {
    const params = severity ? { severity } : {};
    return await handleApiCall(
      apiClient.get('/ai-analysis/incidents', { params }),
      'Failed to list incident reports'
    );
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(500, 'INCIDENT_LIST_ERROR', 'Failed to list incidents', error);
  }
}

/**
 * Delete an incident report
 */
export async function deleteIncident(incidentId: string): Promise<{ status: string }> {
  try {
    return await handleApiCall(
      apiClient.delete(`/ai-analysis/incident-report/${incidentId}`),
      `Failed to delete incident ${incidentId}`
    );
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(
      500,
      'INCIDENT_DELETE_ERROR',
      'Failed to delete incident report',
      error
    );
  }
}
