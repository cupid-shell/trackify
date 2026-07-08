// Compare dotted semver-ish strings ("1.3.30") numerically, segment by segment.
// Missing segments count as 0, so "1.4" > "1.3.30". Returns true when `latest`
// is strictly greater than `current`. Pre-strip any leading "v" before calling.
export const isVersionNewer = (latest, current) => {
  const lParts = latest.split('.').map(Number);
  const cParts = current.split('.').map(Number);
  for (let i = 0; i < Math.max(lParts.length, cParts.length); i++) {
    const l = lParts[i] || 0;
    const c = cParts[i] || 0;
    if (l > c) return true;
    if (l < c) return false;
  }
  return false;
};
