'use client';

import { Card, CardContent } from '@/components/ui/card';

interface WelcomeGuideProps {
  step: 'year' | 'meeting' | 'session' | 'ready';
}

export function WelcomeGuide({ step }: WelcomeGuideProps) {
  const steps = [
    { id: 'year', label: 'Season', description: 'Select a year' },
    { id: 'meeting', label: 'Grand Prix', description: 'Choose a race weekend' },
    { id: 'session', label: 'Session', description: 'Pick a session to analyze' },
  ];

  const currentStepIndex = steps.findIndex((s) => s.id === step);

  return (
    <Card className="border-dashed border-2 bg-muted/30">
      <CardContent className="py-12">
        <div className="max-w-2xl mx-auto text-center space-y-8">
          {/* Icon */}
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <svg
                className="w-8 h-8 text-primary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
          </div>

          {/* Title */}
          <div>
            <h2 className="text-2xl font-bold tracking-tight mb-2">
              Welcome to Apex Analyzer
            </h2>
            <p className="text-muted-foreground">
              Analyze F1 performance data corner-by-corner. Compare drivers, study racing
              lines, and discover what makes the difference.
            </p>
          </div>

          {/* Steps */}
          <div className="flex items-center justify-center gap-2">
            {steps.map((s, index) => (
              <div key={s.id} className="flex items-center">
                <div
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    index < currentStepIndex
                      ? 'bg-primary text-primary-foreground'
                      : index === currentStepIndex
                      ? 'bg-primary/20 text-primary border-2 border-primary'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  <span
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${
                      index < currentStepIndex
                        ? 'bg-primary-foreground text-primary'
                        : index === currentStepIndex
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted-foreground/30 text-muted-foreground'
                    }`}
                  >
                    {index < currentStepIndex ? '✓' : index + 1}
                  </span>
                  <span className="hidden sm:inline">{s.label}</span>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`w-8 h-0.5 mx-1 ${
                      index < currentStepIndex ? 'bg-primary' : 'bg-muted-foreground/30'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Current step instruction */}
          <div className="bg-card rounded-lg p-6 border">
            <p className="text-lg font-medium mb-1">
              {step === 'year' && 'Start by selecting a season'}
              {step === 'meeting' && 'Now choose a Grand Prix'}
              {step === 'session' && 'Finally, pick a session to analyze'}
            </p>
            <p className="text-sm text-muted-foreground">
              {step === 'year' &&
                'Use the dropdown in the header to select a Formula 1 season (2023 or 2024 recommended for best data).'}
              {step === 'meeting' &&
                'Select any race weekend from the season. Each Grand Prix has multiple sessions available.'}
              {step === 'session' &&
                'Choose from Practice, Qualifying, Sprint, or Race sessions. Race sessions have the most complete data.'}
            </p>
          </div>

          {/* Features preview */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
            <div className="p-4 rounded-lg bg-card border">
              <div className="w-8 h-8 rounded bg-red-500/10 flex items-center justify-center mb-2">
                <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <h3 className="font-medium text-sm mb-1">Track Visualization</h3>
              <p className="text-xs text-muted-foreground">
                Interactive track map with corner markers and racing lines
              </p>
            </div>
            <div className="p-4 rounded-lg bg-card border">
              <div className="w-8 h-8 rounded bg-blue-500/10 flex items-center justify-center mb-2">
                <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                </svg>
              </div>
              <h3 className="font-medium text-sm mb-1">Corner Analysis</h3>
              <p className="text-xs text-muted-foreground">
                Compare entry, apex, and exit speeds between drivers
              </p>
            </div>
            <div className="p-4 rounded-lg bg-card border">
              <div className="w-8 h-8 rounded bg-green-500/10 flex items-center justify-center mb-2">
                <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 0l-2 2a1 1 0 101.414 1.414L8 10.414l1.293 1.293a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <h3 className="font-medium text-sm mb-1">Telemetry Data</h3>
              <p className="text-xs text-muted-foreground">
                Speed traces, sector times, and lap comparisons
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
