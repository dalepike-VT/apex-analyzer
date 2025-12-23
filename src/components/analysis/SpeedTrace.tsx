'use client';

import { useMemo, useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';
import { useDrivers, useLaps } from '@/hooks/useOpenF1';
import { openf1 } from '@/lib/openf1';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { CarData, Driver, Lap } from '@/lib/openf1';

interface SpeedTraceProps {
  sessionKey: number | null;
}

interface DriverTelemetry {
  driver: Driver;
  carData: CarData[];
  color: string;
}

export function SpeedTrace({ sessionKey }: SpeedTraceProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [selectedDrivers, setSelectedDrivers] = useState<number[]>([]);
  const [telemetryData, setTelemetryData] = useState<DriverTelemetry[]>([]);
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

  // Toggle driver selection
  const toggleDriver = (driverNumber: number) => {
    setSelectedDrivers((prev) => {
      if (prev.includes(driverNumber)) {
        return prev.filter((d) => d !== driverNumber);
      }
      if (prev.length >= 4) {
        // Max 4 drivers for readability
        return [...prev.slice(1), driverNumber];
      }
      return [...prev, driverNumber];
    });
  };

  // Fetch telemetry data when drivers are selected
  useEffect(() => {
    if (!sessionKey || selectedDrivers.length === 0 || !drivers) {
      setTelemetryData([]);
      return;
    }

    const fetchTelemetry = async () => {
      setIsLoading(true);
      try {
        const results: DriverTelemetry[] = [];

        for (const driverNumber of selectedDrivers) {
          const driver = drivers.find((d) => d.driver_number === driverNumber);
          const fastestLap = driverFastestLaps.get(driverNumber);

          if (!driver || !fastestLap) continue;

          // Fetch car data for this driver's fastest lap
          // We need to estimate time range based on lap start
          const lapStart = new Date(fastestLap.date_start);
          const lapDuration = fastestLap.lap_duration || 90; // Default 90s
          const lapEnd = new Date(lapStart.getTime() + lapDuration * 1000 + 2000);

          const carData = await openf1.getCarData(sessionKey, driverNumber, {
            date: `>=${lapStart.toISOString()}`,
          });

          // Filter to just the lap duration
          const lapData = carData.filter((d) => {
            const date = new Date(d.date);
            return date >= lapStart && date <= lapEnd;
          });

          // Sample to reduce data points (take every Nth point)
          const sampleRate = Math.max(1, Math.floor(lapData.length / 200));
          const sampled = lapData.filter((_, i) => i % sampleRate === 0);

          results.push({
            driver,
            carData: sampled,
            color: `#${driver.team_colour}`,
          });
        }

        setTelemetryData(results);
      } catch (error) {
        console.error('Error fetching telemetry:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTelemetry();
  }, [sessionKey, selectedDrivers, drivers, driverFastestLaps]);

  // Draw the speed traces
  useEffect(() => {
    if (!svgRef.current || telemetryData.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const margin = { top: 20, right: 120, bottom: 40, left: 50 };
    const width = svgRef.current.clientWidth - margin.left - margin.right;
    const height = 250 - margin.top - margin.bottom;

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Find max data length and normalize all traces to percentage of lap
    const maxLength = Math.max(...telemetryData.map((d) => d.carData.length));

    // X scale - percentage of lap
    const x = d3.scaleLinear().domain([0, 100]).range([0, width]);

    // Y scale - speed
    const allSpeeds = telemetryData.flatMap((d) => d.carData.map((c) => c.speed));
    const maxSpeed = d3.max(allSpeeds) || 350;
    const y = d3.scaleLinear().domain([0, maxSpeed]).nice().range([height, 0]);

    // Draw grid
    g.append('g')
      .attr('class', 'grid')
      .attr('opacity', 0.1)
      .call(d3.axisLeft(y).ticks(5).tickSize(-width).tickFormat(() => ''));

    // Draw traces for each driver
    telemetryData.forEach((driverData) => {
      const line = d3
        .line<CarData>()
        .x((_, i) => x((i / (driverData.carData.length - 1)) * 100))
        .y((d) => y(d.speed))
        .curve(d3.curveCatmullRom.alpha(0.5));

      g.append('path')
        .datum(driverData.carData)
        .attr('d', line)
        .attr('fill', 'none')
        .attr('stroke', driverData.color)
        .attr('stroke-width', 2)
        .attr('opacity', 0.8);
    });

    // X axis
    g.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x).ticks(10).tickFormat((d) => `${d}%`))
      .selectAll('text')
      .style('font-size', '10px');

    // X axis label
    g.append('text')
      .attr('x', width / 2)
      .attr('y', height + 35)
      .attr('text-anchor', 'middle')
      .style('font-size', '11px')
      .style('fill', 'currentColor')
      .text('Lap Progress');

    // Y axis
    g.append('g')
      .call(d3.axisLeft(y).ticks(5).tickFormat((d) => `${d}`))
      .selectAll('text')
      .style('font-size', '10px');

    // Y axis label
    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', -40)
      .attr('x', -height / 2)
      .attr('text-anchor', 'middle')
      .style('font-size', '11px')
      .style('fill', 'currentColor')
      .text('Speed (km/h)');

    // Legend
    const legend = g
      .append('g')
      .attr('transform', `translate(${width + 10}, 0)`);

    telemetryData.forEach((driverData, i) => {
      const legendRow = legend
        .append('g')
        .attr('transform', `translate(0, ${i * 20})`);

      legendRow
        .append('rect')
        .attr('width', 14)
        .attr('height', 3)
        .attr('y', 5)
        .attr('fill', driverData.color);

      legendRow
        .append('text')
        .attr('x', 20)
        .attr('y', 10)
        .style('font-size', '11px')
        .style('font-weight', '600')
        .style('fill', 'currentColor')
        .text(driverData.driver.name_acronym);
    });
  }, [telemetryData]);

  if (!sessionKey) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Speed Trace Comparison</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <p className="text-muted-foreground">Select a session to compare speed traces</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Speed Trace Comparison (Fastest Laps)</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Driver Selection */}
        <div className="flex flex-wrap gap-1 mb-4">
          <span className="text-xs text-muted-foreground mr-2 self-center">
            Select up to 4 drivers:
          </span>
          {drivers?.slice(0, 12).map((driver) => (
            <Button
              key={driver.driver_number}
              variant={selectedDrivers.includes(driver.driver_number) ? 'default' : 'outline'}
              size="sm"
              className="h-6 px-2 text-xs"
              onClick={() => toggleDriver(driver.driver_number)}
              style={
                selectedDrivers.includes(driver.driver_number)
                  ? { backgroundColor: `#${driver.team_colour}` }
                  : { borderColor: `#${driver.team_colour}40` }
              }
            >
              {driver.name_acronym}
            </Button>
          ))}
        </div>

        {/* Chart */}
        {isLoading ? (
          <div className="h-[250px] flex items-center justify-center">
            <p className="text-muted-foreground">Loading telemetry data...</p>
          </div>
        ) : telemetryData.length > 0 ? (
          <svg ref={svgRef} width="100%" height={250} />
        ) : (
          <div className="h-[250px] flex items-center justify-center">
            <p className="text-muted-foreground text-sm">
              Select drivers above to compare their fastest lap speed traces
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
