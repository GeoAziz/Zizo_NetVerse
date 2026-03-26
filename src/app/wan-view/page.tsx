'use client';

import PageHeader from '@/components/shared/PageHeader';
import AppLayout from '@/components/layout/AppLayout';
import { Globe } from 'lucide-react';
import dynamic from 'next/dynamic';
import { Suspense } from 'react';

const WANViewContainer = dynamic(
  () => import('@/components/visualizations/WANViewContainer').then(mod => ({ default: mod.WANViewContainer })),
  { ssr: false, loading: () => <div className="w-full h-full bg-black/50 flex items-center justify-center"><p className="text-muted-foreground">Loading 3D WAN globe...</p></div> }
);

export default function WanViewPage() {
  return (
    <AppLayout>
      <div className="h-full flex flex-col">
        <PageHeader
          title="WAN View - Global Traffic Monitor"
          description="Real-time 3D globe visualizing global packet travel, active connections, and threat hotspots with export capabilities."
          icon={Globe}
        />
        <div className="flex-1 overflow-hidden overflow-y-auto mt-4">
          <Suspense fallback={<div className="w-full h-full bg-black/50 flex items-center justify-center"><p className="text-muted-foreground">Loading...</p></div>}>
            <WANViewContainer enableExport={true} showStats={true} />
          </Suspense>
        </div>
      </div>
    </AppLayout>
  );
}

