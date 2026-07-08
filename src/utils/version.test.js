import { describe, it, expect } from 'vitest';
import { isVersionNewer } from './version';

describe('isVersionNewer', () => {
  it('detects a higher patch, minor, or major', () => {
    expect(isVersionNewer('1.3.31', '1.3.30')).toBe(true);
    expect(isVersionNewer('1.4.0', '1.3.30')).toBe(true);
    expect(isVersionNewer('2.0.0', '1.9.9')).toBe(true);
  });

  it('returns false for equal or older versions', () => {
    expect(isVersionNewer('1.3.30', '1.3.30')).toBe(false);
    expect(isVersionNewer('1.3.29', '1.3.30')).toBe(false);
    expect(isVersionNewer('1.2.99', '1.3.0')).toBe(false);
  });

  it('treats missing trailing segments as zero', () => {
    expect(isVersionNewer('1.4', '1.3.30')).toBe(true);
    expect(isVersionNewer('1.3', '1.3.0')).toBe(false);
    expect(isVersionNewer('1.3.0', '1.3')).toBe(false);
  });

  it('compares segments numerically, not lexically', () => {
    // "10" must beat "9" — a string compare would get this wrong
    expect(isVersionNewer('1.10.0', '1.9.0')).toBe(true);
  });
});
