import { describe, it, expect } from 'vitest';
import { matchesTransactionFilters, filterTransactions } from './transactionFilter';

const tx = (over = {}) => ({
  id: 't1',
  type: 'expense',
  amount: 900,
  category: 'Other / Unexpected',
  note: 'SAS Photo Print',
  date: '2026-07-21',
  ...over,
});

describe('matchesTransactionFilters', () => {
  it('matches everything when no criteria are given', () => {
    expect(matchesTransactionFilters(tx())).toBe(true);
    expect(matchesTransactionFilters(tx(), {})).toBe(true);
  });

  describe('search', () => {
    it('matches on note, case-insensitively', () => {
      expect(matchesTransactionFilters(tx(), { searchTerm: 'print' })).toBe(true);
      expect(matchesTransactionFilters(tx(), { searchTerm: 'PRINT' })).toBe(true);
    });

    it('matches on category', () => {
      expect(matchesTransactionFilters(tx(), { searchTerm: 'unexpected' })).toBe(true);
    });

    it('matches on amount', () => {
      expect(matchesTransactionFilters(tx(), { searchTerm: '900' })).toBe(true);
      expect(matchesTransactionFilters(tx(), { searchTerm: '901' })).toBe(false);
    });

    it('rejects a term that appears nowhere', () => {
      expect(matchesTransactionFilters(tx(), { searchTerm: 'groceries' })).toBe(false);
    });

    it('survives a row with no note or category', () => {
      expect(matchesTransactionFilters(tx({ note: null, category: undefined }), { searchTerm: 'x' })).toBe(false);
      expect(matchesTransactionFilters(tx({ note: null, category: undefined }))).toBe(true);
    });
  });

  describe('category', () => {
    it('passes "All" through', () => {
      expect(matchesTransactionFilters(tx(), { selectedCategory: 'All' })).toBe(true);
    });

    it('requires an exact match otherwise', () => {
      expect(matchesTransactionFilters(tx(), { selectedCategory: 'Other / Unexpected' })).toBe(true);
      expect(matchesTransactionFilters(tx(), { selectedCategory: 'Daily Living' })).toBe(false);
    });
  });

  describe('day filter', () => {
    const criteria = { selectedDay: 15, selectedMonth: 6, selectedYear: 2026 };

    it('matches the exact date', () => {
      expect(matchesTransactionFilters(tx({ date: '2026-07-15' }), criteria)).toBe(true);
    });

    it('rejects a different day in the same month', () => {
      expect(matchesTransactionFilters(tx({ date: '2026-07-16' }), criteria)).toBe(false);
    });

    // The regression this fix exists for: with the list scoped to all time, a
    // day-number-only match pulled in the 15th of every month.
    it('rejects the same day number in another month', () => {
      expect(matchesTransactionFilters(tx({ date: '2026-06-15' }), criteria)).toBe(false);
    });

    it('rejects the same day and month in another year', () => {
      expect(matchesTransactionFilters(tx({ date: '2025-07-15' }), criteria)).toBe(false);
    });

    // Month/year are optional, so the old day-of-month behaviour still works
    // for any caller that doesn't know which month it means.
    it('falls back to day-of-month when month and year are omitted', () => {
      expect(matchesTransactionFilters(tx({ date: '2026-06-15' }), { selectedDay: 15 })).toBe(true);
    });
  });

  describe('date range', () => {
    it('includes both bounds', () => {
      const criteria = { startDate: '2026-07-10', endDate: '2026-07-21' };
      expect(matchesTransactionFilters(tx({ date: '2026-07-10' }), criteria)).toBe(true);
      expect(matchesTransactionFilters(tx({ date: '2026-07-21' }), criteria)).toBe(true);
    });

    it('excludes outside the bounds', () => {
      const criteria = { startDate: '2026-07-10', endDate: '2026-07-21' };
      expect(matchesTransactionFilters(tx({ date: '2026-07-09' }), criteria)).toBe(false);
      expect(matchesTransactionFilters(tx({ date: '2026-07-22' }), criteria)).toBe(false);
    });

    it('applies an open-ended range', () => {
      expect(matchesTransactionFilters(tx({ date: '2026-07-21' }), { startDate: '2026-07-01' })).toBe(true);
      expect(matchesTransactionFilters(tx({ date: '2026-06-21' }), { startDate: '2026-07-01' })).toBe(false);
      expect(matchesTransactionFilters(tx({ date: '2026-07-21' }), { endDate: '2026-07-31' })).toBe(true);
    });

    // Both sides now parse as local dates. Reading the bound as UTC midnight
    // shifted the whole range back a day at any negative UTC offset.
    it('treats a boundary date as a local day, not a UTC instant', () => {
      expect(
        matchesTransactionFilters(tx({ date: '2026-07-10' }), { startDate: '2026-07-10', endDate: '2026-07-10' })
      ).toBe(true);
    });
  });

  describe('reimbursable', () => {
    it('keeps only linked rows when enabled', () => {
      const reimbursements = { t1: 'debt-1' };
      expect(matchesTransactionFilters(tx(), { reimbursableOnly: true, reimbursements })).toBe(true);
      expect(matchesTransactionFilters(tx({ id: 't2' }), { reimbursableOnly: true, reimbursements })).toBe(false);
    });

    it('ignores the link when disabled', () => {
      expect(matchesTransactionFilters(tx({ id: 't2' }), { reimbursableOnly: false, reimbursements: {} })).toBe(true);
    });
  });

  it('requires every active criterion to pass', () => {
    const criteria = { searchTerm: 'print', selectedCategory: 'Daily Living' };
    // Matches the search but not the category.
    expect(matchesTransactionFilters(tx(), criteria)).toBe(false);
  });
});

describe('filterTransactions', () => {
  // The six rows behind the "Print" search in the reported screenshot.
  const rows = [
    tx({ id: 'a', amount: 900, note: 'SAS Photo Print', date: '2026-07-21' }),
    tx({ id: 'b', amount: 10, category: 'Daily Living', note: 'Print', date: '2026-07-21' }),
    tx({ id: 'c', amount: 170, note: 'Print+Khata Binding Wool', date: '2026-07-20' }),
    tx({ id: 'd', amount: 70, note: 'Print', date: '2026-07-15' }),
    tx({ id: 'e', amount: 150, note: 'Print', date: '2026-07-11' }),
    tx({ id: 'f', amount: 60, note: 'Print', date: '2026-07-01' }),
    tx({ id: 'g', amount: 5000, category: 'Rent', note: 'July rent', date: '2026-07-05' }),
  ];

  it('returns only the matching rows', () => {
    const found = filterTransactions(rows, { searchTerm: 'Print' });
    expect(found.map((r) => r.id)).toEqual(['a', 'b', 'c', 'd', 'e', 'f']);
    expect(found.reduce((s, r) => s + r.amount, 0)).toBe(1360);
  });

  it('narrows further when filters combine', () => {
    const found = filterTransactions(rows, { searchTerm: 'Print', selectedCategory: 'Daily Living' });
    expect(found.map((r) => r.id)).toEqual(['b']);
  });

  it('returns everything when unfiltered', () => {
    expect(filterTransactions(rows, {})).toHaveLength(7);
  });
});
