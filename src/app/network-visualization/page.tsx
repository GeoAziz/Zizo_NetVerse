
import PageHeader from '@/components/shared/PageHeader';
import NetworkVisualizationClient from '@/components/network-visualization/NetworkVisualizationClient';
import { GitFork } from 'lucide-react'; // Changed icon
import AppLayout from '@/components/layout/AppLayout';

export default function NetworkVisualizationPage() {
  return (
    <AppLayout>
      <div className="h-full flex flex-col">
        <PageHeader
          title="LAN View - Internal Network Topology"
          description="Immersive 3D visualization of local network devices, connections, and real-time status."
          icon={GitFork} // Using GitFork as per NAV_LINKS
        />
        <NetworkVisualizationClient />
      </div>
    </AppLayout>
  );
}
