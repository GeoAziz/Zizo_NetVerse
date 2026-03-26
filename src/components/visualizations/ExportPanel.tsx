'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import {
  Download,
  Video,
  Camera,
  FileJson,
  FileText,
  MoreVertical,
  AlertCircle,
} from 'lucide-react';
import {
  exportDevices,
  exportTraffic,
  exportThreats,
  downloadReport,
  screenshotCanvas,
  CanvasRecorder,
  generateSummaryReport,
} from '@/lib/visualizationExport';

interface ExportPanelProps {
  devices?: Map<string, any>;
  traffic?: any[];
  threats?: any[];
  canvasRef?: HTMLCanvasElement | null;
  title?: string;
}

export function ExportPanel({
  devices,
  traffic,
  threats,
  canvasRef,
  title = 'Export Data',
}: ExportPanelProps) {
  const [isRecording, setIsRecording] = useState(false);
  const recorderRef = useRef<CanvasRecorder | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const handleExportDevices = () => {
    if (devices && devices.size > 0) {
      exportDevices(devices);
    }
  };

  const handleExportTraffic = () => {
    if (traffic && traffic.length > 0) {
      exportTraffic(traffic);
    }
  };

  const handleExportThreats = () => {
    if (threats && threats.length > 0) {
      exportThreats(threats);
    }
  };

  const handleScreenshot = async () => {
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    await screenshotCanvas(canvasRef || null, `${title}-${timestamp}.png`);
  };

  const handleStartRecording = async () => {
    if (!canvasRef) return;

    if (!recorderRef.current) {
      recorderRef.current = new CanvasRecorder(canvasRef);
    }

    await recorderRef.current.start();
    setIsRecording(true);
    setRecordingTime(0);

    recordingIntervalRef.current = setInterval(() => {
      setRecordingTime((prev) => prev + 1);
    }, 1000);
  };

  const handleStopRecording = async () => {
    if (recorderRef.current && recordingIntervalRef.current) {
      await recorderRef.current.stop();
      setIsRecording(false);
      setRecordingTime(0);
      clearInterval(recordingIntervalRef.current);
    }
  };

  const handleDownloadReport = () => {
    downloadReport({ devices, traffic, threats });
  };

  const handleViewReport = () => {
    const report = generateSummaryReport({ devices, traffic, threats });
    const newWindow = window.open('', '_blank');
    if (newWindow) {
      newWindow.document.write(`<pre>${report}</pre>`);
      newWindow.document.close();
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const hasData = (devices && devices.size > 0) || (traffic && traffic.length > 0) || (threats && threats.length > 0);

  return (
    <div className="flex items-center gap-2">
      {/* Main Export Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem
            onClick={handleExportDevices}
            disabled={!devices || devices.size === 0}
            className="gap-2"
          >
            <Badge variant="secondary" className="text-xs">
              {devices?.size || 0}
            </Badge>
            Export Devices (CSV)
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={handleExportTraffic}
            disabled={!traffic || traffic.length === 0}
            className="gap-2"
          >
            <Badge variant="secondary" className="text-xs">
              {traffic?.length || 0}
            </Badge>
            Export Traffic (CSV)
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={handleExportThreats}
            disabled={!threats || threats.length === 0}
            className="gap-2"
          >
            <Badge variant="secondary" className="text-xs">
              {threats?.length || 0}
            </Badge>
            Export Threats (CSV)
          </DropdownMenuItem>

          <div className="my-1 border-t" />

          <Dialog>
            <DialogTrigger asChild>
              <button className="relative flex w-full cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm font-medium outline-none hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50">
                <FileText className="h-4 w-4" />
                View Report
              </button>
            </DialogTrigger>
            <DialogContent className="max-h-96 max-w-2xl overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Data Summary Report</DialogTitle>
                <DialogDescription>
                  Summary statistics for devices, traffic, and threats
                </DialogDescription>
              </DialogHeader>
              <pre className="whitespace-pre-wrap break-words rounded bg-muted p-4 text-xs">
                {generateSummaryReport({ devices, traffic, threats })}
              </pre>
              <Button onClick={handleDownloadReport} className="w-full gap-2">
                <Download className="h-4 w-4" />
                Download Report
              </Button>
            </DialogContent>
          </Dialog>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Screenshot Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={handleScreenshot}
        disabled={!canvasRef}
        className="gap-2"
        title="Take screenshot of current visualization"
      >
        <Camera className="h-4 w-4" />
      </Button>

      {/* Recording Button */}
      {isRecording ? (
        <Button
          variant="destructive"
          size="sm"
          onClick={handleStopRecording}
          className="gap-2 animate-pulse"
        >
          <Video className="h-4 w-4" />
          <span className="text-xs font-mono">{formatTime(recordingTime)}</span>
        </Button>
      ) : (
        <Button
          variant="outline"
          size="sm"
          onClick={handleStartRecording}
          disabled={!canvasRef}
          className="gap-2"
          title="Record visualization"
        >
          <Video className="h-4 w-4" />
        </Button>
      )}

      {/* More Options */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={handleViewReport} disabled={!hasData} className="gap-2">
            <FileJson className="h-4 w-4" />
            View Summary Report
          </DropdownMenuItem>

          <Dialog>
            <DialogTrigger asChild>
              <button className="relative flex w-full cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground">
                <AlertCircle className="h-4 w-4" />
                <span>About Export</span>
              </button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Export & Recording Guide</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="font-semibold">CSV Export</p>
                  <p className="text-muted-foreground">
                    Exports devices, traffic, and threats as comma-separated values. Compatible
                    with Excel and data analysis tools.
                  </p>
                </div>
                <div>
                  <p className="font-semibold">Screenshot</p>
                  <p className="text-muted-foreground">
                    Captures current visualization view as PNG image at full resolution.
                  </p>
                </div>
                <div>
                  <p className="font-semibold">Recording</p>
                  <p className="text-muted-foreground">
                    Records visualization as WebM video at 30fps. Click to start/stop. Used for
                    security briefings and incident analysis.
                  </p>
                </div>
                <div>
                  <p className="font-semibold">Report</p>
                  <p className="text-muted-foreground">
                    Generate summary statistics including device counts, threat severity
                    distribution, and traffic analysis.
                  </p>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
