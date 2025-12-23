/**
 * OpenF1 API Client
 * Wrapper for the OpenF1 REST API
 */

import type {
  Meeting,
  Session,
  Driver,
  Lap,
  CarData,
  Location,
  Pit,
  Stint,
  RaceControl,
  Weather,
  Interval,
  Position,
  QueryParams,
} from './types';

const BASE_URL = process.env.NEXT_PUBLIC_OPENF1_BASE_URL || 'https://api.openf1.org/v1';

/**
 * Build URL with query parameters
 */
function buildUrl(endpoint: string, params?: QueryParams): string {
  const url = new URL(`${BASE_URL}${endpoint}`);

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        url.searchParams.append(key, String(value));
      }
    });
  }

  return url.toString();
}

/**
 * Generic fetch wrapper with error handling
 */
async function fetchApi<T>(endpoint: string, params?: QueryParams): Promise<T> {
  const url = buildUrl(endpoint, params);

  const response = await fetch(url, {
    headers: {
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`OpenF1 API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

/**
 * OpenF1 API Client
 */
export const openf1 = {
  /**
   * Get all meetings (Grand Prix weekends) for a year
   */
  async getMeetings(year: number): Promise<Meeting[]> {
    return fetchApi<Meeting[]>('/meetings', { year });
  },

  /**
   * Get a specific meeting by key
   */
  async getMeeting(meetingKey: number): Promise<Meeting[]> {
    return fetchApi<Meeting[]>('/meetings', { meeting_key: meetingKey });
  },

  /**
   * Get all sessions for a meeting
   */
  async getSessions(meetingKey: number): Promise<Session[]> {
    return fetchApi<Session[]>('/sessions', { meeting_key: meetingKey });
  },

  /**
   * Get a specific session by key
   */
  async getSession(sessionKey: number): Promise<Session[]> {
    return fetchApi<Session[]>('/sessions', { session_key: sessionKey });
  },

  /**
   * Get all drivers in a session
   */
  async getDrivers(sessionKey: number): Promise<Driver[]> {
    return fetchApi<Driver[]>('/drivers', { session_key: sessionKey });
  },

  /**
   * Get lap data for a session
   */
  async getLaps(sessionKey: number, driverNumber?: number): Promise<Lap[]> {
    const params: QueryParams = { session_key: sessionKey };
    if (driverNumber) params.driver_number = driverNumber;
    return fetchApi<Lap[]>('/laps', params);
  },

  /**
   * Get car telemetry data
   * Note: This can return a LOT of data (~3.7Hz sampling)
   * Consider limiting by driver and/or lap
   */
  async getCarData(
    sessionKey: number,
    driverNumber?: number,
    params?: QueryParams
  ): Promise<CarData[]> {
    return fetchApi<CarData[]>('/car_data', {
      session_key: sessionKey,
      driver_number: driverNumber,
      ...params,
    });
  },

  /**
   * Get car location data
   * Note: This can return a LOT of data (~3.7Hz sampling)
   * Consider limiting by driver and/or time range
   */
  async getLocation(
    sessionKey: number,
    driverNumber?: number,
    params?: QueryParams
  ): Promise<Location[]> {
    return fetchApi<Location[]>('/location', {
      session_key: sessionKey,
      driver_number: driverNumber,
      ...params,
    });
  },

  /**
   * Get pit stop data
   */
  async getPits(sessionKey: number, driverNumber?: number): Promise<Pit[]> {
    const params: QueryParams = { session_key: sessionKey };
    if (driverNumber) params.driver_number = driverNumber;
    return fetchApi<Pit[]>('/pit', params);
  },

  /**
   * Get stint data (tire compounds and ages)
   */
  async getStints(sessionKey: number, driverNumber?: number): Promise<Stint[]> {
    const params: QueryParams = { session_key: sessionKey };
    if (driverNumber) params.driver_number = driverNumber;
    return fetchApi<Stint[]>('/stints', params);
  },

  /**
   * Get race control messages
   */
  async getRaceControl(sessionKey: number): Promise<RaceControl[]> {
    return fetchApi<RaceControl[]>('/race_control', { session_key: sessionKey });
  },

  /**
   * Get weather data
   */
  async getWeather(sessionKey: number): Promise<Weather[]> {
    return fetchApi<Weather[]>('/weather', { session_key: sessionKey });
  },

  /**
   * Get interval data (gaps between cars)
   */
  async getIntervals(sessionKey: number, driverNumber?: number): Promise<Interval[]> {
    const params: QueryParams = { session_key: sessionKey };
    if (driverNumber) params.driver_number = driverNumber;
    return fetchApi<Interval[]>('/intervals', params);
  },

  /**
   * Get position data
   */
  async getPositions(sessionKey: number, driverNumber?: number): Promise<Position[]> {
    const params: QueryParams = { session_key: sessionKey };
    if (driverNumber) params.driver_number = driverNumber;
    return fetchApi<Position[]>('/position', params);
  },
};

export default openf1;
