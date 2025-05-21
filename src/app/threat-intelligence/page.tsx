import PageHeader from '@/components/shared/PageHeader';
import ThreatIntelligenceClient from '@/components/threat-intelligence/ThreatIntelligenceClient';
import { ShieldAlert } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout'; // Import AppLayout

export default function ThreatIntelligencePage() {
  return (
    <AppLayout> {/* Wrap content with AppLayout */}
      <div>
        <PageHeader 
          title="Threat Intelligence Feed" 
          description="Curated and AI-analyzed threat profiles and indicators."
          icon={ShieldAlert}
        />
        <ThreatIntelligenceClient />
      </div>
    </AppLayout>
  );
}
