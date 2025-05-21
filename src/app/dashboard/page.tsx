
"use client";

import { useState, useEffect } from 'react';
import PageHeader from '@/components/shared/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, AlertTriangle, BarChart3, Globe, TrendingUp, Zap, BarChartHorizontalBig } from 'lucide-react';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import type { ChartConfig } from "@/components/ui/chart";
import { PolarAngleAxis, PolarGrid, Radar, RadarChart, Line, LineChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PolarRadiusAxis } from 'recharts';
import AppLayout from '@/components/layout/AppLayout'; // Import AppLayout

const initialRadarChartData = [
  { subject: 'Malware', A: 120, B: 110, fullMark: 150 },
  { subject: 'Phishing', A: 98, B: 130, fullMark: 150 },
  { subject: 'DDoS', A: 86, B: 130, fullMark: 150 },
  { subject: 'SQLi', A: 99, B: 100, fullMark: 150 },
  { subject: 'Zero-Day', A: 85, B: 90, fullMark: 150 },
  { subject: 'Ransomware', A: 65, B: 85, fullMark: 150 },
];

const radarChartConfig = {
  detected: {
    label: "Detected Threats",
    color: "hsl(var(--primary))",
  },
  historical: {
    label: "Historical Avg",
    color: "hsl(var(--accent))",
  },
} satisfies ChartConfig;

const initialVitalsChartData = [
  { name: '10:00', cpu: 30, memory: 55, network: 20 },
  { name: '10:05', cpu: 35, memory: 50, network: 25 },
  { name: '10:10', cpu: 40, memory: 60, network: 30 },
  { name: '10:15', cpu: 30, memory: 58, network: 22 },
  { name: '10:20', cpu: 50, memory: 65, network: 40 },
  { name: '10:25', cpu: 45, memory: 62, network: 35 },
];

const vitalsChartConfig = {
  cpu: {
    label: "CPU Usage (%)",
    color: "hsl(var(--primary))",
  },
  memory: {
    label: "Memory Usage (%)",
    color: "hsl(var(--secondary))",
  },
  network: {
    label: "Network (Mbps)",
    color: "hsl(var(--accent))",
  },
} satisfies ChartConfig;

