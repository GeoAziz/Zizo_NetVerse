// src/lib/hopTracingApi.ts
/**
 * Hop Tracing API Client
 * Frontend integration for traceroute endpoint
 */

import { apiClient, handleApiCall, ApiError } from './apiClient';
import type {
  TracerouteResponse,
  TraceJsonResponse,
  HopVisualization,
  convertTracerouteToVisualization,
  convertHopForVisualization,
} from './hopTracingTypes';

/**
 * Initiate a traceroute to a destination
 */
export async function traceRoute(
  destination: string,
  options?: {
    sourceIp?: string;
    maxHops?: number;
    timeout?: number;
  }
): Promise<TracerouteResponse> {
  try {
    const body = {
      destination,
      source_ip: options?.sourceIp,
      max_hops: options?.maxHops || 30,
      timeout: options?.timeout || 5,
    };

    const response = await handleApiCall(
      apiClient.post('/network/trace', body),
      'Failed to trace route'
    );

    return response as TracerouteResponse;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(500, 'TRACE_FAILED', 'Failed to trace route', error);
  }
}

/**
 * Quick traceroute with default parameters
 */
export async function quickTrace(
  destination: string,
  maxHops: number = 30
): Promise<TracerouteResponse> {
  try {
    const response = await handleApiCall(
      apiClient.get(`/network/trace/${destination}`, {
        params: { max_hops: maxHops },
      }),
      'Failed to quick trace'
    );

    return response as TracerouteResponse;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(500, 'QUICK_TRACE_FAILED', 'Quick trace failed', error);
  }
}

/**
 * Get traceroute data optimized for globe visualization
 */
export async function getTraceForVisualization(
  destination: string
): Promise<TraceJsonResponse> {
  try {
    const response = await handleApiCall(
      apiClient.get('/network/tracejson', {
        params: { destination },
      }),
      'Failed to get trace visualization data'
    );

    return response as TraceJsonResponse;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(
      500,
      'TRACE_VIZ_FAILED',
      'Failed to get trace visualization data',
      error
    );
  }
}

// Re-export types and utilities
export type { TracerouteResponse, TraceJsonResponse, HopVisualization } from './hopTracingTypes';
export {
  convertTracerouteToVisualization,
  convertHopForVisualization,
  getHopColor,
  HOP_COLOR_SCHEME,
} from './hopTracingTypes';
