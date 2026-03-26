'use client';

import PageHeader from '@/components/shared/PageHeader';
import AppLayout from '@/components/layout/AppLayout';
import { Map } from 'lucide-react';
import dynamic from 'next/dynamic';
import { Suspense } from 'react';

const ThreatMapContainer = dynamic(
  () => import('@/components/visualizations/ThreatMapContainer').then(mod => ({ default: mod.ThreatMapContainer })),
  { ssr: false, loading: () => <div className="w-full h-full bg-black/50 flex items-center justify-center"><p className="text-muted-foreground">Loading threat map...</p></div> }
);

export default function ThreatMapPage() {
  return (
    <AppLayout>
      <div className="h-full flex flex-col">
        <PageHeader
          title="Global Threat Activity Map"
          description="Visualize active and historical cyber threats, their origins, targets, and export data for incident response."
          icon={Map}
        />
        <div className="flex-1 overflow-hidden overflow-y-auto mt-4">
          <Suspense fallback={<div className="w-full h-full bg-black/50 flex items-center justify-center"><p className="text-muted-foreground">Loading...</p></div>}>
            <ThreatMapContainer enableExport={true} showStats={true} />
          </Suspense>
        </div>
      </div>
    </AppLayout>
  );
}
