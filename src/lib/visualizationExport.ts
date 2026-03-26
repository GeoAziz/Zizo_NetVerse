/**
 * Export and data recording utilities for 3D visualizations
 */

export type ExportFormat = 'json' | 'csv' | 'png';

/**
 * Export visualization data
 */
export function exportVisualizationData(
  data: any,
  format: ExportFormat,
  filename: string
): void {
  let content: string;
  let mimeType: string;

  switch (format) {
    case 'json':
      content = JSON.stringify(data, null, 2);
      mimeType = 'application/json';
      break;

    case 'csv':
      content = convertToCSV(data);
      mimeType = 'text/csv';
      break;

    case 'png':
      // PNG export is handled via canvas
      return;

    default:
      console.error(`Unsupported export format: ${format}`);
      return;
  }

  downloadFile(content, filename, mimeType);
}

/**
 * Convert data to CSV format
 */
function convertToCSV(data: any[]): string {
  if (data.length === 0) return '';

  const headers = Object.keys(data[0]);
  const rows = data.map((item) =>
    headers.map((header) => {
      const value = item[header];
      // Escape quotes and wrap in quotes if contains comma
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    })
  );

  return [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
}

/**
 * Download file to user's device
 */
export function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export devices data
 */
export function exportDevices(devices: Map<string, any>): void {
  const data = Array.from(devices.values()).map((d) => ({
    id: d.id,
    name: d.data.name,
    ip: d.data.ip,
    mac: d.data.mac,
    status: d.data.status,
    type: d.data.type,
    threat_level: d.data.threat_level,
    traffic_in_mbps: d.data.traffic_in,
    traffic_out_mbps: d.data.traffic_out,
  }));

  const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
  exportVisualizationData(data, 'csv', `devices-export-${timestamp}.csv`);
}

/**
 * Export traffic data
 */
export function exportTraffic(traffic: any[]): void {
  const data = traffic.map((t) => ({
    id: t.id,
    source_ip: t.source.source_ip,
    source_country: t.source.source_country,
    dest_ip: t.source.dest_ip,
    dest_country: t.source.dest_country,
    protocol: t.source.protocol,
    bytes: t.source.bytes,
    threat_score: t.source.threat_score,
  }));

  const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
  exportVisualizationData(data, 'csv', `traffic-export-${timestamp}.csv`);
}

/**
 * Export threat events
 */
export function exportThreats(threats: any[]): void {
  const data = threats.map((t) => ({
    id: t.id,
    type: t.data.type,
    severity: t.data.severity,
    source_ip: t.data.source_ip,
    source_country: t.data.source_country,
    target_ip: t.data.target_ip,
    target_country: t.data.target_country,
    description: t.data.description,
    timestamp: new Date(t.data.timestamp * 1000).toISOString(),
  }));

  const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
  exportVisualizationData(data, 'csv', `threats-export-${timestamp}.csv`);
}

/**
 * Screenshot Canvas
 */
export async function screenshotCanvas(
  canvasRef: HTMLCanvasElement | null,
  filename: string = 'screenshot.png'
): Promise<void> {
  if (!canvasRef) {
    console.error('Canvas reference not found');
    return;
  }

  try {
    const image = canvasRef.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = image;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error('Error taking screenshot:', error);
  }
}

/**
 * Record Canvas Stream
 */
export class CanvasRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private chunks: Blob[] = [];
  private isRecording = false;
  private canvasRef: HTMLCanvasElement | null = null;
  private stream: MediaStream | null = null;

  constructor(canvasRef: HTMLCanvasElement) {
    this.canvasRef = canvasRef;
  }

  async start(): Promise<void> {
    if (!this.canvasRef || this.isRecording) return;

    try {
      // Get canvas stream
      const stream = this.canvasRef.captureStream(30); // 30 FPS
      this.stream = stream;
      this.chunks = [];

      // Create media recorder
      const mimeType = 'video/webm;codecs=vp9,opus';
      const options =
        MediaRecorder.isTypeSupported(mimeType) ? { mimeType } : { mimeType: 'video/webm' };

      this.mediaRecorder = new MediaRecorder(stream, options);

      this.mediaRecorder.ondataavailable = (event) => {
        this.chunks.push(event.data);
      };

      this.mediaRecorder.start();
      this.isRecording = true;
      console.log('Recording started');
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  }

  stop(): Promise<void> {
    return new Promise((resolve) => {
      if (!this.mediaRecorder || !this.isRecording) {
        resolve();
        return;
      }

      this.mediaRecorder.onstop = () => {
        const blob = new Blob(this.chunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `visualization-recording-${Date.now()}.webm`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        // Stop all tracks
        if (this.stream) {
          this.stream.getTracks().forEach((track) => track.stop());
        }

        this.isRecording = false;
        console.log('Recording stopped and saved');
        resolve();
      };

      this.mediaRecorder.stop();
    });
  }

  isActive(): boolean {
    return this.isRecording;
  }
}

/**
 * Generate Summary Report
 */
export function generateSummaryReport(data: {
  devices?: Map<string, any>;
  traffic?: any[];
  threats?: any[];
  generatedAt?: Date;
}): string {
  const timestamp = data.generatedAt ? data.generatedAt.toISOString() : new Date().toISOString();

  let report = `
=============================================================================
                    VISUALIZATION DATA SUMMARY REPORT
                        Generated: ${timestamp}
=============================================================================

NETWORK DEVICES
---------------
Total Devices: ${data.devices ? data.devices.size : 0}
`;

  if (data.devices && data.devices.size > 0) {
    const devicesByStatus = {
      online: 0,
      offline: 0,
      suspicious: 0,
    };

    data.devices.forEach((d) => {
      devicesByStatus[d.data.status as keyof typeof devicesByStatus]++;
    });

    report += `Online: ${devicesByStatus.online}
Offline: ${devicesByStatus.offline}
Suspicious: ${devicesByStatus.suspicious}
`;
  }

  report += `
TRAFFIC SUMMARY
---------------
Total Traffic Events: ${data.traffic ? data.traffic.length : 0}
`;

  if (data.traffic && data.traffic.length > 0) {
    const totalBytes = data.traffic.reduce((sum, t) => sum + (t.source?.bytes || 0), 0);
    const avgThreatScore =
      data.traffic.reduce((sum, t) => sum + (t.source?.threat_score || 0), 0) /
      data.traffic.length;

    report += `Total Data: ${(totalBytes / 1024 / 1024).toFixed(2)} MB
Average Threat Score: ${(avgThreatScore * 100).toFixed(2)}%
`;
  }

  report += `
THREAT EVENTS
---------------
Total Threats: ${data.threats ? data.threats.length : 0}
`;

  if (data.threats && data.threats.length > 0) {
    const threatsBySeverity = { critical: 0, high: 0, medium: 0, low: 0 };

    data.threats.forEach((t) => {
      threatsBySeverity[t.data.severity as keyof typeof threatsBySeverity]++;
    });

    report += `Critical: ${threatsBySeverity.critical}
High: ${threatsBySeverity.high}
Medium: ${threatsBySeverity.medium}
Low: ${threatsBySeverity.low}
`;
  }

  report += `
=============================================================================
END OF REPORT
=============================================================================
`;

  return report;
}

/**
 * Generate and download text report
 */
export function downloadReport(data: {
  devices?: Map<string, any>;
  traffic?: any[];
  threats?: any[];
}): void {
  const report = generateSummaryReport(data);
  const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');

  downloadFile(report, `visualization-report-${timestamp}.txt`, 'text/plain');
}
