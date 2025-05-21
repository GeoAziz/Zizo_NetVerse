import PageHeader from '@/components/shared/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Network, ToggleLeft, BarChart, Database } from 'lucide-react';
import Image from 'next/image';

export default function ProxyEnginePage() {
  return (
    <div>
      <PageHeader 
        title="Proxy Interception Engine" 
        description="Status and configuration for the real-time traffic interception module."
        icon={Network}
      />
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle>Engine Status: <span className="text-green-400">Active</span></CardTitle>
          <CardDescription>
            The proxy engine is currently intercepting HTTP/S, TCP, and WebSocket traffic.
            This page is a placeholder for detailed configuration and live statistics.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card className="bg-card/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-primary">Rules Loaded</CardTitle>
                <ToggleLeft className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">1,287</div>
                <p className="text-xs text-muted-foreground">WAF & Custom Rules Active</p>
              </CardContent>
            </Card>
            <Card className="bg-card/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-primary">Connections Per Second</CardTitle>
                <BarChart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">452</div>
                <p className="text-xs text-muted-foreground">Avg. over last 5 mins</p>
              </CardContent>
            </Card>
            <Card className="bg-card/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-primary">Logged Events (24h)</CardTitle>
                <Database className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">3.5M</div>
                <p className="text-xs text-muted-foreground">Packets & Metadata</p>
              </CardContent>
            </Card>
          </div>
          <div className="text-center p-8 border-2 border-dashed border-border/50 rounded-lg">
            <Image 
              src="https://placehold.co/800x400.png?text=Proxy+Engine+Configuration+UI" 
              alt="Proxy Engine UI Placeholder" 
              width={800} 
              height={400} 
              className="opacity-50 rounded-md mx-auto"
              data-ai-hint="server diagram"
            />
            <p className="mt-4 text-lg text-muted-foreground">
              Future: Advanced configuration, rule editor, and real-time performance metrics will be available here.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
