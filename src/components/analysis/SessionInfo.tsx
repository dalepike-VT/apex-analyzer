'use client';

import { Card, CardContent } from '@/components/ui/card';
import { useWeather } from '@/hooks/useOpenF1';
import type { Meeting, Session } from '@/lib/openf1';
import { MapPin, Calendar, Thermometer, Droplets, Wind, CloudRain } from 'lucide-react';

interface SessionInfoProps {
  meeting: Meeting | null;
  session: Session | null;
}

export function SessionInfo({ meeting, session }: SessionInfoProps) {
  const { data: weatherData } = useWeather(session?.session_key ?? null);

  if (!meeting || !session) {
    return null;
  }

  const sessionDate = new Date(session.date_start);
  const formattedDate = sessionDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Get latest weather reading
  const latestWeather = weatherData?.[weatherData.length - 1];

  return (
    <Card className="bg-gradient-to-r from-red-600 to-red-800 text-white border-0">
      <CardContent className="pt-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold">{meeting.meeting_official_name}</h2>
            <p className="text-lg opacity-90">{session.session_name}</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 sm:gap-8">
            {/* Location & Date */}
            <div className="flex flex-col gap-1 text-sm opacity-90">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span>{meeting.circuit_short_name} - {meeting.country_name}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>{formattedDate}</span>
              </div>
            </div>

            {/* Weather Conditions */}
            {latestWeather && (
              <div className="flex flex-wrap gap-3 text-sm">
                <div className="flex items-center gap-1.5 bg-white/10 rounded-full px-3 py-1">
                  <Thermometer className="h-3.5 w-3.5" />
                  <span className="font-medium">{Math.round(latestWeather.air_temperature)}°C</span>
                  <span className="opacity-70 text-xs">air</span>
                </div>
                <div className="flex items-center gap-1.5 bg-white/10 rounded-full px-3 py-1">
                  <div className="w-3.5 h-3.5 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-orange-400" />
                  </div>
                  <span className="font-medium">{Math.round(latestWeather.track_temperature)}°C</span>
                  <span className="opacity-70 text-xs">track</span>
                </div>
                <div className="flex items-center gap-1.5 bg-white/10 rounded-full px-3 py-1">
                  <Droplets className="h-3.5 w-3.5" />
                  <span className="font-medium">{Math.round(latestWeather.humidity)}%</span>
                </div>
                <div className="flex items-center gap-1.5 bg-white/10 rounded-full px-3 py-1">
                  <Wind className="h-3.5 w-3.5" />
                  <span className="font-medium">{Math.round(latestWeather.wind_speed)} km/h</span>
                </div>
                {latestWeather.rainfall > 0 && (
                  <div className="flex items-center gap-1.5 bg-blue-500/30 rounded-full px-3 py-1">
                    <CloudRain className="h-3.5 w-3.5" />
                    <span className="font-medium">Rain</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
