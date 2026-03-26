'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GripHorizontal, X, Plus } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Widget {
  id: string;
  type:
    | 'stats'
    | 'devices'
    | 'threats'
    | 'traffic'
    | 'performance'
    | 'timeline'
    | 'alerts';
  title: string;
  position: number;
}

interface DashboardConfigProps {
  onSave?: (widgets: Widget[]) => void;
}

const availableWidgets = [
  { type: 'stats', title: 'Live Statistics' },
  { type: 'devices', title: 'Devices Overview' },
  { type: 'threats', title: 'Threat Summary' },
  { type: 'traffic', title: 'Traffic Analysis' },
  { type: 'performance', title: 'System Performance' },
  { type: 'timeline', title: 'Event Timeline' },
  { type: 'alerts', title: 'Active Alerts' },
];

export function DashboardConfig({ onSave }: DashboardConfigProps) {
  const [widgets, setWidgets] = useState<Widget[]>([
    { id: '1', type: 'stats', title: 'Live Statistics', position: 0 },
    { id: '2', type: 'threats', title: 'Threat Summary', position: 1 },
    { id: '3', type: 'traffic', title: 'Traffic Analysis', position: 2 },
  ]);

  const [selectedWidget, setSelectedWidget] = useState<string | null>(null);

  const handleAddWidget = (widgetType: string) => {
    const template = availableWidgets.find((w) => w.type === widgetType);
    if (template) {
      const newWidget: Widget = {
        id: `widget-${Date.now()}`,
        type: widgetType as Widget['type'],
        title: template.title,
        position: widgets.length,
      };
      setWidgets([...widgets, newWidget]);
    }
  };

  const handleRemoveWidget = (id: string) => {
    setWidgets(
      widgets
        .filter((w) => w.id !== id)
        .map((w, index) => ({ ...w, position: index }))
    );
  };

  const handleMoveWidget = (id: string, direction: 'up' | 'down') => {
    const index = widgets.findIndex((w) => w.id === id);
    if (
      (direction === 'up' && index > 0) ||
      (direction === 'down' && index < widgets.length - 1)
    ) {
      const newWidgets = [...widgets];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      [newWidgets[index], newWidgets[targetIndex]] = [
        newWidgets[targetIndex],
        newWidgets[index],
      ];
      setWidgets(
        newWidgets.map((w, idx) => ({ ...w, position: idx }))
      );
    }
  };

  const addedWidgetTypes = widgets.map((w) => w.type);
  const availableToAdd = availableWidgets.filter((w) => !addedWidgetTypes.includes(w.type as Widget['type']));

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Dashboard Configuration</CardTitle>
            <CardDescription>
              Customize your visualization dashboard layout and widgets
            </CardDescription>
          </div>
          <Button
            onClick={() => onSave?.(widgets)}
            className="gap-2"
          >
            Save Configuration
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Current Widgets */}
        <div className="space-y-2">
          <p className="text-sm font-medium">Current Widgets ({widgets.length})</p>
          <div className="space-y-2 bg-muted p-3 rounded-lg">
            {widgets.length === 0 ? (
              <p className="text-xs text-muted-foreground">No widgets selected</p>
            ) : (
              widgets.map((widget, index) => (
                <div
                  key={widget.id}
                  className="flex items-center gap-2 p-2 bg-background rounded border"
                  onClick={() => setSelectedWidget(widget.id)}
                >
                  <GripHorizontal className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{widget.title}</p>
                    <p className="text-xs text-muted-foreground">{widget.type}</p>
                  </div>
                  <div className="flex gap-1">
                    {index > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMoveWidget(widget.id, 'up');
                        }}
                      >
                        ↑
                      </Button>
                    )}
                    {index < widgets.length - 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMoveWidget(widget.id, 'down');
                        }}
                      >
                        ↓
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveWidget(widget.id);
                      }}
                    >
                      <X className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Available Widgets to Add */}
        {availableToAdd.length > 0 && (
          <div className="space-y-2 pt-4 border-t">
            <p className="text-sm font-medium">Add Widget</p>
            <Select onValueChange={handleAddWidget}>
              <SelectTrigger>
                <SelectValue placeholder="Select a widget to add..." />
              </SelectTrigger>
              <SelectContent>
                {availableToAdd.map((w) => (
                  <SelectItem key={w.type} value={w.type}>
                    <div className="flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      {w.title}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Configuration Info */}
        <div className="pt-4 border-t">
          <p className="text-xs text-muted-foreground">
            ℹ️ Drag to reorder widgets or use arrow buttons. Remove widgets with the X button.
            Changes are saved when you click "Save Configuration".
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
