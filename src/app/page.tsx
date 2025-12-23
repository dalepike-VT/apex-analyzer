'use client';

import { useState } from 'react';
import { YearSelect, MeetingSelect, SessionSelect } from '@/components/selectors';
import { SessionInfo, LapTimesTable, SectorChart, SpeedTrace } from '@/components/analysis';
import { TrackMap } from '@/components/track';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Meeting, Session } from '@/lib/openf1';

export default function Home() {
  const [year, setYear] = useState<number | null>(2024);
  const [meetingKey, setMeetingKey] = useState<number | null>(null);
  const [sessionKey, setSessionKey] = useState<number | null>(null);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [selectedCorner, setSelectedCorner] = useState<number | null>(null);

  const handleYearChange = (newYear: number) => {
    setYear(newYear);
    setMeetingKey(null);
    setSessionKey(null);
    setSelectedMeeting(null);
    setSelectedSession(null);
    setSelectedCorner(null);
  };

  const handleMeetingChange = (newMeetingKey: number, meeting: Meeting) => {
    setMeetingKey(newMeetingKey);
    setSessionKey(null);
    setSelectedMeeting(meeting);
    setSelectedSession(null);
    setSelectedCorner(null);
  };

  const handleSessionChange = (newSessionKey: number, session: Session) => {
    setSessionKey(newSessionKey);
    setSelectedSession(session);
    setSelectedCorner(null);
  };

  const handleCornerSelect = (corner: number) => {
    setSelectedCorner(corner);
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
          {/* Track Map */}
          <div className="lg:col-span-2">
            <TrackMap
              sessionKey={sessionKey}
              onCornerSelect={handleCornerSelect}
            />
          </div>

          {/* Corner Analysis */}
          <div>
            <Card className="h-[450px]">
              <CardHeader>
                <CardTitle>
                  {selectedCorner
                    ? `Corner ${selectedCorner} Analysis`
                    : 'Corner Analysis'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {sessionKey ? (
                  selectedCorner ? (
                    <div className="space-y-4">
                      <p className="text-sm text-muted-foreground">
                        Analyzing Turn {selectedCorner}
                      </p>
                      <div className="text-xs text-muted-foreground">
                        <p>Corner-specific telemetry analysis coming soon:</p>
                        <ul className="list-disc list-inside mt-2 space-y-1">
                          <li>Entry speed comparison</li>
                          <li>Minimum apex speed</li>
                          <li>Exit speed & acceleration</li>
                          <li>Braking point analysis</li>
                          <li>Racing line comparison</li>
                        </ul>
                      </div>
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm">
                      Select a driver on the track map, then click a corner marker
                      to view detailed analysis
                    </p>
                  )
                ) : (
                  <p className="text-muted-foreground text-sm">
                    No session selected
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Lap Times Table */}
        <LapTimesTable sessionKey={sessionKey} />

        {/* Sector Comparison Chart */}
        <SectorChart sessionKey={sessionKey} />

        {/* Speed Trace Comparison */}
        <SpeedTrace sessionKey={sessionKey} />
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
