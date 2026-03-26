'use client';

import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { X, Filter } from 'lucide-react';

export interface FilterCriteria {
  threatLevel?: 'all' | 'low' | 'medium' | 'high' | 'critical';
  deviceType?: 'all' | 'server' | 'workstation' | 'iot' | 'network';
  deviceStatus?: 'all' | 'online' | 'offline' | 'suspicious';
  timeRange?: '1h' | '24h' | '7d' | '30d' | 'all';
  minThreatScore?: number;
  maxThreatScore?: number;
}

interface VisualizationFilterPanelProps {
  onFilterChange: (criteria: FilterCriteria) => void;
  onClose?: () => void;
}

export function VisualizationFilterPanel({
  onFilterChange,
  onClose,
}: VisualizationFilterPanelProps) {
  const [filters, setFilters] = useState<FilterCriteria>({
    threatLevel: 'all',
    deviceType: 'all',
    deviceStatus: 'all',
    timeRange: '24h',
    minThreatScore: 0,
    maxThreatScore: 100,
  });

  const handleFilterChange = useCallback(
    (newFilters: Partial<FilterCriteria>) => {
      const updated = { ...filters, ...newFilters };
      setFilters(updated);
      onFilterChange(updated);
    },
    [filters, onFilterChange]
  );

  const handleReset = useCallback(() => {
    const defaultFilters: FilterCriteria = {
      threatLevel: 'all',
      deviceType: 'all',
      deviceStatus: 'all',
      timeRange: '24h',
      minThreatScore: 0,
      maxThreatScore: 100,
    };
    setFilters(defaultFilters);
    onFilterChange(defaultFilters);
  }, [onFilterChange]);

  const activeFilters = Object.entries(filters).filter(([key, value]) => {
    if (key === 'minThreatScore') return value !== 0;
    if (key === 'maxThreatScore') return value !== 100;
    return value !== 'all' && value !== undefined;
  }).length;

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            <CardTitle className="text-base">Advanced Filters</CardTitle>
            {activeFilters > 0 && (
              <Badge variant="secondary" className="ml-2">
                {activeFilters} active
              </Badge>
            )}
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Threat Level */}
        <div className="space-y-2">
          <label className="text-sm font-semibold">Threat Level</label>
          <Select
            value={filters.threatLevel}
            onValueChange={(value) =>
              handleFilterChange({ threatLevel: value as FilterCriteria['threatLevel'] })
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Levels</SelectItem>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Device Type */}
        <div className="space-y-2">
          <label className="text-sm font-semibold">Device Type</label>
          <Select
            value={filters.deviceType}
            onValueChange={(value) =>
              handleFilterChange({ deviceType: value as FilterCriteria['deviceType'] })
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="server">Server</SelectItem>
              <SelectItem value="workstation">Workstation</SelectItem>
              <SelectItem value="iot">IoT Device</SelectItem>
              <SelectItem value="network">Network</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Device Status */}
        <div className="space-y-2">
          <label className="text-sm font-semibold">Device Status</label>
          <Select
            value={filters.deviceStatus}
            onValueChange={(value) =>
              handleFilterChange({ deviceStatus: value as FilterCriteria['deviceStatus'] })
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="online">Online</SelectItem>
              <SelectItem value="offline">Offline</SelectItem>
              <SelectItem value="suspicious">Suspicious</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Time Range */}
        <div className="space-y-2">
          <label className="text-sm font-semibold">Time Range</label>
          <Select
            value={filters.timeRange}
            onValueChange={(value) =>
              handleFilterChange({ timeRange: value as FilterCriteria['timeRange'] })
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1h">Last Hour</SelectItem>
              <SelectItem value="24h">Last 24 Hours</SelectItem>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Threat Score Range */}
        <div className="space-y-2">
          <label className="text-sm font-semibold">
            Threat Score: {filters.minThreatScore}% - {filters.maxThreatScore}%
          </label>
          <div className="space-y-2">
            <Slider
              min={0}
              max={100}
              step={5}
              value={[filters.minThreatScore || 0]}
              onValueChange={(value) =>
                handleFilterChange({ minThreatScore: value[0] })
              }
              className="w-full"
            />
            <Slider
              min={0}
              max={100}
              step={5}
              value={[filters.maxThreatScore || 100]}
              onValueChange={(value) =>
                handleFilterChange({ maxThreatScore: value[0] })
              }
              className="w-full"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            className="flex-1"
          >
            Reset Filters
          </Button>
          {onClose && (
            <Button size="sm" onClick={onClose} className="flex-1">
              Apply
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Filter data based on criteria
 */
export function applyFilters<T extends any>(
  data: T[],
  filters: FilterCriteria,
  getters: {
    threatLevel?: (item: T) => string;
    deviceType?: (item: T) => string;
    deviceStatus?: (item: T) => string;
    timestamp?: (item: T) => number;
    threatScore?: (item: T) => number;
  }
): T[] {
  return data.filter((item) => {
    // Threat Level Filter
    if (filters.threatLevel && filters.threatLevel !== 'all' && getters.threatLevel) {
      if (getters.threatLevel(item) !== filters.threatLevel) return false;
    }

    // Device Type Filter
    if (filters.deviceType && filters.deviceType !== 'all' && getters.deviceType) {
      if (getters.deviceType(item) !== filters.deviceType) return false;
    }

    // Device Status Filter
    if (filters.deviceStatus && filters.deviceStatus !== 'all' && getters.deviceStatus) {
      if (getters.deviceStatus(item) !== filters.deviceStatus) return false;
    }

    // Time Range Filter
    if (filters.timeRange && filters.timeRange !== 'all' && getters.timestamp) {
      const now = Date.now();
      const itemTime = getters.timestamp(item) * 1000;
      const timeMs = {
        '1h': 60 * 60 * 1000,
        '24h': 24 * 60 * 60 * 1000,
        '7d': 7 * 24 * 60 * 60 * 1000,
        '30d': 30 * 24 * 60 * 60 * 1000,
      }[filters.timeRange];

      if (timeMs && now - itemTime > timeMs) return false;
    }

    // Threat Score Filter
    if (getters.threatScore) {
      const score = getters.threatScore(item);
      if (
        (filters.minThreatScore && score < filters.minThreatScore) ||
        (filters.maxThreatScore && score > filters.maxThreatScore)
      ) {
        return false;
      }
    }

    return true;
  });
}
