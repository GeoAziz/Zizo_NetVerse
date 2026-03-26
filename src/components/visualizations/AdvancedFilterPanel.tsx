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
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { X } from 'lucide-react';

export interface VisualizationFilters {
  threatLevel: string[];
  deviceType: string[];
  status: string[];
  timeRange: 'all' | '1h' | '24h' | '7d' | '30d';
  minTraffic?: number;
  maxTraffic?: number;
  searchTerm?: string;
}

interface FilterPanelProps {
  filters: VisualizationFilters;
  onFiltersChange: (filters: VisualizationFilters) => void;
}

const threatLevels = ['low', 'medium', 'high', 'critical'];
const deviceTypes = ['router', 'pc', 'server', 'mobile', 'iot'];
const deviceStatuses = ['online', 'offline', 'suspicious'];
const timeRanges: Array<'all' | '1h' | '24h' | '7d' | '30d'> = [
  'all',
  '1h',
  '24h',
  '7d',
  '30d',
];

export function AdvancedFilterPanel({
  filters,
  onFiltersChange,
}: FilterPanelProps) {
  const handleThreatLevelToggle = (level: string) => {
    const newLevels = filters.threatLevel.includes(level)
      ? filters.threatLevel.filter((l) => l !== level)
      : [...filters.threatLevel, level];
    onFiltersChange({ ...filters, threatLevel: newLevels });
  };

  const handleDeviceTypeToggle = (type: string) => {
    const newTypes = filters.deviceType.includes(type)
      ? filters.deviceType.filter((t) => t !== type)
      : [...filters.deviceType, type];
    onFiltersChange({ ...filters, deviceType: newTypes });
  };

  const handleStatusToggle = (status: string) => {
    const newStatuses = filters.status.includes(status)
      ? filters.status.filter((s) => s !== status)
      : [...filters.status, status];
    onFiltersChange({ ...filters, status: newStatuses });
  };

  const handleReset = () => {
    onFiltersChange({
      threatLevel: [],
      deviceType: [],
      status: [],
      timeRange: 'all',
      minTraffic: undefined,
      maxTraffic: undefined,
      searchTerm: undefined,
    });
  };

  const activeFilters =
    filters.threatLevel.length +
    filters.deviceType.length +
    filters.status.length +
    (filters.searchTerm ? 1 : 0) +
    (filters.minTraffic ? 1 : 0) +
    (filters.maxTraffic ? 1 : 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Filters</CardTitle>
            <CardDescription>
              {activeFilters > 0 ? (
                <span className="text-primary font-semibold">{activeFilters} active</span>
              ) : (
                'No filters applied'
              )}
            </CardDescription>
          </div>
          {activeFilters > 0 && (
            <Button variant="ghost" size="sm" onClick={handleReset} className="gap-2">
              <X className="h-4 w-4" />
              Clear All
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Search */}
        <div className="space-y-2">
          <Label>Search</Label>
          <Input
            placeholder="Device name, IP, or ID..."
            value={filters.searchTerm || ''}
            onChange={(e) =>
              onFiltersChange({ ...filters, searchTerm: e.target.value })
            }
          />
        </div>

        {/* Time Range */}
        <div className="space-y-2">
          <Label>Time Range</Label>
          <Select
            value={filters.timeRange}
            onValueChange={(value) =>
              onFiltersChange({
                ...filters,
                timeRange: value as typeof filters.timeRange,
              })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="1h">Last 1 Hour</SelectItem>
              <SelectItem value="24h">Last 24 Hours</SelectItem>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Threat Level */}
        <div className="space-y-3">
          <Label>Threat Level</Label>
          <div className="flex flex-wrap gap-2">
            {threatLevels.map((level) => (
              <Button
                key={level}
                variant={
                  filters.threatLevel.includes(level) ? 'default' : 'outline'
                }
                size="sm"
                onClick={() => handleThreatLevelToggle(level)}
                className={
                  filters.threatLevel.includes(level)
                    ? level === 'critical'
                      ? 'bg-red-600 hover:bg-red-700'
                      : level === 'high'
                        ? 'bg-orange-600 hover:bg-orange-700'
                        : level === 'medium'
                          ? 'bg-yellow-600 hover:bg-yellow-700'
                          : 'bg-green-600 hover:bg-green-700'
                    : ''
                }
              >
                {level.charAt(0).toUpperCase() + level.slice(1)}
              </Button>
            ))}
          </div>
        </div>

        {/* Device Type */}
        <div className="space-y-3">
          <Label>Device Type</Label>
          <div className="space-y-2">
            {deviceTypes.map((type) => (
              <div key={type} className="flex items-center space-x-2">
                <Checkbox
                  id={`type-${type}`}
                  checked={filters.deviceType.includes(type)}
                  onCheckedChange={() => handleDeviceTypeToggle(type)}
                />
                <Label htmlFor={`type-${type}`} className="font-normal cursor-pointer">
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Device Status */}
        <div className="space-y-3">
          <Label>Device Status</Label>
          <div className="space-y-2">
            {deviceStatuses.map((status) => (
              <div key={status} className="flex items-center space-x-2">
                <Checkbox
                  id={`status-${status}`}
                  checked={filters.status.includes(status)}
                  onCheckedChange={() => handleStatusToggle(status)}
                />
                <Label htmlFor={`status-${status}`} className="font-normal cursor-pointer">
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Traffic Range */}
        <div className="space-y-3">
          <Label>Traffic (Mbps)</Label>
          <div className="space-y-2">
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="Min"
                value={filters.minTraffic || ''}
                onChange={(e) =>
                  onFiltersChange({
                    ...filters,
                    minTraffic: e.target.value ? parseInt(e.target.value) : undefined,
                  })
                }
              />
              <Input
                type="number"
                placeholder="Max"
                value={filters.maxTraffic || ''}
                onChange={(e) =>
                  onFiltersChange({
                    ...filters,
                    maxTraffic: e.target.value ? parseInt(e.target.value) : undefined,
                  })
                }
              />
            </div>
          </div>
        </div>

        {/* Active Filters Display */}
        {activeFilters > 0 && (
          <div className="pt-4 border-t">
            <p className="text-xs text-muted-foreground mb-2">Active Filters:</p>
            <div className="flex flex-wrap gap-1">
              {filters.threatLevel.map((level) => (
                <Badge
                  key={`threat-${level}`}
                  variant="secondary"
                  className="gap-1 cursor-pointer hover:opacity-80"
                  onClick={() => handleThreatLevelToggle(level)}
                >
                  {level}
                  <X className="h-3 w-3" />
                </Badge>
              ))}
              {filters.deviceType.map((type) => (
                <Badge
                  key={`type-${type}`}
                  variant="secondary"
                  className="gap-1 cursor-pointer hover:opacity-80"
                  onClick={() => handleDeviceTypeToggle(type)}
                >
                  {type}
                  <X className="h-3 w-3" />
                </Badge>
              ))}
              {filters.status.map((status) => (
                <Badge
                  key={`status-${status}`}
                  variant="secondary"
                  className="gap-1 cursor-pointer hover:opacity-80"
                  onClick={() => handleStatusToggle(status)}
                >
                  {status}
                  <X className="h-3 w-3" />
                </Badge>
              ))}
              {filters.searchTerm && (
                <Badge
                  variant="secondary"
                  className="gap-1 cursor-pointer hover:opacity-80"
                  onClick={() => onFiltersChange({ ...filters, searchTerm: undefined })}
                >
                  Search: {filters.searchTerm}
                  <X className="h-3 w-3" />
                </Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
