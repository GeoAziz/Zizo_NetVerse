"use client";

import { useState } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input'; // Not used, but good to have if needed
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { generateIncidentReport, type GenerateIncidentReportInput, type GenerateIncidentReportOutput } from '@/ai/flows/generate-incident-report';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { Loader2, Sparkles } from 'lucide-react';

const formSchema = z.object({
  incidentDescription: z.string().min(50, "Incident description must be at least 50 characters."),
  networkDataSummary: z.string().min(30, "Network data summary must be at least 30 characters."),
  threatIntelData: z.string().min(30, "Threat intelligence data must be at least 30 characters."),
  visualizationType: z.enum(['network_map', 'threat_timeline', 'geo_distribution']),
});

export default function IncidentReportForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [report, setReport] = useState<GenerateIncidentReportOutput | null>(null);
  const { toast } = useToast();

  const form = useForm<GenerateIncidentReportInput>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      incidentDescription: '',
      networkDataSummary: '',
      threatIntelData: '',
      visualizationType: 'network_map',
    },
  });

  const onSubmit: SubmitHandler<GenerateIncidentReportInput> = async (data) => {
    setIsLoading(true);
    setReport(null);
    try {
      const result = await generateIncidentReport(data);
      setReport(result);
      toast({
        title: "Report Generated Successfully!",
        description: "The AI has compiled the incident report.",
        variant: "default",
      });
    } catch (error) {
      console.error("Error generating report:", error);
      toast({
        title: "Error Generating Report",
        description: error instanceof Error ? error.message : "An unknown error occurred.",
        variant: "destructive",
      });
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
                      <Textarea placeholder="Summary of relevant network logs, traffic anomalies, affected IPs/ports..." {...field} rows={3} className="bg-input border-border focus:ring-primary" />
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
                      <Textarea placeholder="Known TTPs, threat actor information, relevant IOCs..." {...field} rows={3} className="bg-input border-border focus:ring-primary" />
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

      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle>Generated Report</CardTitle>
          <CardDescription>The AI-generated report will appear here.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 max-h-[70vh] overflow-y-auto">
          {isLoading && (
            <div className="flex flex-col items-center justify-center h-64">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="mt-4 text-muted-foreground">Generating report, please wait...</p>
            </div>
          )}
          {report && !isLoading && (
            <>
              <h2 className="text-2xl font-semibold text-primary">{report.reportTitle}</h2>
              
              <div>
                <h3 className="text-lg font-medium mt-4 mb-1 text-accent">Executive Summary</h3>
                <div className="prose prose-sm prose-invert max-w-none p-3 bg-black/20 rounded-md border border-border/50 text-sm">
                  <pre className="whitespace-pre-wrap font-sans">{report.executiveSummary}</pre>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mt-4 mb-1 text-accent">Detailed Analysis</h3>
                 <div className="prose prose-sm prose-invert max-w-none p-3 bg-black/20 rounded-md border border-border/50 text-sm">
                  <pre className="whitespace-pre-wrap font-sans">{report.detailedAnalysis}</pre>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium mt-4 mb-1 text-accent">Recommendations</h3>
                 <div className="prose prose-sm prose-invert max-w-none p-3 bg-black/20 rounded-md border border-border/50 text-sm">
                  <pre className="whitespace-pre-wrap font-sans">{report.recommendations}</pre>
                </div>
              </div>
              
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
                        unoptimized={report.visualizationDataUri.startsWith('data:')} // Required for data URIs
                    />
                  </div>
                </div>
              )}
            </>
          )}
          {!report && !isLoading && (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <Sparkles className="h-12 w-12 text-muted-foreground/50" />
              <p className="mt-4 text-muted-foreground">Your generated report will be displayed here once processed.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
