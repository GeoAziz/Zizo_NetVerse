import PageHeader from '@/components/shared/PageHeader';
import IncidentReportForm from '@/components/incident-reporting/IncidentReportForm';
import { BotMessageSquare } from 'lucide-react';

export default function IncidentReportingPage() {
  return (
    <div>
      <PageHeader 
        title="AI-Powered Incident Reporting" 
        description="Generate comprehensive cybersecurity incident reports using AI."
        icon={BotMessageSquare}
      />
      <IncidentReportForm />
    </div>
  );
}
