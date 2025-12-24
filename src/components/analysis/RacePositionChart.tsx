'use client';

import { useMemo, useRef, useEffect } from 'react';
import * as d3 from 'd3';
import { useDrivers, useLaps } from '@/hooks/useOpenF1';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';

interface RacePositionChartProps {
  sessionKey: number | null;
  focusedDrivers?: number[];
}

interface PositionData {
  lap: number;
  position: number;
}

interface DriverPositions {
  driverNumber: number;
  acronym: string;
  color: string;
  positions: PositionData[];
}

export function RacePositionChart({ sessionKey, focusedDrivers = [] }: RacePositionChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  const { data: drivers } = useDrivers(sessionKey);
  const { data: laps, isLoading } = useLaps(sessionKey);

  // Process lap data to extract position history
  const driverPositions = useMemo(() => {
    if (!laps || !drivers) return [];

    const positionMap = new Map<number, DriverPositions>();

    // Initialize drivers
    drivers.forEach((driver) => {
      positionMap.set(driver.driver_number, {
        driverNumber: driver.driver_number,
        acronym: driver.name_acronym,
        color: `#${driver.team_colour}`,
        positions: [],
      });
    });

    // Group laps by lap number and sort by duration to get position
    const lapGroups = new Map<number, { driverNumber: number; duration: number | null }[]>();

    laps.forEach((lap) => {
      if (!lapGroups.has(lap.lap_number)) {
        lapGroups.set(lap.lap_number, []);
      }
      lapGroups.get(lap.lap_number)!.push({
        driverNumber: lap.driver_number,
        duration: lap.lap_duration,
      });
    });

    // For each lap, determine positions based on cumulative time
    const cumulativeTimes = new Map<number, number>();

    Array.from(lapGroups.keys())
      .sort((a, b) => a - b)
      .forEach((lapNum) => {
        const lapData = lapGroups.get(lapNum)!;

        // Update cumulative times
        lapData.forEach((lap) => {
          if (lap.duration !== null) {
            const prev = cumulativeTimes.get(lap.driverNumber) || 0;
            cumulativeTimes.set(lap.driverNumber, prev + lap.duration);
          }
        });

        // Sort by cumulative time to get positions
        const sorted = Array.from(cumulativeTimes.entries())
          .sort((a, b) => a[1] - b[1]);

        sorted.forEach(([driverNumber], idx) => {
          const driverData = positionMap.get(driverNumber);
          if (driverData) {
            driverData.positions.push({
              lap: lapNum,
              position: idx + 1,
            });
          }
        });
      });

    return Array.from(positionMap.values()).filter((d) => d.positions.length > 0);
  }, [laps, drivers]);

  // Draw the chart
  useEffect(() => {
    if (!svgRef.current || driverPositions.length === 0 || focusedDrivers.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const margin = { top: 20, right: 100, bottom: 40, left: 50 };
    const width = svgRef.current.clientWidth - margin.left - margin.right;
    const height = 300 - margin.top - margin.bottom;

    if (width <= 0) return;

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Filter to focused drivers
    const filteredData = driverPositions.filter((d) =>
      focusedDrivers.includes(d.driverNumber)
    );

    // Find extents
    const maxLap = Math.max(...filteredData.flatMap((d) => d.positions.map((p) => p.lap)));
    const maxPos = Math.min(20, Math.max(...filteredData.flatMap((d) => d.positions.map((p) => p.position))));

    const x = d3.scaleLinear().domain([1, maxLap]).range([0, width]);
    const y = d3.scaleLinear().domain([1, maxPos]).range([0, height]);

    // Grid lines
    g.append('g')
      .attr('class', 'grid')
      .attr('opacity', 0.1)
      .call(
        d3.axisLeft(y)
          .ticks(Math.min(maxPos, 10))
          .tickSize(-width)
          .tickFormat(() => '')
      );

    // Draw position lines
    const line = d3
      .line<PositionData>()
      .x((d) => x(d.lap))
      .y((d) => y(d.position))
      .curve(d3.curveMonotoneX);

    filteredData.forEach((driver) => {
      g.append('path')
        .datum(driver.positions)
        .attr('d', line)
        .attr('fill', 'none')
        .attr('stroke', driver.color)
        .attr('stroke-width', 2.5)
        .attr('opacity', 0.9);

      // Add endpoint marker
      const lastPos = driver.positions[driver.positions.length - 1];
      if (lastPos) {
        g.append('circle')
          .attr('cx', x(lastPos.lap))
          .attr('cy', y(lastPos.position))
          .attr('r', 4)
          .attr('fill', driver.color);
      }
    });

    // X axis
    g.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x).ticks(10).tickFormat((d) => `${d}`))
      .append('text')
      .attr('x', width / 2)
      .attr('y', 35)
      .attr('fill', 'currentColor')
      .attr('text-anchor', 'middle')
      .attr('font-size', '12px')
      .text('Lap');

    // Y axis (inverted - P1 at top)
    g.append('g')
      .call(d3.axisLeft(y).ticks(Math.min(maxPos, 10)).tickFormat((d) => `P${d}`))
      .append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -height / 2)
      .attr('y', -35)
      .attr('fill', 'currentColor')
      .attr('text-anchor', 'middle')
      .attr('font-size', '12px')
      .text('Position');

    // Legend
    const legend = g
      .append('g')
      .attr('transform', `translate(${width + 10}, 0)`);

    filteredData.forEach((driver, i) => {
      const lastPos = driver.positions[driver.positions.length - 1];
      const legendRow = legend
        .append('g')
        .attr('transform', `translate(0, ${i * 22})`);

      legendRow
        .append('rect')
        .attr('width', 16)
        .attr('height', 4)
        .attr('y', 6)
        .attr('fill', driver.color);

      legendRow
        .append('text')
        .attr('x', 22)
        .attr('y', 12)
        .style('font-size', '11px')
        .style('fill', 'currentColor')
        .text(`${driver.acronym} (P${lastPos?.position || '-'})`);
    });
  }, [driverPositions, focusedDrivers]);

  if (!sessionKey) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Race Position Chart
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            Select a session to view position changes
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
            <TrendingUp className="h-5 w-5" />
            Race Position Chart
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

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Race Position Chart
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Chart */}
        {focusedDrivers.length === 0 ? (
          <div className="h-[300px] flex items-center justify-center">
            <p className="text-muted-foreground text-sm">
              Select drivers above to track positions
            </p>
          </div>
        ) : driverPositions.length > 0 ? (
          <svg ref={svgRef} width="100%" height={300} />
        ) : (
          <div className="h-[300px] flex items-center justify-center">
            <p className="text-muted-foreground text-sm">
              No position data available
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
