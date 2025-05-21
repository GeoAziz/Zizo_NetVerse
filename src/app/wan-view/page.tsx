
import PageHeader from '@/components/shared/PageHeader';
import AppLayout from '@/components/layout/AppLayout';
import { Globe } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';

export default function WanViewPage() {
  return (
    <AppLayout>
      <div>
        <PageHeader 
          title="WAN View - Global Traffic Monitor" 
          description="Real-time 3D globe visualizing global packet travel and active connections."
          icon={Globe}
        />
        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle>Global Network Activity</CardTitle>
            <CardDescription>This area will feature an interactive 3D globe displaying live WAN traffic, device locations, and threat origins.</CardDescription>
          </CardHeader>
          <CardContent className="h-[60vh] flex items-center justify-center bg-black/30 relative border border-border/30 rounded-md">
            {/* Placeholder for Three.js canvas */}
            <Image
              src="https://placehold.co/1200x800.png"
              alt="3D WAN Globe Placeholder"
              layout="fill"
              objectFit="cover"
              className="opacity-40"
              data-ai-hint="earth connections"
            />
            <div className="z-10 text-center p-8 bg-background/80 rounded-lg shadow-2xl">
              <Globe className="h-20 w-20 text-primary mx-auto mb-4" />
              <p className="text-2xl font-semibold text-foreground/90">
                Interactive 3D WAN Globe Coming Soon
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                (Three.js integration planned for dynamic visualization)
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
