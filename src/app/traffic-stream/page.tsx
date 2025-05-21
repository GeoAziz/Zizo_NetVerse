import PageHeader from '@/components/shared/PageHeader';
import TrafficStreamClient from '@/components/traffic-stream/TrafficStreamClient';
import { ListFilter } from 'lucide-react';

export default function TrafficStreamPage() {
  return (
    <div>
      <PageHeader 
        title="Live Traffic Stream" 
        description="Intercept, view, filter, and analyze network packets in real-time."
        icon={ListFilter}
      />
      <TrafficStreamClient />
    </div>
  );
}
