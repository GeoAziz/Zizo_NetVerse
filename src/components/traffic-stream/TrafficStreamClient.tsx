
"use client";

import { useState, useMemo, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Play, Pause, Search, Download, Brain, Loader2, TerminalSquare, ChevronRight, Network, AlertCircle, BookUser, Terminal } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogFooter,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { analyzeTrafficPacket, type AnalyzeTrafficPacketInput, type AnalyzeTrafficPacketOutput } from '@/ai/flows/analyze-traffic-packet-flow';
import { ScrollArea } from '@/components/ui/scroll-area';

type LogCategory = 'Network' | 'System' | 'Alerts' | 'Audit';

type TrafficLog = {
  id: string;
  timestamp: string;
  category: LogCategory;
  protocol?: 'HTTP' | 'HTTPS' | 'TCP' | 'WebSocket' | 'DNS' | 'FTP' | 'SSH' | 'NTP'; 
  sourceIp?: string;
  sourcePort?: number;
  destIp?: string;
  destPort?: number;
  length?: number;
  summary: string;
  action?: 'Allowed' | 'Blocked' | 'Modified' | 'Flagged' | 'Logged' | 'System Event' | 'User Action' | 'Security Alert';
  payloadExcerpt?: string; 
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
  const [activeTab, setActiveTab] = useState<LogCategory>('Network');
  const { toast } = useToast();

  const connectWebSocket = useCallback(() => {
    // TODO: The backend developer will need to provide the WebSocket URL.
    // This is a placeholder for the real implementation.
    // Example: const ws = new WebSocket('ws://your-backend-ip:8000/ws/logs/network');
    
    // ws.onmessage = (event) => {
    //   if (!isStreaming) return;
    //   const newLog = JSON.parse(event.data);
    //   setAllLogs(prevLogs => [
    //     {...newLog, id: `log-${Date.now()}-${Math.random()}`},
    //     ...prevLogs,
    //   ].slice(0, 200));
    // };

    // ws.onopen = () => {
    //   console.log("WebSocket connected");
    //   toast({ title: "Live Stream Connected", description: "Receiving real-time network logs." });
    // };

    // ws.onclose = () => {
    //   console.log("WebSocket disconnected. Attempting to reconnect...");
    //   setTimeout(connectWebSocket, 3000); // Reconnect after 3 seconds
    // };

    // ws.onerror = (error) => {
    //   console.error("WebSocket error:", error);
    //   toast({ title: "Live Stream Connection Error", variant: "destructive" });
    //   ws.close();
    // };

    // return ws;
    console.log("WebSocket connection logic is in place but commented out. Backend implementation needed.");
    return null;

  }, [isStreaming, toast]);
  
  useEffect(() => {
    // const ws = connectWebSocket();
    // return () => ws?.close();
    // NOTE: The above lines are commented out until the backend is ready.
    // For now, we will show a placeholder message.
    const placeholder: TrafficLog[] = [{
      id: 'placeholder-1',
      timestamp: new Date().toISOString(),
      category: 'Network',
      summary: 'Waiting for live data from Python backend...',
      sourceIp: '127.0.0.1',
      destIp: 'frontend',
      action: 'Logged'
    }]
    setAllLogs(placeholder);

  }, [connectWebSocket]);


  const filteredLogs = useMemo(() => {
    return allLogs.filter(log =>
      log.category === activeTab &&
      (log.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
       (log.sourceIp && log.sourceIp.includes(searchTerm)) ||
       (log.destIp && log.destIp.includes(searchTerm)) ||
       (log.protocol && log.protocol.toLowerCase().includes(searchTerm.toLowerCase()))) &&
      (protocolFilter === 'all' || !log.protocol || log.protocol === protocolFilter) &&
      (actionFilter === 'all' || !log.action || log.action === actionFilter)
    ).slice(0, 75); 
  }, [allLogs, searchTerm, protocolFilter, actionFilter, activeTab]);

  const handleAnalyzePacket = async () => {
    if (!selectedPacket || !selectedPacket.protocol || selectedPacket.sourceIp === 'SYSTEM' || !selectedPacket.sourcePort || !selectedPacket.destIp || !selectedPacket.destPort || !selectedPacket.action) {
        toast({ title: "AI Analysis Unavailable", description: "Selected log is not suitable for network packet analysis.", variant: "default" });
        return;
    }
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
      case 'System Event': return 'bg-indigo-500/70 text-indigo-100 border-indigo-400/80 hover:bg-indigo-600/70';
      case 'User Action': return 'bg-purple-500/70 text-purple-100 border-purple-400/80 hover:bg-purple-600/70';
      case 'Security Alert': return 'bg-pink-600/80 text-pink-100 border-pink-500/80 hover:bg-pink-700/80';
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
  
  const renderLogTable = (category: LogCategory) => (
    <ScrollArea className="h-[calc(100vh-480px)] lg:h-[calc(100vh-440px)] bg-black/30">
      <Table>
        <TableHeader className="sticky top-0 bg-card/90 backdrop-blur-sm z-10">
          <TableRow className="border-b-border/50">
            <TableHead className="w-[90px] text-muted-foreground/80 text-xs">Timestamp</TableHead>
            {category === 'Network' && <TableHead className="w-[90px] text-muted-foreground/80 text-xs">Protocol</TableHead>}
            {category === 'Network' && <TableHead className="w-[170px] text-muted-foreground/80 text-xs">Source</TableHead>}
            {category === 'Network' && <TableHead className="w-[170px] text-muted-foreground/80 text-xs">Destination</TableHead>}
            {category === 'Network' && <TableHead className="w-[70px] text-muted-foreground/80 text-xs">Length</TableHead>}
            <TableHead className="text-muted-foreground/80 text-xs">Summary</TableHead>
            <TableHead className="w-[110px] text-right text-muted-foreground/80 text-xs">Action/Type</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="font-mono text-xs">
          {filteredLogs.filter(log => log.category === category).map((log) => (
            <TableRow
              key={log.id}
              onClick={() => { setSelectedPacket(log); setAnalysisResult(null); setShowAnalysisDialog(false); }}
              className={`cursor-pointer hover:bg-primary/25 transition-colors duration-150 border-b-border/30 ${selectedPacket?.id === log.id ? 'bg-primary/30' : 'odd:bg-transparent even:bg-black/20'}`}
            >
              <TableCell className="py-2 px-3 text-muted-foreground">{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', fractionalSecondDigits: 2 })}</TableCell>
              {category === 'Network' && (
                <>
                  <TableCell className="py-2 px-3">
                    {log.protocol && <Badge variant={"outline"} className={cn('text-[0.7rem] py-0.5 px-1.5 border', getProtocolBadgeClassName(log.protocol))}>{log.protocol}</Badge>}
                  </TableCell>
                  <TableCell className="py-2 px-3 text-sky-300">{log.sourceIp}{log.sourcePort !==0 ? `:${log.sourcePort}` : ''}</TableCell>
                  <TableCell className="py-2 px-3 text-lime-300">{log.destIp}{log.destIp && log.destPort ? `:${log.destPort}`: ''}</TableCell>
                  <TableCell className="py-2 px-3 text-amber-300">{log.length ? `${log.length} B` : '-'}</TableCell>
                </>
              )}
              <TableCell className="py-2 px-3 text-foreground/80 max-w-[200px] md:max-w-[300px] truncate" title={log.summary}>{log.summary}</TableCell>
              <TableCell className="py-2 px-3 text-right">
                 {log.action && <Badge variant={"outline"} className={cn('text-[0.7rem] py-0.5 px-1.5 border', getActionBadgeClassName(log.action))}>{log.action}</Badge>}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {filteredLogs.filter(log => log.category === category).length === 0 && (
          <div className="text-center py-10 text-muted-foreground font-mono">
            -- No {category.toLowerCase()} events match current filters --
          </div>
        )}
    </ScrollArea>
  );

  return (
    <div className="space-y-6">
      <Card className="shadow-lg border-border/50 bg-card/90 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg text-accent">Stream Filters & Controls</CardTitle>
          <div className="flex flex-wrap gap-4 items-end pt-3">
            <div className="flex-grow min-w-[200px] sm:min-w-[250px]">
              <Label htmlFor="search" className="block text-xs font-medium text-muted-foreground mb-1">Search Current Log Tab</Label>
              <Input
                id="search"
                placeholder="IP, protocol, summary..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-input/80 border-border/70 focus:ring-primary placeholder:text-muted-foreground/70"
              />
            </div>
            {activeTab === 'Network' && (
              <>
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
              </>
            )}
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
          <Tabs defaultValue="Network" onValueChange={(value) => setActiveTab(value as LogCategory)} className="w-full">
            <CardHeader className="border-b border-border/30 pb-0">
                <div className="flex items-center justify-between">
                    <div className="flex items-center">
                        <TerminalSquare className="h-6 w-6 mr-3 text-primary" />
                        <div>
                            <CardTitle className="text-xl text-foreground">Live Event Stream</CardTitle>
                            <CardDescription className="text-xs text-muted-foreground">Displaying {filteredLogs.length} of {Math.min(allLogs.length, 200)} recent events. Filtered from {allLogs.length} total logs in '{activeTab}' tab.</CardDescription>
                        </div>
                    </div>
                    <TabsList className="bg-background/30 border-border/50 border">
                        <TabsTrigger value="Network"><Network className="mr-2 h-4 w-4"/>Network</TabsTrigger>
                        <TabsTrigger value="System"><Terminal className="mr-2 h-4 w-4"/>System</TabsTrigger>
                        <TabsTrigger value="Alerts"><AlertCircle className="mr-2 h-4 w-4"/>Alerts</TabsTrigger>
                        <TabsTrigger value="Audit"><BookUser className="mr-2 h-4 w-4"/>Audit</TabsTrigger>
                    </TabsList>
                </div>
            </CardHeader>
            <CardContent className="p-0">
              <TabsContent value="Network" className="m-0">{renderLogTable('Network')}</TabsContent>
              <TabsContent value="System" className="m-0">{renderLogTable('System')}</TabsContent>
              <TabsContent value="Alerts" className="m-0">{renderLogTable('Alerts')}</TabsContent>
              <TabsContent value="Audit" className="m-0">{renderLogTable('Audit')}</TabsContent>
            </CardContent>
          </Tabs>
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
          <CardContent className="space-y-2.5 text-xs p-4 font-mono max-h-[calc(100vh-300px)] overflow-y-auto bg-black/40">
            {selectedPacket ? (
              <>
                <div className="break-all"><strong>ID:</strong> <span className="text-muted-foreground">{selectedPacket.id}</span></div>
                <div><strong>Timestamp:</strong> <span className="text-muted-foreground">{new Date(selectedPacket.timestamp).toLocaleString()}</span></div>
                <div><strong>Category:</strong> <span className="text-muted-foreground">{selectedPacket.category}</span></div>
                {selectedPacket.protocol && <div><strong>Protocol:</strong> <Badge variant={"outline"} className={cn('ml-1 text-[0.7rem]', getProtocolBadgeClassName(selectedPacket.protocol))}>{selectedPacket.protocol}</Badge></div>}
                {selectedPacket.sourceIp && <div><strong>Source:</strong> <span className="text-sky-300">{selectedPacket.sourceIp}{selectedPacket.sourcePort && selectedPacket.sourcePort !== 0 ? `:${selectedPacket.sourcePort}` : ''}</span></div>}
                {selectedPacket.destIp && <div><strong>Destination:</strong> <span className="text-lime-300">{selectedPacket.destIp}{selectedPacket.destPort ? `:${selectedPacket.destPort}`: ''}</span></div>}
                {selectedPacket.length && <div><strong>Length:</strong> <span className="text-amber-300">{selectedPacket.length} Bytes</span></div>}
                <div className="break-words"><strong>Summary:</strong> <span className="text-foreground/90">{selectedPacket.summary}</span></div>
                {selectedPacket.action && <div><strong>Action/Type:</strong> <Badge variant={"outline"} className={cn('ml-1 text-[0.7rem]', getActionBadgeClassName(selectedPacket.action))}>{selectedPacket.action}</Badge></div>}

                {selectedPacket.payloadExcerpt && (
                  <div className="pt-2">
                    <h4 className="text-xs font-semibold text-muted-foreground/80 mb-1">Payload Excerpt / Raw Data:</h4>
                    <ScrollArea className="max-h-[180px] p-3 bg-black/70 rounded-md text-[0.65rem] leading-relaxed overflow-auto text-green-400 border border-border/50 shadow-inner">
                      <pre className="whitespace-pre-wrap">
                        {selectedPacket.payloadExcerpt || "-- No payload data available --"}
                      </pre>
                    </ScrollArea>
                  </div>
                )}

                <div className="pt-3 flex flex-wrap gap-2">
                    <Button 
                        variant="primary" 
                        size="sm" 
                        onClick={handleAnalyzePacket} 
                        disabled={isAnalyzing || !selectedPacket.protocol} 
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

    