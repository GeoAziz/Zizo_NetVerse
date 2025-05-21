import PageHeader from '@/components/shared/PageHeader';
import ThreatIntelligenceClient from '@/components/threat-intelligence/ThreatIntelligenceClient';
import { ShieldAlert } from 'lucide-react';

export default function ThreatIntelligencePage() {
  return (
    <div>
      <PageHeader 
        title="Threat Intelligence Feed" 
        description="Curated and AI-analyzed threat profiles and indicators."
        icon={ShieldAlert}
      />
      <ThreatIntelligenceClient />
    </div>
  );
}
