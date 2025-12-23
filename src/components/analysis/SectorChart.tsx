'use client';

import { useMemo, useRef, useEffect } from 'react';
import * as d3 from 'd3';
import { useLaps, useDrivers } from '@/hooks/useOpenF1';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Driver, Lap } from '@/lib/openf1';

interface SectorChartProps {
  sessionKey: number | null;
}

interface DriverSectorData {
  driver: Driver;
  sector1: number | null;
  sector2: number | null;
  sector3: number | null;
  total: number | null;
}

export function SectorChart({ sessionKey }: SectorChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const { data: laps } = useLaps(sessionKey);
  const { data: drivers } = useDrivers(sessionKey);

  const sectorData = useMemo(() => {
    if (!laps || !drivers) return [];

    // Group laps by driver and find best lap
    const driverLapsMap = new Map<number, Lap[]>();
    laps.forEach((lap) => {
      if (!driverLapsMap.has(lap.driver_number)) {
        driverLapsMap.set(lap.driver_number, []);
      }
      driverLapsMap.get(lap.driver_number)!.push(lap);
    });

    const results: DriverSectorData[] = drivers.map((driver) => {
      const driverLaps = driverLapsMap.get(driver.driver_number) || [];
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
        sector1: bestLap?.duration_sector_1 ?? null,
        sector2: bestLap?.duration_sector_2 ?? null,
        sector3: bestLap?.duration_sector_3 ?? null,
        total: bestLap?.lap_duration ?? null,
      };
    });

    // Sort by total time and take top 10
    return results
      .filter((d) => d.total !== null)
      .sort((a, b) => a.total! - b.total!)
      .slice(0, 10);
  }, [laps, drivers]);

  useEffect(() => {
    if (!svgRef.current || sectorData.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const margin = { top: 20, right: 20, bottom: 60, left: 60 };
    const width = svgRef.current.clientWidth - margin.left - margin.right;
    const height = 300 - margin.top - margin.bottom;

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // X scale - drivers
    const x0 = d3
      .scaleBand()
      .domain(sectorData.map((d) => d.driver.name_acronym))
      .rangeRound([0, width])
      .paddingInner(0.2);

    const x1 = d3
      .scaleBand()
      .domain(['S1', 'S2', 'S3'])
      .rangeRound([0, x0.bandwidth()])
      .padding(0.1);

    // Y scale - sector times
    const maxSector = d3.max(sectorData, (d) =>
      Math.max(d.sector1 ?? 0, d.sector2 ?? 0, d.sector3 ?? 0)
    ) ?? 40;

    const y = d3.scaleLinear().domain([0, maxSector]).nice().range([height, 0]);

    // Color scale for sectors
    const sectorColors = {
      S1: '#ef4444', // red
      S2: '#22c55e', // green
      S3: '#3b82f6', // blue
    };

    // Draw bars
    sectorData.forEach((d) => {
      const driverGroup = g
        .append('g')
        .attr('transform', `translate(${x0(d.driver.name_acronym)},0)`);

      // S1 bar
      if (d.sector1 !== null) {
        driverGroup
          .append('rect')
          .attr('x', x1('S1')!)
          .attr('y', y(d.sector1))
          .attr('width', x1.bandwidth())
          .attr('height', height - y(d.sector1))
          .attr('fill', sectorColors.S1)
          .attr('rx', 2);
      }

      // S2 bar
      if (d.sector2 !== null) {
        driverGroup
          .append('rect')
          .attr('x', x1('S2')!)
          .attr('y', y(d.sector2))
          .attr('width', x1.bandwidth())
          .attr('height', height - y(d.sector2))
          .attr('fill', sectorColors.S2)
          .attr('rx', 2);
      }

      // S3 bar
      if (d.sector3 !== null) {
        driverGroup
          .append('rect')
          .attr('x', x1('S3')!)
          .attr('y', y(d.sector3))
          .attr('width', x1.bandwidth())
          .attr('height', height - y(d.sector3))
          .attr('fill', sectorColors.S3)
          .attr('rx', 2);
      }
    });

    // X axis
    g.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x0))
      .selectAll('text')
      .attr('transform', 'rotate(-45)')
      .style('text-anchor', 'end')
      .attr('dx', '-0.5em')
      .attr('dy', '0.5em')
      .style('font-size', '11px')
      .style('font-weight', '600');

    // Y axis
    g.append('g')
      .call(d3.axisLeft(y).ticks(5).tickFormat((d) => `${d}s`))
      .selectAll('text')
      .style('font-size', '11px');

    // Y axis label
    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', -45)
      .attr('x', -height / 2)
      .attr('text-anchor', 'middle')
      .style('font-size', '12px')
      .style('fill', 'currentColor')
      .text('Sector Time (seconds)');

    // Legend
    const legend = svg
      .append('g')
      .attr('transform', `translate(${margin.left + width - 100}, 5)`);

    ['S1', 'S2', 'S3'].forEach((sector, i) => {
      const legendRow = legend
        .append('g')
        .attr('transform', `translate(${i * 35}, 0)`);

      legendRow
        .append('rect')
        .attr('width', 12)
        .attr('height', 12)
        .attr('fill', sectorColors[sector as keyof typeof sectorColors])
        .attr('rx', 2);

      legendRow
        .append('text')
        .attr('x', 15)
        .attr('y', 10)
        .style('font-size', '11px')
        .style('fill', 'currentColor')
        .text(sector);
    });
  }, [sectorData]);

  if (!sessionKey) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Sector Comparison</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <p className="text-muted-foreground">Select a session to view sector times</p>
        </CardContent>
      </Card>
    );
  }

  if (sectorData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Sector Comparison</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <p className="text-muted-foreground">Loading sector data...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sector Comparison (Top 10)</CardTitle>
      </CardHeader>
      <CardContent>
        <svg ref={svgRef} width="100%" height={300} />
      </CardContent>
    </Card>
  );
}
