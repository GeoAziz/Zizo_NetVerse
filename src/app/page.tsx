import PageHeader from '@/components/shared/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, AlertTriangle, BarChart3, Globe } from 'lucide-react';
import Image from 'next/image';

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <PageHeader 
        title="System Dashboard" 
        description="Real-time overview of network sentinel operations."
        icon={Activity}
      />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="shadow-lg hover:shadow-primary/50 transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-primary">Active Threats</CardTitle>
            <AlertTriangle className="h-5 w-5 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">+5 from last hour</p>
          </CardContent>
        </Card>

        <Card className="shadow-lg hover:shadow-primary/50 transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-primary">Packets Intercepted</CardTitle>
            <BarChart3 className="h-5 w-5 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">1.2M</div>
            <p className="text-xs text-muted-foreground">Processed in last 24h</p>
          </CardContent>
        </Card>

        <Card className="shadow-lg hover:shadow-primary/50 transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-primary">AI Emulation Status</CardTitle>
            <Globe className="h-5 w-5 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-400">Nominal</div>
            <p className="text-xs text-muted-foreground">All simulations stable</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle>ThreatPulse Radar</CardTitle>
            <CardDescription>Visualizing incoming threat vectors (placeholder).</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] flex items-center justify-center bg-card-foreground/5 rounded-b-md">
             <Image src="https://placehold.co/600x300.png?text=Threat+Radar" alt="Threat Radar Placeholder" width={600} height={300} className="opacity-50 rounded-md" data-ai-hint="radar futuristic" />
          </CardContent>
        </Card>

        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle>Vitals Panel</CardTitle>
            <CardDescription>Key system performance metrics (placeholder).</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] flex items-center justify-center bg-card-foreground/5 rounded-b-md">
            <Image src="https://placehold.co/600x300.png?text=System+Vitals" alt="System Vitals Placeholder" width={600} height={300} className="opacity-50 rounded-md" data-ai-hint="graph chart" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
