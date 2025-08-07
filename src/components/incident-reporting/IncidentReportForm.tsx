"use client";

import { useState } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { generateIncidentReport as generateIncidentReportFlow } from '@/ai/flows/generate-incident-report';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { Loader2, Sparkles, ListChecks } from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';

const formSchema = z.object({
  incidentDescription: z.string().min(50, "Incident description must be at least 50 characters."),
  networkDataSummary: z.string().min(30, "Network data summary must be at least 30 characters."),
  threatIntelData: z.string().min(30, "Threat intelligence data must be at least 30 characters."),
  visualizationType: z.enum(['network_map', 'threat_timeline', 'geo_distribution']),
});

type GenerateIncidentReportInput = z.infer<typeof formSchema>;

type GenerateIncidentReportOutput = {
  reportTitle: string;
  executiveSummary: string;
  detailedAnalysis: string;
  recommendations: string;
  suggestedRuleImprovements?: string[];
  visualizationDataUri?: string;
};

export default function IncidentReportForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [report, setReport] = useState<GenerateIncidentReportOutput | null>(null);
  const { toast } = useToast();

  const form = useForm<GenerateIncidentReportInput>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      incidentDescription: "On 2024-07-29 at 14:35 UTC, multiple alerts fired related to suspicious outbound traffic from server 'SRV-DB-01' (10.0.1.54) to an unknown IP address (198.51.100.23). The traffic was flagged by our Data Loss Prevention system for attempting to transfer a compressed archive named 'db_backup_q2.zip'.",
      networkDataSummary: "Observed a sustained TCP connection on port 4444 from 10.0.1.54 to 198.51.100.23, lasting 15 minutes. Approximately 850MB of data was exfiltrated before the connection was terminated by automated firewall rules. Normal traffic for this server is restricted to internal subnets and a known update server.",
      threatIntelData: "The destination IP 198.51.100.23 is associated with the 'KryllWorm' malware family, a known data-stealing trojan. Our threat feed indicates this IP was activated as a C2 server within the last 48 hours. The TTPs match 'T1041: Exfiltration Over C2 Channel'.",
      visualizationType: 'network_map',
    },
  });

  const onSubmit: SubmitHandler<GenerateIncidentReportInput> = async (data) => {
    setIsLoading(true);
    setReport(null);
    try {
      const backendResult = await generateIncidentReportFlow(data);
      setReport(backendResult);
      toast({ title: 'Incident Report Generated', description: 'AI-powered report is ready.' });
    } catch (e: any) {
      const errorMessage = e?.message || 'Failed to generate incident report';
      toast({ title: 'Error', description: errorMessage, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle>Generate New Incident Report</CardTitle>
          <CardDescription>Provide details about the incident below. The AI will generate a structured report.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="incidentDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Incident Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Detailed description of what happened, when, and how it was discovered..." {...field} rows={5} className="bg-input border-border focus:ring-primary" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="networkDataSummary"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Network Data Summary</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Summary of relevant network logs, traffic anomalies, affected IPs/ports..." {...field} rows={4} className="bg-input border-border focus:ring-primary" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="threatIntelData"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Threat Intelligence Data</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Known TTPs, threat actor information, relevant IOCs..." {...field} rows={4} className="bg-input border-border focus:ring-primary" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="visualizationType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Visualization Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-input border-border focus:ring-primary">
                          <SelectValue placeholder="Select a visualization type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="network_map">Network Map</SelectItem>
                        <SelectItem value="threat_timeline">Threat Timeline</SelectItem>
                        <SelectItem value="geo_distribution">Geo Distribution</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isLoading} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="mr-2 h-4 w-4" />
                )}
                Generate Report with AI
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card className="shadow-xl flex flex-col">
        <CardHeader>
          <CardTitle>Generated Report</CardTitle>
          <CardDescription>The AI-generated report will appear here.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 flex-grow">
          <ScrollArea className="h-[calc(100vh-400px)]">
            <div className="pr-4">
              {isLoading && (
                <div className="flex flex-col items-center justify-center h-full pt-16">
                  <Loader2 className="h-12 w-12 animate-spin text-primary" />
                  <p className="mt-4 text-muted-foreground">Generating report, please wait...</p>
                </div>
              )}
              {report && !isLoading && (
                <>
                  <h2 className="text-2xl font-semibold text-primary">{report.reportTitle}</h2>
                  
                  <div>
                    <h3 className="text-lg font-medium mt-4 mb-1 text-accent">Executive Summary</h3>
                    <div className="prose prose-sm prose-invert max-w-none p-3 bg-black/20 rounded-md border border-border/50 text-sm whitespace-pre-wrap font-sans">
                      {report.executiveSummary}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium mt-4 mb-1 text-accent">Detailed Analysis</h3>
                    <div className="prose prose-sm prose-invert max-w-none p-3 bg-black/20 rounded-md border border-border/50 text-sm whitespace-pre-wrap font-sans">
                      {report.detailedAnalysis}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium mt-4 mb-1 text-accent">Recommendations</h3>
                    <div className="prose prose-sm prose-invert max-w-none p-3 bg-black/20 rounded-md border border-border/50 text-sm whitespace-pre-wrap font-sans">
                      {report.recommendations}
                    </div>
                  </div>

                  {report.suggestedRuleImprovements && report.suggestedRuleImprovements.length > 0 && (
                    <div>
                      <h3 className="text-lg font-medium mt-4 mb-1 text-accent flex items-center">
                        <ListChecks className="mr-2 h-5 w-5" />
                        Suggested Rule Improvements
                      </h3>
                      <ul className="list-none p-3 bg-black/20 rounded-md border border-border/50 text-sm space-y-2">
                        {report.suggestedRuleImprovements.map((rule, index) => (
                          <li key={index} className="font-mono text-xs text-foreground/90 bg-black/30 p-2 rounded-sm border border-border/30">
                            {rule}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {report.visualizationDataUri && (
                    <div className="mt-6">
                      <h3 className="text-lg font-medium mb-2 text-accent">Visualization</h3>
                      <div className="relative aspect-video w-full overflow-hidden rounded-md border border-border shadow-lg">
                        <Image 
                            src={report.visualizationDataUri} 
                            alt="Generated Visualization" 
                            layout="fill"
                            objectFit="contain" 
                            className="bg-muted"
                            unoptimized={report.visualizationDataUri.startsWith('data:')}
                        />
                      </div>
                    </div>
                  )}
                </>
              )}
              {!report && !isLoading && (
                <div className="flex flex-col items-center justify-center h-full pt-16 text-center">
                  <Sparkles className="h-12 w-12 text-muted-foreground/50" />
                  <p className="mt-4 text-muted-foreground">Your generated report will be displayed here once processed.</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
