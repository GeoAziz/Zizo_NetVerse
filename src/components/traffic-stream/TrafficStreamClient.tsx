
"use client";

import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Play, Pause, SkipForward, Search, Download, Eye, Brain, Loader2, TerminalSquare, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { analyzeTrafficPacket, type AnalyzeTrafficPacketInput, type AnalyzeTrafficPacketOutput } from '@/ai/flows/analyze-traffic-packet-flow';
import { ScrollArea } from '@/components/ui/scroll-area';

type TrafficLog = {
  id: string;
  timestamp: string;
  protocol: 'HTTP' | 'HTTPS' | 'TCP' | 'WebSocket' | 'DNS' | 'FTP' | 'SSH' | 'NTP'; // Added SSH, NTP
  sourceIp: string;
  sourcePort: number;
  destIp: string;
  destPort: number;
  length: number;
  summary: string;
  action: 'Allowed' | 'Blocked' | 'Modified' | 'Flagged' | 'Logged'; // Added Logged
  payloadExcerpt?: string; 
};

const generateMockData = (count: number): TrafficLog[] => {
  const protocols: Array<TrafficLog['protocol']> = ['HTTP', 'HTTPS', 'TCP', 'WebSocket', 'DNS', 'FTP', 'SSH', 'NTP'];
  const actions: Array<TrafficLog['action']> = ['Allowed', 'Blocked', 'Modified', 'Flagged', 'Logged'];
  const commonDestPorts: { [key in TrafficLog['protocol']]?: number[] } = {
    HTTP: [80, 8080],
    HTTPS: [443],
    DNS: [53],
    FTP: [20, 21],
    SSH: [22],
    NTP: [123],
  };
  const summaries = [
    "GET /api/users HTTP/1.1", "POST /auth/login HTTP/1.1", "WebSocket Handshake Request", "TCP SYN_ACK Segment",
    "PUT /data/update?id=123 HTTP/1.1", "DELETE /resource/id HTTP/1.1", "TLSv1.3 ClientHello", "WebSocket Binary Frame",
    "DNS Standard query A example.com", "FTP PORT command", "SSH-2.0-OpenSSH_8.2p1", "NTP Version 4, client",
    "User login attempt: 'admin'", "Firewall rule updated: DENY TCP from any to 10.0.1.5:8080", "System health check: OK"
  ];
  const payloadSamples = [
    "User-Agent: Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36",
    "{'username': 'sys_admin', 'password': 'redacted_for_security'}",
    "Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==",
    "Flags: [S.], seq 4294967295, win 65535, options [mss 1460,sackOK,TS val 100 ecr 0,nop,wscale 7], length 0",
    "Content-Type: application/json; charset=utf-8. Payload: {\"status\":\"success\", \"id\":123}",
    "Resource /resource/id deleted successfully by user 'operator01'",
    "Cipher Suites: TLS_AES_256_GCM_SHA384, TLS_CHACHA20_POLY1305_SHA256, TLS_AES_128_GCM_SHA256",
    "0x81 0x05 0x48 0x65 0x6c 0x6c 0x6f", // Binary data example
    "example.com. IN A ? Addr: 93.184.216.34 (RCODE: NoError)",
    "227 Entering Passive Mode (192,168,1,100,10,20). File: /data/archive.zip",
    "SSH Key Exchange Init: curve25519-sha256, GSSAPI (Kerberos V5)",
    "Leap: 0, Version: 4, Mode: Client, Stratum: 2, Poll: 10, Precision: -23"
  ];

  return Array.from({ length: count }, (_, i) => {
    const now = new Date();
    now.setSeconds(now.getSeconds() - i * (Math.floor(Math.random() * 3) + 1));
    const protocol = protocols[i % protocols.length];
    const destPortOptions = commonDestPorts[protocol] || [Math.floor(Math.random() * 64511) + 1024];
    const destPort = destPortOptions[Math.floor(Math.random() * destPortOptions.length)];

    return {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 9)}-${i}`,
      timestamp: now.toISOString(),
      protocol: protocol,
      sourceIp: i % 4 === 0 ? 'SYSTEM' : `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 254) + 1}`,
      sourcePort: i % 4 === 0 ? 0 : Math.floor(Math.random() * 64511) + 1024,
      destIp: i % 3 === 0 ? `172.16.${Math.floor(Math.random()*32)}.${Math.floor(Math.random()*254)+1}` : `10.0.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 254) + 1}`,
      destPort: destPort,
      length: Math.floor(Math.random() * 1400) + (protocol === 'TCP' ? 20 : 40),
      summary: summaries[i % summaries.length] + (Math.random() > 0.8 ? " - POTENTIAL_IOC" : ""),
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
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalyzeTrafficPacketOutput | null>(null);
  const [showAnalysisDialog, setShowAnalysisDialog] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setAllLogs(generateMockData(75)); 

    let intervalId: NodeJS.Timeout;
    if (isStreaming) {
      intervalId = setInterval(() => {
        setAllLogs(prevLogs => [
          ...generateMockData(Math.floor(Math.random() * 4) + 2).map(log => ({...log, timestamp: new Date().toISOString()})),
          ...prevLogs,
        ].slice(0, 200)); 
      }, 1200); 
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
    ).slice(0, 75); 
  }, [allLogs, searchTerm, protocolFilter, actionFilter]);

  const handleAnalyzePacket = async () => {
    if (!selectedPacket) return;
    setIsAnalyzing(true);
    setAnalysisResult(null);
    setShowAnalysisDialog(true);
    try {
      const input: AnalyzeTrafficPacketInput = {
        protocol: selectedPacket.protocol,
        sourceIp: selectedPacket.sourceIp,
        sourcePort: selectedPacket.sourcePort,
        destIp: selectedPacket.destIp,
        destPort: selectedPacket.destPort,
        summary: selectedPacket.summary,
        payloadExcerpt: selectedPacket.payloadExcerpt,
        action: selectedPacket.action,
      };
      const result = await analyzeTrafficPacket(input);
      setAnalysisResult(result);
    } catch (error) {
      console.error("Error analyzing packet:", error);
      toast({
        title: "AI Analysis Failed",
        description: error instanceof Error ? error.message : "An unknown error occurred during analysis.",
        variant: "destructive",
      });
      setShowAnalysisDialog(false);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getProtocolBadgeClassName = (protocol: TrafficLog['protocol']) => {
     switch (protocol) {
      case 'HTTPS': return 'bg-green-500/20 text-green-300 border-green-500/50 hover:bg-green-500/30';
      case 'HTTP': return 'bg-blue-500/20 text-blue-300 border-blue-500/50 hover:bg-blue-500/30';
      case 'TCP': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50 hover:bg-yellow-500/30';
      case 'WebSocket': return 'bg-purple-500/20 text-purple-300 border-purple-500/50 hover:bg-purple-500/30';
      case 'DNS': return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 hover:bg-cyan-500/30';
      case 'FTP': return 'bg-orange-500/20 text-orange-300 border-orange-500/50 hover:bg-orange-500/30';
      case 'SSH': return 'bg-pink-500/20 text-pink-300 border-pink-500/50 hover:bg-pink-500/30';
      case 'NTP': return 'bg-teal-500/20 text-teal-300 border-teal-500/50 hover:bg-teal-500/30';
      default: return 'bg-slate-600/30 text-slate-300 border-slate-500/50 hover:bg-slate-600/40';
    }
  }

  const getActionBadgeClassName = (action: TrafficLog['action']) => {
     switch (action) {
      case 'Blocked': return 'bg-red-600/80 text-red-100 border-red-500/90 hover:bg-red-700/80';
      case 'Modified': return 'bg-yellow-500/80 text-yellow-950 border-yellow-600/70 hover:bg-yellow-600/80';
      case 'Flagged': return 'bg-orange-600/80 text-orange-100 border-orange-500/70 hover:bg-orange-700/80';
      case 'Allowed': return 'bg-green-600/70 text-green-100 border-green-500/80 hover:bg-green-700/70';
      case 'Logged': return 'bg-sky-600/70 text-sky-100 border-sky-500/80 hover:bg-sky-700/70';
      default: return 'bg-slate-500/70 text-slate-100 border-slate-400/60 hover:bg-slate-600/70';
    }
  }

  const getSeverityBadgeClass = (severity: AnalyzeTrafficPacketOutput['severity'] | undefined) => {
    if (!severity) return 'bg-slate-600/30 text-slate-200 border-slate-500/60';
    switch (severity) {
        case 'Critical': return 'bg-red-700 text-red-100 border-red-600';
        case 'High': return 'bg-red-500 text-red-100 border-red-400';
        case 'Medium': return 'bg-orange-500 text-orange-100 border-orange-400';
        case 'Low': return 'bg-yellow-500 text-yellow-950 border-yellow-400';
        case 'Informational': return 'bg-blue-500 text-blue-100 border-blue-400';
        default: return 'bg-gray-500 text-gray-100 border-gray-400';
    }
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-lg border-border/50 bg-card/90 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg text-accent">Stream Filters & Controls</CardTitle>
          <div className="flex flex-wrap gap-4 items-end pt-3">
            <div className="flex-grow min-w-[200px] sm:min-w-[250px]">
              <Label htmlFor="search" className="block text-xs font-medium text-muted-foreground mb-1">Search Log Stream</Label>
              <Input
                id="search"
                placeholder="IP, protocol, summary..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-input/80 border-border/70 focus:ring-primary placeholder:text-muted-foreground/70"
              />
            </div>
            <div>
              <Label htmlFor="protocol" className="block text-xs font-medium text-muted-foreground mb-1">Protocol</Label>
              <Select value={protocolFilter} onValueChange={setProtocolFilter}>
                <SelectTrigger className="w-full sm:w-[160px] bg-input/80 border-border/70 focus:ring-primary">
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
                  <SelectItem value="SSH">SSH</SelectItem>
                  <SelectItem value="NTP">NTP</SelectItem>
                </SelectContent>
              </Select>
            </div>
             <div>
              <Label htmlFor="action" className="block text-xs font-medium text-muted-foreground mb-1">Action</Label>
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger className="w-full sm:w-[160px] bg-input/80 border-border/70 focus:ring-primary">
                  <SelectValue placeholder="Action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  <SelectItem value="Allowed">Allowed</SelectItem>
                  <SelectItem value="Blocked">Blocked</SelectItem>
                  <SelectItem value="Modified">Modified</SelectItem>
                  <SelectItem value="Flagged">Flagged</SelectItem>
                  <SelectItem value="Logged">Logged</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button variant="outline" onClick={() => setIsStreaming(!isStreaming)} className="h-10 border-border/70 hover:bg-primary/10 hover:border-primary">
                {isStreaming ? <Pause className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}
                {isStreaming ? 'Pause' : 'Resume'} Stream
              </Button>
              <Button variant="outline" className="h-10 border-border/70 hover:bg-primary/10 hover:border-primary">
                <Download className="mr-2 h-4 w-4" /> Export Logs
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card className="xl:col-span-2 shadow-xl border-border/50 bg-card/90 backdrop-blur-md">
          <CardHeader className="border-b border-border/30 pb-3">
            <div className="flex items-center">
                <TerminalSquare className="h-6 w-6 mr-3 text-primary" />
                <div>
                    <CardTitle className="text-xl text-foreground">Live Event Stream</CardTitle>
                    <CardDescription className="text-xs">Displaying {filteredLogs.length} of {Math.min(allLogs.length, 200)} recent events. Filtered from {allLogs.length} total logs.</CardDescription>
                </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[calc(100vh-420px)] lg:h-[calc(100vh-380px)]">
              <Table>
                <TableHeader className="sticky top-0 bg-card/80 backdrop-blur-sm z-10">
                  <TableRow className="border-b-border/50">
                    <TableHead className="w-[90px] text-muted-foreground/80 text-xs">Timestamp</TableHead>
                    <TableHead className="w-[90px] text-muted-foreground/80 text-xs">Protocol</TableHead>
                    <TableHead className="w-[170px] text-muted-foreground/80 text-xs">Source</TableHead>
                    <TableHead className="w-[170px] text-muted-foreground/80 text-xs">Destination</TableHead>
                    <TableHead className="w-[70px] text-muted-foreground/80 text-xs">Length</TableHead>
                    <TableHead className="text-muted-foreground/80 text-xs">Summary</TableHead>
                    <TableHead className="w-[90px] text-right text-muted-foreground/80 text-xs">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="font-mono text-xs">
                  {filteredLogs.map((log) => (
                    <TableRow
                      key={log.id}
                      onClick={() => {
                          setSelectedPacket(log);
                          setAnalysisResult(null); 
                          setShowAnalysisDialog(false); 
                      }}
                      className={`cursor-pointer hover:bg-primary/15 transition-colors duration-150 border-b-border/30 ${selectedPacket?.id === log.id ? 'bg-primary/20' : 'odd:bg-black/10 even:bg-black/20'}`}
                    >
                      <TableCell className="py-2 px-3 text-muted-foreground">{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', fractionalSecondDigits: 2 })}</TableCell>
                      <TableCell className="py-2 px-3">
                        <Badge
                          variant={"outline"}
                          className={cn('text-[0.7rem] py-0.5 px-1.5 border', getProtocolBadgeClassName(log.protocol))}
                        >
                          {log.protocol}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-2 px-3 text-sky-300">{log.sourceIp}{log.sourcePort !==0 ? `:${log.sourcePort}` : ''}</TableCell>
                      <TableCell className="py-2 px-3 text-lime-300">{log.destIp}:{log.destPort}</TableCell>
                      <TableCell className="py-2 px-3 text-amber-300">{log.length} B</TableCell>
                      <TableCell className="py-2 px-3 text-foreground/80 max-w-[200px] truncate" title={log.summary}>{log.summary}</TableCell>
                      <TableCell className="py-2 px-3 text-right">
                         <Badge
                           variant={"outline"}
                           className={cn('text-[0.7rem] py-0.5 px-1.5 border', getActionBadgeClassName(log.action))}
                         >
                          {log.action}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
             {filteredLogs.length === 0 && (
                <div className="text-center py-10 text-muted-foreground font-mono">
                  -- No events match current filters --
                </div>
              )}
          </CardContent>
        </Card>

        <Card className="xl:col-span-1 shadow-xl border-border/50 bg-card/90 backdrop-blur-md h-fit sticky top-24">
          <CardHeader className="border-b border-border/30 pb-3">
             <div className="flex items-center">
                <ChevronRight className="h-5 w-5 mr-2 text-primary group-hover:text-accent transition-colors" />
                <div>
                    <CardTitle className="text-lg text-foreground">Event Details</CardTitle>
                    <CardDescription className="text-xs">Select an event from the stream to inspect.</CardDescription>
                </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-2.5 text-xs p-4 font-mono max-h-[calc(100vh-300px)] overflow-y-auto">
            {selectedPacket ? (
              <>
                <div className="break-all"><strong>ID:</strong> <span className="text-muted-foreground">{selectedPacket.id}</span></div>
                <div><strong>Timestamp:</strong> <span className="text-muted-foreground">{new Date(selectedPacket.timestamp).toLocaleString()}</span></div>
                <div><strong>Protocol:</strong> <Badge variant={"outline"} className={cn('ml-1 text-[0.7rem]', getProtocolBadgeClassName(selectedPacket.protocol))}>{selectedPacket.protocol}</Badge></div>
                <div><strong>Source:</strong> <span className="text-sky-300">{selectedPacket.sourceIp}{selectedPacket.sourcePort !== 0 ? `:${selectedPacket.sourcePort}` : ''}</span></div>
                <div><strong>Destination:</strong> <span className="text-lime-300">{selectedPacket.destIp}:{selectedPacket.destPort}</span></div>
                <div><strong>Length:</strong> <span className="text-amber-300">{selectedPacket.length} Bytes</span></div>
                <div className="break-words"><strong>Summary:</strong> <span className="text-foreground/90">{selectedPacket.summary}</span></div>
                <div><strong>Action:</strong> <Badge variant={"outline"} className={cn('ml-1 text-[0.7rem]', getActionBadgeClassName(selectedPacket.action))}>{selectedPacket.action}</Badge></div>

                <div className="pt-2">
                  <h4 className="text-xs font-semibold text-muted-foreground/80 mb-1">Payload Excerpt / Raw Data:</h4>
                  <pre className="p-3 bg-black/70 rounded-md text-[0.65rem] leading-relaxed overflow-auto max-h-[180px] text-green-400 border border-border/50 shadow-inner">
                    {selectedPacket.payloadExcerpt || "-- No payload data available --"}
                  </pre>
                </div>

                <div className="pt-3 flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" className="text-xs border-border/60 hover:bg-primary/10 hover:border-primary"><Search className="mr-1.5 h-3 w-3" /> Full Inspect</Button>
                    <Button variant="outline" size="sm" className="text-xs border-border/60 hover:bg-primary/10 hover:border-primary"><SkipForward className="mr-1.5 h-3 w-3" /> Replay Event</Button>
                    <Button 
                        variant="primary" 
                        size="sm" 
                        onClick={handleAnalyzePacket} 
                        disabled={isAnalyzing || selectedPacket.sourceIp === 'SYSTEM'} 
                        className="text-xs"
                    >
                      {isAnalyzing ? <Loader2 className="mr-1.5 h-3 w-3 animate-spin" /> : <Brain className="mr-1.5 h-3 w-3" />}
                       AI Analysis
                    </Button>
                  </div>
              </>
            ) : (
              <p className="text-muted-foreground/70 italic py-10 text-center">-- No event selected --</p>
            )}
          </CardContent>
        </Card>
      </div>

      {showAnalysisDialog && (
        <AlertDialog open={showAnalysisDialog} onOpenChange={setShowAnalysisDialog}>
          <AlertDialogContent className="max-w-lg bg-card/95 backdrop-blur-xl border-primary/50">
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center text-xl text-primary">
                <Brain className="mr-2 h-5 w-5" /> AI Security Assessment
              </AlertDialogTitle>
              <AlertDialogDescription className="text-sm text-muted-foreground">
                AI-generated insights for the selected network event.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <ScrollArea className="max-h-[60vh] pr-2">
              <div className="py-4 space-y-3 text-sm font-mono">
                {isAnalyzing && !analysisResult && (
                  <div className="flex flex-col items-center justify-center py-8">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    <p className="mt-3 text-muted-foreground">AI is analyzing the event...</p>
                  </div>
                )}
                {analysisResult && (
                  <>
                    <div>
                      <strong>Suspicious:</strong>{' '}
                      <Badge variant={analysisResult.isSuspicious ? "destructive" : "default"} className={cn(analysisResult.isSuspicious ? 'bg-destructive/90' : 'bg-green-600/90 text-green-100 border-green-700/50')}>
                        {analysisResult.isSuspicious ? 'YES' : 'NO'}
                      </Badge>
                    </div>
                    <div>
                      <strong>Severity:</strong>{' '}
                      <Badge variant="outline" className={cn('px-2 py-0.5 text-xs', getSeverityBadgeClass(analysisResult.severity))}>
                        {analysisResult.severity}
                      </Badge>
                    </div>
                     <div><strong>Confidence:</strong> <span className="text-primary">{(analysisResult.confidenceScore * 100).toFixed(0) }%</span></div>
                    <div className="pt-1">
                      <strong className="block mb-0.5 text-muted-foreground/80">Reasoning:</strong>
                      <p className="p-3 bg-black/50 rounded-md border border-border/30 text-muted-foreground text-xs leading-relaxed">
                        {analysisResult.suspicionReason}
                      </p>
                    </div>
                    <div>
                      <strong className="block mb-0.5 text-muted-foreground/80">Suggested Actions:</strong>
                      <ul className="list-none p-3 bg-black/50 rounded-md border border-border/30 text-muted-foreground text-xs space-y-1.5">
                        {analysisResult.suggestedActions.map((action, index) => (
                          <li key={index} className="flex items-start">
                            <ChevronRight className="h-3.5 w-3.5 mr-1.5 mt-0.5 text-primary/70 shrink-0" />
                            <span>{action}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </>
                )}
                {!isAnalyzing && !analysisResult && ( 
                    <p className="text-muted-foreground text-center py-8">Analysis could not be displayed.</p>
                )}
              </div>
            </ScrollArea>
            <AlertDialogFooter className="mt-2">
              <AlertDialogCancel onClick={() => setShowAnalysisDialog(false)} className="hover:border-primary/70">Close</AlertDialogCancel>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
