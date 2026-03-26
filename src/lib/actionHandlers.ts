/**
 * Action handlers for device and threat mitigation
 */

export interface QuarantineRequest {
  deviceId: string;
  reason: string;
  duration?: number; // minutes
}

export interface DeepAnalysisRequest {
  deviceId: string;
  priority: 'low' | 'medium' | 'high';
}

export interface ThreatMitigationRequest {
  threatId: string;
  action: 'block' | 'quarantine' | 'alert' | 'investigate';
  reason: string;
}

export interface BlockThreatRequest {
  threatId: string;
  sourceIp: string;
  targetIp: string;
}

/**
 * Quarantine device
 */
export async function quarantineDevice(request: QuarantineRequest): Promise<void> {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000/api/v1';
  
  try {
    const response = await fetch(`${baseUrl}/device-control/quarantine`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`Quarantine failed: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Device quarantined:', data);
  } catch (error) {
    console.error('Quarantine error:', error);
    throw error;
  }
}

/**
 * Initiate deep analysis on device
 */
export async function initiateDeepAnalysis(request: DeepAnalysisRequest): Promise<void> {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000/api/v1';
  
  try {
    const response = await fetch(`${baseUrl}/device-inspector/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`Analysis failed: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Analysis initiated:', data);
  } catch (error) {
    console.error('Analysis error:', error);
    throw error;
  }
}

/**
 * Mitigate threat
 */
export async function mitigateThreat(request: ThreatMitigationRequest): Promise<void> {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000/api/v1';
  
  try {
    const response = await fetch(`${baseUrl}/threat-control/mitigate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`Mitigation failed: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Threat mitigated:', data);
  } catch (error) {
    console.error('Mitigation error:', error);
    throw error;
  }
}

/**
 * Block threat IP
 */
export async function blockThreatIp(request: BlockThreatRequest): Promise<void> {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000/api/v1';
  
  try {
    const response = await fetch(`${baseUrl}/firewall-control/block`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`Block failed: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Threat IP blocked:', data);
  } catch (error) {
    console.error('Block error:', error);
    throw error;
  }
}

/**
 * Create incident report
 */
export async function createIncidentReport(threatId: string, description: string): Promise<void> {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000/api/v1';
  
  try {
    const response = await fetch(`${baseUrl}/incidents/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        threatId,
        description,
        timestamp: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      throw new Error(`Report creation failed: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Incident report created:', data);
  } catch (error) {
    console.error('Report creation error:', error);
    throw error;
  }
}

/**
 * Send to VirusTotal for analysis
 */
export async function sendToVirusTotal(ip: string): Promise<string> {
  // In production, this would send to actual VirusTotal API
  // For now, return mock URL
  const vtUrl = `https://www.virustotal.com/gui/home/search?query=${ip}`;
  window.open(vtUrl, '_blank');
  return vtUrl;
}

/**
 * Validate action prerequisites before executing
 */
export function validateAction(actionType: string, data: any): { valid: boolean; error?: string } {
  switch (actionType) {
    case 'quarantine':
      if (!data.deviceId || !data.reason) {
        return { valid: false, error: 'Missing deviceId or reason' };
      }
      break;
    case 'analyze':
      if (!data.deviceId || !data.priority) {
        return { valid: false, error: 'Missing deviceId or priority' };
      }
      break;
    case 'mitigate':
      if (!data.threatId || !data.action) {
        return { valid: false, error: 'Missing threatId or action' };
      }
      break;
    case 'block':
      if (!data.threatId || !data.sourceIp) {
        return { valid: false, error: 'Missing threatId or sourceIp' };
      }
      break;
  }
  return { valid: true };
}
