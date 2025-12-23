'use client';

import { useDrivers } from '@/hooks/useOpenF1';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface DriverListProps {
  sessionKey: number | null;
}

export function DriverList({ sessionKey }: DriverListProps) {
  const { data: drivers, isLoading } = useDrivers(sessionKey);

  if (!sessionKey) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Drivers</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Select a session to view drivers</p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Drivers</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Loading drivers...</p>
        </CardContent>
      </Card>
    );
  }

  // Sort drivers by number
  const sortedDrivers = drivers?.slice().sort((a, b) => a.driver_number - b.driver_number);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Drivers ({drivers?.length ?? 0})</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2">
          {sortedDrivers?.map((driver) => (
            <div
              key={driver.driver_number}
              className="flex items-center gap-2 p-2 rounded-md border hover:bg-accent cursor-pointer transition-colors"
              style={{ borderLeftColor: `#${driver.team_colour}`, borderLeftWidth: '4px' }}
            >
              <span className="font-mono text-sm font-bold w-6">
                {driver.driver_number}
              </span>
              <span className="font-medium text-sm truncate">
                {driver.name_acronym}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
