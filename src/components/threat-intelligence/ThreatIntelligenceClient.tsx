
"use client";

import { useState, useEffect } from 'react';
import ThreatCard, { type Threat } from './ThreatCard';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw, Bug, Fish, ShieldOff, DatabaseZap, TerminalSquare, AlertOctagon, type LucideIcon } from 'lucide-react';
import { generateThreatIntel, type GenerateThreatIntelInput, type ThreatIntelEntry } from '@/ai/flows/generate-threat-intel-flow';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';

const threatTypeToIconMap: Record<ThreatIntelEntry['type'], LucideIcon | undefined> = {
  Malware: Bug,
  Phishing: Fish,
  DDoS: ShieldOff,
  SQLi: DatabaseZap,
  RCE: TerminalSquare,
  'Zero-day': AlertOctagon,
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 260,
      damping: 20,
    },
  },
};

export default function ThreatIntelligenceClient() {
  const [threats, setThreats] = useState<Threat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const { toast } = useToast();

  const fetchThreats = async () => {
    setIsLoading(true);
    try {
      // Request 6 threats to have a good variety
      const result = await generateThreatIntel({ count: 6, locale: 'en' });
      if (result && result.threats) {
        const threatsWithIcons = result.threats.map(t => ({
          ...t,
          icon: threatTypeToIconMap[t.type] || undefined,
        }));
        setThreats(threatsWithIcons);
      } else {
        setThreats([]);
        toast({
          title: "No Threats Generated",
          description: "The AI did not return any threat data.",
          variant: "default",
        });
      }
    } catch (error) {
      console.error("Error generating threat intel:", error);
      toast({
        title: "Error Generating Threats",
        description: error instanceof Error ? error.message : "An unknown error occurred while fetching threat intelligence.",
        variant: "destructive",
      });
      setThreats([]); // Clear threats on error
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchThreats();
  }, []);

  const filteredThreats = threats.filter(threat => {
    const matchesSearch = threat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          threat.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (threat.aiVerdict && threat.aiVerdict.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesSeverity = severityFilter === 'all' || threat.severity === severityFilter;
    const matchesStatus = statusFilter === 'all' || threat.status === statusFilter;
    return matchesSearch && matchesSeverity && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <Card className="shadow-md">
        <CardContent className="p-4 flex flex-wrap gap-4 items-center justify-between">
          <div className="flex flex-wrap gap-4 items-center flex-grow">
            <Input
              placeholder="Search threats..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-xs flex-grow bg-input border-border focus:ring-primary"
            />
            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger className="w-[180px] bg-input border-border focus:ring-primary">
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severities</SelectItem>
                <SelectItem value="Critical">Critical</SelectItem>
                <SelectItem value="High">High</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="Low">Low</SelectItem>
                <SelectItem value="Informational">Informational</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px] bg-input border-border focus:ring-primary">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Mitigated">Mitigated</SelectItem>
                <SelectItem value="Investigating">Investigating</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={fetchThreats} disabled={isLoading} variant="outline">
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            Refresh Threats
          </Button>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center h-64">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="mt-4 text-muted-foreground">Generating threat intelligence feed...</p>
        </div>
      ) : filteredThreats.length > 0 ? (
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {filteredThreats.map((threat, index) => (
            <ThreatCard key={threat.id} threat={threat} variants={cardVariants} custom={index} />
          ))}
        </motion.div>
      ) : (
        <div className="text-center py-10">
          <p className="text-xl text-muted-foreground">No threats match your criteria or an error occurred.</p>
          <Button onClick={fetchThreats} variant="link" className="mt-2">Try refreshing</Button>
        </div>
      )}
    </div>
  );
}
