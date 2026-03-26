'use client';

import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { VisualizationFilterPanel, FilterCriteria, applyFilters } from './VisualizationFilterPanel';
import { TimelinePlayback, TimelineEvent } from './TimelinePlayback';
import { DashboardConfigurator, useDashboardLayouts } from './DashboardConfigurator';
import { Filter, Clock, Layout } from 'lucide-react';

interface EnhancedVisualizationPageProps {
  title: string;
  children: React.ReactNode;
  events?: TimelineEvent[];
  data?: any;
  onFilterChange?: (criteria: FilterCriteria) => void;
  onTimelineEvent?: (event: TimelineEvent) => void;
  canvasRef?: HTMLCanvasElement | null;
}

/**
 * Enhanced visualization page with all Phase 3 features
 */
export function EnhancedVisualizationPage({
  title,
  children,
  events = [],
  data,
  onFilterChange,
  onTimelineEvent,
  canvasRef,
}: EnhancedVisualizationPageProps) {
  const [activeFilter, setActiveFilter] = useState<FilterCriteria | null>(null);
  const [showTimeline, setShowTimeline] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const { saveLayout, loadAllLayouts } = useDashboardLayouts();
  const [layouts, setLayouts] = useState(loadAllLayouts());

  const handleFilterChange = useCallback(
    (criteria: FilterCriteria) => {
      setActiveFilter(criteria);
      onFilterChange?.(criteria);
    },
    [onFilterChange]
  );

  const handleSaveDashboard = useCallback(
    (layout: any) => {
      saveLayout(layout);
      setLayouts(loadAllLayouts());
    },
    [saveLayout, loadAllLayouts]
  );

  // Process events through filters
  const filteredEvents = activeFilter
    ? applyFilters(events, activeFilter, {
        threatLevel: (e) => e.severity || 'low',
        timestamp: (e) => e.timestamp,
      })
    : events;

  return (
    <div className="space-y-4">
      {/* Top Controls Bar */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle>{title}</CardTitle>

            <div className="flex items-center gap-2">
              {/* Filter Button */}
              <Sheet open={showFilters} onOpenChange={setShowFilters}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Filter className="h-4 w-4" />
                    Filters
                    {activeFilter && Object.values(activeFilter).some((v) => v && v !== 'all') && (
                      <span className="ml-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                        !
                      </span>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-80 overflow-y-auto">
                  <VisualizationFilterPanel
                    onFilterChange={handleFilterChange}
                    onClose={() => setShowFilters(false)}
                  />
                </SheetContent>
              </Sheet>

              {/* Timeline Button */}
              <Button
                variant={showTimeline ? 'default' : 'outline'}
                size="sm"
                onClick={() => setShowTimeline(!showTimeline)}
                className="gap-2"
              >
                <Clock className="h-4 w-4" />
                Timeline
              </Button>

              {/* Dashboard Config */}
              <DashboardConfigurator onSave={handleSaveDashboard} />
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Timeline Playback (if visible) */}
      {showTimeline && filteredEvents.length > 0 && (
        <TimelinePlayback
          events={filteredEvents}
          onEventPlay={onTimelineEvent}
          duration={300}
        />
      )}

      {/* Main Visualization Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Main Content (3 cols) */}
        <div className="lg:col-span-3">
          {children}
        </div>

        {/* Sidebar (1 col) */}
        <div className="space-y-4">
          {/* Quick Stats */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Events:</span>
                <span className="font-semibold">{events.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Filtered:</span>
                <span className="font-semibold">{filteredEvents.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Threats:</span>
                <span className="font-semibold text-red-600">
                  {events.filter((e) => e.type === 'threat_event').length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Updates:</span>
                <span className="font-semibold text-blue-600">
                  {events.filter((e) => e.type === 'device_update').length}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Saved Layouts */}
          {layouts.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Layout className="h-4 w-4" />
                  Layouts
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                {layouts.map((layout) => (
                  <Button
                    key={layout.id}
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-xs"
                    onClick={() => {
                      // Load layout
                      console.log('Loading layout:', layout.name);
                    }}
                  >
                    {layout.name}
                  </Button>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Help / Instructions */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Controls</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs text-muted-foreground">
              <div>
                <strong>Desktop:</strong>
                <ul className="list-disc list-inside">
                  <li>Scroll: Zoom in/out</li>
                  <li>Drag: Rotate view</li>
                </ul>
              </div>
              <div>
                <strong>Mobile:</strong>
                <ul className="list-disc list-inside">
                  <li>Pinch: Zoom</li>
                  <li>Drag: Rotate</li>
                  <li>2-finger: Pan</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
