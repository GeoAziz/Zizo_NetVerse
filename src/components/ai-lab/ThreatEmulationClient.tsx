"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea'; // Keep if needed for other parts, not directly used for scenario selection
import { useToast } from '@/hooks/use-toast';
import { Loader2, PlayCircle, ShieldCheck, AlertTriangle, Activity, FileText, type LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import IncidentReportForm from '@/components/incident-reporting/IncidentReportForm';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { analyzePacket, analyzeIncident } from '@/lib/aiLabApi';

type EmulationScenarioKey = 
  | 'simulated_malware' 
  | 'port_scanning' 
  | 'packet_flooding' 
  | 'mitm_attempt'
  | 'phishing_campaign'
  | 'data_exfiltration';

type EmulationStatus = 'idle' | 'running' | 'completed' | 'error';

interface ScenarioDetail {
  name: string;
  description: string;
  icon: LucideIcon;
  mockSteps: string[];
}

const scenarioDetails: Record<EmulationScenarioKey, ScenarioDetail> = {
  simulated_malware: { 
    name: 'Simulated Malware Infection', 
    description: 'Emulates behavior of common malware variants within a sandboxed environment.', 
    icon: AlertTriangle,
    mockSteps: [
      "Preparing sandboxed environment...",
      "Deploying mock 'KryllWorm.X' payload...",
      "Monitoring for C2 communication attempts...",
      "Virtual EDR detected anomalous activity.",
      "Malware behavior successfully contained and logged."
    ]
  },
  port_scanning: { 
    name: 'Network Port Scanning', 
    description: 'Simulates an attacker scanning for open ports on target systems.', 
    icon: Activity,
    mockSteps: [
      "Initiating stealth scan on target range 192.168.1.0/24...",
      "Probing common service ports (21, 22, 80, 443, 3389)...",
      "Port 80 (HTTP) found open on 192.168.1.10.",
      "Port 443 (HTTPS) found open on 192.168.1.10.",
      "Port 22 (SSH) found open on 192.168.1.15.",
      "Scan completed. 3 open ports identified."
    ]
  },
  packet_flooding: { 
    name: 'Packet Flooding (DDoS)', 
    description: 'Simulates a denial-of-service attack by flooding the network with traffic.', 
    icon: ShieldCheck,
    mockSteps: [
      "Configuring flood parameters: UDP, target 192.168.1.254, 10k PPS...",
      "Starting packet generation engine...",
      "Network monitoring shows increased traffic to target.",
      "Simulated firewall detected and mitigated flood after 30s.",
      "DDoS emulation concluded. Target remained responsive."
    ]
  },
  mitm_attempt: { 
    name: 'Man-in-the-Middle Attempt', 
    description: 'Emulates techniques used to intercept or alter communications.', 
    icon: ShieldCheck,
    mockSteps: [
      "Initiating ARP spoofing on local segment...",
      "Attempting to intercept traffic between 192.168.1.5 and 192.168.1.1...",
      "Network intrusion detection system (NIDS) flagged suspicious ARP packets.",
      "MITM attempt blocked by NIDS.",
      "Emulation complete. Network integrity maintained."
    ]
  },
  phishing_campaign: { 
    name: 'Phishing Campaign Simulation', 
    description: 'Simulates a targeted phishing attack to test user awareness and email security.', 
    icon: AlertTriangle,
    mockSteps: [
      "Crafting mock phishing email template 'Urgent Password Reset'...",
      "Sending simulated emails to virtual user inboxes...",
      "User 'v_user1' opened email, did not click link.",
      "User 'v_user2' opened email and clicked mock malicious link.",
      "Phishing attempt on 'v_user2' logged. Endpoint protection blocked site.",
      "Campaign simulation concluded."
    ]
  },
  data_exfiltration: { 
    name: 'Data Exfiltration Simulation', 
    description: 'Emulates unauthorized data transfer out of the network.', 
    icon: FileText,
    mockSteps: [
      "Identifying mock sensitive data files in sandboxed environment...",
      "Attempting to transfer 'project_alpha_secrets.zip' to external IP...",
      "Data Loss Prevention (DLP) system detected unusual outbound transfer.",
      "Transfer blocked by DLP policy 'CONFIDENTIAL_DATA'.",
      "Exfiltration attempt logged and alerted."
    ]
  },
};

export default function ThreatEmulationClient() {
  const [selectedScenario, setSelectedScenario] = useState<EmulationScenarioKey>('simulated_malware');
  const [status, setStatus] = useState<EmulationStatus>('idle');
  const [emulationLog, setEmulationLog] = useState<string[]>([]);
  const [targetScope, setTargetScope] = useState('');
  const { toast } = useToast();

  const handleRunEmulation = async () => {
    setStatus('running');
    const currentScenario = scenarioDetails[selectedScenario];
    setEmulationLog([`Starting emulation: ${currentScenario.name}...`]);
    let stepDelay = 1000;
    currentScenario.mockSteps.forEach((step, index) => {
      setTimeout(() => {
        setEmulationLog(prev => [...prev, step]);
      }, stepDelay * (index + 1));
    });
    // Call backend AI analysis for real data (example: analyzePacket)
    try {
      const aiResult = await analyzePacket({ scenario: selectedScenario, target: targetScope });
      setEmulationLog(prev => [...prev, `AI Analysis: ${JSON.stringify(aiResult)}`]);
    } catch (e) {
      setEmulationLog(prev => [...prev, 'AI backend analysis failed.']);
    }
    setTimeout(() => {
      const success = Math.random() > 0.15; // 85% success rate for simulation
      if (success) {
        setEmulationLog(prev => [...prev, `Emulation of ${currentScenario.name} completed successfully.`]);
        setStatus('completed');
        toast({
          title: "Emulation Complete",
          description: `${currentScenario.name} finished. Check logs for details.`,
        });
      } else {
        setEmulationLog(prev => [...prev, `Error during ${currentScenario.name} emulation. Check system integrity.`]);
        setStatus('error');
        toast({
          title: "Emulation Error",
          description: `An error occurred during the ${currentScenario.name} emulation.`,
          variant: "destructive",
        });
      }
    }, stepDelay * (currentScenario.mockSteps.length + 1) + 500);
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };
  
  const logVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: (i: number) => ({ 
      opacity: 1, 
      x: 0, 
      transition: { delay: i * 0.05, duration: 0.2} 
    }),
  };

  return (
    <Tabs defaultValue="emulation" className="w-full">
      <TabsList className="grid w-full grid-cols-2 mb-6 bg-card border border-border/50">
        <TabsTrigger value="emulation"><PlayCircle className="mr-2 h-4 w-4"/>Threat Emulation</TabsTrigger>
        <TabsTrigger value="reporting"><FileText className="mr-2 h-4 w-4"/>Incident Reporting</TabsTrigger>
      </TabsList>

      <TabsContent value="emulation">
        <motion.div
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          <Card className="shadow-xl border-border/50">
            <CardHeader>
              <CardTitle>Configure Threat Emulation</CardTitle>
              <CardDescription>Select a scenario and initiate an AI-driven threat emulation to test your defenses.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="scenario" className="text-muted-foreground">Select Emulation Scenario</Label>
                <Select
                  value={selectedScenario}
                  onValueChange={(value: string) => setSelectedScenario(value as EmulationScenarioKey)}
                  disabled={status === 'running'}
                >
                  <SelectTrigger id="scenario" className="w-full bg-input border-border focus:ring-primary mt-1">
                    <SelectValue placeholder="Choose a scenario" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(scenarioDetails).map(([key, details]) => (
                      <SelectItem key={key} value={key}>
                        <div className="flex items-center">
                          <details.icon className="mr-2 h-4 w-4 text-muted-foreground" />
                          {details.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedScenario && (
                    <p className="text-xs text-muted-foreground mt-2 pl-1">
                        {scenarioDetails[selectedScenario].description}
                    </p>
                )}
              </div>

              <div>
                <Label htmlFor="targetScope" className="text-muted-foreground">Target Scope (Optional)</Label>
                <Input 
                  id="targetScope"
                  placeholder="e.g., 192.168.1.0/24, specific device ID, or 'All Internal'" 
                  disabled={status === 'running'} 
                  className="bg-input border-border focus:ring-primary mt-1 placeholder:text-muted-foreground/70"
                  value={targetScope}
                  onChange={(e) => setTargetScope(e.target.value)}
                />
                 <p className="text-xs text-muted-foreground mt-1 pl-1">Define target systems or network segments. Leave blank for broad internal simulation.</p>
              </div>

            </CardContent>
            <CardFooter>
              <Button
                onClick={handleRunEmulation}
                disabled={status === 'running'}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                {status === 'running' ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <PlayCircle className="mr-2 h-4 w-4" />
                )}
                {status === 'running' ? 'Emulation in Progress...' : 'Run Emulation'}
              </Button>
            </CardFooter>
          </Card>

          <Card className="shadow-xl border-border/50 flex flex-col">
            <CardHeader>
              <CardTitle>Emulation Log & Status</CardTitle>
              <CardDescription>Real-time updates from the ongoing or completed emulation.</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow flex flex-col">
              <ScrollArea className="h-64 flex-grow bg-black/50 rounded-md p-4 border border-border/50 shadow-inner">
                  {emulationLog.length === 0 && status === 'idle' && (
                    <p className="text-sm text-muted-foreground/70 italic text-center pt-10">Emulation log will appear here...</p>
                  )}
                  {emulationLog.map((log, index) => (
                    <motion.p 
                      key={index} 
                      custom={index}
                      variants={logVariants}
                      initial="hidden"
                      animate="visible"
                      className="text-xs text-green-400 font-mono mb-1.5"
                    >
                      <span className="text-primary/70 mr-1.5">&gt;</span>{log}
                    </motion.p>
                  ))}
                   {status === 'running' && emulationLog.length > 0 && emulationLog.length < (scenarioDetails[selectedScenario]?.mockSteps.length || 0) +1 && (
                     <motion.div 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1}}
                        className="flex items-center text-xs text-yellow-400 font-mono mt-2"
                      >
                       <Loader2 className="h-3 w-3 animate-spin mr-2"/> Processing...
                     </motion.div>
                   )}
              </ScrollArea>
              <div className="mt-4 text-sm">
                <strong>Status: </strong>
                <span className={cn(
                  status === 'idle' && 'text-muted-foreground',
                  status === 'running' && 'text-yellow-400 animate-pulse',
                  status === 'completed' && 'text-green-400',
                  status === 'error' && 'text-destructive',
                )}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </span>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </TabsContent>

      <TabsContent value="reporting">
        <IncidentReportForm />
      </TabsContent>
    </Tabs>
  );
}

