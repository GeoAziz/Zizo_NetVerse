'use client';

import PageHeader from '@/components/shared/PageHeader';
import { GitFork } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import dynamic from 'next/dynamic';
import { Suspense } from 'react';

const LANViewContainer = dynamic(
  () => import('@/components/visualizations/LANViewContainer').then(mod => ({ default: mod.LANViewContainer })),
  { ssr: false, loading: () => <div className="w-full h-full bg-black/50 flex items-center justify-center"><p className="text-muted-foreground">Loading 3D LAN visualization...</p></div> }
);

export default function NetworkVisualizationPage() {
  return (
    <AppLayout>
      <div className="h-full flex flex-col">
        <PageHeader
          title="LAN View - Internal Network Topology"
          description="Immersive 3D visualization of local network devices, connections, and real-time status with export capabilities."
          icon={GitFork}
        />
        <div className="flex-1 overflow-hidden overflow-y-auto mt-4">
          <Suspense fallback={<div className="w-full h-full bg-black/50 flex items-center justify-center"><p className="text-muted-foreground">Loading...</p></div>}>
            <LANViewContainer enableExport={true} showStats={true} />
          </Suspense>
        </div>
      </div>
    </AppLayout>
  );
}
