// Parse a stored date string into a *local* Date at midnight, so day-level
// grouping and comparisons don't drift across time zones. Strings with a time
// component are normalized to their local Y/M/D; bare "YYYY-MM-DD" is built
// directly in local time (avoiding the UTC interpretation of `new Date("...")`).
// Falls back to "now" for missing or unparseable input.
export const parseLocalDate = (dateStr) => {
  if (!dateStr) return new Date();
  const hasTime = /[T ]\d/.test(dateStr);
  if (hasTime) {
    const parsed = new Date(dateStr);
    if (!isNaN(parsed.getTime())) {
      return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
    }
  }
  const datePart = dateStr.split(/[ T]/)[0];
  const parts = datePart.split('-');
  if (parts.length === 3) {
    const [year, month, day] = parts.map(Number);
    if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
      const parsed = new Date(year, month - 1, day);
      if (!isNaN(parsed.getTime())) {
        return parsed;
      }
    }
  }
  return new Date();
};
