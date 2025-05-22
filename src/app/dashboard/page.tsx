
"use client";

import { useState, useEffect, type FC } from 'react';
import Link from 'next/link';
import PageHeader from '@/components/shared/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardFooter, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Activity, AlertTriangle, BarChartHorizontalBig, Zap, Maximize, ChevronRight, Bell, Server } from 'lucide-react';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import type { ChartConfig } from "@/components/ui/chart";
import { PolarAngleAxis, PolarGrid, Radar, RadarChart, Line, LineChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PolarRadiusAxis } from 'recharts';
import AppLayout from '@/components/layout/AppLayout';
import { NAV_LINKS, APP_NAME } from '@/lib/constants';
import { motion } from 'framer-motion';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

// Helper component for client-side time formatting
const ClientSideFormattedTime: FC<{ isoTimestamp: string }> = ({ isoTimestamp }) => {
  const [formattedTime, setFormattedTime] = useState<string | null>(null);

  useEffect(() => {
    // Ensure this runs only on the client
    setFormattedTime(new Date(isoTimestamp).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', second: '2-digit' }));
  }, [isoTimestamp]);

  return <>{formattedTime || '...'}</>;
};


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

const commandModules = NAV_LINKS.filter(link => link.href !== '/dashboard');

type MockNotification = {
  id: string;
  title: string;
  description: string;
  timestamp: string; // Store as ISO string
  severity: 'Critical' | 'High' | 'Medium' | 'Low' | 'Info';
  read: boolean;
};

// Initialize with ISO strings for timestamps
const initialNotifications: MockNotification[] = [
  { id: 'n1', title: 'Critical Alert: Data Breach Attempt', description: 'Suspicious outbound connection from SRV-03 to known C2 server blocked.', timestamp: new Date(Date.now() - 5 * 60000).toISOString(), severity: 'Critical', read: false },
  { id: 'n2', title: 'High: Malware Detected', description: 'Malware signature "KryllWorm.X" detected on WKSTN-112. Quarantine pending.', timestamp: new Date(Date.now() - 15 * 60000).toISOString(), severity: 'High', read: false },
  { id: 'n3', title: 'Medium: Port Scan Detected', description: 'IP 103.45.12.98 scanned multiple ports on FW-MAIN.', timestamp: new Date(Date.now() - 45 * 60000).toISOString(), severity: 'Medium', read: true },
  { id: 'n4', title: 'Info: System Update Applied', description: 'Security patch ZN-2025-003 applied to all core servers.', timestamp: new Date(Date.now() - 2 * 3600000).toISOString(), severity: 'Info', read: true },
];


export default function DashboardPage() {
  const [activeThreats, setActiveThreats] = useState<number | null>(null);
  const [packetsIntercepted, setPacketsIntercepted] = useState<number | null>(null);
  const [connectedDevices, setConnectedDevices] = useState<number | null>(null);
  const [radarChartData, setRadarChartData] = useState(initialRadarChartData);
  const [vitalsChartData, setVitalsChartData] = useState(initialVitalsChartData);
  const [notifications, setNotifications] = useState<MockNotification[]>([]); 

  useEffect(() => {
    // Initialize stats only on client
    setActiveThreats(Math.floor(Math.random() * 20) + 5);
    setPacketsIntercepted(Math.floor(Math.random() * 500000) + 1000000);
    setConnectedDevices(Math.floor(Math.random() * 100) + 50);

    // Client-side initialization of notifications
    const now = Date.now();
    setNotifications([
      { id: 'n1', title: 'Critical Alert: Data Breach Attempt', description: 'Suspicious outbound connection from SRV-03 to known C2 server blocked.', timestamp: new Date(now - 5 * 60000).toISOString(), severity: 'Critical', read: false },
      { id: 'n2', title: 'High: Malware Detected', description: 'Malware signature "KryllWorm.X" detected on WKSTN-112. Quarantine pending.', timestamp: new Date(now - 15 * 60000).toISOString(), severity: 'High', read: false },
      { id: 'n3', title: 'Medium: Port Scan Detected', description: 'IP 103.45.12.98 scanned multiple ports on FW-MAIN.', timestamp: new Date(now - 45 * 60000).toISOString(), severity: 'Medium', read: true },
      { id: 'n4', title: 'Info: System Update Applied', description: 'Security patch ZN-2025-003 applied to all core servers.', timestamp: new Date(now - 2 * 3600000).toISOString(), severity: 'Info', read: true },
      { id: 'n5', title: 'Low: Unusual Login Pattern', description: 'User "j.doe" logged in from a new geographic location.', timestamp: new Date(now - 6 * 3600000).toISOString(), severity: 'Low', read: true },
    ]);


    const threatInterval = setInterval(() => {
      setActiveThreats(prev => prev !== null ? Math.max(0, prev + Math.floor(Math.random() * 6) - 3) : Math.floor(Math.random() * 20) + 5);
    }, 3000);

    const packetInterval = setInterval(() => {
      setPacketsIntercepted(prev => prev !== null ? prev + Math.floor(Math.random() * 15000) + 5000 : Math.floor(Math.random() * 500000) + 1000000);
    }, 2000);
    
    const deviceInterval = setInterval(() => {
      setConnectedDevices(prev => prev !== null ? Math.max(10, prev + Math.floor(Math.random() * 10) - 5) : Math.floor(Math.random() * 100) + 50);
    }, 7000);

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
        const timeParts = typeof lastDataPoint.name === 'string' ? lastDataPoint.name.split(':') : ['0', '0'];
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
      clearInterval(deviceInterval);
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

  const getSeverityBadgeVariant = (severity: MockNotification['severity']) => {
    switch (severity) {
      case 'Critical': return 'destructive';
      case 'High': return 'destructive'; 
      case 'Medium': return 'secondary'; 
      case 'Low': return 'outline';
      default: return 'default';
    }
  };


  return (
    <AppLayout>
      <div className="space-y-8">
        <PageHeader
          title={`${APP_NAME} Mission Control`}
          description="Centralized real-time overview of network operations and cybersecurity posture."
          icon={Maximize}
        />

        <motion.div
          className="grid gap-6 md:grid-cols-2 lg:grid-cols-4"
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
            <Card className="shadow-lg hover:shadow-primary/50 transition-shadow duration-300 border-border/30 bg-card/80 backdrop-blur-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-foreground/80">Connected Devices</CardTitle>
                <Server className="h-5 w-5 text-foreground/70" />
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold">{connectedDevices !== null ? connectedDevices : '...'}</div>
                <p className="text-xs text-muted-foreground">Total devices on network</p>
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
                <div className="text-2xl font-bold text-green-400">Nominal</div>
                <p className="text-xs text-muted-foreground">All AI simulations stable</p>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>

        <div className="grid gap-6 lg:grid-cols-3">
          <motion.div 
            className="lg:col-span-2"
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <Card className="shadow-xl border-border/50 bg-card/90 backdrop-blur-sm h-full">
              <CardHeader>
                <CardTitle className="text-xl text-accent">Command Modules</CardTitle>
                <CardDescription>Access specialized system consoles and tools.</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {commandModules.map((item, idx) => (
                  <motion.div
                    key={item.href}
                    variants={cardVariants}
                    custom={idx} // For staggered animation if visible variant takes an index
                    whileHover={{ scale: 1.03, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Link href={item.href} passHref>
                      <Card className="h-full flex flex-col justify-between bg-card-foreground/5 hover:bg-primary/10 hover:border-primary/70 border-border/30 transition-all duration-300 shadow-md hover:shadow-lg cursor-pointer group">
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <item.icon className="h-7 w-7 text-primary mb-2 transition-colors group-hover:text-accent" />
                            <ChevronRight className="h-5 w-5 text-muted-foreground transition-colors group-hover:text-accent" />
                          </div>
                          <CardTitle className="text-lg text-foreground group-hover:text-primary transition-colors">{item.label}</CardTitle>
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

          <motion.div variants={cardVariants} custom={commandModules.length}>
            <Card className="shadow-xl border-border/50 bg-card/90 backdrop-blur-sm h-full flex flex-col">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center"><Bell className="mr-2 h-5 w-5 text-primary"/>Notifications</CardTitle>
                  <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-accent">View All</Button>
                </div>
                <CardDescription>Recent system alerts and updates.</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow p-0">
                <ScrollArea className="h-[300px] lg:h-full max-h-[calc(100%-4rem)] px-4 pb-4">
                  {notifications.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No new notifications.</p>
                  ) : (
                    <div className="space-y-3">
                      {notifications.map(notif => (
                        <motion.div 
                          key={notif.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3 }}
                          className={`p-3 rounded-md border ${notif.read ? 'border-border/30 bg-black/20' : 'border-primary/50 bg-primary/10'}`}
                        >
                          <div className="flex justify-between items-start">
                            <h4 className={`font-semibold text-sm ${notif.read ? 'text-foreground/80' : 'text-primary'}`}>{notif.title}</h4>
                            <Badge variant={getSeverityBadgeVariant(notif.severity)} className="text-xs">{notif.severity}</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{notif.description}</p>
                          <p className="text-xs text-muted-foreground/70 mt-1.5">
                            <ClientSideFormattedTime isoTimestamp={notif.timestamp} />
                          </p>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </motion.div>
        </div>
        

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
                      <Radar name="Detected Threats" dataKey="A" stroke="hsl(var(--primary))" fill="hsl(var(--primary)/0.4)" fillOpacity={0.6} />
                      <Radar name="Historical Avg" dataKey="B" stroke="hsl(var(--accent))" fill="hsl(var(--accent)/0.3)" fillOpacity={0.5} />
                      <Tooltip
                        content={<ChartTooltipContent indicator="line" />}
                        cursor={{ fill: "hsl(var(--popover)/0.3)" }}
                      />
                      <ChartLegend content={<ChartLegendContent />} />
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
                      <ChartLegend content={<ChartLegendContent />} />
                      <Line type="monotone" dataKey="cpu" name="CPU Usage (%)" strokeWidth={2} stroke="hsl(var(--primary))" activeDot={{ r: 6, fill: "hsl(var(--primary))" }} dot={false} />
                      <Line type="monotone" dataKey="memory" name="Memory Usage (%)" strokeWidth={2} stroke="hsl(var(--secondary))" activeDot={{ r: 6, fill: "hsl(var(--secondary))" }} dot={false}/>
                      <Line type="monotone" dataKey="network" name="Network (Mbps)" strokeWidth={2} stroke="hsl(var(--accent))" activeDot={{ r: 6, fill: "hsl(var(--accent))" }} dot={false}/>
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

    

    