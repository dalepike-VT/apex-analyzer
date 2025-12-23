'use client';

import { useMemo } from 'react';
import { useLaps, useDrivers } from '@/hooks/useOpenF1';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { Lap, Driver } from '@/lib/openf1';

interface LapTimesTableProps {
  sessionKey: number | null;
}

interface DriverBestLap {
  driver: Driver;
  bestLap: Lap | null;
  bestLapTime: number | null;
  sector1: number | null;
  sector2: number | null;
  sector3: number | null;
  gapToLeader: number | null;
}

function formatLapTime(seconds: number | null): string {
  if (seconds === null) return '-';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toFixed(3).padStart(6, '0')}`;
}

function formatSectorTime(seconds: number | null): string {
  if (seconds === null) return '-';
  return seconds.toFixed(3);
}

function formatGap(gap: number | null): string {
  if (gap === null || gap === 0) return '-';
  return `+${gap.toFixed(3)}`;
}

export function LapTimesTable({ sessionKey }: LapTimesTableProps) {
  const { data: laps, isLoading: lapsLoading } = useLaps(sessionKey);
  const { data: drivers, isLoading: driversLoading } = useDrivers(sessionKey);

  const driverBestLaps = useMemo(() => {
    if (!laps || !drivers) return [];

    // Group laps by driver and find best lap
    const driverLapsMap = new Map<number, Lap[]>();
    laps.forEach((lap) => {
      if (!driverLapsMap.has(lap.driver_number)) {
        driverLapsMap.set(lap.driver_number, []);
      }
      driverLapsMap.get(lap.driver_number)!.push(lap);
    });

    // Calculate best lap for each driver
    const results: DriverBestLap[] = drivers.map((driver) => {
      const driverLaps = driverLapsMap.get(driver.driver_number) || [];

      // Find best lap (excluding pit out laps and null times)
      const validLaps = driverLaps.filter(
        (lap) => lap.lap_duration !== null && !lap.is_pit_out_lap
      );

      const bestLap = validLaps.reduce<Lap | null>((best, lap) => {
        if (!best) return lap;
        if (lap.lap_duration! < best.lap_duration!) return lap;
        return best;
      }, null);

      return {
        driver,
        bestLap,
        bestLapTime: bestLap?.lap_duration ?? null,
        sector1: bestLap?.duration_sector_1 ?? null,
        sector2: bestLap?.duration_sector_2 ?? null,
        sector3: bestLap?.duration_sector_3 ?? null,
        gapToLeader: null, // Will calculate after sorting
      };
    });

    // Sort by best lap time
    results.sort((a, b) => {
      if (a.bestLapTime === null) return 1;
      if (b.bestLapTime === null) return -1;
      return a.bestLapTime - b.bestLapTime;
    });

    // Calculate gap to leader
    const leaderTime = results[0]?.bestLapTime;
    results.forEach((result, index) => {
      if (index === 0 || result.bestLapTime === null || leaderTime === null) {
        result.gapToLeader = null;
      } else {
        result.gapToLeader = result.bestLapTime - leaderTime;
      }
    });

    return results;
  }, [laps, drivers]);

  // Find fastest sectors across all drivers
  const fastestSectors = useMemo(() => {
    const fastest = { sector1: Infinity, sector2: Infinity, sector3: Infinity };
    driverBestLaps.forEach((d) => {
      if (d.sector1 !== null && d.sector1 < fastest.sector1) fastest.sector1 = d.sector1;
      if (d.sector2 !== null && d.sector2 < fastest.sector2) fastest.sector2 = d.sector2;
      if (d.sector3 !== null && d.sector3 < fastest.sector3) fastest.sector3 = d.sector3;
    });
    return fastest;
  }, [driverBestLaps]);

  if (!sessionKey) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Lap Times</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Select a session to view lap times</p>
        </CardContent>
      </Card>
    );
  }

  if (lapsLoading || driversLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Lap Times</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Loading lap data...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Best Lap Times</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">Pos</TableHead>
              <TableHead className="w-16">No.</TableHead>
              <TableHead>Driver</TableHead>
              <TableHead>Team</TableHead>
              <TableHead className="text-right">S1</TableHead>
              <TableHead className="text-right">S2</TableHead>
              <TableHead className="text-right">S3</TableHead>
              <TableHead className="text-right">Lap Time</TableHead>
              <TableHead className="text-right">Gap</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {driverBestLaps.map((result, index) => (
              <TableRow key={result.driver.driver_number}>
                <TableCell className="font-medium">{index + 1}</TableCell>
                <TableCell>
                  <span
                    className="inline-block w-8 h-6 rounded text-center text-xs font-bold leading-6 text-white"
                    style={{ backgroundColor: `#${result.driver.team_colour}` }}
                  >
                    {result.driver.driver_number}
                  </span>
                </TableCell>
                <TableCell className="font-medium">
                  {result.driver.name_acronym}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {result.driver.team_name}
                </TableCell>
                <TableCell
                  className={`text-right font-mono text-sm ${
                    result.sector1 === fastestSectors.sector1
                      ? 'text-purple-500 font-bold'
                      : ''
                  }`}
                >
                  {formatSectorTime(result.sector1)}
                </TableCell>
                <TableCell
                  className={`text-right font-mono text-sm ${
                    result.sector2 === fastestSectors.sector2
                      ? 'text-purple-500 font-bold'
                      : ''
                  }`}
                >
                  {formatSectorTime(result.sector2)}
                </TableCell>
                <TableCell
                  className={`text-right font-mono text-sm ${
                    result.sector3 === fastestSectors.sector3
                      ? 'text-purple-500 font-bold'
                      : ''
                  }`}
                >
                  {formatSectorTime(result.sector3)}
                </TableCell>
                <TableCell
                  className={`text-right font-mono font-medium ${
                    index === 0 ? 'text-purple-500' : ''
                  }`}
                >
                  {formatLapTime(result.bestLapTime)}
                </TableCell>
                <TableCell className="text-right font-mono text-muted-foreground">
                  {formatGap(result.gapToLeader)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
