import { describe, it, expect } from 'vitest';
import { parseLocalDate, formatRelativeTime } from './date';

describe('parseLocalDate', () => {
  it('parses "YYYY-MM-DD" as local midnight (no UTC drift)', () => {
    const d = parseLocalDate('2026-06-21');
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(5); // June is 5 (zero-based)
    expect(d.getDate()).toBe(21);
    expect(d.getHours()).toBe(0);
    expect(d.getMinutes()).toBe(0);
  });

  it('normalizes a value with a time component to local Y/M/D at midnight', () => {
    const d = parseLocalDate('2026-06-21T14:30:00');
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(5);
    expect(d.getDate()).toBe(21);
    expect(d.getHours()).toBe(0);
  });

  it('handles a space-separated date-time', () => {
    const d = parseLocalDate('2026-01-05 09:15');
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(0);
    expect(d.getDate()).toBe(5);
  });

  it('returns a Date (today) for empty input', () => {
    expect(parseLocalDate('')).toBeInstanceOf(Date);
    expect(parseLocalDate(null)).toBeInstanceOf(Date);
  });

  it('returns a valid Date for an unparseable string', () => {
    const d = parseLocalDate('not-a-date');
    expect(d).toBeInstanceOf(Date);
    expect(isNaN(d.getTime())).toBe(false);
  });
});

describe('formatRelativeTime', () => {
  const NOW = 1_700_000_000_000;

  it('says "just now" under a minute', () => {
    expect(formatRelativeTime(NOW, NOW)).toBe('just now');
    expect(formatRelativeTime(NOW - 59_000, NOW)).toBe('just now');
  });

  it('reports minutes, hours and days', () => {
    expect(formatRelativeTime(NOW - 5 * 60_000, NOW)).toBe('5m ago');
    expect(formatRelativeTime(NOW - 59 * 60_000, NOW)).toBe('59m ago');
    expect(formatRelativeTime(NOW - 2 * 3_600_000, NOW)).toBe('2h ago');
    expect(formatRelativeTime(NOW - 23 * 3_600_000, NOW)).toBe('23h ago');
    expect(formatRelativeTime(NOW - 3 * 86_400_000, NOW)).toBe('3d ago');
  });

  // A clock adjustment must not produce "in -3 minutes".
  it('clamps a future timestamp to "just now"', () => {
    expect(formatRelativeTime(NOW + 10 * 60_000, NOW)).toBe('just now');
  });

  it('is type safe', () => {
    expect(formatRelativeTime(null, NOW)).toBe('just now');
    expect(formatRelativeTime(NOW, undefined)).toBe('just now');
  });
});
