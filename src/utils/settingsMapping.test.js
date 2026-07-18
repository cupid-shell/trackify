import { describe, it, expect } from 'vitest';
import { mapSettingsRow, readSkippedBills } from './settingsMapping';

// Mirrors AppContext's defaultSettings closely enough to exercise every fallback.
const DEFAULTS = {
  base_income: 15000,
  savings_goal: 3000,
  expense_categories: ['Seat Rent', 'Food & Dining', 'Transport'],
  income_categories: ['Allowance', 'Bonus', 'Other'],
  category_budgets: {},
  savings_goals: [],
  category_metadata: {},
  presets: [{ label: 'default preset' }],
  recurring_bills: [{ name: 'default bill' }],
  notification_preferences: { budget_alerts: true, budget_threshold: '85' },
  currency: 'BDT',
};

const FULL_ROW = {
  base_income: 20000,
  savings_goal: 5000,
  expense_categories: ['Rent', 'Groceries'],
  income_categories: ['Salary'],
  category_budgets: { Rent: 3000 },
  savings_goals: [{ name: 'Laptop', target: 50000 }],
  category_metadata: { _currency: 'USD', _payment_methods: ['Cash'] },
  presets: [{ label: 'row preset' }],
  recurring_bills: [{ name: 'row bill' }],
  notification_preferences: { budget_alerts: false },
};

describe('mapSettingsRow', () => {
  it('maps a fully-populated row, preferring columns over defaults', () => {
    const s = mapSettingsRow(FULL_ROW, DEFAULTS);
    expect(s.base_income).toBe(20000);
    expect(s.savings_goal).toBe(5000);
    expect(s.expense_categories).toEqual(['Rent', 'Groceries']);
    expect(s.income_categories).toEqual(['Salary']);
    expect(s.category_budgets).toEqual({ Rent: 3000 });
    expect(s.savings_goals).toEqual([{ name: 'Laptop', target: 50000 }]);
    expect(s.presets).toEqual([{ label: 'row preset' }]);
    expect(s.recurring_bills).toEqual([{ name: 'row bill' }]);
    expect(s.notification_preferences).toEqual({ budget_alerts: false });
  });

  it('falls back to defaults for an empty row', () => {
    const s = mapSettingsRow({}, DEFAULTS);
    expect(s.base_income).toBe(15000);
    expect(s.savings_goal).toBe(3000);
    expect(s.expense_categories).toEqual(DEFAULTS.expense_categories);
    expect(s.income_categories).toEqual(DEFAULTS.income_categories);
    expect(s.presets).toEqual(DEFAULTS.presets);
    expect(s.recurring_bills).toEqual(DEFAULTS.recurring_bills);
    expect(s.notification_preferences).toEqual(DEFAULTS.notification_preferences);
    expect(s.category_metadata).toEqual({});
    expect(s.category_budgets).toEqual({});
    expect(s.savings_goals).toEqual([]);
  });

  it('falls through a null column to the category_metadata bag', () => {
    const row = {
      presets: null,
      recurring_bills: null,
      notification_preferences: null,
      category_metadata: {
        _presets: [{ label: 'meta preset' }],
        _recurring_bills: [{ name: 'meta bill' }],
        _notification_preferences: { budget_alerts: false, budget_threshold: '50' },
      },
    };
    const s = mapSettingsRow(row, DEFAULTS);
    expect(s.presets).toEqual([{ label: 'meta preset' }]);
    expect(s.recurring_bills).toEqual([{ name: 'meta bill' }]);
    expect(s.notification_preferences).toEqual({ budget_alerts: false, budget_threshold: '50' });
  });

  it('falls through a missing column to the bag, then to defaults', () => {
    const onlyMeta = mapSettingsRow({ category_metadata: { _presets: [{ label: 'm' }] } }, DEFAULTS);
    expect(onlyMeta.presets).toEqual([{ label: 'm' }]);
    // recurring_bills is in neither column nor bag -> defaults
    expect(onlyMeta.recurring_bills).toEqual(DEFAULTS.recurring_bills);
  });

  it('honours an explicitly empty array in the bag rather than skipping to defaults', () => {
    // `_presets: []` is a real user state (they deleted every preset) and must
    // not be treated as "absent" — the guard is `!== undefined`, not truthiness.
    const s = mapSettingsRow({ category_metadata: { _presets: [] } }, DEFAULTS);
    expect(s.presets).toEqual([]);
  });

  // --- Regression guard: this is what pins the realtime-handler bug fix. ---
  // The realtime settings handler used to omit `currency` from its setUserSettings
  // object, so a settings write from another tab silently reset the user's
  // currency. Both paths now go through this function; if `currency` ever stops
  // being derived from the metadata bag, this fails.
  it('derives currency from category_metadata._currency', () => {
    expect(mapSettingsRow(FULL_ROW, DEFAULTS).currency).toBe('USD');
  });

  it('defaults currency when the bag has no _currency', () => {
    expect(mapSettingsRow({ category_metadata: {} }, DEFAULTS).currency).toBe('BDT');
    expect(mapSettingsRow({}, DEFAULTS).currency).toBe('BDT');
  });

  it('always returns an object for category_metadata, even when the column is null', () => {
    expect(mapSettingsRow({ category_metadata: null }, DEFAULTS).category_metadata).toEqual({});
  });

  it('does not mutate the input row', () => {
    const row = { ...FULL_ROW, category_metadata: { ...FULL_ROW.category_metadata } };
    const snapshot = JSON.parse(JSON.stringify(row));
    mapSettingsRow(row, DEFAULTS);
    expect(row).toEqual(snapshot);
  });
});

describe('readSkippedBills', () => {
  it('reads the skipped-bills list out of the metadata bag', () => {
    const row = { category_metadata: { _skipped_bills: ['Seat Rent-2026-7'] } };
    expect(readSkippedBills(row)).toEqual(['Seat Rent-2026-7']);
  });

  it('returns an empty array when the key, the bag, or the row is missing', () => {
    expect(readSkippedBills({ category_metadata: {} })).toEqual([]);
    expect(readSkippedBills({})).toEqual([]);
    expect(readSkippedBills(null)).toEqual([]);
    expect(readSkippedBills(undefined)).toEqual([]);
  });
});
