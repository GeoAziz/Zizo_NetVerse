
import PageHeader from '@/components/shared/PageHeader';
import TrafficStreamClient from '@/components/traffic-stream/TrafficStreamClient';
import { Terminal } from 'lucide-react'; 
import AppLayout from '@/components/layout/AppLayout';

export default function TrafficStreamPage() {
  return (
    <AppLayout>
      <div>
        <PageHeader 
          title="System Logs & Live Terminal" 
          description="Real-time system activity, network logs, and AI analysis with tabbed views." 
          icon={Terminal} 
        />
        <TrafficStreamClient />
      </div>
    </AppLayout>
  );
}
