'use client';

import { useMemo } from 'react';
import { useStints, useDrivers, useLaps } from '@/hooks/useOpenF1';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Circle } from 'lucide-react';

interface TireStrategyProps {
  sessionKey: number | null;
  focusedDrivers?: number[];
}

const COMPOUND_COLORS: Record<string, string> = {
  SOFT: '#ef4444',
  MEDIUM: '#eab308',
  HARD: '#f5f5f5',
  INTERMEDIATE: '#22c55e',
  WET: '#3b82f6',
};

const COMPOUND_SHORT: Record<string, string> = {
  SOFT: 'S',
  MEDIUM: 'M',
  HARD: 'H',
  INTERMEDIATE: 'I',
  WET: 'W',
};

interface DriverStrategy {
  driverNumber: number;
  acronym: string;
  teamColor: string;
  stints: {
    compound: string;
    lapStart: number;
    lapEnd: number;
    age: number;
  }[];
  totalLaps: number;
}

export function TireStrategy({ sessionKey, focusedDrivers = [] }: TireStrategyProps) {
  const { data: stints, isLoading: stintsLoading } = useStints(sessionKey);
  const { data: drivers } = useDrivers(sessionKey);
  const { data: laps } = useLaps(sessionKey);

  const driverStrategies = useMemo(() => {
    if (!stints || !drivers) return [];

    // Find max lap for the session
    const maxLap = laps?.reduce((max, lap) => Math.max(max, lap.lap_number), 0) || 60;

    const strategies: DriverStrategy[] = [];

    drivers.forEach((driver) => {
      const driverStints = stints
        .filter((s) => s.driver_number === driver.driver_number)
        .sort((a, b) => a.stint_number - b.stint_number)
        .map((stint, idx, arr) => ({
          compound: stint.compound,
          lapStart: stint.lap_start,
          lapEnd: stint.lap_end ?? (arr[idx + 1]?.lap_start - 1 || maxLap),
          age: stint.tyre_age_at_start,
        }));

      if (driverStints.length === 0) return;

      strategies.push({
        driverNumber: driver.driver_number,
        acronym: driver.name_acronym,
        teamColor: `#${driver.team_colour}`,
        stints: driverStints,
        totalLaps: Math.max(...driverStints.map((s) => s.lapEnd)),
      });
    });

    // Sort by finishing position (based on total laps completed - simple heuristic)
    return strategies.sort((a, b) => b.totalLaps - a.totalLaps);
  }, [stints, drivers, laps]);

  const maxLaps = useMemo(() => {
    if (driverStrategies.length === 0) return 60;
    return Math.max(...driverStrategies.map((d) => d.totalLaps));
  }, [driverStrategies]);

  if (!sessionKey) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Circle className="h-5 w-5" fill="#ef4444" stroke="none" />
            Tire Strategy
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            Select a session to view tire strategies
          </p>
        </CardContent>
      </Card>
    );
  }

  if (stintsLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Circle className="h-5 w-5" fill="#ef4444" stroke="none" />
            Tire Strategy
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (driverStrategies.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Circle className="h-5 w-5" fill="#ef4444" stroke="none" />
            Tire Strategy
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm text-center py-4">
            No tire data available for this session
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2">
          <Circle className="h-5 w-5" fill="#ef4444" stroke="none" />
          Tire Strategy
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Lap scale header */}
        <div className="flex items-center mb-2 text-xs text-muted-foreground">
          <div className="w-14 flex-shrink-0" />
          <div className="flex-1 flex justify-between px-1">
            <span>Lap 1</span>
            <span>Lap {Math.floor(maxLaps / 2)}</span>
            <span>Lap {maxLaps}</span>
          </div>
        </div>

        {/* Driver strategies */}
        <div className="space-y-1.5">
          {driverStrategies.slice(0, 15).map((driver) => {
            const isFocused = focusedDrivers.length === 0 || focusedDrivers.includes(driver.driverNumber);
            return (
            <div
              key={driver.driverNumber}
              className="flex items-center gap-2 transition-opacity"
              style={{ opacity: isFocused ? 1 : 0.3 }}
            >
              {/* Driver badge */}
              <div
                className="w-12 text-center py-0.5 rounded text-[10px] font-bold text-white flex-shrink-0"
                style={{ backgroundColor: driver.teamColor }}
              >
                {driver.acronym}
              </div>

              {/* Stint bars */}
              <div className="flex-1 h-5 relative bg-muted/30 rounded overflow-hidden">
                {driver.stints.map((stint, i) => {
                  const startPercent = ((stint.lapStart - 1) / maxLaps) * 100;
                  const widthPercent = ((stint.lapEnd - stint.lapStart + 1) / maxLaps) * 100;

                  return (
                    <div
                      key={i}
                      className="absolute h-full flex items-center justify-center text-[9px] font-bold"
                      style={{
                        left: `${startPercent}%`,
                        width: `${widthPercent}%`,
                        backgroundColor: COMPOUND_COLORS[stint.compound] || '#666',
                        color: stint.compound === 'HARD' ? '#000' : '#fff',
                      }}
                      title={`${stint.compound}: Lap ${stint.lapStart}-${stint.lapEnd} (${stint.age} laps old at start)`}
                    >
                      {widthPercent > 8 && (
                        <span>
                          {COMPOUND_SHORT[stint.compound]}
                          {stint.age > 0 && <sup className="opacity-70">{stint.age}</sup>}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Stop count */}
              <div className="w-8 text-right text-xs text-muted-foreground flex-shrink-0">
                {driver.stints.length - 1}x
              </div>
            </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t text-xs text-muted-foreground">
          <span className="font-medium">Compounds:</span>
          {Object.entries(COMPOUND_COLORS).map(([compound, color]) => (
            <div key={compound} className="flex items-center gap-1">
              <div
                className="w-4 h-3 rounded-sm"
                style={{ backgroundColor: color }}
              />
              <span className="capitalize">{compound.toLowerCase()}</span>
            </div>
          ))}
          <span className="ml-auto">
            <sup>n</sup> = tire age at start
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
