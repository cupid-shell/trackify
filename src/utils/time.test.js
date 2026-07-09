import { describe, it, expect } from 'vitest';
import { pad, parseTime, compose } from './time';

describe('pad', () => {
  it('zero-pads single digits and leaves two-digit values', () => {
    expect(pad(0)).toBe('00');
    expect(pad(5)).toBe('05');
    expect(pad(12)).toBe('12');
    expect(pad(59)).toBe('59');
  });
});

describe('parseTime', () => {
  it('handles the midnight and noon edge cases', () => {
    expect(parseTime('00:00')).toEqual({ h12: 12, m: 0, ampm: 'AM' });
    expect(parseTime('12:00')).toEqual({ h12: 12, m: 0, ampm: 'PM' });
  });

  it('splits AM and PM hours correctly', () => {
    expect(parseTime('09:05')).toEqual({ h12: 9, m: 5, ampm: 'AM' });
    expect(parseTime('11:59')).toEqual({ h12: 11, m: 59, ampm: 'AM' });
    expect(parseTime('13:30')).toEqual({ h12: 1, m: 30, ampm: 'PM' });
    expect(parseTime('23:59')).toEqual({ h12: 11, m: 59, ampm: 'PM' });
  });

  it('falls back to midnight on empty or malformed input', () => {
    const midnight = { h12: 12, m: 0, ampm: 'AM' };
    expect(parseTime('')).toEqual(midnight);
    expect(parseTime(undefined)).toEqual(midnight);
    expect(parseTime(null)).toEqual(midnight);
    expect(parseTime('garbage')).toEqual(midnight);
  });
});

describe('compose', () => {
  it('handles the midnight and noon edge cases', () => {
    expect(compose(12, 0, 'AM')).toBe('00:00');
    expect(compose(12, 0, 'PM')).toBe('12:00');
  });

  it('builds 24-hour strings from 12-hour parts', () => {
    expect(compose(9, 5, 'AM')).toBe('09:05');
    expect(compose(11, 59, 'AM')).toBe('11:59');
    expect(compose(1, 30, 'PM')).toBe('13:30');
    expect(compose(11, 59, 'PM')).toBe('23:59');
  });
});

describe('parseTime <-> compose round-trip', () => {
  it('returns the original 24-hour value', () => {
    for (const t of ['00:00', '00:30', '09:05', '11:59', '12:00', '13:30', '23:59']) {
      const { h12, m, ampm } = parseTime(t);
      expect(compose(h12, m, ampm)).toBe(t);
    }
  });
});
