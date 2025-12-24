'use client';

import { useMemo, useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';
import { useDrivers, useLaps } from '@/hooks/useOpenF1';
import { openf1 } from '@/lib/openf1';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react';
import type { Driver, Lap } from '@/lib/openf1';

interface CornerZoomProps {
  sessionKey: number | null;
  onCornerChange?: (corner: number) => void;
}

interface TrackPoint {
  x: number;
  y: number;
}

interface DriverTraceData {
  driver: Driver;
  points: TrackPoint[];
  color: string;
}

interface CornerData {
  index: number;
  center: TrackPoint;
  points: TrackPoint[];
}

export function CornerZoom({ sessionKey, onCornerChange }: CornerZoomProps) {
  const mainSvgRef = useRef<SVGSVGElement>(null);
  const miniSvgRef = useRef<SVGSVGElement>(null);
  const [selectedDrivers, setSelectedDrivers] = useState<number[]>([]);
  const [driverTraces, setDriverTraces] = useState<DriverTraceData[]>([]);
  const [fullTrackPoints, setFullTrackPoints] = useState<TrackPoint[]>([]);
  const [corners, setCorners] = useState<CornerData[]>([]);
  const [selectedCorner, setSelectedCorner] = useState<number>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [referenceDriverNumber, setReferenceDriverNumber] = useState<number | null>(null);

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

  // Get session's fastest driver as reference for track layout
  const fastestDriver = useMemo((): { driver: Driver; lap: Lap } | null => {
    if (!drivers || driverFastestLaps.size === 0) return null;
    let fastest: { driver: Driver; lap: Lap } | null = null;
    drivers.forEach((driver) => {
      const lap = driverFastestLaps.get(driver.driver_number);
      if (lap) {
        if (!fastest || lap.lap_duration! < fastest.lap.lap_duration!) {
          fastest = { driver, lap };
        }
      }
    });
    return fastest;
  }, [drivers, driverFastestLaps]);

  // Fetch reference track and detect corners
  useEffect(() => {
    if (!sessionKey || !fastestDriver) {
      setFullTrackPoints([]);
      setCorners([]);
      return;
    }

    const fetchTrackData = async () => {
      try {
        const lap = fastestDriver.lap;
        const lapStart = new Date(lap.date_start);
        const lapDuration = lap.lap_duration || 90;
        const lapEnd = new Date(lapStart.getTime() + (lapDuration + 5) * 1000);

        const startStr = lapStart.toISOString().slice(0, 19);
        const endStr = lapEnd.toISOString().slice(0, 19);

        const locationData = await openf1.getLocation(sessionKey, fastestDriver.driver.driver_number, {
          'date>=': startStr,
          'date<=': endStr,
        });

        const validData = locationData.filter((loc) => loc.x !== 0 || loc.y !== 0);
        if (validData.length === 0) return;

        // Keep higher resolution for corner detection
        const points = validData.map((loc) => ({ x: loc.x, y: loc.y }));
        setFullTrackPoints(points);
        setReferenceDriverNumber(fastestDriver.driver.driver_number);

        // Detect corners by curvature changes
        const detectedCorners: CornerData[] = [];
        const windowSize = Math.max(10, Math.floor(points.length / 30));

        for (let i = windowSize * 2; i < points.length - windowSize * 2; i += Math.floor(windowSize / 2)) {
          const prev = points[i - windowSize];
          const curr = points[i];
          const next = points[i + windowSize];

          const angle1 = Math.atan2(curr.y - prev.y, curr.x - prev.x);
          const angle2 = Math.atan2(next.y - curr.y, next.x - curr.x);
          let angleDiff = Math.abs(angle2 - angle1);
          if (angleDiff > Math.PI) angleDiff = 2 * Math.PI - angleDiff;

          // Only significant corners
          if (angleDiff > 0.25) {
            // Extract corner segment (20% of lap around this point)
            const segmentSize = Math.floor(points.length * 0.08);
            const startIdx = Math.max(0, i - segmentSize);
            const endIdx = Math.min(points.length - 1, i + segmentSize);

            detectedCorners.push({
              index: i,
              center: curr,
              points: points.slice(startIdx, endIdx + 1),
            });
          }
        }

        // Filter to keep only distinct corners (not too close together)
        const filteredCorners: CornerData[] = [];
        detectedCorners.forEach((corner) => {
          const isTooClose = filteredCorners.some(
            (existing) => Math.abs(existing.index - corner.index) < windowSize * 1.5
          );
          if (!isTooClose) {
            filteredCorners.push(corner);
          }
        });

        setCorners(filteredCorners.slice(0, 20)); // Max 20 corners
      } catch (err) {
        console.error('Error fetching track data:', err);
      }
    };

    fetchTrackData();
  }, [sessionKey, fastestDriver]);

  // Toggle driver selection
  const toggleDriver = (driverNumber: number) => {
    setSelectedDrivers((prev) => {
      if (prev.includes(driverNumber)) {
        return prev.filter((d) => d !== driverNumber);
      }
      if (prev.length >= 4) {
        return [...prev.slice(1), driverNumber];
      }
      return [...prev, driverNumber];
    });
  };

  // Fetch traces for selected drivers
  useEffect(() => {
    if (!sessionKey || selectedDrivers.length === 0 || !drivers || corners.length === 0) {
      setDriverTraces([]);
      return;
    }

    const fetchDriverTraces = async () => {
      setIsLoading(true);
      try {
        const traces: DriverTraceData[] = [];
        const currentCorner = corners[selectedCorner - 1];
        if (!currentCorner) return;

        for (const driverNumber of selectedDrivers) {
          const driver = drivers.find((d) => d.driver_number === driverNumber);
          const fastestLap = driverFastestLaps.get(driverNumber);

          if (!driver || !fastestLap) continue;

          const lapStart = new Date(fastestLap.date_start);
          const lapDuration = fastestLap.lap_duration || 90;
          const lapEnd = new Date(lapStart.getTime() + (lapDuration + 5) * 1000);

          const startStr = lapStart.toISOString().slice(0, 19);
          const endStr = lapEnd.toISOString().slice(0, 19);

          const locationData = await openf1.getLocation(sessionKey, driverNumber, {
            'date>=': startStr,
            'date<=': endStr,
          });

          const validData = locationData.filter((loc) => loc.x !== 0 || loc.y !== 0);
          if (validData.length === 0) continue;

          // Extract corner segment based on position ratio
          const cornerRatio = currentCorner.index / fullTrackPoints.length;
          const segmentSize = Math.floor(validData.length * 0.08);
          const centerIdx = Math.floor(validData.length * cornerRatio);
          const startIdx = Math.max(0, centerIdx - segmentSize);
          const endIdx = Math.min(validData.length - 1, centerIdx + segmentSize);

          traces.push({
            driver,
            points: validData.slice(startIdx, endIdx + 1).map((loc) => ({ x: loc.x, y: loc.y })),
            color: `#${driver.team_colour}`,
          });
        }

        setDriverTraces(traces);
      } catch (err) {
        console.error('Error fetching driver traces:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDriverTraces();
  }, [sessionKey, selectedDrivers, drivers, driverFastestLaps, selectedCorner, corners, fullTrackPoints.length]);

  // Draw mini track overview
  useEffect(() => {
    if (!miniSvgRef.current || fullTrackPoints.length === 0) return;

    const svg = d3.select(miniSvgRef.current);
    svg.selectAll('*').remove();

    const width = 120;
    const height = 80;
    const margin = 5;

    const xExtent = d3.extent(fullTrackPoints, (d) => d.x) as [number, number];
    const yExtent = d3.extent(fullTrackPoints, (d) => d.y) as [number, number];
    const xRange = xExtent[1] - xExtent[0];
    const yRange = yExtent[1] - yExtent[0];
    const scale = Math.min((width - margin * 2) / xRange, (height - margin * 2) / yRange);

    const xCenter = (xExtent[0] + xExtent[1]) / 2;
    const yCenter = (yExtent[0] + yExtent[1]) / 2;
    const xScale = (x: number) => (x - xCenter) * scale + width / 2;
    const yScale = (y: number) => -(y - yCenter) * scale + height / 2;

    const line = d3.line<TrackPoint>()
      .x((d) => xScale(d.x))
      .y((d) => yScale(d.y))
      .curve(d3.curveCatmullRom.alpha(0.5));

    // Track outline
    svg.append('path')
      .datum(fullTrackPoints)
      .attr('d', line)
      .attr('fill', 'none')
      .attr('stroke', '#4b5563')
      .attr('stroke-width', 2);

    // Highlight current corner
    const currentCorner = corners[selectedCorner - 1];
    if (currentCorner) {
      svg.append('circle')
        .attr('cx', xScale(currentCorner.center.x))
        .attr('cy', yScale(currentCorner.center.y))
        .attr('r', 6)
        .attr('fill', '#f97316')
        .attr('stroke', '#ffffff')
        .attr('stroke-width', 1);
    }
  }, [fullTrackPoints, corners, selectedCorner]);

  // Draw zoomed corner view
  useEffect(() => {
    if (!mainSvgRef.current || corners.length === 0) return;

    const svg = d3.select(mainSvgRef.current);
    svg.selectAll('*').remove();

    const margin = { top: 10, right: 10, bottom: 10, left: 10 };
    const width = mainSvgRef.current.clientWidth - margin.left - margin.right;
    const height = 200 - margin.top - margin.bottom;

    if (width <= 0 || height <= 0) return;

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    const currentCorner = corners[selectedCorner - 1];
    if (!currentCorner) return;

    // Use corner segment points for bounds
    const cornerPoints = currentCorner.points;
    const xExtent = d3.extent(cornerPoints, (d) => d.x) as [number, number];
    const yExtent = d3.extent(cornerPoints, (d) => d.y) as [number, number];

    // Add padding
    const padding = 0.15;
    const xRange = xExtent[1] - xExtent[0];
    const yRange = yExtent[1] - yExtent[0];
    const xPadded = [xExtent[0] - xRange * padding, xExtent[1] + xRange * padding];
    const yPadded = [yExtent[0] - yRange * padding, yExtent[1] + yRange * padding];

    const scale = Math.min(width / (xPadded[1] - xPadded[0]), height / (yPadded[1] - yPadded[0]));
    const xCenter = (xPadded[0] + xPadded[1]) / 2;
    const yCenter = (yPadded[0] + yPadded[1]) / 2;

    const xScale = (x: number) => (x - xCenter) * scale + width / 2;
    const yScale = (y: number) => -(y - yCenter) * scale + height / 2;

    const line = d3.line<TrackPoint>()
      .x((d) => xScale(d.x))
      .y((d) => yScale(d.y))
      .curve(d3.curveCatmullRom.alpha(0.5));

    // Draw track surface (reference line)
    g.append('path')
      .datum(cornerPoints)
      .attr('d', line)
      .attr('fill', 'none')
      .attr('stroke', '#374151')
      .attr('stroke-width', 40)
      .attr('stroke-linecap', 'round')
      .attr('stroke-linejoin', 'round');

    g.append('path')
      .datum(cornerPoints)
      .attr('d', line)
      .attr('fill', 'none')
      .attr('stroke', '#4b5563')
      .attr('stroke-width', 32)
      .attr('stroke-linecap', 'round')
      .attr('stroke-linejoin', 'round');

    // Draw driver traces
    if (driverTraces.length > 0) {
      driverTraces.forEach((trace, i) => {
        if (trace.points.length < 2) return;

        g.append('path')
          .datum(trace.points)
          .attr('d', line)
          .attr('fill', 'none')
          .attr('stroke', trace.color)
          .attr('stroke-width', 4)
          .attr('stroke-linecap', 'round')
          .attr('stroke-linejoin', 'round')
          .attr('opacity', 0.9);

        // Entry marker
        const entryPoint = trace.points[0];
        g.append('circle')
          .attr('cx', xScale(entryPoint.x))
          .attr('cy', yScale(entryPoint.y))
          .attr('r', 6)
          .attr('fill', trace.color)
          .attr('stroke', '#ffffff')
          .attr('stroke-width', 2);

        // Exit marker (arrow)
        const exitPoint = trace.points[trace.points.length - 1];
        g.append('circle')
          .attr('cx', xScale(exitPoint.x))
          .attr('cy', yScale(exitPoint.y))
          .attr('r', 4)
          .attr('fill', trace.color);
      });

      // Legend
      const legend = g.append('g').attr('transform', `translate(10, 10)`);
      driverTraces.forEach((trace, i) => {
        const row = legend.append('g').attr('transform', `translate(0, ${i * 24})`);
        row.append('rect')
          .attr('width', 20)
          .attr('height', 6)
          .attr('y', 5)
          .attr('rx', 2)
          .attr('fill', trace.color);
        row.append('text')
          .attr('x', 28)
          .attr('y', 12)
          .attr('font-size', '12px')
          .attr('font-weight', 'bold')
          .attr('fill', 'currentColor')
          .text(trace.driver.name_acronym);
      });
    } else {
      // Show reference line when no drivers selected
      g.append('path')
        .datum(cornerPoints)
        .attr('d', line)
        .attr('fill', 'none')
        .attr('stroke', '#6b7280')
        .attr('stroke-width', 3)
        .attr('stroke-dasharray', '8,4')
        .attr('opacity', 0.5);

      g.append('text')
        .attr('x', width / 2)
        .attr('y', height / 2)
        .attr('text-anchor', 'middle')
        .attr('font-size', '14px')
        .attr('fill', '#9ca3af')
        .text('Select drivers to compare racing lines');
    }

    // Corner label
    g.append('text')
      .attr('x', width - 10)
      .attr('y', height - 10)
      .attr('text-anchor', 'end')
      .attr('font-size', '24px')
      .attr('font-weight', 'bold')
      .attr('fill', '#f97316')
      .attr('opacity', 0.3)
      .text(`T${selectedCorner}`);

  }, [corners, selectedCorner, driverTraces]);

  // Corner navigation
  const prevCorner = () => {
    const newCorner = selectedCorner > 1 ? selectedCorner - 1 : corners.length;
    setSelectedCorner(newCorner);
    onCornerChange?.(newCorner);
  };

  const nextCorner = () => {
    const newCorner = selectedCorner < corners.length ? selectedCorner + 1 : 1;
    setSelectedCorner(newCorner);
    onCornerChange?.(newCorner);
  };

  if (!sessionKey) {
    return (
      <Card className="h-[520px] overflow-hidden">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ZoomIn className="h-5 w-5" />
            Corner Racing Lines
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-full">
          <p className="text-muted-foreground">Select a session to analyze corners</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-[520px] overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <ZoomIn className="h-5 w-5" />
            Corner Racing Lines
          </CardTitle>

          {/* Mini track overview */}
          <div className="bg-muted/50 rounded p-1">
            <svg ref={miniSvgRef} width={120} height={80} />
          </div>
        </div>

        {/* Corner navigation */}
        <div className="flex items-center justify-center gap-4 mt-2">
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={prevCorner}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-primary">Turn {selectedCorner}</span>
            <span className="text-muted-foreground text-sm">of {corners.length}</span>
          </div>
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={nextCorner}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-2">
        {/* Driver Selection */}
        <div>
          <p className="text-xs text-muted-foreground mb-1">Compare racing lines (max 4 drivers):</p>
          <div className="flex flex-wrap gap-1 max-h-[50px] overflow-y-auto">
            {drivers?.map((driver) => (
              <Button
                key={driver.driver_number}
                variant={selectedDrivers.includes(driver.driver_number) ? 'default' : 'outline'}
                size="sm"
                className="h-6 px-2 text-[10px]"
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
        </div>

        {/* Zoomed Corner View */}
        {isLoading ? (
          <div className="h-[200px] flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
              <p className="text-muted-foreground text-sm">Loading racing lines...</p>
            </div>
          </div>
        ) : corners.length > 0 ? (
          <svg ref={mainSvgRef} width="100%" height={200} />
        ) : (
          <div className="h-[200px] flex items-center justify-center">
            <p className="text-muted-foreground text-sm">Loading track data...</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
