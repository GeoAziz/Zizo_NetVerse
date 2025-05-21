import PageHeader from '@/components/shared/PageHeader';
import NetworkVisualizationClient from '@/components/network-visualization/NetworkVisualizationClient';
import { Globe } from 'lucide-react';

export default function NetworkVisualizationPage() {
  return (
    <div className="h-full flex flex-col">
      <PageHeader 
        title="3D Network Map" 
        description="Interactive real-time visualization of network assets and traffic flows."
        icon={Globe}
      />
      <NetworkVisualizationClient />
    </div>
  );
}
