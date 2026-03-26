// src/lib/hopTracingTypes.ts
/**
 * Hop Tracing Types and Interfaces
 * Defines data structures for traceroute visualization
 */

export interface HopInfo {
  hop_number: number;
  ip_address: string | null;
  hostname: string | null;
  rtt_ms: number[];
  packet_loss_percent: number;
  country?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

export interface TracerouteResponse {
  source_ip: string;
  destination_ip: string;
  destination_hostname?: string | null;
  hops: HopInfo[];
  total_hops: number;
  average_rtt_ms: number;
  packet_loss_percent: number;
}

export interface TraceJsonResponse {
  status: "success" | "error";
  destination: string;
  destination_ip: string;
  source_ip: string;
  hops: HopJsonInfo[];
  stats: {
    total_hops: number;
    avg_rtt: number;
    total_loss: number;
  };
}

export interface HopJsonInfo {
  number: number;
  ip: string | null;
  host: string | null;
  rtts: number[];
  loss: number;
  loc: {
    lat: number;
    lon: number;
    country?: string;
  };
}

export interface HopVisualization {
  id: string;
  sourceLat: number;
  sourceLon: number;
  destLat: number;
  destLon: number;
  hops: HopLocationData[];
  metrics: {
    totalHops: number;
    avgRTT: number;
    packetLoss: number;
    startTime: Date;
    endTime?: Date;
  };
  status: "tracing" | "complete" | "failed";
  error?: string;
}

export interface HopLocationData {
  hopNumber: number;
  ip: string | null;
  hostname: string | null;
  latitude: number;
  longitude: number;
  rtts: number[];
  packetLoss: number;
  color: string; // Color for visualization based on health
}

export interface TracerouteRequest {
  destination: string;
  source_ip?: string;
  max_hops?: number;
  timeout?: number;
}

// Color mapping based on hop quality
export const HOP_COLOR_SCHEME = {
  healthy: "#10b981", // Green - RTT < 50ms, no loss
  warning: "#f59e0b", // Yellow - RTT 50-200ms or 5-10% loss
  critical: "#ef4444", // Red - RTT > 200ms or > 10% loss
  timeout: "#6366f1", // Indigo - Timeout/unreachable
  unknown: "#9ca3af", // Gray - Unknown/no data
};

/**
 * Determine color based on hop metrics
 */
export function getHopColor(
  rttMs: number,
  packetLoss: number
): string {
  if (rttMs <= 0 || packetLoss >= 50) {
    return HOP_COLOR_SCHEME.timeout;
  }
  if (rttMs > 200 || packetLoss > 10) {
    return HOP_COLOR_SCHEME.critical;
  }
  if (rttMs > 50 || packetLoss > 5) {
    return HOP_COLOR_SCHEME.warning;
  }
  return HOP_COLOR_SCHEME.healthy;
}

/**
 * Convert HopJsonInfo to HopLocationData for visualization
 */
export function convertHopForVisualization(
  hop: HopJsonInfo
): HopLocationData {
  const avgRTT = hop.rtts.length > 0 ? hop.rtts.reduce((a, b) => a + b) / hop.rtts.length : 0;

  return {
    hopNumber: hop.number,
    ip: hop.ip,
    hostname: hop.host,
    latitude: hop.loc.lat,
    longitude: hop.loc.lon,
    rtts: hop.rtts,
    packetLoss: hop.loss,
    color: getHopColor(avgRTT, hop.loss),
  };
}

/**
 * Convert full traceroute response to visualization data
 */
export function convertTracerouteToVisualization(
  trace: TraceJsonResponse,
  startLat: number = 0,
  startLon: number = 0,
  endLat: number = 0,
  endLon: number = 0
): HopVisualization {
  const hopVisualizations = trace.hops.map(convertHopForVisualization);

  return {
    id: `trace-${trace.destination_ip}-${Date.now()}`,
    sourceLat: startLat,
    sourceLon: startLon,
    destLat: endLat,
    destLon: endLon,
    hops: hopVisualizations,
    metrics: {
      totalHops: trace.stats.total_hops,
      avgRTT: trace.stats.avg_rtt,
      packetLoss: trace.stats.total_loss,
      startTime: new Date(),
    },
    status: "complete",
  };
}
