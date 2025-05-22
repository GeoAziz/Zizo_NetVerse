
"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2, PlayCircle, ShieldCheck, AlertTriangle, Activity, FileText } from 'lucide-react';
import { motion } from 'framer-motion';
import IncidentReportForm from '@/components/incident-reporting/IncidentReportForm'; // Import the existing form
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";


type EmulationScenario = 
  | 'simulated_malware' 
  | 'port_scanning' 
  | 'packet_flooding' 
  | 'mitm_attempt'
  | 'phishing_campaign'
  | 'data_exfiltration';

type EmulationStatus = 'idle' | 'running' | 'completed' | 'error';

const scenarioDetails: Record<EmulationScenario, { name: string; description: string; icon: React.ElementType }> = {
  simulated_malware: { name: 'Simulated Malware Infection', description: 'Emulates behavior of common malware variants within a sandboxed environment.', icon: AlertTriangle },
  port_scanning: { name: 'Network Port Scanning', description: 'Simulates an attacker scanning for open ports on target systems.', icon: Activity },
  packet_flooding: { name: 'Packet Flooding (DDoS)', description: 'Simulates a denial-of-service attack by flooding the network with traffic.', icon: ShieldCheck },
  mitm_attempt: { name: 'Man-in-the-Middle Attempt', description: 'Emulates techniques used to intercept or alter communications.', icon: ShieldCheck },
  phishing_campaign: { name: 'Phishing Campaign Simulation', description: 'Simulates a targeted phishing attack to test user awareness and email security.', icon: AlertTriangle },
  data_exfiltration: { name: 'Data Exfiltration Simulation', description: 'Emulates unauthorized data transfer out of the network.', icon: FileText },
};

export default function ThreatEmulationClient() {
  const [selectedScenario, setSelectedScenario] = useState<EmulationScenario>('simulated_malware');
  const [status, setStatus] = useState<EmulationStatus>('idle');
  const [emulationLog, setEmulationLog] = useState<string[]>([]);
  const { toast } = useToast();

  const handleRunEmulation = () => {
    setStatus('running');
    setEmulationLog([`Starting emulation: ${scenarioDetails[selectedScenario].name}...`]);

    // Simulate emulation process
    setTimeout(() => {
      setEmulationLog(prev => [...prev, `Analyzing target environment for ${selectedScenario}...`]);
    }, 1000);
    setTimeout(() => {
      setEmulationLog(prev => [...prev, `Executing ${selectedScenario} attack vectors...`]);
    }, 2500);
    setTimeout(() => {
      const success = Math.random() > 0.2; // 80% success rate for simulation
      if (success) {
        setEmulationLog(prev => [...prev, `Emulation of ${scenarioDetails[selectedScenario].name} completed successfully.`]);
        setStatus('completed');
        toast({
          title: "Emulation Complete",
          description: `${scenarioDetails[selectedScenario].name} finished. Check logs for details.`,
        });
      } else {
        setEmulationLog(prev => [...prev, `Error during ${scenarioDetails[selectedScenario].name} emulation. Check system integrity.`]);
        setStatus('error');
        toast({
          title: "Emulation Error",
          description: `An error occurred during the ${scenarioDetails[selectedScenario].name} emulation.`,
          variant: "destructive",
        });
      }
    }, 4000 + Math.random() * 2000);
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
      transition: { delay: i * 0.1, duration: 0.3} 
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
                  onValueChange={(value) => setSelectedScenario(value as EmulationScenario)}
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

              {/* Placeholder for future target selection or advanced config */}
              <div>
                <Label className="text-muted-foreground">Target Scope (Optional)</Label>
                <Input placeholder="e.g., 192.168.1.0/24, specific device ID, or 'All Internal'" disabled className="bg-input/50 border-border/50 mt-1" />
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

          <Card className="shadow-xl border-border/50">
            <CardHeader>
              <CardTitle>Emulation Log & Status</CardTitle>
              <CardDescription>Real-time updates from the ongoing or completed emulation.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-black/50 rounded-md p-4 border border-border/50 shadow-inner">
                <ScrollArea className="h-full">
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
                   {status === 'running' && (
                     <motion.div 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: emulationLog.length * 0.1 + 0.2}}
                        className="flex items-center text-xs text-yellow-400 font-mono mt-2"
                      >
                       <Loader2 className="h-3 w-3 animate-spin mr-2"/> Processing...
                     </motion.div>
                   )}
                </ScrollArea>
              </div>
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
        {/* Here we embed the existing IncidentReportForm */}
        <IncidentReportForm />
      </TabsContent>
    </Tabs>
  );
}

