'use client';

import { useState } from 'react';
import { YearSelect, MeetingSelect, SessionSelect } from '@/components/selectors';
import { DriverList, SessionInfo } from '@/components/analysis';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Meeting, Session } from '@/lib/openf1';

export default function Home() {
  const [year, setYear] = useState<number | null>(2024);
  const [meetingKey, setMeetingKey] = useState<number | null>(null);
  const [sessionKey, setSessionKey] = useState<number | null>(null);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);

  const handleYearChange = (newYear: number) => {
    setYear(newYear);
    setMeetingKey(null);
    setSessionKey(null);
    setSelectedMeeting(null);
    setSelectedSession(null);
  };

  const handleMeetingChange = (newMeetingKey: number, meeting: Meeting) => {
    setMeetingKey(newMeetingKey);
    setSessionKey(null);
    setSelectedMeeting(meeting);
    setSelectedSession(null);
  };

  const handleSessionChange = (newSessionKey: number, session: Session) => {
    setSessionKey(newSessionKey);
    setSelectedSession(session);
  };

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Apex Analyzer</h1>
              <p className="text-muted-foreground text-sm">
                F1 Corner-by-Corner Performance Analysis
              </p>
            </div>

            {/* Selectors */}
            <div className="flex flex-wrap items-center gap-2">
              <YearSelect value={year} onChange={handleYearChange} />
              <MeetingSelect
                year={year}
                value={meetingKey}
                onChange={handleMeetingChange}
              />
              <SessionSelect
                meetingKey={meetingKey}
                value={sessionKey}
                onChange={handleSessionChange}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Session Info Banner */}
        <SessionInfo meeting={selectedMeeting} session={selectedSession} />

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Track Map Placeholder */}
          <div className="lg:col-span-2">
            <Card className="h-[400px]">
              <CardHeader>
                <CardTitle>Track Map</CardTitle>
              </CardHeader>
              <CardContent className="flex items-center justify-center h-full">
                {sessionKey ? (
                  <div className="text-center text-muted-foreground">
                    <p className="text-lg font-medium">Track visualization coming soon</p>
                    <p className="text-sm">Click on corners to analyze driver performance</p>
                  </div>
                ) : (
                  <p className="text-muted-foreground">
                    Select a year, Grand Prix, and session to begin analysis
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Corner Analysis Placeholder */}
          <div>
            <Card className="h-[400px]">
              <CardHeader>
                <CardTitle>Corner Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                {sessionKey ? (
                  <p className="text-muted-foreground text-sm">
                    Select a corner on the track map to view driver comparisons
                  </p>
                ) : (
                  <p className="text-muted-foreground text-sm">
                    No session selected
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Driver List */}
        <DriverList sessionKey={sessionKey} />

        {/* Telemetry Section Placeholder */}
        {sessionKey && (
          <Card>
            <CardHeader>
              <CardTitle>Telemetry Comparison</CardTitle>
            </CardHeader>
            <CardContent className="h-[200px] flex items-center justify-center">
              <p className="text-muted-foreground">
                Speed, throttle, and brake traces will appear here when comparing drivers
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t mt-12">
        <div className="container mx-auto px-4 py-4 text-center text-sm text-muted-foreground">
          Data provided by{' '}
          <a
            href="https://openf1.org"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-foreground"
          >
            OpenF1 API
          </a>
        </div>
      </footer>
    </main>
  );
}
