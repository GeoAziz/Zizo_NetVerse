
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, ShieldCheck, Info, Zap, Eye, BarChartHorizontalBig, ExternalLink } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import Image from 'next/image';
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
import { Separator } from '../ui/separator';

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
  genomeSignature?: string;
  icon?: LucideIcon;
};

type ThreatCardProps = {
  threat: Threat;
};

const severityIcons: Record<Threat['severity'], JSX.Element> = {
  Critical: <AlertTriangle className="h-5 w-5 text-red-400" />,
  High: <AlertTriangle className="h-5 w-5 text-orange-400" />,
  Medium: <Zap className="h-5 w-5 text-yellow-400" />,
  Low: <Info className="h-5 w-5 text-blue-400" />,
  Informational: <Info className="h-5 w-5 text-gray-400" />,
};

const severityBadgeVariant: Record<Threat['severity'], 'destructive' | 'secondary' | 'outline'> = {
  Critical: 'destructive',
  High: 'destructive', 
  Medium: 'secondary',
  Low: 'outline',
  Informational: 'outline',
} as const;


export default function ThreatCard({ threat }: ThreatCardProps) {
  const { toast } = useToast();

  const handleMitigate = () => {
    toast({
      title: "Mitigation Action",
      description: `Mitigation process initiated for threat: "${threat.name}".`,
      variant: "default",
    });
  };

  const ThreatIcon = threat.icon;

  return (
    <Card className="shadow-xl hover:shadow-primary/60 transition-all duration-300 ease-in-out transform hover:-translate-y-1 bg-card border border-border overflow-hidden flex flex-col">
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
          {ThreatIcon && <ThreatIcon className="h-8 w-8 text-muted-foreground" />}
        </div>
      </CardHeader>
      <CardContent className="space-y-3 pb-4 flex-grow">
        <p className="text-sm text-muted-foreground line-clamp-3">{threat.description}</p>
        
        {threat.genomeSignature && (
          <div className="mt-2">
            <h4 className="text-xs font-semibold text-foreground mb-1">Threat Genome Signature:</h4>
            <Image 
              src={`https://placehold.co/300x50.png?text=${encodeURIComponent(threat.genomeSignature)}`} 
              alt="Genome Signature" 
              width={300} 
              height={50} 
              className="rounded opacity-70 border border-border/50"
              data-ai-hint="dna sequence" 
            />
          </div>
        )}

        <div className="text-xs text-muted-foreground space-y-1 pt-1">
          <p><strong>Status:</strong> <span className={threat.status === 'Active' ? 'text-destructive font-semibold' : threat.status === 'Mitigated' ? 'text-green-400 font-semibold' : 'text-yellow-400 font-semibold'}>{threat.status}</span></p>
          <p><strong>First Seen:</strong> {new Date(threat.firstSeen).toLocaleDateString()} at {new Date(threat.firstSeen).toLocaleTimeString()}</p>
          <p><strong>Last Seen:</strong> {new Date(threat.lastSeen).toLocaleDateString()} at {new Date(threat.lastSeen).toLocaleTimeString()}</p>
          <p><strong>Affected Systems:</strong> {threat.affectedSystems.toLocaleString()}</p>
        </div>

        {threat.aiVerdict && (
            <div className="p-2.5 bg-background/50 rounded-md border border-border/50 mt-2">
                <p className="text-xs font-semibold text-accent mb-0.5">AI Analysis:</p>
                <p className="text-xs text-muted-foreground">{threat.aiVerdict}</p>
            </div>
        )}
        {threat.recommendation && (
            <div className="p-2.5 bg-background/50 rounded-md border border-border/50 mt-2">
                <p className="text-xs font-semibold text-accent mb-0.5">Recommendation:</p>
                <p className="text-xs text-muted-foreground">{threat.recommendation}</p>
            </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-end gap-2 bg-muted/30 py-3 px-4 border-t border-border/50">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Eye className="mr-2 h-4 w-4" /> View Details
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="max-w-2xl">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-2xl text-primary flex items-center">
                {ThreatIcon && <ThreatIcon className="mr-3 h-7 w-7 text-primary/80" />}
                {threat.name}
              </AlertDialogTitle>
              <AlertDialogDescription className="text-base text-muted-foreground pt-1">
                Detailed information for the observed threat.
              </AlertDialogDescription>
            </AlertDialogHeader>
            
            <div className="space-y-3 py-4 max-h-[60vh] overflow-y-auto px-1 text-sm">
              <div className="flex gap-2 items-center flex-wrap">
                <Badge variant={severityBadgeVariant[threat.severity] || 'default'} className="text-sm px-3 py-1">
                  {severityIcons[threat.severity]}
                  <span className="ml-1.5">{threat.severity}</span>
                </Badge>
                <Badge variant="outline" className="text-sm px-3 py-1 border-accent text-accent">{threat.type}</Badge>
                 <Badge variant="outline" className={`text-sm px-3 py-1 ${threat.status === 'Active' ? 'border-destructive text-destructive' : threat.status === 'Mitigated' ? 'border-green-500 text-green-500' : 'border-yellow-500 text-yellow-500'}`}>{threat.status}</Badge>
              </div>

              <Separator className="my-3"/>

              <p><strong>Full Description:</strong> {threat.description}</p>
              
              {threat.genomeSignature && (
                <div className="mt-3">
                  <h4 className="text-sm font-semibold text-foreground mb-1">Genome Signature:</h4>
                   <Image 
                    src={`https://placehold.co/400x60.png?text=${encodeURIComponent(threat.genomeSignature)}`} 
                    alt="Genome Signature" 
                    width={400} 
                    height={60} 
                    className="rounded opacity-80 border border-border/50 shadow-sm"
                    data-ai-hint="dna sequence abstract" 
                  />
                </div>
              )}
              
              <Separator className="my-3"/>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2">
                <p><strong>First Observed:</strong> {new Date(threat.firstSeen).toLocaleString()}</p>
                <p><strong>Last Observed:</strong> {new Date(threat.lastSeen).toLocaleString()}</p>
                <p><strong>Affected Systems Estimate:</strong> {threat.affectedSystems.toLocaleString()}</p>
                <p><strong>Unique ID:</strong> <span className="font-mono text-xs bg-muted p-1 rounded">{threat.id}</span></p>
              </div>
              
              {threat.aiVerdict && (
                <>
                  <Separator className="my-3"/>
                  <div className="p-3 bg-black/20 rounded-md border border-border/30">
                      <p className="font-semibold text-accent mb-1">AI-Generated Analysis:</p>
                      <p className="text-muted-foreground">{threat.aiVerdict}</p>
                  </div>
                </>
              )}

              {threat.recommendation && (
                 <>
                  <Separator className="my-3"/>
                  <div className="p-3 bg-black/20 rounded-md border border-border/30">
                      <p className="font-semibold text-accent mb-1">Recommended Actions:</p>
                      <p className="text-muted-foreground">{threat.recommendation}</p>
                  </div>
                </>
              )}
            </div>
            <AlertDialogFooter className="pt-4">
              <AlertDialogCancel>Close</AlertDialogCancel>
              <AlertDialogAction onClick={() => window.open(`https://www.virustotal.com/gui/search/${encodeURIComponent(threat.name)}`, "_blank")}>
                 <ExternalLink className="mr-2 h-4 w-4" /> Search on VirusTotal
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {threat.status === 'Active' && (
          <Button variant="secondary" size="sm" onClick={handleMitigate}>
            <ShieldCheck className="mr-2 h-4 w-4" /> Mitigate
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

    