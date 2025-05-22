
import PageHeader from '@/components/shared/PageHeader';
import AppLayout from '@/components/layout/AppLayout';
import { Map } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';

export default function ThreatMapPage() {
  return (
    <AppLayout>
      <div>
        <PageHeader
          title="Global Threat Activity Map"
          description="Visualize active and historical cyber threats, their origins, and targets."
          icon={Map}
        />
        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle>Interactive Threat Geo-Visualizer</CardTitle>
            <CardDescription>This map will display real-time and historical threat data, allowing for filtering by attack type, country, and event replay via a timeline slider.</CardDescription>
          </CardHeader>
          <CardContent className="h-[60vh] flex items-center justify-center bg-black/30 relative border border-border/30 rounded-md">
             <Image
              src="https://placehold.co/1200x800.png"
              alt="Threat Map Placeholder"
              layout="fill"
              objectFit="cover"
              className="opacity-40"
              data-ai-hint="world map data"
            />
            <div className="z-10 text-center p-8 bg-background/80 rounded-lg shadow-2xl">
              <Map className="h-20 w-20 text-primary mx-auto mb-4" />
              <p className="text-2xl font-semibold text-foreground/90">
                Live Threat Map Coming Soon
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                (Integration of geo-mapping and threat data visualization planned, featuring attack replays and filtering capabilities)
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
