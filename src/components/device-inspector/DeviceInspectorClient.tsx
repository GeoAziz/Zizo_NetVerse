"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, ShieldAlert, Power, Ban, Globe, Cpu } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getDevice, controlDevice } from '@/lib/deviceApi';
import { enrichIp } from '@/lib/enrichmentApi';

interface DeviceDetails {
  id: string;
  ip: string;
  mac: string;
  os: string;
  hostname: string;
  enrichment?: any;
  alerts?: any[];
  status: 'online' | 'offline' | 'isolated';
}

export default function DeviceInspectorClient({ deviceId }: { deviceId: string }) {
  const { toast } = useToast();
  const [device, setDevice] = useState<DeviceDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const fetchDeviceData = async () => {
      setLoading(true);
      try {
        const dev = await getDevice(deviceId);
        if (dev && dev.ip) {
          try {
            const enrich = await enrichIp(dev.ip);
            dev.enrichment = enrich;
          } catch {
            dev.enrichment = { error: 'Failed to enrich IP' };
          }
        }
        setDevice(dev);
      } catch (err) {
        toast({ title: 'Error', description: 'Failed to load device details from backend.', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    };
    fetchDeviceData();
  }, [deviceId, toast]);

  const handleControl = async (action: 'shutdown' | 'isolate' | 'block') => {
    setActionLoading(true);
    try {
      const data = await controlDevice(action, deviceId);
      toast({ title: 'Success', description: data.message || `Action '${action}' sent.` });
      // Optimistically update status
      if (action === 'isolate') {
        setDevice((d) => (d ? { ...d, status: 'isolated' } : d));
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || `Failed to perform action: ${action}`;
      toast({ title: 'Error', description: errorMessage, variant: 'destructive' });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <div className="flex justify-center items-center h-40"><Loader2 className="animate-spin h-8 w-8 text-accent" /></div>;
  if (!device) return <div className="text-center text-muted-foreground p-8">Could not load device data.</div>;

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Cpu className="h-5 w-5 text-accent" />{device.hostname} <Badge>{device.status}</Badge></CardTitle>
        <CardDescription>IP: {device.ip} | MAC: {device.mac} | OS: {device.os}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <h4 className="font-semibold mb-2 flex items-center gap-2"><Globe className="h-4 w-4 text-primary" />Enrichment</h4>
          <pre className="bg-muted/30 p-2 rounded text-xs overflow-x-auto">{JSON.stringify(device.enrichment, null, 2)}</pre>
        </div>
        <div className="mb-4">
          <h4 className="font-semibold mb-2 flex items-center gap-2"><ShieldAlert className="h-4 w-4 text-destructive" />Threat Alerts</h4>
          {device.alerts && device.alerts.length > 0 ? (
            <ul className="list-disc ml-6 text-sm">
              {device.alerts.map((alert, i) => <li key={i}>{alert}</li>)}
            </ul>
          ) : <span className="text-muted-foreground">No recent alerts.</span>}
        </div>
      </CardContent>
      <CardFooter className="flex gap-2">
        <Button variant="destructive" onClick={() => handleControl('shutdown')} disabled={actionLoading}>
          {actionLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Power className="mr-2 h-4 w-4"/>}
          Shutdown
        </Button>
        <Button variant="outline" onClick={() => handleControl('isolate')} disabled={actionLoading || device.status === 'isolated'}>
           {actionLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Ban className="mr-2 h-4 w-4"/>}
          Isolate
        </Button>
        <Button variant="secondary" onClick={() => handleControl('block')} disabled={actionLoading}>
          {actionLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <ShieldAlert className="mr-2 h-4 w-4"/>}
          Block
        </Button>
      </CardFooter>
    </Card>
  );
}
