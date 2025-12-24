'use client';

import { useMemo, useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';
import { useDrivers, useLaps } from '@/hooks/useOpenF1';
import { openf1 } from '@/lib/openf1';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { Location, Driver, Lap } from '@/lib/openf1';

interface TrackMapProps {
  sessionKey: number | null;
  onCornerSelect?: (corner: number) => void;
}

interface TrackPoint {
  x: number;
  y: number;
}

export function TrackMap({ sessionKey, onCornerSelect }: TrackMapProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [selectedDriver, setSelectedDriver] = useState<number | null>(null);
  const [trackPoints, setTrackPoints] = useState<TrackPoint[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: drivers } = useDrivers(sessionKey);
  const { data: laps } = useLaps(sessionKey);

  // Find the fastest lap for selected driver
  const fastestLap = useMemo(() => {
    if (!laps || !selectedDriver) return null;
    const driverLaps = laps.filter(
      (lap) =>
        lap.driver_number === selectedDriver &&
        lap.lap_duration !== null &&
        !lap.is_pit_out_lap
    );
    return driverLaps.reduce<Lap | null>((best, lap) => {
      if (!best) return lap;
      if (lap.lap_duration! < best.lap_duration!) return lap;
      return best;
    }, null);
  }, [laps, selectedDriver]);

  // Fetch location data for just the fastest lap
  useEffect(() => {
    if (!sessionKey || !selectedDriver || !fastestLap) {
      setTrackPoints([]);
      return;
    }

    const fetchLocationData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const lapStart = new Date(fastestLap.date_start);
        const lapDuration = fastestLap.lap_duration || 90;
        const lapEnd = new Date(lapStart.getTime() + (lapDuration + 5) * 1000);

        // Format dates without timezone for API compatibility
        const startStr = lapStart.toISOString().slice(0, 19);
        const endStr = lapEnd.toISOString().slice(0, 19);

        // Fetch location data with time bounds
        const locationData = await openf1.getLocation(sessionKey, selectedDriver, {
          'date>=': startStr,
          'date<=': endStr,
        });

        // Filter out points with zero coordinates (invalid data)
        const validData = locationData.filter(
          (loc) => loc.x !== 0 || loc.y !== 0
        );

        if (validData.length === 0) {
          setError('No track data available for this lap');
          setTrackPoints([]);
          return;
        }

        // Sample points to reduce density (aim for ~300-500 points)
        const sampleRate = Math.max(1, Math.floor(validData.length / 400));
        const sampled = validData.filter((_, i) => i % sampleRate === 0);

        setTrackPoints(
          sampled.map((loc) => ({
            x: loc.x,
            y: loc.y,
          }))
        );
      } catch (err) {
        console.error('Error fetching location data:', err);
        setError('Failed to load track data');
        setTrackPoints([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLocationData();
  }, [sessionKey, selectedDriver, fastestLap]);

  // Get driver for display
  const selectedDriverInfo = drivers?.find((d) => d.driver_number === selectedDriver);
  const driverColor = selectedDriverInfo ? `#${selectedDriverInfo.team_colour}` : '#ef4444';

  // Draw the track
  useEffect(() => {
    if (!svgRef.current || trackPoints.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const margin = { top: 20, right: 20, bottom: 20, left: 20 };
    const width = svgRef.current.clientWidth - margin.left - margin.right;
    const height = 350 - margin.top - margin.bottom;

    if (width <= 0 || height <= 0) return;

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Calculate bounds
    const xExtent = d3.extent(trackPoints, (d) => d.x) as [number, number];
    const yExtent = d3.extent(trackPoints, (d) => d.y) as [number, number];

    // Create scales with aspect ratio preservation
    const xRange = xExtent[1] - xExtent[0];
    const yRange = yExtent[1] - yExtent[0];
    const scale = Math.min(width / xRange, height / yRange) * 0.9;

    const xCenter = (xExtent[0] + xExtent[1]) / 2;
    const yCenter = (yExtent[0] + yExtent[1]) / 2;

    const xScale = (x: number) => (x - xCenter) * scale + width / 2;
    const yScale = (y: number) => -(y - yCenter) * scale + height / 2; // Flip Y

    // Draw track outline
    const line = d3
      .line<TrackPoint>()
      .x((d) => xScale(d.x))
      .y((d) => yScale(d.y))
      .curve(d3.curveCatmullRom.alpha(0.5));

    // Track background (wider, darker)
    g.append('path')
      .datum(trackPoints)
      .attr('d', line)
      .attr('fill', 'none')
      .attr('stroke', '#374151')
      .attr('stroke-width', 14)
      .attr('stroke-linecap', 'round')
      .attr('stroke-linejoin', 'round');

    // Track surface (kerbs simulation)
    g.append('path')
      .datum(trackPoints)
      .attr('d', line)
      .attr('fill', 'none')
      .attr('stroke', '#4b5563')
      .attr('stroke-width', 10)
      .attr('stroke-linecap', 'round')
      .attr('stroke-linejoin', 'round');

    // Racing line (driver's team color)
    g.append('path')
      .datum(trackPoints)
      .attr('d', line)
      .attr('fill', 'none')
      .attr('stroke', driverColor)
      .attr('stroke-width', 3)
      .attr('stroke-linecap', 'round')
      .attr('stroke-linejoin', 'round');

    // Start/finish marker (first point)
    if (trackPoints.length > 0) {
      // Checkered flag effect
      g.append('rect')
        .attr('x', xScale(trackPoints[0].x) - 12)
        .attr('y', yScale(trackPoints[0].y) - 6)
        .attr('width', 24)
        .attr('height', 12)
        .attr('fill', '#ffffff')
        .attr('stroke', '#000000')
        .attr('stroke-width', 1)
        .attr('rx', 2);

      g.append('text')
        .attr('x', xScale(trackPoints[0].x))
        .attr('y', yScale(trackPoints[0].y) + 3)
        .attr('text-anchor', 'middle')
        .attr('font-size', '8px')
        .attr('font-weight', 'bold')
        .attr('fill', '#000000')
        .text('S/F');
    }

    // Add corner markers at direction changes
    const cornerIndices: number[] = [];
    const windowSize = Math.max(5, Math.floor(trackPoints.length / 20));

    for (let i = windowSize; i < trackPoints.length - windowSize; i += windowSize) {
      const prev = trackPoints[i - windowSize];
      const curr = trackPoints[i];
      const next = trackPoints[i + windowSize];

      const angle1 = Math.atan2(curr.y - prev.y, curr.x - prev.x);
      const angle2 = Math.atan2(next.y - curr.y, next.x - curr.x);
      let angleDiff = Math.abs(angle2 - angle1);
      if (angleDiff > Math.PI) angleDiff = 2 * Math.PI - angleDiff;

      if (angleDiff > 0.3) {
        cornerIndices.push(i);
      }
    }

    // Draw corner markers
    cornerIndices.slice(0, 15).forEach((idx, cornerNum) => {
      const point = trackPoints[idx];
      const cornerGroup = g
        .append('g')
        .attr('cursor', 'pointer')
        .on('click', () => onCornerSelect?.(cornerNum + 1));

      cornerGroup
        .append('circle')
        .attr('cx', xScale(point.x))
        .attr('cy', yScale(point.y))
        .attr('r', 11)
        .attr('fill', '#1f2937')
        .attr('stroke', '#f97316')
        .attr('stroke-width', 2);

      cornerGroup
        .append('text')
        .attr('x', xScale(point.x))
        .attr('y', yScale(point.y) + 4)
        .attr('text-anchor', 'middle')
        .attr('font-size', '10px')
        .attr('font-weight', 'bold')
        .attr('fill', '#f97316')
        .text(cornerNum + 1);
    });
  }, [trackPoints, onCornerSelect, driverColor]);

  if (!sessionKey) {
    return (
      <Card className="h-[450px]">
        <CardHeader>
          <CardTitle>Track Map</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-full">
          <p className="text-muted-foreground">
            Select a session to view track map
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-[450px]">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle>Track Map</CardTitle>
          {selectedDriverInfo && (
            <div
              className="flex items-center gap-2 px-2 py-1 rounded text-sm font-medium"
              style={{
                backgroundColor: `#${selectedDriverInfo.team_colour}20`,
                borderLeft: `3px solid #${selectedDriverInfo.team_colour}`,
              }}
            >
              <span>{selectedDriverInfo.name_acronym}</span>
              <span className="text-muted-foreground">
                {fastestLap ? `Lap ${fastestLap.lap_number}` : ''}
              </span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {/* Driver Selection */}
        <div className="flex flex-wrap gap-1 mb-3 max-h-[80px] overflow-y-auto">
          {drivers?.map((driver) => (
            <Button
              key={driver.driver_number}
              variant={selectedDriver === driver.driver_number ? 'default' : 'outline'}
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => setSelectedDriver(driver.driver_number)}
              style={
                selectedDriver === driver.driver_number
                  ? { backgroundColor: `#${driver.team_colour}` }
                  : { borderColor: `#${driver.team_colour}` }
              }
            >
              {driver.name_acronym}
            </Button>
          ))}
        </div>

        {/* Track Visualization */}
        {isLoading ? (
          <div className="h-[300px] flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
              <p className="text-muted-foreground text-sm">Loading track data...</p>
            </div>
          </div>
        ) : error ? (
          <div className="h-[300px] flex items-center justify-center">
            <p className="text-muted-foreground text-sm">{error}</p>
          </div>
        ) : trackPoints.length > 0 ? (
          <svg ref={svgRef} width="100%" height={350} />
        ) : (
          <div className="h-[300px] flex items-center justify-center">
            <p className="text-muted-foreground text-sm text-center">
              Select a driver above to view their racing line
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
