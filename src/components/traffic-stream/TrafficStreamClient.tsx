
"use client";

import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Play, Pause, SkipForward, Search, Download, Eye } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type TrafficLog = {
  id: string;
  timestamp: string;
  protocol: 'HTTP' | 'HTTPS' | 'TCP' | 'WebSocket' | 'DNS' | 'FTP';
  sourceIp: string;
  sourcePort: number;
  destIp: string;
  destPort: number;
  length: number;
  summary: string;
  action: 'Allowed' | 'Blocked' | 'Modified' | 'Flagged';
  payloadExcerpt?: string; // For packet details
};

// Generate more diverse mock data
const generateMockData = (count: number): TrafficLog[] => {
  const protocols: Array<'HTTP' | 'HTTPS' | 'TCP' | 'WebSocket' | 'DNS' | 'FTP'> = ['HTTP', 'HTTPS', 'TCP', 'WebSocket', 'DNS', 'FTP'];
  const actions: Array<'Allowed' | 'Blocked' | 'Modified' | 'Flagged'> = ['Allowed', 'Blocked', 'Modified', 'Flagged'];
  const commonDestPorts: { [key in typeof protocols[number]]?: number[] } = {
    HTTP: [80, 8080],
    HTTPS: [443],
    DNS: [53],
    FTP: [20, 21],
  };
  const summaries = [
    "GET /api/users HTTP/1.1", "POST /auth/login HTTP/1.1", "WebSocket Handshake Request", "TCP SYN_ACK Segment",
    "PUT /data/update?id=123 HTTP/1.1", "DELETE /resource/id HTTP/1.1", "TLSv1.3 ClientHello", "WebSocket Binary Frame",
    "DNS Standard query A example.com", "FTP PORT command", "SSH-2.0-OpenSSH_8.2p1", "NTP Version 4, client"
  ];
  const payloadSamples = [
    "User-Agent: Mozilla/5.0...",
    "{'username': 'testuser', 'password': '***'}",
    "Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==",
    "Window: 65535, Max Segment Size: 1460",
    "Content-Type: application/json...",
    "DELETE request successful",
    "Cipher Suites: TLS_AES_256_GCM_SHA384...",
    "0x81 0x05 0x48 0x65 0x6c 0x6c 0x6f", // Binary data example
    "example.com. IN A ? Addr: 93.184.216.34",
    "227 Entering Passive Mode (192,168,1,100,10,20)",
    "Protocol major 2, minor 0",
    "Leap: 0, Version: 4, Mode: Client"
  ];


  return Array.from({ length: count }, (_, i) => {
    const now = new Date();
    now.setSeconds(now.getSeconds() - i * (Math.floor(Math.random() * 3) + 1)); // Vary time intervals more
    const protocol = protocols[i % protocols.length];
    const destPortOptions = commonDestPorts[protocol] || [Math.floor(Math.random() * 64511) + 1024];
    const destPort = destPortOptions[Math.floor(Math.random() * destPortOptions.length)];

    return {
      id: `pkt-${Date.now()}-${Math.random().toString(36).substring(2, 9)}-${i}`,
      timestamp: now.toISOString(),
      protocol: protocol,
      sourceIp: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 254) + 1}`,
      sourcePort: Math.floor(Math.random() * 64511) + 1024,
      destIp: i % 3 === 0 ? `172.16.${Math.floor(Math.random()*32)}.${Math.floor(Math.random()*254)+1}` : `10.0.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 254) + 1}`,
      destPort: destPort,
      length: Math.floor(Math.random() * 1400) + 40, // Min length 40
      summary: summaries[i % summaries.length] + (Math.random() > 0.8 ? " - ANOMALY" : ""),
      action: actions[i % actions.length],
      payloadExcerpt: payloadSamples[i % payloadSamples.length],
    };
  });
};


export default function TrafficStreamClient() {
  const [allLogs, setAllLogs]  = useState<TrafficLog[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [protocolFilter, setProtocolFilter] = useState<string>('all');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [isStreaming, setIsStreaming] = useState(true);
  const [selectedPacket, setSelectedPacket] = useState<TrafficLog | null>(null);

  useEffect(() => {
    setAllLogs(generateMockData(75)); // Initial load

    let intervalId: NodeJS.Timeout;
    if (isStreaming) {
      intervalId = setInterval(() => {
        setAllLogs(prevLogs => [
          ...generateMockData(Math.floor(Math.random() * 3) + 1).map(log => ({...log, timestamp: new Date().toISOString()})), // Add 1 to 3 new logs
          ...prevLogs,
        ].slice(0, 150)); // Keep max 150 logs for performance
      }, 1500); // Faster streaming
    }
    return () => clearInterval(intervalId);
  }, [isStreaming]);

  const filteredLogs = useMemo(() => {
    return allLogs.filter(log =>
      (log.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
       log.sourceIp.includes(searchTerm) ||
       log.destIp.includes(searchTerm) ||
       log.protocol.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (protocolFilter === 'all' || log.protocol === protocolFilter) &&
      (actionFilter === 'all' || log.action === actionFilter)
    ).slice(0, 50); // Display max 50 in table for performance, but filter all
  }, [allLogs, searchTerm, protocolFilter, actionFilter]);

  const getProtocolBadgeVariant = (protocol: TrafficLog['protocol']) => {
    switch (protocol) {
      case 'HTTPS': return 'default'; // More prominent
      case 'HTTP': return 'secondary';
      case 'TCP': return 'outline';
      case 'WebSocket': return 'default';
      case 'DNS': return 'secondary';
      case 'FTP': return 'outline';
      default: return 'default';
    }
  };

  const getProtocolBadgeClassName = (protocol: TrafficLog['protocol']) => {
     switch (protocol) {
      case 'HTTPS': return 'bg-green-500/30 text-green-200 border-green-500/60 hover:bg-green-500/40';
      case 'HTTP': return 'bg-blue-500/30 text-blue-200 border-blue-500/60 hover:bg-blue-500/40';
      case 'TCP': return 'bg-yellow-500/30 text-yellow-200 border-yellow-500/60 hover:bg-yellow-500/40';
      case 'WebSocket': return 'bg-purple-500/30 text-purple-200 border-purple-500/60 hover:bg-purple-500/40';
      case 'DNS': return 'bg-cyan-500/30 text-cyan-200 border-cyan-500/60 hover:bg-cyan-500/40';
      case 'FTP': return 'bg-orange-500/30 text-orange-200 border-orange-500/60 hover:bg-orange-500/40';
      default: return 'bg-gray-500/30 text-gray-200 border-gray-500/60 hover:bg-gray-500/40';
    }
  }

  const getActionBadgeVariant = (action: TrafficLog['action']) => {
    switch (action) {
      case 'Blocked': return 'destructive';
      case 'Modified': return 'secondary';
      case 'Flagged': return 'default'; // Use default, but will be styled by className
      case 'Allowed': return 'default'; // Use default, but will be styled by className
      default: return 'default';
    }
  }

  const getActionBadgeClassName = (action: TrafficLog['action']) => {
     switch (action) {
      case 'Blocked': return ''; // Destructive variant handles it
      case 'Modified': return 'bg-yellow-400/80 text-yellow-950 border-yellow-500/70 hover:bg-yellow-500/80';
      case 'Flagged': return 'bg-orange-500/80 text-orange-950 border-orange-600/70 hover:bg-orange-600/80';
      case 'Allowed': return 'bg-green-400/70 text-green-950 border-green-500/60 hover:bg-green-500/70';
      default: return 'bg-gray-400/70 text-gray-950 border-gray-500/60 hover:bg-gray-500/70';
    }
  }


  return (
    <div className="space-y-6">
      <Card className="shadow-lg border-border/70">
        <CardHeader className="pb-4">
          <CardTitle>Filters & Controls</CardTitle>
          <div className="flex flex-wrap gap-4 items-end pt-3">
            <div className="flex-grow min-w-[200px] sm:min-w-[250px]">
              <Label htmlFor="search" className="block text-sm font-medium text-muted-foreground mb-1">Search Stream</Label>
              <Input
                id="search"
                placeholder="IP, protocol, summary..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-input border-border focus:ring-primary"
              />
            </div>
            <div>
              <Label htmlFor="protocol" className="block text-sm font-medium text-muted-foreground mb-1">Protocol</Label>
              <Select value={protocolFilter} onValueChange={setProtocolFilter}>
                <SelectTrigger className="w-full sm:w-[180px] bg-input border-border focus:ring-primary">
                  <SelectValue placeholder="Protocol" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Protocols</SelectItem>
                  <SelectItem value="HTTP">HTTP</SelectItem>
                  <SelectItem value="HTTPS">HTTPS</SelectItem>
                  <SelectItem value="TCP">TCP</SelectItem>
                  <SelectItem value="WebSocket">WebSocket</SelectItem>
                  <SelectItem value="DNS">DNS</SelectItem>
                  <SelectItem value="FTP">FTP</SelectItem>
                </SelectContent>
              </Select>
            </div>
             <div>
              <Label htmlFor="action" className="block text-sm font-medium text-muted-foreground mb-1">Action</Label>
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger className="w-full sm:w-[180px] bg-input border-border focus:ring-primary">
                  <SelectValue placeholder="Action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  <SelectItem value="Allowed">Allowed</SelectItem>
                  <SelectItem value="Blocked">Blocked</SelectItem>
                  <SelectItem value="Modified">Modified</SelectItem>
                  <SelectItem value="Flagged">Flagged</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button variant="outline" onClick={() => setIsStreaming(!isStreaming)} className="h-10">
                {isStreaming ? <Pause className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}
                {isStreaming ? 'Pause' : 'Resume'}
              </Button>
              <Button variant="outline" className="h-10">
                <Download className="mr-2 h-4 w-4" /> Export
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card className="xl:col-span-2 shadow-xl border-border/70">
          <CardHeader>
            <CardTitle>Live Packet Stream</CardTitle>
            <CardDescription>Displaying {filteredLogs.length} of {Math.min(allLogs.length, 150)} packets (max 150 displayed). Filtered from {allLogs.length} total logs.</CardDescription>
          </CardHeader>
          <CardContent className="max-h-[calc(100vh-350px)] overflow-auto"> {/* Adjusted height */}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Timestamp</TableHead>
                  <TableHead className="w-[100px]">Protocol</TableHead>
                  <TableHead className="w-[180px]">Source</TableHead>
                  <TableHead className="w-[180px]">Destination</TableHead>
                  <TableHead className="w-[80px]">Length</TableHead>
                  <TableHead>Summary</TableHead>
                  <TableHead className="w-[100px] text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.map((log) => (
                  <TableRow
                    key={log.id}
                    onClick={() => setSelectedPacket(log)}
                    className={`cursor-pointer hover:bg-muted/50 transition-colors duration-150 ${selectedPacket?.id === log.id ? 'bg-primary/10' : ''}`}
                  >
                    <TableCell className="text-xs font-mono">{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', fractionalSecondDigits: 2 })}</TableCell>
                    <TableCell>
                      <Badge
                        variant={getProtocolBadgeVariant(log.protocol)}
                        className={cn('text-xs py-0.5 px-1.5', getProtocolBadgeClassName(log.protocol))}
                      >
                        {log.protocol}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs">{log.sourceIp}:{log.sourcePort}</TableCell>
                    <TableCell className="text-xs">{log.destIp}:{log.destPort}</TableCell>
                    <TableCell className="text-xs">{log.length} B</TableCell>
                    <TableCell className="text-xs max-w-[250px] truncate" title={log.summary}>{log.summary}</TableCell>
                    <TableCell className="text-right">
                       <Badge
                         variant={getActionBadgeVariant(log.action)}
                         className={cn('text-xs py-0.5 px-1.5', getActionBadgeClassName(log.action))}
                       >
                        {log.action}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
             {filteredLogs.length === 0 && (
              <div className="text-center py-10 text-muted-foreground">
                No packets match your current filters.
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="xl:col-span-1 shadow-xl border-border/70 h-fit sticky top-24"> {/* Make details card sticky */}
          <CardHeader>
            <CardTitle>Packet Details</CardTitle>
            <CardDescription>Select a packet from the stream to view its details.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 max-h-[calc(100vh-300px)] overflow-y-auto text-sm"> {/* Adjusted height */}
            {selectedPacket ? (
              <>
                <div className="break-all"><strong>ID:</strong> {selectedPacket.id}</div>
                <div><strong>Timestamp:</strong> {new Date(selectedPacket.timestamp).toLocaleString()}</div>
                <div><strong>Protocol:</strong> <Badge variant={getProtocolBadgeVariant(selectedPacket.protocol)} className={cn('text-xs', getProtocolBadgeClassName(selectedPacket.protocol))}>{selectedPacket.protocol}</Badge></div>
                <div><strong>Source:</strong> {selectedPacket.sourceIp}:{selectedPacket.sourcePort}</div>
                <div><strong>Destination:</strong> {selectedPacket.destIp}:{selectedPacket.destPort}</div>
                <div><strong>Length:</strong> {selectedPacket.length} Bytes</div>
                <div className="break-words"><strong>Summary:</strong> {selectedPacket.summary}</div>
                <div><strong>Action:</strong> <Badge variant={getActionBadgeVariant(selectedPacket.action)} className={cn('text-xs', getActionBadgeClassName(selectedPacket.action))}>{selectedPacket.action}</Badge></div>

                <div className="pt-2">
                  <h4 className="text-xs font-semibold text-muted-foreground mb-1">Payload Excerpt:</h4>
                  <pre className="p-3 bg-black/60 rounded-md text-xs overflow-auto max-h-[150px] text-green-300 font-mono border border-border/50">
                    {selectedPacket.payloadExcerpt || "No payload data available."}
                  </pre>
                </div>

                <div className="pt-3 flex flex-wrap gap-2">
                    <Button variant="outline" size="sm"><Search className="mr-1.5 h-3.5 w-3.5" /> Inspect Raw</Button>
                    <Button variant="outline" size="sm"><SkipForward className="mr-1.5 h-3.5 w-3.5" /> Replay Packet</Button>
                    <Button variant="outline" size="sm"><Eye className="mr-1.5 h-3.5 w-3.5" /> Analyze with AI</Button>
                  </div>
              </>
            ) : (
              <p className="text-muted-foreground italic py-10 text-center">No packet selected.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
