'use client';

import { useMemo, useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';
import { useDrivers, useLaps } from '@/hooks/useOpenF1';
import { openf1 } from '@/lib/openf1';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { CarData, Driver, Lap, Location } from '@/lib/openf1';

interface CornerAnalysisProps {
  sessionKey: number | null;
  selectedCorner: number;
  focusedDrivers?: number[];
  cornerLocation?: { x: number; y: number } | null;
}

interface DriverCornerData {
  driver: Driver;
  entrySpeed: number;
  minSpeed: number;
  exitSpeed: number;
  brakingDistance: number; // meters before apex
  throttleOnDistance: number; // meters after apex
  color: string;
  speedTrace: { distance: number; speed: number }[];
}

export function CornerAnalysis({ sessionKey, selectedCorner, focusedDrivers = [], cornerLocation }: CornerAnalysisProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [cornerData, setCornerData] = useState<DriverCornerData[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const { data: drivers } = useDrivers(sessionKey);
  const { data: laps } = useLaps(sessionKey);

  // Get fastest lap for each driver
  const driverFastestLaps = useMemo(() => {
    if (!laps || !drivers) return new Map<number, Lap>();

    const fastestLaps = new Map<number, Lap>();
    drivers.forEach((driver) => {
      const driverLaps = laps.filter(
        (lap) =>
          lap.driver_number === driver.driver_number &&
          lap.lap_duration !== null &&
          !lap.is_pit_out_lap
      );
      const fastest = driverLaps.reduce<Lap | null>((best, lap) => {
        if (!best) return lap;
        if (lap.lap_duration! < best.lap_duration!) return lap;
        return best;
      }, null);
      if (fastest) {
        fastestLaps.set(driver.driver_number, fastest);
      }
    });
    return fastestLaps;
  }, [laps, drivers]);

  // Fetch and analyze corner data when focused drivers change
  useEffect(() => {
    if (!sessionKey || focusedDrivers.length === 0 || !drivers) {
      setCornerData([]);
      return;
    }

    const analyzeCorner = async () => {
      setIsLoading(true);
      try {
        const results: DriverCornerData[] = [];

        for (const driverNumber of focusedDrivers) {
          const driver = drivers.find((d) => d.driver_number === driverNumber);
          const fastestLap = driverFastestLaps.get(driverNumber);

          if (!driver || !fastestLap) continue;

          // Fetch car data for this driver's fastest lap
          const lapStart = new Date(fastestLap.date_start);
          const lapDuration = fastestLap.lap_duration || 90;
          const lapEnd = new Date(lapStart.getTime() + (lapDuration + 2) * 1000);

          const startStr = lapStart.toISOString().slice(0, 19);
          const endStr = lapEnd.toISOString().slice(0, 19);

          const carData = await openf1.getCarData(sessionKey, driverNumber, {
            'date>=': startStr,
            'date<=': endStr,
          });

          if (carData.length === 0) continue;

          // Estimate corner position as percentage of lap
          // Corners are roughly evenly distributed, so corner N is at ~(N/15) of lap
          const cornerPercent = (selectedCorner / 15);
          const cornerIndex = Math.floor(carData.length * cornerPercent);

          // Extract window around corner (10% of lap before and after)
          const windowSize = Math.floor(carData.length * 0.08);
          const startIdx = Math.max(0, cornerIndex - windowSize);
          const endIdx = Math.min(carData.length - 1, cornerIndex + windowSize);

          const cornerWindow = carData.slice(startIdx, endIdx + 1);

          if (cornerWindow.length < 10) continue;

          // Find minimum speed (apex)
          let minSpeedIdx = 0;
          let minSpeed = Infinity;
          cornerWindow.forEach((data, i) => {
            if (data.speed < minSpeed) {
              minSpeed = data.speed;
              minSpeedIdx = i;
            }
          });

          // Entry speed (start of window)
          const entrySpeed = cornerWindow[0]?.speed || 0;

          // Exit speed (end of window)
          const exitSpeed = cornerWindow[cornerWindow.length - 1]?.speed || 0;

          // Find braking point (where brake > 0 before apex)
          let brakingStartIdx = 0;
          for (let i = 0; i < minSpeedIdx; i++) {
            if (cornerWindow[i].brake > 10) {
              brakingStartIdx = i;
              break;
            }
          }

          // Find throttle on point (where throttle > 50 after apex)
          let throttleOnIdx = minSpeedIdx;
          for (let i = minSpeedIdx; i < cornerWindow.length; i++) {
            if (cornerWindow[i].throttle > 50) {
              throttleOnIdx = i;
              break;
            }
          }

          // Convert indices to approximate distance (meters)
          // F1 cars cover ~100m per second at 360km/h, sampling at ~3.7Hz
          const metersPerSample = 27; // approximate
          const brakingDistance = (minSpeedIdx - brakingStartIdx) * metersPerSample;
          const throttleOnDistance = (throttleOnIdx - minSpeedIdx) * metersPerSample;

          // Create speed trace for chart
          const speedTrace = cornerWindow.map((data, i) => ({
            distance: (i - minSpeedIdx) * metersPerSample,
            speed: data.speed,
          }));

          results.push({
            driver,
            entrySpeed,
            minSpeed,
            exitSpeed,
            brakingDistance,
            throttleOnDistance,
            color: `#${driver.team_colour}`,
            speedTrace,
          });
        }

        setCornerData(results);
      } catch (error) {
        console.error('Error analyzing corner:', error);
      } finally {
        setIsLoading(false);
      }
    };

    analyzeCorner();
  }, [sessionKey, focusedDrivers, drivers, driverFastestLaps, selectedCorner]);

  // Draw corner speed comparison chart
  useEffect(() => {
    if (!svgRef.current || cornerData.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const margin = { top: 10, right: 80, bottom: 30, left: 45 };
    const width = svgRef.current.clientWidth - margin.left - margin.right;
    const height = 150 - margin.top - margin.bottom;

    if (width <= 0) return;

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Find extents
    const allDistances = cornerData.flatMap((d) => d.speedTrace.map((s) => s.distance));
    const allSpeeds = cornerData.flatMap((d) => d.speedTrace.map((s) => s.speed));

    const xExtent = d3.extent(allDistances) as [number, number];
    const yExtent = [
      Math.min(...allSpeeds) * 0.9,
      Math.max(...allSpeeds) * 1.05,
    ];

    const x = d3.scaleLinear().domain(xExtent).range([0, width]);
    const y = d3.scaleLinear().domain(yExtent).range([height, 0]);

    // Grid
    g.append('g')
      .attr('class', 'grid')
      .attr('opacity', 0.1)
      .call(d3.axisLeft(y).ticks(4).tickSize(-width).tickFormat(() => ''));

    // Apex line (x = 0)
    g.append('line')
      .attr('x1', x(0))
      .attr('x2', x(0))
      .attr('y1', 0)
      .attr('y2', height)
      .attr('stroke', '#ef4444')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '4,4')
      .attr('opacity', 0.7);

    g.append('text')
      .attr('x', x(0) + 3)
      .attr('y', 10)
      .attr('font-size', '9px')
      .attr('fill', '#ef4444')
      .text('APEX');

    // Draw speed traces
    cornerData.forEach((driverData) => {
      const line = d3
        .line<{ distance: number; speed: number }>()
        .x((d) => x(d.distance))
        .y((d) => y(d.speed))
        .curve(d3.curveCatmullRom.alpha(0.5));

      g.append('path')
        .datum(driverData.speedTrace)
        .attr('d', line)
        .attr('fill', 'none')
        .attr('stroke', driverData.color)
        .attr('stroke-width', 2)
        .attr('opacity', 0.8);
    });

    // X axis
    g.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x).ticks(5).tickFormat((d) => `${d}m`))
      .selectAll('text')
      .style('font-size', '9px');

    // Y axis
    g.append('g')
      .call(d3.axisLeft(y).ticks(4).tickFormat((d) => `${d}`))
      .selectAll('text')
      .style('font-size', '9px');

    // Legend
    const legend = g
      .append('g')
      .attr('transform', `translate(${width + 5}, 0)`);

    cornerData.forEach((driverData, i) => {
      const legendRow = legend
        .append('g')
        .attr('transform', `translate(0, ${i * 16})`);

      legendRow
        .append('rect')
        .attr('width', 12)
        .attr('height', 3)
        .attr('y', 4)
        .attr('fill', driverData.color);

      legendRow
        .append('text')
        .attr('x', 15)
        .attr('y', 8)
        .style('font-size', '9px')
        .style('fill', 'currentColor')
        .text(driverData.driver.name_acronym);
    });
  }, [cornerData]);

  if (!sessionKey) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Corner Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            Select a session to analyze corners
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Turn {selectedCorner} Analysis</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          <div className="h-[150px] flex items-center justify-center">
            <p className="text-muted-foreground text-xs">Analyzing corner...</p>
          </div>
        ) : cornerData.length > 0 ? (
          <>
            {/* Speed Trace Chart */}
            <svg ref={svgRef} width="100%" height={150} />

            {/* Stats Table */}
            <div className="space-y-1">
              {cornerData.map((data) => (
                <div
                  key={data.driver.driver_number}
                  className="flex items-center gap-2 text-[10px] p-1 rounded"
                  style={{ backgroundColor: `${data.color}15` }}
                >
                  <span
                    className="font-bold w-8"
                    style={{ color: data.color }}
                  >
                    {data.driver.name_acronym}
                  </span>
                  <div className="flex gap-3 text-muted-foreground">
                    <span>Entry: <span className="text-foreground font-medium">{Math.round(data.entrySpeed)}</span></span>
                    <span>Min: <span className="text-foreground font-medium">{Math.round(data.minSpeed)}</span></span>
                    <span>Exit: <span className="text-foreground font-medium">{Math.round(data.exitSpeed)}</span></span>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : focusedDrivers.length === 0 ? (
          <p className="text-muted-foreground text-xs text-center py-4">
            Select drivers above to compare corner performance
          </p>
        ) : (
          <p className="text-muted-foreground text-xs text-center py-4">
            No telemetry data available
          </p>
        )}
      </CardContent>
    </Card>
  );
}
