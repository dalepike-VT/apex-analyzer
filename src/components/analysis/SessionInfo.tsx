'use client';

import { Card, CardContent } from '@/components/ui/card';
import type { Meeting, Session } from '@/lib/openf1';
import { MapPin, Calendar, Clock } from 'lucide-react';

interface SessionInfoProps {
  meeting: Meeting | null;
  session: Session | null;
}

export function SessionInfo({ meeting, session }: SessionInfoProps) {
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

  return (
    <Card className="bg-gradient-to-r from-red-600 to-red-800 text-white border-0">
      <CardContent className="pt-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold">{meeting.meeting_official_name}</h2>
            <p className="text-lg opacity-90">{session.session_name}</p>
          </div>
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
        </div>
      </CardContent>
    </Card>
  );
}
