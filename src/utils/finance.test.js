import { describe, it, expect } from 'vitest';
import { filterByMonth, sumByType, computeMonthTotals, computeRollovers } from './finance';

const tx = (date, type, amount, category = 'Food') => ({ date, type, amount, category });

describe('filterByMonth', () => {
  const txs = [
    tx('2026-01-15', 'expense', 100),
    tx('2026-02-01', 'expense', 200),
    tx('2025-01-20', 'income', 300),
  ];

  it('keeps only transactions in the given month/year (0-indexed month)', () => {
    expect(filterByMonth(txs, 0, 2026)).toEqual([tx('2026-01-15', 'expense', 100)]);
    expect(filterByMonth(txs, 1, 2026)).toEqual([tx('2026-02-01', 'expense', 200)]);
    expect(filterByMonth(txs, 0, 2025)).toEqual([tx('2025-01-20', 'income', 300)]);
  });

  it('returns empty when nothing matches', () => {
    expect(filterByMonth(txs, 5, 2026)).toEqual([]);
  });
});

describe('sumByType', () => {
  const txs = [
    tx('2026-01-01', 'income', 1000),
    tx('2026-01-02', 'expense', '300'), // string amount -> Number()
    tx('2026-01-03', 'expense', 200),
  ];

  it('sums amounts of a type and coerces string amounts', () => {
    expect(sumByType(txs, 'income')).toBe(1000);
    expect(sumByType(txs, 'expense')).toBe(500);
  });

  it('is 0 for an absent type or empty list', () => {
    expect(sumByType(txs, 'transfer')).toBe(0);
    expect(sumByType([], 'expense')).toBe(0);
  });
});

describe('computeMonthTotals', () => {
  it('adds this month income to base income and nets out expenses', () => {
    const txs = [
      tx('2026-01-01', 'income', 1000),
      tx('2026-01-02', 'expense', 300),
      tx('2026-01-03', 'expense', '200'),
    ];
    expect(computeMonthTotals(txs, 5000)).toEqual({
      totalAllowances: 1000,
      totalExpenses: 500,
      totalIncome: 6000,
      balance: 5500,
    });
  });

  it('handles a string base income and no transactions', () => {
    expect(computeMonthTotals([], '5000')).toEqual({
      totalAllowances: 0,
      totalExpenses: 0,
      totalIncome: 5000,
      balance: 5000,
    });
  });
});

describe('computeRollovers', () => {
  it('returns {} when no categories are rollover-enabled', () => {
    expect(computeRollovers({
      transactions: [tx('2026-01-05', 'expense', 100)],
      enabledCategories: [],
      budgets: { Food: 500 },
      selectedYear: 2026,
      selectedMonth: 0,
    })).toEqual({});
  });

  it('returns {} when there are no transactions', () => {
    expect(computeRollovers({
      transactions: [],
      enabledCategories: ['Food'],
      budgets: { Food: 500 },
      selectedYear: 2026,
      selectedMonth: 0,
    })).toEqual({});
  });

  it('carries an under-budget surplus into the next month', () => {
    // Jan: spend 300 of a 500 budget -> 200 surplus should apply TO Feb.
    const result = computeRollovers({
      transactions: [tx('2026-01-10', 'expense', 300)],
      enabledCategories: ['Food'],
      budgets: { Food: 500 },
      selectedYear: 2026,
      selectedMonth: 1, // view February
    });
    expect(result['2026-0']).toEqual({ Food: 0 });   // nothing carried into January
    expect(result['2026-1']).toEqual({ Food: 200 }); // 200 carried into February
  });

  it('never carries a negative rollover when over budget', () => {
    const result = computeRollovers({
      transactions: [tx('2026-01-10', 'expense', 600)], // 100 over a 500 budget
      enabledCategories: ['Food'],
      budgets: { Food: 500 },
      selectedYear: 2026,
      selectedMonth: 1,
    });
    expect(result['2026-1']).toEqual({ Food: 0 });
  });

  it('gives no rollover when the category has no budget', () => {
    const result = computeRollovers({
      transactions: [tx('2026-01-10', 'expense', 50, 'Gifts')],
      enabledCategories: ['Gifts'],
      budgets: {}, // no budget for Gifts
      selectedYear: 2026,
      selectedMonth: 1,
    });
    expect(result['2026-1']).toEqual({ Gifts: 0 });
  });

  it('compounds surplus across several months', () => {
    // Jan spend 300 (+200 surplus) -> Feb budget 700, spend 400 (+300 surplus) -> Mar sees 300.
    const result = computeRollovers({
      transactions: [
        tx('2026-01-10', 'expense', 300),
        tx('2026-02-10', 'expense', 400),
      ],
      enabledCategories: ['Food'],
      budgets: { Food: 500 },
      selectedYear: 2026,
      selectedMonth: 2, // view March
    });
    expect(result['2026-1']).toEqual({ Food: 200 });
    expect(result['2026-2']).toEqual({ Food: 300 });
  });
});
