import { apiClient, handleApiCall, ApiError } from './apiClient';

export interface EnrichmentData {
  ip?: string;
  domain?: string;
  hash?: string;
  url?: string;
}

export interface ThreatFeedItem {
  id: string;
  name: string;
  source: string;
  last_updated: string;
  indicator_count: number;
}

/**
 * Enrich an IP address with threat intelligence
 */
export async function enrichIp(ip: string): Promise<any> {
  try {
    return await handleApiCall(
      apiClient.post('/ai-analysis/analyze-packet', {
        packet_data: { source_ip: ip },
        include_threat_analysis: true,
      }),
      `Failed to enrich IP: ${ip}`
    );
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(500, 'IP_ENRICHMENT_ERROR', 'Failed to enrich IP address', error);
  }
}

/**
 * Get list of available threat feeds
 */
export async function getThreatFeeds(): Promise<{ feeds: ThreatFeedItem[] }> {
  try {
    return await handleApiCall(
      apiClient.get('/threat-feeds/list'),
      'Failed to retrieve threat feeds'
    );
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(
      500,
      'THREAT_FEEDS_RETRIEVAL_ERROR',
      'Failed to retrieve threat feeds',
      error
    );
  }
}

/**
 * Upload a custom threat feed file
 */
export async function uploadThreatFeed(file: File): Promise<{ status: string; feed_id: string }> {
  try {
    const formData = new FormData();
    formData.append('file', file);

    // Create a custom instance without JSON content-type for multipart
    const response = await apiClient.post('/threat-feeds/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    return response.data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(
      500,
      'THREAT_FEED_UPLOAD_ERROR',
      'Failed to upload threat feed',
      error
    );
  }
}

/**
 * Get threat feed details and indicators
 */
export async function getThreatFeedDetails(feedId: string): Promise<ThreatFeedItem> {
  try {
    return await handleApiCall(
      apiClient.get(`/threat-feeds/${feedId}`),
      `Failed to retrieve threat feed: ${feedId}`
    );
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(
      500,
      'THREAT_FEED_DETAILS_ERROR',
      'Failed to retrieve threat feed details',
      error
    );
  }
}

/**
 * Delete a threat feed
 */
export async function deleteThreatFeed(feedId: string): Promise<{ status: string }> {
  try {
    return await handleApiCall(
      apiClient.delete(`/threat-feeds/${feedId}`),
      `Failed to delete threat feed: ${feedId}`
    );
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(
      500,
      'THREAT_FEED_DELETE_ERROR',
      'Failed to delete threat feed',
      error
    );
  }
}
