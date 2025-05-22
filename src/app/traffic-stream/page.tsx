
import PageHeader from '@/components/shared/PageHeader';
import TrafficStreamClient from '@/components/traffic-stream/TrafficStreamClient';
import { Terminal } from 'lucide-react'; // Changed icon to Terminal
import AppLayout from '@/components/layout/AppLayout';

export default function TrafficStreamPage() {
  return (
    <AppLayout>
      <div>
        <PageHeader 
          title="System Logs & Live Terminal" // Updated title
          description="Real-time system activity, network logs, and AI analysis." // Updated description
          icon={Terminal} // Updated icon
        />
        <TrafficStreamClient />
      </div>
    </AppLayout>
  );
}
