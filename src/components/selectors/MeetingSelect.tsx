'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useMeetings } from '@/hooks/useOpenF1';
import type { Meeting } from '@/lib/openf1';

interface MeetingSelectProps {
  year: number | null;
  value: number | null;
  onChange: (meetingKey: number, meeting: Meeting) => void;
}

export function MeetingSelect({ year, value, onChange }: MeetingSelectProps) {
  const { data: meetings, isLoading, error } = useMeetings(year ?? 0);

  const handleChange = (meetingKey: string) => {
    const meeting = meetings?.find((m) => m.meeting_key === parseInt(meetingKey, 10));
    if (meeting) {
      onChange(meeting.meeting_key, meeting);
    }
  };

  return (
    <Select
      value={value?.toString() ?? ''}
      onValueChange={handleChange}
      disabled={!year || isLoading}
    >
      <SelectTrigger className="w-[240px]">
        <SelectValue placeholder={isLoading ? 'Loading...' : 'Select Grand Prix'} />
      </SelectTrigger>
      <SelectContent>
        {meetings?.map((meeting) => (
          <SelectItem key={meeting.meeting_key} value={meeting.meeting_key.toString()}>
            {meeting.meeting_name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
