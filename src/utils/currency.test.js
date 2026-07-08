import { describe, it, expect } from 'vitest';
import { formatCurrency, getCurrencySymbol, CURRENCIES } from './currency';

describe('getCurrencySymbol', () => {
  it('returns the symbol for a known currency', () => {
    expect(getCurrencySymbol('USD')).toBe('$');
    expect(getCurrencySymbol('BDT')).toBe('৳');
    expect(getCurrencySymbol('EUR')).toBe('€');
  });

  it('defaults to BDT for an unknown or missing code', () => {
    expect(getCurrencySymbol('XYZ')).toBe('৳');
    expect(getCurrencySymbol()).toBe('৳');
  });
});

describe('formatCurrency', () => {
  it('prefixes the symbol and groups thousands', () => {
    expect(formatCurrency(1500, 'USD')).toBe('$1,500');
    expect(formatCurrency(1000000, 'USD')).toBe('$1,000,000');
  });

  it('keeps up to two decimals but no trailing zeros', () => {
    expect(formatCurrency(12.5, 'USD')).toBe('$12.5');
    expect(formatCurrency(10, 'USD')).toBe('$10');
  });

  it('defaults to BDT when no code is given', () => {
    expect(formatCurrency(50)).toBe('৳50');
  });

  it('falls back to BDT for an unknown code', () => {
    expect(formatCurrency(50, 'XYZ')).toBe('৳50');
  });

  it('returns "<symbol>0" for non-numeric input', () => {
    expect(formatCurrency('abc', 'USD')).toBe('$0');
    expect(formatCurrency(undefined, 'BDT')).toBe('৳0');
  });

  it('exposes a currency table covering the supported codes', () => {
    expect(Object.keys(CURRENCIES)).toEqual(
      expect.arrayContaining(['BDT', 'USD', 'EUR', 'GBP', 'INR', 'JPY'])
    );
  });
});
