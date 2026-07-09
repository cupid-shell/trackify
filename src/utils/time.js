// Pure time helpers for the TimePicker. Kept in a plain .js module (no JSX) so
// they run under the plugin-free vitest config and can be unit-tested. Value
// in/out is 24-hour "HH:MM" — the same shape a native <input type="time"> uses.

export const pad = (n) => String(n).padStart(2, '0');

// "HH:MM" (24-hour) -> { h12, m, ampm }. Falls back to midnight on bad input.
export const parseTime = (value) => {
  const [hStr, mStr] = String(value || '00:00').split(':');
  let h = parseInt(hStr, 10);
  let m = parseInt(mStr, 10);
  if (isNaN(h)) h = 0;
  if (isNaN(m)) m = 0;
  return { h12: h % 12 === 0 ? 12 : h % 12, m, ampm: h >= 12 ? 'PM' : 'AM' };
};

// (h12 [1-12], m [0-59], ampm 'AM'|'PM') -> "HH:MM" (24-hour).
export const compose = (h12, m, ampm) => {
  let h = h12 % 12;
  if (ampm === 'PM') h += 12;
  return `${pad(h)}:${pad(m)}`;
};
