
import PageHeader from '@/components/shared/PageHeader';
import ThreatEmulationClient from '@/components/ai-lab/ThreatEmulationClient';
import { BotMessageSquare } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';

export default function AiLabPage() {
  return (
    <AppLayout>
      <div>
        <PageHeader 
          title="AI Lab: Threat Emulation & Reporting" 
          description="Simulate cyber attacks, generate incident reports, and test your network defenses using AI."
          icon={BotMessageSquare}
        />
        {/* IncidentReportForm can be moved here or to a sub-component/tab later */}
        {/* For now, we focus on the new ThreatEmulationClient */}
        <ThreatEmulationClient />
      </div>
    </AppLayout>
  );
}
