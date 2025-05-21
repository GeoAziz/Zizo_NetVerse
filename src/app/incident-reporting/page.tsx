import PageHeader from '@/components/shared/PageHeader';
import IncidentReportForm from '@/components/incident-reporting/IncidentReportForm';
import { BotMessageSquare } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout'; // Import AppLayout

export default function IncidentReportingPage() {
  return (
    <AppLayout> {/* Wrap content with AppLayout */}
      <div>
        <PageHeader 
          title="AI-Powered Incident Reporting" 
          description="Generate comprehensive cybersecurity incident reports using AI."
          icon={BotMessageSquare}
        />
        <IncidentReportForm />
      </div>
    </AppLayout>
  );
}
