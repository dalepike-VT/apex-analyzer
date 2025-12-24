'use client';

import { useMemo } from 'react';
import { usePits, useStints, useDrivers } from '@/hooks/useOpenF1';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Timer, Circle } from 'lucide-react';

interface PitStopAnalysisProps {
  sessionKey: number | null;
}

const COMPOUND_COLORS: Record<string, string> = {
  SOFT: '#ef4444',
  MEDIUM: '#eab308',
  HARD: '#f5f5f5',
  INTERMEDIATE: '#22c55e',
  WET: '#3b82f6',
};

interface DriverPitData {
  driverNumber: number;
  acronym: string;
  teamColor: string;
  pits: {
    lap: number;
    duration: number | null;
    compoundFrom?: string;
    compoundTo?: string;
  }[];
  totalPitTime: number;
  stints: {
    compound: string;
    lapStart: number;
    lapEnd: number | null;
    age: number;
  }[];
}

export function PitStopAnalysis({ sessionKey }: PitStopAnalysisProps) {
  const { data: pits, isLoading: pitsLoading } = usePits(sessionKey);
  const { data: stints, isLoading: stintsLoading } = useStints(sessionKey);
  const { data: drivers } = useDrivers(sessionKey);

  const driverPitData = useMemo(() => {
    if (!pits || !drivers) return [];

    const driverMap = new Map<number, DriverPitData>();

    // Initialize drivers with pit stops
    drivers.forEach((driver) => {
      const driverPits = pits
        .filter((p) => p.driver_number === driver.driver_number)
        .sort((a, b) => a.lap_number - b.lap_number);

      if (driverPits.length === 0) return;

      const driverStints = stints
        ?.filter((s) => s.driver_number === driver.driver_number)
        .sort((a, b) => a.stint_number - b.stint_number) || [];

      const totalPitTime = driverPits.reduce(
        (sum, pit) => sum + (pit.pit_duration || 0),
        0
      );

      // Match pits to stint changes
      const pitsWithCompounds = driverPits.map((pit, i) => {
        const stintBefore = driverStints.find(
          (s) => s.lap_end === pit.lap_number || (s.lap_start <= pit.lap_number && (s.lap_end === null || s.lap_end >= pit.lap_number))
        );
        const stintAfter = driverStints.find(
          (s) => s.lap_start === pit.lap_number || s.lap_start === pit.lap_number + 1
        );

        return {
          lap: pit.lap_number,
          duration: pit.pit_duration,
          compoundFrom: stintBefore?.compound,
          compoundTo: stintAfter?.compound,
        };
      });

      driverMap.set(driver.driver_number, {
        driverNumber: driver.driver_number,
        acronym: driver.name_acronym,
        teamColor: `#${driver.team_colour}`,
        pits: pitsWithCompounds,
        totalPitTime,
        stints: driverStints.map((s) => ({
          compound: s.compound,
          lapStart: s.lap_start,
          lapEnd: s.lap_end,
          age: s.tyre_age_at_start,
        })),
      });
    });

    // Sort by total pit time (fastest first)
    return Array.from(driverMap.values()).sort(
      (a, b) => a.totalPitTime - b.totalPitTime
    );
  }, [pits, stints, drivers]);

  const isLoading = pitsLoading || stintsLoading;

  if (!sessionKey) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Timer className="h-5 w-5" />
            Pit Stop Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            Select a session to view pit stop data
          </p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Timer className="h-5 w-5" />
            Pit Stop Analysis
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

  if (driverPitData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Timer className="h-5 w-5" />
            Pit Stop Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm text-center py-4">
            No pit stop data available for this session
          </p>
        </CardContent>
      </Card>
    );
  }

  const fastestPit = Math.min(
    ...driverPitData.flatMap((d) => d.pits.map((p) => p.duration || Infinity))
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Timer className="h-5 w-5" />
          Pit Stop Analysis
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {driverPitData.slice(0, 10).map((driver) => (
            <div
              key={driver.driverNumber}
              className="flex items-center gap-3 p-2 rounded-lg bg-muted/30"
            >
              {/* Driver Badge */}
              <div
                className="w-12 text-center py-1 rounded text-xs font-bold text-white"
                style={{ backgroundColor: driver.teamColor }}
              >
                {driver.acronym}
              </div>

              {/* Pit Stops */}
              <div className="flex-1 flex flex-wrap gap-2">
                {driver.pits.map((pit, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-1.5 bg-background rounded px-2 py-1 text-xs"
                  >
                    <span className="text-muted-foreground">L{pit.lap}</span>
                    {pit.compoundFrom && pit.compoundTo && (
                      <>
                        <Circle
                          className="h-2.5 w-2.5"
                          fill={COMPOUND_COLORS[pit.compoundFrom]}
                          stroke="none"
                        />
                        <span className="text-muted-foreground">→</span>
                        <Circle
                          className="h-2.5 w-2.5"
                          fill={COMPOUND_COLORS[pit.compoundTo]}
                          stroke="none"
                        />
                      </>
                    )}
                    <span
                      className={`font-mono font-medium ${
                        pit.duration === fastestPit
                          ? 'text-purple-500'
                          : 'text-foreground'
                      }`}
                    >
                      {pit.duration ? `${pit.duration.toFixed(1)}s` : '-'}
                    </span>
                  </div>
                ))}
              </div>

              {/* Total Time */}
              <div className="text-right text-xs">
                <span className="text-muted-foreground">Total: </span>
                <span className="font-mono font-medium">
                  {driver.totalPitTime.toFixed(1)}s
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t text-xs text-muted-foreground">
          <span className="font-medium">Compounds:</span>
          {Object.entries(COMPOUND_COLORS).map(([compound, color]) => (
            <div key={compound} className="flex items-center gap-1">
              <Circle className="h-2.5 w-2.5" fill={color} stroke="none" />
              <span className="capitalize">{compound.toLowerCase()}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
