import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Converts a 24-hour time string ("15:30", "09:00") into a 12-hour formatted string ("3:30 PM", "9:00 AM").
 * Idempotent: returns already-formatted 12-hour strings unchanged.
 */
export function formatTime12(time24: string | null | undefined): string {
  if (!time24) return '';
  const trimmed = time24.trim();
  if (/am|pm/i.test(trimmed)) {
    return trimmed;
  }
  const parts = trimmed.split(':');
  if (parts.length < 2) return trimmed;
  const h = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  if (isNaN(h) || isNaN(m)) return trimmed;

  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, '0')} ${period}`;
}

/**
 * Formats a time range in 12-hour format ("9:00 AM – 9:45 AM")
 */
export function formatTimeRange12(start: string | null | undefined, end?: string | null | undefined): string {
  if (!start) return '';
  const startFmt = formatTime12(start);
  if (!end) return startFmt;
  const endFmt = formatTime12(end);
  return `${startFmt} – ${endFmt}`;
}
