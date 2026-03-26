import { apiClient, handleApiCall, ApiError } from './apiClient';

export interface ProxyRule {
  id: string;
  description: string;
  action: 'Block' | 'Allow' | 'Log' | 'Rate Limit';
  status: 'Active' | 'Inactive';
  priority?: number;
  conditions?: Record<string, any>;
}

export interface ProxyStatus {
  status: 'active' | 'inactive' | 'error';
  uptime_seconds?: number;
  connections_processed?: number;
  rules_active?: number;
}

/**
 * Start the proxy engine
 */
export async function startProxy(): Promise<{ status: string; message: string }> {
  try {
    return await handleApiCall(
      apiClient.post('/proxy/start', {}),
      'Failed to start proxy engine'
    );
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(500, 'PROXY_START_ERROR', 'Failed to start proxy engine', error);
  }
}

/**
 * Stop the proxy engine
 */
export async function stopProxy(): Promise<{ status: string; message: string }> {
  try {
    return await handleApiCall(
      apiClient.post('/proxy/stop', {}),
      'Failed to stop proxy engine'
    );
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(500, 'PROXY_STOP_ERROR', 'Failed to stop proxy engine', error);
  }
}

/**
 * Fetch all proxy rules from backend
 * Falls back to mock data if backend is unavailable (development)
 */
export async function fetchProxyRules(): Promise<ProxyRule[]> {
  try {
    const response = await handleApiCall(
      apiClient.get('/proxy/rules'),
      'Failed to fetch proxy rules'
    );
    return response.rules || [];
  } catch (error) {
    if (error instanceof ApiError && process.env.NODE_ENV !== 'production') {
      console.warn('Failed to fetch proxy rules, using mock data:', error.message);
      // Return mock data for development
      return [
        {
          id: 'RULE-001',
          description: 'Block known C&C server IPs (ThreatFeed-A)',
          action: 'Block',
          status: 'Active',
          priority: 1,
        },
        {
          id: 'RULE-002',
          description: 'Allow outbound HTTPS on port 443 for finance dept',
          action: 'Allow',
          status: 'Active',
          priority: 2,
        },
        {
          id: 'RULE-003',
          description: 'Log all DNS requests to *.internal.local (Audit)',
          action: 'Log',
          status: 'Inactive',
          priority: 3,
        },
        {
          id: 'RULE-004',
          description: 'Rate limit connections to /login endpoint',
          action: 'Rate Limit',
          status: 'Active',
          priority: 4,
        },
      ];
    }
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(500, 'PROXY_RULES_ERROR', 'Failed to fetch proxy rules', error);
  }
}

/**
 * Get current proxy engine status
 */
export async function getProxyStatus(): Promise<ProxyStatus> {
  try {
    const response = await handleApiCall(
      apiClient.get('/proxy/status'),
      'Failed to fetch proxy status'
    );
    return response;
  } catch (error) {
    if (error instanceof ApiError && process.env.NODE_ENV !== 'production') {
      console.warn('Failed to fetch proxy status, using default:', error.message);
      return { status: 'inactive' };
    }
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(500, 'PROXY_STATUS_ERROR', 'Failed to fetch proxy status', error);
  }
}

/**
 * Add a new proxy rule
 */
export async function addProxyRule(rule: Omit<ProxyRule, 'id'>): Promise<ProxyRule> {
  try {
    return await handleApiCall(
      apiClient.post('/proxy/rules', rule),
      'Failed to add proxy rule'
    );
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(500, 'PROXY_RULE_ADD_ERROR', 'Failed to add proxy rule', error);
  }
}

/**
 * Delete a proxy rule
 */
export async function deleteProxyRule(ruleId: string): Promise<{ status: string }> {
  try {
    return await handleApiCall(
      apiClient.delete(`/proxy/rules/${ruleId}`),
      `Failed to delete proxy rule: ${ruleId}`
    );
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(500, 'PROXY_RULE_DELETE_ERROR', 'Failed to delete proxy rule', error);
  }
}

/**
 * Update a proxy rule
 */
export async function updateProxyRule(
  ruleId: string,
  updates: Partial<ProxyRule>
): Promise<ProxyRule> {
  try {
    return await handleApiCall(
      apiClient.put(`/proxy/rules/${ruleId}`, updates),
      `Failed to update proxy rule: ${ruleId}`
    );
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(500, 'PROXY_RULE_UPDATE_ERROR', 'Failed to update proxy rule', error);
  }
}
