
"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import PageHeader from '@/components/shared/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardFooter, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Activity, AlertTriangle, BarChartHorizontalBig, Zap, Maximize, ChevronRight } from 'lucide-react';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import type { ChartConfig } from "@/components/ui/chart";
import { PolarAngleAxis, PolarGrid, Radar, RadarChart, Line, LineChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import AppLayout from '@/components/layout/AppLayout';
import { NAV_LINKS, APP_NAME } from '@/lib/constants';
import { motion } from 'framer-motion';

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
    color: "hsl(var(--secondary))", // Using secondary from theme
  },
  network: {
    label: "Network (Mbps)",
    color: "hsl(var(--accent))",
  },
} satisfies ChartConfig;

// Filter out the 'Home' link for module buttons as we are already on the dashboard.
const commandModules = NAV_LINKS.filter(link => link.href !== '/dashboard');

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
        // Ensure lastDataPoint.name is a valid time string like "HH:MM"
        const timeParts = lastDataPoint.name.split(':');
        const date = new Date();
        date.setHours(parseInt(timeParts[0]), parseInt(timeParts[1]), 0, 0);
        
        const newTimeDate = new Date(date.getTime() + 5 * 60000);
        const newTime = newTimeDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});

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

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.05, duration: 0.4, ease: "easeOut" },
    }),
  };

  return (
    <AppLayout>
      <div className="space-y-8">
        <PageHeader
          title={`${APP_NAME} Mission Control`}
          description="Centralized real-time overview of network operations and cybersecurity posture."
          icon={Maximize} // Changed icon to something more 'control panel' like
        />

        {/* Top Status Cards */}
        <motion.div 
          className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
        >
          <motion.div variants={cardVariants}>
            <Card className="shadow-lg hover:shadow-primary/50 transition-shadow duration-300 border-primary/30 bg-card/80 backdrop-blur-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-primary">Active Threats</CardTitle>
                <AlertTriangle className="h-5 w-5 text-destructive animate-pulse" />
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold">{activeThreats !== null ? activeThreats : '...'}</div>
                <p className="text-xs text-muted-foreground">Real-time critical alerts</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={cardVariants}>
            <Card className="shadow-lg hover:shadow-primary/50 transition-shadow duration-300 border-accent/30 bg-card/80 backdrop-blur-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-accent">Packets Intercepted</CardTitle>
                <BarChartHorizontalBig className="h-5 w-5 text-accent" />
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold">{packetsIntercepted !== null ? (packetsIntercepted / 1000000).toFixed(1) + 'M' : '...'}</div>
                <p className="text-xs text-muted-foreground">Total processed data volume</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={cardVariants}>
            <Card className="shadow-lg hover:shadow-primary/50 transition-shadow duration-300 border-secondary/30 bg-card/80 backdrop-blur-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-secondary">AI Emulation Status</CardTitle>
                <Zap className="h-5 w-5 text-secondary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-400">Nominal</div> {/* Using text-green-400 for status */}
                <p className="text-xs text-muted-foreground">All AI simulations stable</p>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>

        {/* Command Modules Section */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3, duration: 0.5 }}>
          <Card className="shadow-xl border-border/50 bg-card/90 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-xl text-accent">Command Modules</CardTitle>
              <CardDescription>Access specialized system consoles and tools.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {commandModules.map((item, idx) => (
                <motion.div key={item.href} variants={cardVariants} custom={idx}>
                  <Link href={item.href} passHref>
                    <Card className="h-full flex flex-col justify-between bg-card-foreground/5 hover:bg-primary/10 hover:border-primary/70 border-border/30 transition-all duration-300 shadow-md hover:shadow-lg cursor-pointer">
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                           <item.icon className="h-7 w-7 text-primary mb-2" />
                           <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary" />
                        </div>
                        <CardTitle className="text-lg text-foreground">{item.label}</CardTitle>
                      </CardHeader>
                      <CardContent className="flex-grow pb-3">
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {item.description || item.longLabel}
                        </p>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </CardContent>
          </Card>
        </motion.div>

        {/* Charts Section */}
        <div className="grid gap-6 lg:grid-cols-2">
          <motion.div variants={cardVariants} custom={commandModules.length + 1}>
            <Card className="shadow-xl border-border/50 bg-card/90 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>ThreatPulse Radar</CardTitle>
                <CardDescription>Visualizing incoming threat vectors by type.</CardDescription>
              </CardHeader>
              <CardContent className="h-[350px] p-4 bg-card-foreground/5 rounded-b-md">
                <ChartContainer config={radarChartConfig} className="w-full h-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarChartData} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border)/0.3)" />
                      <PolarGrid stroke="hsl(var(--border)/0.5)" />
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
          </motion.div>

          <motion.div variants={cardVariants} custom={commandModules.length + 2}>
            <Card className="shadow-xl border-border/50 bg-card/90 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>System Vitals</CardTitle>
                <CardDescription>Key performance metrics over the last 30 minutes.</CardDescription>
              </CardHeader>
              <CardContent className="h-[350px] p-4 bg-card-foreground/5 rounded-b-md">
                <ChartContainer config={vitalsChartConfig} className="w-full h-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={vitalsChartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border)/0.3)" />
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
          </motion.div>
        </div>
      </div>
    </AppLayout> 
  );
}
