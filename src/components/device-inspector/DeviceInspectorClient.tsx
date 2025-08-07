"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, ShieldAlert, Power, Ban, Globe, Cpu } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
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
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/v1/devices/${deviceId}`)
      .then(res => res.json())
      .then(async (dev) => {
        // Fetch enrichment for device IP
        if (dev && dev.ip) {
          try {
            const enrich = await enrichIp(dev.ip);
            dev.enrichment = enrich;
          } catch {
            dev.enrichment = { error: 'Failed to enrich IP' };
          }
        }
        setDevice(dev);
      })
      .catch(() => toast({ title: 'Error', description: 'Failed to load device details', variant: 'destructive' }))
      .finally(() => setLoading(false));
  }, [deviceId]);

  const handleControl = async (action: 'shutdown' | 'isolate' | 'block') => {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/control/${action}-device`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ device_id: deviceId })
      });
      const data = await res.json();
      if (res.ok) {
        toast({ title: 'Success', description: data.message });
        setDevice((d) => d ? { ...d, status: action === 'isolate' ? 'isolated' : d.status } : d);
      } else {
        toast({ title: 'Error', description: data.detail || 'Failed to perform action', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to perform action', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  if (loading || !device) return <div className="flex justify-center items-center h-40"><Loader2 className="animate-spin h-8 w-8 text-accent" /></div>;

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
        <Button variant="destructive" onClick={() => handleControl('shutdown')} disabled={loading}>Shutdown</Button>
        <Button variant="outline" onClick={() => handleControl('isolate')} disabled={loading || device.status === 'isolated'}>Isolate</Button>
        <Button variant="secondary" onClick={() => handleControl('block')} disabled={loading}>Block</Button>
      </CardFooter>
    </Card>
  );
}
