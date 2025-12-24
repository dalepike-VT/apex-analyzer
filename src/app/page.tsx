'use client';

import { useState } from 'react';
import { YearSelect, MeetingSelect, SessionSelect } from '@/components/selectors';
import { SessionInfo, LapTimesTable, SectorChart, SpeedTrace, CornerAnalysis, PitStopAnalysis, RacePositionChart, TireStrategy } from '@/components/analysis';
import { CornerZoom } from '@/components/track';
import { WelcomeGuide } from '@/components/WelcomeGuide';
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

  // Determine current step for welcome guide
  const getCurrentStep = (): 'year' | 'meeting' | 'session' | 'ready' => {
    if (!year) return 'year';
    if (!meetingKey) return 'meeting';
    if (!sessionKey) return 'session';
    return 'ready';
  };

  const currentStep = getCurrentStep();
  const showWelcome = currentStep !== 'ready';

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-3">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            {/* Logo & Title */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-md">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight">Apex Analyzer</h1>
                <p className="text-muted-foreground text-xs">
                  F1 Performance Analysis
                </p>
              </div>
            </div>

            {/* Selectors with labels */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex flex-col gap-0.5">
                <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                  Season
                </label>
                <YearSelect value={year} onChange={handleYearChange} />
              </div>
              <div className="flex flex-col gap-0.5">
                <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                  Grand Prix
                </label>
                <MeetingSelect
                  year={year}
                  value={meetingKey}
                  onChange={handleMeetingChange}
                />
              </div>
              <div className="flex flex-col gap-0.5">
                <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                  Session
                </label>
                <SessionSelect
                  meetingKey={meetingKey}
                  value={sessionKey}
                  onChange={handleSessionChange}
                />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6 space-y-6">
        {showWelcome ? (
          /* Welcome/Onboarding State */
          <WelcomeGuide step={currentStep} />
        ) : (
          /* Analysis Content */
          <>
            {/* Session Info Banner */}
            <SessionInfo meeting={selectedMeeting} session={selectedSession} />

            {/* Corner Racing Line Comparison */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Zoomed Corner View */}
              <div className="lg:col-span-2">
                <CornerZoom
                  sessionKey={sessionKey}
                  onCornerChange={handleCornerSelect}
                />
              </div>

              {/* Corner Speed Analysis */}
              <div className="h-[520px]">
                <CornerAnalysis
                  sessionKey={sessionKey}
                  selectedCorner={selectedCorner}
                />
              </div>
            </div>

            {/* Race Position & Tire Strategy */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <RacePositionChart sessionKey={sessionKey} />
              <TireStrategy sessionKey={sessionKey} />
            </div>

            {/* Pit Stop Analysis */}
            <PitStopAnalysis sessionKey={sessionKey} />

            {/* Lap Times Table */}
            <LapTimesTable sessionKey={sessionKey} />

            {/* Sector Comparison Chart */}
            <SectorChart sessionKey={sessionKey} />

            {/* Speed Trace Comparison */}
            <SpeedTrace sessionKey={sessionKey} />
          </>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t mt-12 bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <span>Data provided by</span>
              <a
                href="https://openf1.org"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-foreground hover:text-primary transition-colors"
              >
                OpenF1 API
              </a>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-xs">
                Not affiliated with Formula 1 or FIA
              </span>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
