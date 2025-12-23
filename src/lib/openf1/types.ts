/**
 * OpenF1 API Type Definitions
 * Based on https://openf1.org documentation
 */

// Meeting (Grand Prix weekend)
export interface Meeting {
  meeting_key: number;
  meeting_name: string;
  meeting_official_name: string;
  location: string;
  country_key: number;
  country_code: string;
  country_name: string;
  circuit_key: number;
  circuit_short_name: string;
  date_start: string;
  gmt_offset: string;
  year: number;
}

// Session (FP1, FP2, FP3, Qualifying, Sprint, Race)
export interface Session {
  session_key: number;
  session_name: string;
  session_type: 'Practice' | 'Qualifying' | 'Sprint' | 'Race' | 'Sprint Qualifying';
  meeting_key: number;
  date_start: string;
  date_end: string;
  gmt_offset: string;
  year: number;
  country_name: string;
  circuit_short_name: string;
}

// Driver
export interface Driver {
  driver_number: number;
  broadcast_name: string;
  full_name: string;
  name_acronym: string;
  team_name: string;
  team_colour: string;
  first_name: string;
  last_name: string;
  headshot_url: string | null;
  country_code: string;
  session_key: number;
  meeting_key: number;
}

// Lap data
export interface Lap {
  date_start: string;
  driver_number: number;
  duration_sector_1: number | null;
  duration_sector_2: number | null;
  duration_sector_3: number | null;
  i1_speed: number | null;
  i2_speed: number | null;
  is_pit_out_lap: boolean;
  lap_duration: number | null;
  lap_number: number;
  meeting_key: number;
  segments_sector_1: number[] | null;
  segments_sector_2: number[] | null;
  segments_sector_3: number[] | null;
  session_key: number;
  st_speed: number | null;
}

// Car telemetry data (sampled at ~3.7Hz)
export interface CarData {
  brake: number; // 0-100
  date: string;
  driver_number: number;
  drs: number; // 0-14 (various DRS states)
  meeting_key: number;
  n_gear: number; // 0-8
  rpm: number;
  session_key: number;
  speed: number; // km/h
  throttle: number; // 0-100
}

// Car location data (sampled at ~3.7Hz)
export interface Location {
  date: string;
  driver_number: number;
  meeting_key: number;
  session_key: number;
  x: number;
  y: number;
  z: number;
}

// Pit stop data
export interface Pit {
  date: string;
  driver_number: number;
  lap_number: number;
  meeting_key: number;
  pit_duration: number | null;
  session_key: number;
}

// Stint data (tire compound and age)
export interface Stint {
  compound: 'SOFT' | 'MEDIUM' | 'HARD' | 'INTERMEDIATE' | 'WET';
  driver_number: number;
  lap_end: number | null;
  lap_start: number;
  meeting_key: number;
  session_key: number;
  stint_number: number;
  tyre_age_at_start: number;
}

// Race control messages
export interface RaceControl {
  category: string;
  date: string;
  driver_number: number | null;
  flag: string | null;
  lap_number: number | null;
  meeting_key: number;
  message: string;
  scope: string | null;
  sector: number | null;
  session_key: number;
}

// Weather data
export interface Weather {
  air_temperature: number;
  date: string;
  humidity: number;
  meeting_key: number;
  pressure: number;
  rainfall: number;
  session_key: number;
  track_temperature: number;
  wind_direction: number;
  wind_speed: number;
}

// Interval data (gaps between cars)
export interface Interval {
  date: string;
  driver_number: number;
  gap_to_leader: number | null;
  interval: number | null;
  meeting_key: number;
  session_key: number;
}

// Position data
export interface Position {
  date: string;
  driver_number: number;
  meeting_key: number;
  position: number;
  session_key: number;
}

// API query parameters
export interface QueryParams {
  [key: string]: string | number | boolean | undefined;
}
