import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, ShieldCheck, Info, Zap, Eye, BarChartHorizontalBig } from 'lucide-react';
import Image from 'next/image';

export type Threat = {
  id: string;
  name: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low' | 'Informational';
  type: 'Malware' | 'Phishing' | 'DDoS' | 'SQLi' | 'RCE' | 'Zero-day';
  status: 'Active' | 'Mitigated' | 'Investigating';
  description: string;
  firstSeen: string;
  lastSeen: string;
  affectedSystems: number;
  aiVerdict?: string;
  recommendation?: string;
  genomeSignature?: string; // Placeholder for "GenomeTrail" idea
  icon?: LucideIcon;
};

type ThreatCardProps = {
  threat: Threat;
};

const severityIcons = {
  Critical: <AlertTriangle className="h-5 w-5 text-red-400" />,
  High: <AlertTriangle className="h-5 w-5 text-orange-400" />,
  Medium: <Zap className="h-5 w-5 text-yellow-400" />,
  Low: <Info className="h-5 w-5 text-blue-400" />,
  Informational: <Info className="h-5 w-5 text-gray-400" />,
};

const severityBadgeVariant = {
  Critical: 'destructive',
  High: 'destructive', // Using destructive for high too for visibility
  Medium: 'secondary',
  Low: 'outline',
  Informational: 'outline',
} as const;


export default function ThreatCard({ threat }: ThreatCardProps) {
  return (
    <Card className="shadow-xl hover:shadow-primary/60 transition-all duration-300 ease-in-out transform hover:-translate-y-1 bg-card border border-border overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl text-primary mb-1">{threat.name}</CardTitle>
            <div className="flex gap-2 items-center">
               <Badge variant={severityBadgeVariant[threat.severity] || 'default'} className="text-xs">
                {severityIcons[threat.severity]}
                <span className="ml-1">{threat.severity}</span>
              </Badge>
              <Badge variant="outline" className="text-xs border-accent text-accent">{threat.type}</Badge>
            </div>
          </div>
          {threat.icon && <threat.icon className="h-8 w-8 text-muted-foreground" />}
        </div>
      </CardHeader>
      <CardContent className="space-y-3 pb-4">
        <p className="text-sm text-muted-foreground line-clamp-3">{threat.description}</p>
        
        {threat.genomeSignature && (
          <div className="mt-2">
            <h4 className="text-xs font-semibold text-foreground mb-1">Threat Genome Signature:</h4>
            {/* Placeholder for GenomeTrail visualization */}
            <Image 
              src={`https://placehold.co/300x50.png?text=${threat.genomeSignature.replace(/\s+/g, '+')}`} 
              alt="Genome Signature" 
              width={300} 
              height={50} 
              className="rounded opacity-70"
              data-ai-hint="dna sequence" 
            />
          </div>
        )}

        <div className="text-xs text-muted-foreground space-y-1">
          <p><strong>Status:</strong> <span className={threat.status === 'Active' ? 'text-destructive' : threat.status === 'Mitigated' ? 'text-green-400' : 'text-yellow-400'}>{threat.status}</span></p>
          <p><strong>First Seen:</strong> {new Date(threat.firstSeen).toLocaleDateString()}</p>
          <p><strong>Affected Systems:</strong> {threat.affectedSystems}</p>
        </div>

        {threat.aiVerdict && (
            <div className="p-2 bg-background/50 rounded-md border border-border/50">
                <p className="text-xs font-semibold text-accent">AI Analysis:</p>
                <p className="text-xs text-muted-foreground">{threat.aiVerdict}</p>
            </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-end gap-2 bg-muted/30 py-3 px-4">
        <Button variant="outline" size="sm">
          <Eye className="mr-2 h-4 w-4" /> View Details
        </Button>
        {threat.status === 'Active' && (
          <Button variant="secondary" size="sm">
            <ShieldCheck className="mr-2 h-4 w-4" /> Mitigate
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
