"use client";

import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Play, Pause, SkipForward, Search, Download } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

type TrafficLog = {
  id: string;
  timestamp: string;
  protocol: 'HTTP' | 'HTTPS' | 'TCP' | 'WebSocket';
  sourceIp: string;
  sourcePort: number;
  destIp: string;
  destPort: number;
  length: number;
  summary: string;
  action: 'Allowed' | 'Blocked' | 'Modified';
};

// Generate more diverse mock data
const generateMockData = (count: number): TrafficLog[] => {
  const protocols: Array<'HTTP' | 'HTTPS' | 'TCP' | 'WebSocket'> = ['HTTP', 'HTTPS', 'TCP', 'WebSocket'];
  const actions: Array<'Allowed' | 'Blocked' | 'Modified'> = ['Allowed', 'Blocked', 'Modified'];
  const summaries = [
    "GET /api/users", "POST /auth/login", "WebSocket Handshake", "TCP SYN_ACK", 
    "PUT /data/update", "DELETE /resource/id", "TLS ClientHello", "WebSocket Frame"
  ];

  return Array.from({ length: count }, (_, i) => {
    const now = new Date();
    now.setSeconds(now.getSeconds() - i * Math.floor(Math.random() * 5 + 1)); // Vary time intervals
    return {
      id: `pkt-${Date.now()}-${i}`,
      timestamp: now.toISOString(),
      protocol: protocols[i % protocols.length],
      sourceIp: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 254) + 1}`,
      sourcePort: Math.floor(Math.random() * 64511) + 1024,
      destIp: `10.0.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 254) + 1}`,
      destPort: i % 4 === 0 ? 80 : i % 4 === 1 ? 443 : Math.floor(Math.random() * 64511) + 1024,
      length: Math.floor(Math.random() * 1400) + 60,
      summary: summaries[i % summaries.length] + (Math.random() > 0.7 ? " - Potential Anomaly Detected" : ""),
      action: actions[i % actions.length],
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
    setAllLogs(generateMockData(50)); // Initial load

    let intervalId: NodeJS.Timeout;
    if (isStreaming) {
      intervalId = setInterval(() => {
        setAllLogs(prevLogs => [
          ...generateMockData(1).map(log => ({...log, timestamp: new Date().toISOString()})),
          ...prevLogs,
        ].slice(0, 100)); // Keep max 100 logs for performance
      }, 2000);
    }
    return () => clearInterval(intervalId);
  }, [isStreaming]);

  const filteredLogs = useMemo(() => {
    return allLogs.filter(log =>
      (log.summary.toLowerCase().includes(searchTerm.toLowerCase()) || 
       log.sourceIp.includes(searchTerm) || 
       log.destIp.includes(searchTerm)) &&
      (protocolFilter === 'all' || log.protocol === protocolFilter) &&
      (actionFilter === 'all' || log.action === actionFilter)
    );
  }, [allLogs, searchTerm, protocolFilter, actionFilter]);

  return (
    <div className="space-y-4">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Filters & Controls</CardTitle>
          <div className="flex flex-wrap gap-4 items-end pt-2">
            <div className="flex-grow min-w-[200px]">
              <label htmlFor="search" className="block text-sm font-medium text-muted-foreground mb-1">Search</label>
              <Input
                id="search"
                placeholder="Search IP, summary..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-input border-border focus:ring-primary"
              />
            </div>
            <div>
              <label htmlFor="protocol" className="block text-sm font-medium text-muted-foreground mb-1">Protocol</label>
              <Select value={protocolFilter} onValueChange={setProtocolFilter}>
                <SelectTrigger className="w-[180px] bg-input border-border focus:ring-primary">
                  <SelectValue placeholder="Protocol" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Protocols</SelectItem>
                  <SelectItem value="HTTP">HTTP</SelectItem>
                  <SelectItem value="HTTPS">HTTPS</SelectItem>
                  <SelectItem value="TCP">TCP</SelectItem>
                  <SelectItem value="WebSocket">WebSocket</SelectItem>
                </SelectContent>
              </Select>
            </div>
             <div>
              <label htmlFor="action" className="block text-sm font-medium text-muted-foreground mb-1">Action</label>
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger className="w-[180px] bg-input border-border focus:ring-primary">
                  <SelectValue placeholder="Action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  <SelectItem value="Allowed">Allowed</SelectItem>
                  <SelectItem value="Blocked">Blocked</SelectItem>
                  <SelectItem value="Modified">Modified</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" onClick={() => setIsStreaming(!isStreaming)} className="h-10">
              {isStreaming ? <Pause className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}
              {isStreaming ? 'Pause' : 'Resume'} Stream
            </Button>
            <Button variant="outline" className="h-10">
              <Download className="mr-2 h-4 w-4" /> Export Logs
            </Button>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 shadow-xl">
          <CardHeader>
            <CardTitle>Packet Stream</CardTitle>
            <CardDescription>Displaying {filteredLogs.length} of {allLogs.length} packets.</CardDescription>
          </CardHeader>
          <CardContent className="max-h-[600px] overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Protocol</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Destination</TableHead>
                  <TableHead>Length</TableHead>
                  <TableHead>Summary</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.map((log) => (
                  <TableRow key={log.id} onClick={() => setSelectedPacket(log)} className="cursor-pointer hover:bg-muted/50">
                    <TableCell className="text-xs">{new Date(log.timestamp).toLocaleTimeString()}</TableCell>
                    <TableCell>
                      <Badge variant={
                        log.protocol === 'HTTPS' ? 'default' : 
                        log.protocol === 'HTTP' ? 'secondary' :
                        log.protocol === 'TCP' ? 'outline' : 'default' // Use default for WebSocket or others
                      } className={
                        log.protocol === 'HTTPS' ? 'bg-green-500/20 text-green-300 border-green-500/50' :
                        log.protocol === 'HTTP' ? 'bg-blue-500/20 text-blue-300 border-blue-500/50' :
                        log.protocol === 'TCP' ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50' :
                        'bg-purple-500/20 text-purple-300 border-purple-500/50' // WebSocket
                      }>
                        {log.protocol}
                      </Badge>
                    </TableCell>
                    <TableCell>{log.sourceIp}:{log.sourcePort}</TableCell>
                    <TableCell>{log.destIp}:{log.destPort}</TableCell>
                    <TableCell>{log.length} B</TableCell>
                    <TableCell className="max-w-[200px] truncate">{log.summary}</TableCell>
                    <TableCell>
                       <Badge variant={log.action === 'Blocked' ? 'destructive' : log.action === 'Modified' ? 'secondary' : 'default'}
                         className={
                            log.action === 'Blocked' ? '' :
                            log.action === 'Modified' ? 'bg-yellow-400/80 text-yellow-900' :
                            'bg-green-400/80 text-green-900'
                         }
                       >
                        {log.action}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="lg:col-span-1 shadow-xl">
          <CardHeader>
            <CardTitle>Packet Details</CardTitle>
            <CardDescription>Select a packet to view its details.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 min-h-[300px]">
            {selectedPacket ? (
              <>
                <div><strong>ID:</strong> {selectedPacket.id}</div>
                <div><strong>Timestamp:</strong> {new Date(selectedPacket.timestamp).toLocaleString()}</div>
                <div><strong>Protocol:</strong> {selectedPacket.protocol}</div>
                <div><strong>Source:</strong> {selectedPacket.sourceIp}:{selectedPacket.sourcePort}</div>
                <div><strong>Destination:</strong> {selectedPacket.destIp}:{selectedPacket.destPort}</div>
                <div><strong>Length:</strong> {selectedPacket.length} Bytes</div>
                <div><strong>Summary:</strong> {selectedPacket.summary}</div>
                <div><strong>Action:</strong> {selectedPacket.action}</div>
                <pre className="mt-4 p-2 bg-black/50 rounded-md text-xs overflow-auto max-h-[200px] text-green-300 font-mono">
                  {`// Raw packet data (placeholder)
HEX DUMP: 00 11 22 33 44 55 66 77 88 99 AA BB CC DD EE FF
ASCII   : ............TEST............
...`}
                </pre>
                 <div className="pt-4 flex gap-2">
                    <Button variant="outline" size="sm"><Search className="mr-2 h-4 w-4" /> Inspect Raw</Button>
                    <Button variant="outline" size="sm"><SkipForward className="mr-2 h-4 w-4" /> Replay</Button>
                  </div>
              </>
            ) : (
              <p className="text-muted-foreground">No packet selected.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
