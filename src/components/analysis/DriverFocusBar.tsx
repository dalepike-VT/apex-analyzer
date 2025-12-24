'use client';

import { useMemo } from 'react';
import { useDrivers, useLaps } from '@/hooks/useOpenF1';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Trophy, Zap, RotateCcw } from 'lucide-react';
import type { Driver } from '@/lib/openf1';

interface DriverFocusBarProps {
  sessionKey: number | null;
  focusedDrivers: number[];
  onFocusedDriversChange: (drivers: number[]) => void;
  maxDrivers?: number;
}

export function DriverFocusBar({
  sessionKey,
  focusedDrivers,
  onFocusedDriversChange,
  maxDrivers = 4,
}: DriverFocusBarProps) {
  const { data: drivers } = useDrivers(sessionKey);
  const { data: laps } = useLaps(sessionKey);

  // Calculate driver standings based on cumulative lap times
  const driverStandings = useMemo(() => {
    if (!drivers || !laps) return [];

    const standings: { driver: Driver; totalTime: number; bestLap: number | null }[] = [];

    drivers.forEach((driver) => {
      const driverLaps = laps.filter(
        (lap) => lap.driver_number === driver.driver_number && lap.lap_duration !== null
      );

      const totalTime = driverLaps.reduce((sum, lap) => sum + (lap.lap_duration || 0), 0);
      const bestLap = driverLaps.reduce<number | null>((best, lap) => {
        if (!lap.lap_duration) return best;
        if (!best) return lap.lap_duration;
        return lap.lap_duration < best ? lap.lap_duration : best;
      }, null);

      if (totalTime > 0) {
        standings.push({ driver, totalTime, bestLap });
      }
    });

    return standings.sort((a, b) => a.totalTime - b.totalTime);
  }, [drivers, laps]);

  // Find fastest lap holder
  const fastestLapHolder = useMemo(() => {
    if (driverStandings.length === 0) return null;
    return driverStandings.reduce((fastest, current) => {
      if (!current.bestLap) return fastest;
      if (!fastest || !fastest.bestLap) return current;
      return current.bestLap < fastest.bestLap ? current : fastest;
    }, null as typeof driverStandings[0] | null);
  }, [driverStandings]);

  const toggleDriver = (driverNumber: number) => {
    if (focusedDrivers.includes(driverNumber)) {
      onFocusedDriversChange(focusedDrivers.filter((d) => d !== driverNumber));
    } else if (focusedDrivers.length < maxDrivers) {
      onFocusedDriversChange([...focusedDrivers, driverNumber]);
    } else {
      // Replace oldest selection
      onFocusedDriversChange([...focusedDrivers.slice(1), driverNumber]);
    }
  };

  const selectTop3 = () => {
    const top3 = driverStandings.slice(0, 3).map((s) => s.driver.driver_number);
    onFocusedDriversChange(top3);
  };

  const selectFastestLap = () => {
    if (fastestLapHolder) {
      onFocusedDriversChange([fastestLapHolder.driver.driver_number]);
    }
  };

  const clearSelection = () => {
    onFocusedDriversChange([]);
  };

  if (!sessionKey || !drivers || drivers.length === 0) {
    return null;
  }

  // Sort drivers by their standing position for display
  const sortedDrivers = driverStandings.map((s) => s.driver);

  return (
    <Card className="bg-card/50 backdrop-blur border-muted">
      <CardContent className="py-3">
        <div className="flex flex-col gap-3">
          {/* Header with quick actions */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span>Focus Drivers</span>
              <span className="text-muted-foreground text-xs">
                ({focusedDrivers.length}/{maxDrivers} selected)
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs gap-1.5"
                onClick={selectTop3}
              >
                <Trophy className="h-3 w-3" />
                Top 3
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs gap-1.5"
                onClick={selectFastestLap}
              >
                <Zap className="h-3 w-3 text-purple-500" />
                Fastest Lap
              </Button>
              {focusedDrivers.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs gap-1.5"
                  onClick={clearSelection}
                >
                  <RotateCcw className="h-3 w-3" />
                  Clear
                </Button>
              )}
            </div>
          </div>

          {/* Driver grid */}
          <div className="grid grid-cols-5 sm:grid-cols-7 md:grid-cols-10 lg:grid-cols-12 xl:grid-cols-20 gap-1.5">
            {sortedDrivers.map((driver, index) => {
              const isSelected = focusedDrivers.includes(driver.driver_number);
              const isFastestLap = fastestLapHolder?.driver.driver_number === driver.driver_number;

              return (
                <Button
                  key={driver.driver_number}
                  variant={isSelected ? 'default' : 'outline'}
                  size="sm"
                  className="h-auto py-1.5 px-2 text-xs flex-col gap-0 relative min-w-0"
                  onClick={() => toggleDriver(driver.driver_number)}
                  style={
                    isSelected
                      ? { backgroundColor: `#${driver.team_colour}` }
                      : { borderColor: `#${driver.team_colour}60` }
                  }
                >
                  <span className="text-[9px] opacity-60">P{index + 1}</span>
                  <span className="font-bold text-[11px]">{driver.name_acronym}</span>
                  {isFastestLap && (
                    <Zap className="h-3 w-3 text-purple-400 absolute -top-1 -right-1" />
                  )}
                </Button>
              );
            })}
          </div>

          {/* Selection hint */}
          {focusedDrivers.length === 0 && (
            <p className="text-xs text-muted-foreground text-center">
              Select drivers to compare across all charts, or use quick actions above
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