export default function DashboardPage() {
  const [activeThreats, setActiveThreats] = useState<number | null>(null);
  const [packetsIntercepted, setPacketsIntercepted] = useState<number | null>(null);
  const [radarChartData, setRadarChartData] = useState(initialRadarChartData);
  const [vitalsChartData, setVitalsChartData] = useState(initialVitalsChartData);

  useEffect(() => {
    setActiveThreats(Math.floor(Math.random() * 20) + 5);
    setPacketsIntercepted(Math.floor(Math.random() * 500000) + 1000000);

    const threatInterval = setInterval(() => {
      setActiveThreats(prev => prev !== null ? Math.max(0, prev + Math.floor(Math.random() * 6) - 3) : Math.floor(Math.random() * 20) + 5);
    }, 3000);

    const packetInterval = setInterval(() => {
      setPacketsIntercepted(prev => prev !== null ? prev + Math.floor(Math.random() * 15000) + 5000 : Math.floor(Math.random() * 500000) + 1000000);
    }, 2000);

    const radarInterval = setInterval(() => {
      setRadarChartData(prevData => 
        prevData.map(item => ({
          ...item,
          A: Math.min(item.fullMark, Math.max(0, item.A + Math.floor(Math.random() * 20) - 10)),
          B: Math.min(item.fullMark, Math.max(0, item.B + Math.floor(Math.random() * 10) - 5)),
        }))
      );
    }, 5000);

    const vitalsInterval = setInterval(() => {
      setVitalsChartData(prevData => {
        const lastDataPoint = prevData[prevData.length - 1];
        const newTime = new Date(new Date(\`1970-01-01T\${lastDataPoint.name}:00Z\`).getTime() + 5 * 60000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        const newDataPoint = {
          name: newTime,
          cpu: Math.min(100, Math.max(10, lastDataPoint.cpu + Math.floor(Math.random() * 20) - 10)),
          memory: Math.min(100, Math.max(20, lastDataPoint.memory + Math.floor(Math.random() * 10) - 5)),
          network: Math.min(100, Math.max(5, lastDataPoint.network + Math.floor(Math.random() * 15) - 7)),
        };
        return [...prevData.slice(1), newDataPoint];
      });
    }, 4000);

    return () => {
      clearInterval(threatInterval);
      clearInterval(packetInterval);
      clearInterval(radarInterval);
      clearInterval(vitalsInterval);
    };
  }, []);

  return (
    <AppLayout> {/* Wrap content with AppLayout */}
      <div className="space-y-6">
        <PageHeader
          title="System Dashboard"
          description="Real-time overview of Zizo_NetVerse operations."
          icon={Activity}
        />

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="shadow-lg hover:shadow-primary/50 transition-shadow duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-primary">Active Threats</CardTitle>
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">{activeThreats !== null ? activeThreats : '...'}</div>
              <p className="text-xs text-muted-foreground">Real-time detection count</p>
            </CardContent>
          </Card>

          <Card className="shadow-lg hover:shadow-primary/50 transition-shadow duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-primary">Packets Intercepted</CardTitle>
              <BarChartHorizontalBig className="h-5 w-5 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">{packetsIntercepted !== null ? (packetsIntercepted / 1000000).toFixed(1) + 'M' : '...'}</div>
              <p className="text-xs text-muted-foreground">Processed data volume</p>
            </CardContent>
          </Card>

          <Card className="shadow-lg hover:shadow-primary/50 transition-shadow duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-primary">AI Emulation Status</CardTitle>
              <Zap className="h-5 w-5 text-secondary" />
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
              <CardDescription>Visualizing incoming threat vectors by type.</CardDescription>
            </CardHeader>
            <CardContent className="h-[350px] p-4 bg-card-foreground/5 rounded-b-md">
              <ChartContainer config={radarChartConfig} className="w-full h-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarChartData} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border)/0.5)" />
                    <PolarGrid stroke="hsl(var(--border)/0.7)" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: 'hsl(var(--foreground))', fontSize: 12 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 150]} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
                    <Radar nameKey="detected" dataKey="A" stroke="hsl(var(--primary))" fill="hsl(var(--primary)/0.4)" fillOpacity={0.6} />
                    <Radar nameKey="historical" dataKey="B" stroke="hsl(var(--accent))" fill="hsl(var(--accent)/0.3)" fillOpacity={0.5} />
                    <Tooltip
                      content={<ChartTooltipContent indicator="line" />}
                      cursor={{ fill: "hsl(var(--popover)/0.3)" }}
                    />
                    <Legend content={<ChartLegendContent />} />
                  </RadarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card className="shadow-xl">
            <CardHeader>
              <CardTitle>System Vitals</CardTitle>
              <CardDescription>Key performance metrics over the last 30 minutes.</CardDescription>
            </CardHeader>
            <CardContent className="h-[350px] p-4 bg-card-foreground/5 rounded-b-md">
              <ChartContainer config={vitalsChartConfig} className="w-full h-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={vitalsChartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border)/0.5)" />
                    <XAxis dataKey="name" tick={{ fill: 'hsl(var(--foreground))', fontSize: 12 }} />
                    <YAxis domain={[0,100]} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
                    <Tooltip
                      content={<ChartTooltipContent />}
                      cursor={{ fill: "hsl(var(--popover)/0.3)" }}
                    />
                    <Legend content={<ChartLegendContent />} />
                    <Line type="monotone" dataKey="cpu" nameKey="cpu" strokeWidth={2} stroke="hsl(var(--primary))" activeDot={{ r: 6, fill: "hsl(var(--primary))" }} dot={false} />
                    <Line type="monotone" dataKey="memory" nameKey="memory" strokeWidth={2} stroke="hsl(var(--secondary))" activeDot={{ r: 6, fill: "hsl(var(--secondary))" }} dot={false}/>
                    <Line type="monotone" dataKey="network" nameKey="network" strokeWidth={2} stroke="hsl(var(--accent))" activeDot={{ r: 6, fill: "hsl(var(--accent))" }} dot={false}/>
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout> 
  );
}
