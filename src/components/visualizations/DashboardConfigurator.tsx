'use client';

import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, Plus, X, Save } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export type WidgetType =
  | 'stats'
  | 'timeline'
  | 'filter'
  | 'legend'
  | 'alerts'
  | 'heatmap'
  | 'comparison'
  | 'export';

export interface DashboardWidget {
  id: string;
  type: WidgetType;
  title: string;
  position: { row: number; col: number };
  size: { width: number; height: number };
  config?: any;
  enabled: boolean;
}

export interface DashboardLayout {
  id: string;
  name: string;
  widgets: DashboardWidget[];
  createdAt: Date;
  updatedAt: Date;
}

const AVAILABLE_WIDGETS: Array<{ type: WidgetType; name: string; description: string }> = [
  { type: 'stats', name: 'Statistics', description: 'Live stats and metrics' },
  { type: 'timeline', name: 'Timeline', description: 'Event timeline and playback' },
  { type: 'filter', name: 'Filters', description: 'Advanced filtering controls' },
  { type: 'legend', name: 'Legend', description: 'Visualization legend' },
  { type: 'alerts', name: 'Alerts', description: 'Active alerts and notifications' },
  { type: 'heatmap', name: 'Heatmap', description: 'Threat density heatmap' },
  { type: 'comparison', name: 'Comparison', description: 'Side-by-side comparison' },
  { type: 'export', name: 'Export', description: 'Export and download tools' },
];

interface DashboardConfiguratorProps {
  onSave?: (layout: DashboardLayout) => void;
  initialLayout?: DashboardLayout;
}

export function DashboardConfigurator({
  onSave,
  initialLayout,
}: DashboardConfiguratorProps) {
  const [layout, setLayout] = useState<DashboardLayout>(
    initialLayout || {
      id: `layout-${Date.now()}`,
      name: 'Default Configuration',
      widgets: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  );

  const [isOpen, setIsOpen] = useState(false);

  const addWidget = useCallback((type: WidgetType) => {
    const newWidget: DashboardWidget = {
      id: `widget-${Date.now()}`,
      type,
      title: AVAILABLE_WIDGETS.find((w) => w.type === type)?.name || type,
      position: { row: 0, col: 0 },
      size: { width: 2, height: 2 },
      enabled: true,
    };

    setLayout((prev) => ({
      ...prev,
      widgets: [...prev.widgets, newWidget],
      updatedAt: new Date(),
    }));
  }, []);

  const removeWidget = useCallback((id: string) => {
    setLayout((prev) => ({
      ...prev,
      widgets: prev.widgets.filter((w) => w.id !== id),
      updatedAt: new Date(),
    }));
  }, []);

  const toggleWidget = useCallback((id: string) => {
    setLayout((prev) => ({
      ...prev,
      widgets: prev.widgets.map((w) =>
        w.id === id ? { ...w, enabled: !w.enabled } : w
      ),
      updatedAt: new Date(),
    }));
  }, []);

  const updateWidgetSize = useCallback(
    (id: string, width: number, height: number) => {
      setLayout((prev) => ({
        ...prev,
        widgets: prev.widgets.map((w) =>
          w.id === id
            ? { ...w, size: { width: Math.max(1, width), height: Math.max(1, height) } }
            : w
        ),
        updatedAt: new Date(),
      }));
    },
    []
  );

  const handleSave = useCallback(() => {
    onSave?.(layout);
    setIsOpen(false);
  }, [layout, onSave]);

  const enabledWidgets = layout.widgets.filter((w) => w.enabled);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <ChevronDown className="h-4 w-4" />
          Configure Layout
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-96 overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Customize Dashboard Layout</DialogTitle>
          <DialogDescription>
            Add, remove, and configure widgets to customize your visualization
            dashboard.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current Widgets */}
          <div className="space-y-2">
            <h3 className="font-semibold text-sm">Active Widgets ({enabledWidgets.length})</h3>
            {layout.widgets.length === 0 ? (
              <p className="text-sm text-muted-foreground">No widgets added yet</p>
            ) : (
              <div className="space-y-2">
                {layout.widgets.map((widget) => (
                  <Card key={widget.id} className="p-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={widget.enabled}
                            onChange={() => toggleWidget(widget.id)}
                            className="rounded"
                          />
                          <span className="font-medium text-sm">{widget.title}</span>
                          {widget.enabled ? (
                            <Badge>Active</Badge>
                          ) : (
                            <Badge variant="outline">Inactive</Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Size: {widget.size.width}x{widget.size.height}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <select
                          value={widget.size.width}
                          onChange={(e) =>
                            updateWidgetSize(
                              widget.id,
                              parseInt(e.target.value),
                              widget.size.height
                            )
                          }
                          className="h-8 text-xs border rounded px-2"
                          disabled={!widget.enabled}
                        >
                          {[1, 2, 3, 4].map((n) => (
                            <option key={n} value={n}>
                              W{n}
                            </option>
                          ))}
                        </select>
                        <select
                          value={widget.size.height}
                          onChange={(e) =>
                            updateWidgetSize(
                              widget.id,
                              widget.size.width,
                              parseInt(e.target.value)
                            )
                          }
                          className="h-8 text-xs border rounded px-2"
                          disabled={!widget.enabled}
                        >
                          {[1, 2, 3, 4].map((n) => (
                            <option key={n} value={n}>
                              H{n}
                            </option>
                          ))}
                        </select>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeWidget(widget.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Add Widget */}
          <div className="space-y-2">
            <h3 className="font-semibold text-sm">Available Widgets</h3>
            <div className="grid grid-cols-2 gap-2">
              {AVAILABLE_WIDGETS.map((widget) => {
                const isAdded = layout.widgets.some((w) => w.type === widget.type);
                return (
                  <Button
                    key={widget.type}
                    variant={isAdded ? 'outline' : 'secondary'}
                    size="sm"
                    onClick={() => !isAdded && addWidget(widget.type)}
                    disabled={isAdded}
                    className="justify-start h-16 flex-col items-start"
                  >
                    <span className="font-semibold text-xs">{widget.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {widget.description}
                    </span>
                    {isAdded && (
                      <Badge variant="secondary" className="mt-1">
                        Added
                      </Badge>
                    )}
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button onClick={handleSave} className="flex-1 gap-2">
              <Save className="h-4 w-4" />
              Save Configuration
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Local storage management for dashboard layouts
 */
export function useDashboardLayouts() {
  const STORAGE_KEY = 'visualization_dashboards';

  const saveLayout = useCallback((layout: DashboardLayout) => {
    try {
      const layouts = loadAllLayouts();
      const index = layouts.findIndex((l) => l.id === layout.id);
      if (index >= 0) {
        layouts[index] = layout;
      } else {
        layouts.push(layout);
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(layouts));
    } catch (error) {
      console.error('Error saving layout:', error);
    }
  }, []);

  const loadLayout = useCallback((id: string): DashboardLayout | null => {
    try {
      const layouts = loadAllLayouts();
      return layouts.find((l) => l.id === id) || null;
    } catch (error) {
      console.error('Error loading layout:', error);
      return null;
    }
  }, []);

  const loadAllLayouts = (): DashboardLayout[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error loading layouts:', error);
      return [];
    }
  };

  const deleteLayout = useCallback((id: string) => {
    try {
      const layouts = loadAllLayouts();
      const filtered = layouts.filter((l) => l.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.error('Error deleting layout:', error);
    }
  }, []);

  return { saveLayout, loadLayout, loadAllLayouts, deleteLayout };
}
