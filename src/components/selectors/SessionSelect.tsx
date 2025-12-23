'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useSessions } from '@/hooks/useOpenF1';
import type { Session } from '@/lib/openf1';

interface SessionSelectProps {
  meetingKey: number | null;
  value: number | null;
  onChange: (sessionKey: number, session: Session) => void;
}

// Order sessions logically
const SESSION_ORDER = ['Practice 1', 'Practice 2', 'Practice 3', 'Sprint Qualifying', 'Sprint', 'Qualifying', 'Race'];

export function SessionSelect({ meetingKey, value, onChange }: SessionSelectProps) {
  const { data: sessions, isLoading } = useSessions(meetingKey);

  // Sort sessions in logical order
  const sortedSessions = sessions?.slice().sort((a, b) => {
    const aIndex = SESSION_ORDER.indexOf(a.session_name);
    const bIndex = SESSION_ORDER.indexOf(b.session_name);
    return aIndex - bIndex;
  });

  const handleChange = (sessionKey: string) => {
    const session = sessions?.find((s) => s.session_key === parseInt(sessionKey, 10));
    if (session) {
      onChange(session.session_key, session);
    }
  };

  return (
    <Select
      value={value?.toString() ?? ''}
      onValueChange={handleChange}
      disabled={!meetingKey || isLoading}
    >
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder={isLoading ? 'Loading...' : 'Select Session'} />
      </SelectTrigger>
      <SelectContent>
        {sortedSessions?.map((session) => (
          <SelectItem key={session.session_key} value={session.session_key.toString()}>
            {session.session_name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
