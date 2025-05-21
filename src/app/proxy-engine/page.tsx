
import PageHeader from '@/components/shared/PageHeader';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Network, ToggleLeft, BarChart, Database, Settings, ShieldCheck, BarChart3, FileText } from 'lucide-react';
import Image from 'next/image';

export default function ProxyEnginePage() {
  return (
    <div>
      <PageHeader 
        title="Proxy Interception Engine" 
        description="Status, configuration, and real-time metrics for the traffic interception module."
        icon={Network}
      />
      <Card className="shadow-xl mb-6">
        <CardHeader>
          <CardTitle>Engine Status: <span className="text-green-400">Active & Nominal</span></CardTitle>
          <CardDescription>
            The proxy engine is currently intercepting and analyzing HTTP/S, TCP, and WebSocket traffic.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-card/60 hover:shadow-primary/30 transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-primary">Rules Loaded</CardTitle>
                <ToggleLeft className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">1,305</div>
                <p className="text-xs text-muted-foreground">WAF & Custom Rules</p>
              </CardContent>
            </Card>
            <Card className="bg-card/60 hover:shadow-primary/30 transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-primary">Conn/Sec (Avg)</CardTitle>
                <BarChart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">481</div>
                <p className="text-xs text-muted-foreground">Last 5 mins</p>
              </CardContent>
            </Card>
            <Card className="bg-card/60 hover:shadow-primary/30 transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-primary">Blocked Threats (24h)</CardTitle>
                <ShieldCheck className="h-4 w-4 text-destructive" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">78</div>
                <p className="text-xs text-muted-foreground">Based on active rules</p>
              </CardContent>
            </Card>
            <Card className="bg-card/60 hover:shadow-primary/30 transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-primary">Logged Events (24h)</CardTitle>
                <Database className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">3.9M</div>
                <p className="text-xs text-muted-foreground">Packets & Metadata</p>
              </CardContent>
            </Card>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center"><Settings className="mr-2 h-5 w-5 text-accent"/>Rule Management & Configuration</CardTitle>
            <CardDescription>Define and manage interception rules, policies, and engine settings.</CardDescription>
          </CardHeader>
          <CardContent className="text-center p-8 border-2 border-dashed border-border/30 rounded-lg m-6 mt-0 bg-background/30">
            <Image 
              src="https://placehold.co/600x300.png" 
              alt="Rule Management UI Placeholder" 
              width={600} 
              height={300} 
              className="opacity-60 rounded-md mx-auto shadow-md"
              data-ai-hint="code editor"
            />
            <p className="mt-4 text-md text-muted-foreground">
              Future: Advanced rule editor, policy versioning, and engine behavior settings.
            </p>
            <Button variant="outline" className="mt-4">Access Rule Editor (Coming Soon)</Button>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center"><BarChart3 className="mr-2 h-5 w-5 text-accent"/>Live Performance Metrics</CardTitle>
            <CardDescription>Monitor real-time performance, resource usage, and traffic statistics.</CardDescription>
          </CardHeader>
          <CardContent className="text-center p-8 border-2 border-dashed border-border/30 rounded-lg m-6 mt-0 bg-background/30">
            <Image 
              src="https://placehold.co/600x300.png" 
              alt="Live Metrics UI Placeholder" 
              width={600} 
              height={300} 
              className="opacity-60 rounded-md mx-auto shadow-md"
              data-ai-hint="dashboard charts"
            />
            <p className="mt-4 text-md text-muted-foreground">
              Future: Real-time charts for CPU/memory, connection rates, and rule hit counts.
            </p>
             <Button variant="outline" className="mt-4">View Live Dashboard (Coming Soon)</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
