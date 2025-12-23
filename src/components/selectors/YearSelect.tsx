'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface YearSelectProps {
  value: number | null;
  onChange: (year: number) => void;
}

// OpenF1 has data starting from 2023
const AVAILABLE_YEARS = [2025, 2024, 2023];

export function YearSelect({ value, onChange }: YearSelectProps) {
  return (
    <Select
      value={value?.toString() ?? ''}
      onValueChange={(v) => onChange(parseInt(v, 10))}
    >
      <SelectTrigger className="w-[140px]">
        <SelectValue placeholder="Select Year" />
      </SelectTrigger>
      <SelectContent>
        {AVAILABLE_YEARS.map((year) => (
          <SelectItem key={year} value={year.toString()}>
            {year}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
