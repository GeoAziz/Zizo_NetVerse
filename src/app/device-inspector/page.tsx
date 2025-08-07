
import PageHeader from '@/components/shared/PageHeader';
import AppLayout from '@/components/layout/AppLayout';
import { Cpu } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import DeviceInspectorClient from '@/components/device-inspector/DeviceInspectorClient';

export default function DeviceInspectorPage() {
  return (
    <AppLayout>
      <div>
        <PageHeader
          title="Device Inspector"
          description="Detailed dossier and management controls for network devices."
          icon={Cpu}
        />
        {/* Example: deviceId could come from router or selection context */}
        <DeviceInspectorClient deviceId="example-device-id" />
      </div>
    </AppLayout>
  );
}
