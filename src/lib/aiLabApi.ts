import { apiClient, handleApiCall, ApiError } from './apiClient';

export interface PacketData {
  protocol?: string;
  source_ip?: string;
  source_port?: number;
  dest_ip?: string;
  dest_port?: number;
  length?: number;
  [key: string]: any;
}

export interface PacketAnalysisResponse {
  status: string;
  packet_summary: {
    protocol?: string;
    source: string;
    destination: string;
    length?: number;
  };
  threat_analysis: Record<string, any>;
  recommendations: string[];
}

export interface IncidentData {
  incident_id: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  incident_type: string;
  affected_assets?: string[];
  threat_indicators?: any[];
  recommendations?: string[];
  immediate_actions?: string[];
  long_term_actions?: string[];
  detection_method?: string;
  confidence_score?: number;
}

export interface IncidentReportResponse {
  status: string;
  incident_id: string;
  generated_at: string;
  report_content: IncidentData;
}

/**
 * Analyze a network packet for threats and anomalies
 */
export async function analyzePacket(packetData: PacketData): Promise<PacketAnalysisResponse> {
  try {
    return await handleApiCall(
      apiClient.post('/ai-analysis/analyze-packet', {
        packet_data: packetData,
        include_threat_analysis: true,
        include_recommendations: true,
      }),
      'Failed to analyze packet'
    );
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(500, 'PACKET_ANALYSIS_ERROR', 'Failed to analyze packet', error);
  }
}

/**
 * Generate an AI-assisted incident report
 */
export async function generateIncidentReport(
  incidentData: IncidentData
): Promise<IncidentReportResponse> {
  try {
    return await handleApiCall(
      apiClient.post('/ai-analysis/incident-report', incidentData),
      'Failed to generate incident report'
    );
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(
      500,
      'INCIDENT_REPORT_ERROR',
      'Failed to generate incident report',
      error
    );
  }
}

/**
 * Get a previously generated incident report
 */
export async function getIncidentReport(
  incidentId: string
): Promise<IncidentReportResponse> {
  try {
    return await handleApiCall(
      apiClient.get(`/ai-analysis/incident-report/${incidentId}`),
      `Failed to retrieve incident report ${incidentId}`
    );
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(
      500,
      'INCIDENT_REPORT_RETRIEVAL_ERROR',
      'Failed to retrieve incident report',
      error
    );
  }
}

/**
 * List all incident reports with optional filtering
 */
export async function listIncidentReports(
  severity?: string
): Promise<{ incidents: IncidentReportResponse[] }> {
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
    throw new ApiError(
      500,
      'INCIDENT_LIST_ERROR',
      'Failed to list incident reports',
      error
    );
  }
}
