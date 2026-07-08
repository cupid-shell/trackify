import { describe, it, expect } from 'vitest';
import { parseLocalDate } from './date';

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
