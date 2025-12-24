'use client';

import { useQuery } from '@tanstack/react-query';
import { openf1 } from '@/lib/openf1';
import type { Meeting, Session, Driver, Lap, CarData, Location } from '@/lib/openf1';

/**
 * Hook to fetch meetings (Grand Prix) for a year
 */
export function useMeetings(year: number) {
  return useQuery({
    queryKey: ['meetings', year],
    queryFn: () => openf1.getMeetings(year),
    enabled: year > 0,
  });
}

/**
 * Hook to fetch sessions for a meeting
 */
export function useSessions(meetingKey: number | null) {
  return useQuery({
    queryKey: ['sessions', meetingKey],
    queryFn: () => openf1.getSessions(meetingKey!),
    enabled: meetingKey !== null,
  });
}

/**
 * Hook to fetch drivers for a session
 */
export function useDrivers(sessionKey: number | null) {
  return useQuery({
    queryKey: ['drivers', sessionKey],
    queryFn: () => openf1.getDrivers(sessionKey!),
    enabled: sessionKey !== null,
  });
}

/**
 * Hook to fetch laps for a session
 */
export function useLaps(sessionKey: number | null, driverNumber?: number) {
  return useQuery({
    queryKey: ['laps', sessionKey, driverNumber],
    queryFn: () => openf1.getLaps(sessionKey!, driverNumber),
    enabled: sessionKey !== null,
  });
}

/**
 * Hook to fetch car telemetry data
 * Use sparingly - this is a lot of data!
 */
export function useCarData(
  sessionKey: number | null,
  driverNumber: number | null,
  enabled = true
) {
  return useQuery({
    queryKey: ['carData', sessionKey, driverNumber],
    queryFn: () => openf1.getCarData(sessionKey!, driverNumber!),
    enabled: enabled && sessionKey !== null && driverNumber !== null,
  });
}

/**
 * Hook to fetch car location data
 * Use sparingly - this is a lot of data!
 */
export function useLocation(
  sessionKey: number | null,
  driverNumber: number | null,
  enabled = true
) {
  return useQuery({
    queryKey: ['location', sessionKey, driverNumber],
    queryFn: () => openf1.getLocation(sessionKey!, driverNumber!),
    enabled: enabled && sessionKey !== null && driverNumber !== null,
  });
}

/**
 * Hook to fetch stints (tire data) for a session
 */
export function useStints(sessionKey: number | null, driverNumber?: number) {
  return useQuery({
    queryKey: ['stints', sessionKey, driverNumber],
    queryFn: () => openf1.getStints(sessionKey!, driverNumber),
    enabled: sessionKey !== null,
  });
}

/**
 * Hook to fetch pit stops for a session
 */
export function usePits(sessionKey: number | null, driverNumber?: number) {
  return useQuery({
    queryKey: ['pits', sessionKey, driverNumber],
    queryFn: () => openf1.getPits(sessionKey!, driverNumber),
    enabled: sessionKey !== null,
  });
}

/**
 * Hook to fetch weather data for a session
 */
export function useWeather(sessionKey: number | null) {
  return useQuery({
    queryKey: ['weather', sessionKey],
    queryFn: () => openf1.getWeather(sessionKey!),
    enabled: sessionKey !== null,
  });
}

/**
 * Hook to fetch position data for a session
 */
export function usePositions(sessionKey: number | null) {
  return useQuery({
    queryKey: ['positions', sessionKey],
    queryFn: () => openf1.getPositions(sessionKey!),
    enabled: sessionKey !== null,
  });
}

/**
 * Hook to fetch interval data for a session
 */
export function useIntervals(sessionKey: number | null) {
  return useQuery({
    queryKey: ['intervals', sessionKey],
    queryFn: () => openf1.getIntervals(sessionKey!),
    enabled: sessionKey !== null,
  });
}
