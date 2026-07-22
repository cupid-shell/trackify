import { describe, it, expect } from 'vitest';
import {
  categoryNotificationId,
  budgetMonthKey,
  spikeDayKey,
  evaluateBudgetAlert,
  evaluateSpendSpike,
  evaluateSavingsMilestone,
} from './alerts';

// 2026-07-15, local midday so the local and UTC dates agree for most assertions.
const NOW = new Date(2026, 6, 15, 12, 0, 0);

const expense = (amount, category, date, extra = {}) => ({
  type: 'expense',
  amount,
  category,
  date,
  ...extra,
});

describe('categoryNotificationId', () => {
  it('is deterministic for the same category', () => {
    expect(categoryNotificationId(3000, 'Food')).toBe(categoryNotificationId(3000, 'Food'));
  });

  it('stays inside its 400-wide band', () => {
    ['Food', 'Rent', 'Transport', 'Entertainment', ''].forEach((cat) => {
      const id = categoryNotificationId(3000, cat);
      expect(id).toBeGreaterThanOrEqual(3000);
      expect(id).toBeLessThan(3400);
    });
  });

  it('keeps the three alert families in separate bands', () => {
    expect(categoryNotificationId(3000, 'Food')).toBeLessThan(3400);
    expect(categoryNotificationId(3500, 'Food')).toBeGreaterThanOrEqual(3500);
    expect(categoryNotificationId(5000, 'Food')).toBeGreaterThanOrEqual(5000);
  });
});

describe('budgetMonthKey', () => {
  // Pins the on-disk key format: 1-indexed, not zero-padded. Existing dedupe
  // entries in localStorage use this exact shape.
  it('is 1-indexed and unpadded', () => {
    expect(budgetMonthKey(new Date(2026, 6, 15))).toBe('2026-7');
    expect(budgetMonthKey(new Date(2026, 0, 1))).toBe('2026-1');
    expect(budgetMonthKey(new Date(2026, 11, 31))).toBe('2026-12');
  });
});

describe('spikeDayKey', () => {
  // Built from local components and read back as local, so the assertion holds
  // in any timezone the test runner happens to be in.
  it('is the local date', () => {
    expect(spikeDayKey(new Date(2026, 6, 15, 2, 0, 0))).toBe('2026-07-15');
    expect(spikeDayKey(new Date(2026, 6, 15, 23, 30, 0))).toBe('2026-07-15');
  });

  it('zero-pads month and day', () => {
    expect(spikeDayKey(new Date(2026, 0, 5, 12, 0, 0))).toBe('2026-01-05');
  });
});

describe('evaluateBudgetAlert', () => {
  const base = {
    transactions: [],
    newTx: expense(100, 'Food', '2026-07-15'),
    budgets: { Food: 1000 },
    currency: 'BDT',
    now: NOW,
  };

  it('returns null when the category has no budget', () => {
    expect(evaluateBudgetAlert({ ...base, budgets: {} })).toBeNull();
    expect(evaluateBudgetAlert({ ...base, budgets: { Food: 0 } })).toBeNull();
  });

  it('returns null when both alert types are disabled', () => {
    expect(
      evaluateBudgetAlert({
        ...base,
        newTx: expense(2000, 'Food', '2026-07-15'),
        warningEnabled: false,
        exhaustionEnabled: false,
      })
    ).toBeNull();
  });

  it('stays quiet below the threshold', () => {
    expect(evaluateBudgetAlert(base)).toBeNull();
  });

  it('warns at the threshold and reports the running total', () => {
    const result = evaluateBudgetAlert({
      ...base,
      transactions: [expense(800, 'Food', '2026-07-02')],
      newTx: expense(50, 'Food', '2026-07-15'),
    });
    expect(result.kind).toBe('budget_warning');
    expect(result.totalSpent).toBe(850); // 85% of 1000, exactly on the line
    expect(result.tone).toBe('warning');
    expect(result.dedupeKey).toBe('trackify_notified_budget_Food_2026-7');
    expect(result.body).toContain('৳850');
    expect(result.body).toContain('(85%)');
  });

  it('honours a custom threshold', () => {
    const args = {
      ...base,
      transactions: [expense(500, 'Food', '2026-07-02')],
      newTx: expense(10, 'Food', '2026-07-15'),
    };
    expect(evaluateBudgetAlert(args)).toBeNull();
    expect(evaluateBudgetAlert({ ...args, thresholdPercent: 50 }).kind).toBe('budget_warning');
  });

  it('escalates to exhausted at 100% and prefers it over the warning', () => {
    const result = evaluateBudgetAlert({
      ...base,
      transactions: [expense(900, 'Food', '2026-07-02')],
      newTx: expense(200, 'Food', '2026-07-15'),
    });
    expect(result.kind).toBe('budget_exhausted');
    expect(result.tone).toBe('danger');
    expect(result.totalSpent).toBe(1100);
    expect(result.dedupeKey).toBe('trackify_notified_budget_exhaust_Food_2026-7');
    expect(result.nativeId).not.toBe(categoryNotificationId(3000, 'Food'));
  });

  // Documents a real quirk of the original if/else-if: switching exhaustion off
  // does not silence 100% — it downgrades it to a warning.
  it('falls back to a warning at 100% when exhaustion is disabled', () => {
    const result = evaluateBudgetAlert({
      ...base,
      transactions: [expense(900, 'Food', '2026-07-02')],
      newTx: expense(200, 'Food', '2026-07-15'),
      exhaustionEnabled: false,
    });
    expect(result.kind).toBe('budget_warning');
  });

  it('is silent at 100% when only exhaustion is enabled and it is off', () => {
    const result = evaluateBudgetAlert({
      ...base,
      transactions: [expense(900, 'Food', '2026-07-02')],
      newTx: expense(200, 'Food', '2026-07-15'),
      warningEnabled: false,
    });
    expect(result.kind).toBe('budget_exhausted');
  });

  it('counts only this month, this category, and only expenses', () => {
    const result = evaluateBudgetAlert({
      ...base,
      transactions: [
        expense(900, 'Food', '2026-06-30'), // last month
        expense(900, 'Rent', '2026-07-02'), // other category
        { type: 'income', amount: 900, category: 'Food', date: '2026-07-03' },
      ],
      newTx: expense(200, 'Food', '2026-07-15'),
    });
    // Only the 200 counts, which is under the 850 threshold.
    expect(result).toBeNull();
  });

  it('does not double-count the new transaction if the caller passes a stale list', () => {
    const result = evaluateBudgetAlert({
      ...base,
      transactions: [expense(850, 'Food', '2026-07-02')],
      newTx: expense(0, 'Food', '2026-07-15'),
    });
    expect(result.totalSpent).toBe(850);
  });
});

describe('evaluateSpendSpike', () => {
  const history = [
    expense(100, 'Food', '2026-07-01'),
    expense(100, 'Food', '2026-07-02'),
    expense(100, 'Food', '2026-07-03'),
  ];
  const base = { transactions: history, enabled: true, currency: 'BDT', now: NOW };

  it('returns null when disabled', () => {
    expect(
      evaluateSpendSpike({ ...base, newTx: expense(9999, 'Food', '2026-07-15'), enabled: false })
    ).toBeNull();
  });

  it('needs at least three prior entries in the category', () => {
    expect(
      evaluateSpendSpike({
        ...base,
        transactions: history.slice(0, 2),
        newTx: expense(9999, 'Food', '2026-07-15'),
      })
    ).toBeNull();
  });

  it('fires only above 3x the all-time category average', () => {
    // average is 100, so 300 is not a spike but 301 is.
    expect(evaluateSpendSpike({ ...base, newTx: expense(300, 'Food', '2026-07-15') })).toBeNull();
    const hit = evaluateSpendSpike({ ...base, newTx: expense(301, 'Food', '2026-07-15') });
    expect(hit.kind).toBe('spend_spike');
    expect(hit.average).toBe(100);
    expect(hit.dedupeKey).toBe('trackify_notified_spike_Food_2026-07-15');
    expect(hit.body).toContain('৳301');
  });

  it('averages only over the matching category', () => {
    const result = evaluateSpendSpike({
      ...base,
      transactions: [...history, expense(10000, 'Rent', '2026-07-04')],
      newTx: expense(400, 'Food', '2026-07-15'),
    });
    expect(result.average).toBe(100);
  });

  it('ignores income when averaging', () => {
    const result = evaluateSpendSpike({
      ...base,
      transactions: [...history, { type: 'income', amount: 9000, category: 'Food', date: '2026-07-04' }],
      newTx: expense(400, 'Food', '2026-07-15'),
    });
    expect(result.average).toBe(100);
  });

  it('averages only over the rolling window, not all-time', () => {
    const result = evaluateSpendSpike({
      ...base,
      transactions: [
        expense(5000, 'Food', '2026-01-01'), // ~6 months ago — outside 90 days
        expense(5000, 'Food', '2026-02-01'), // outside
        ...history, // three recent 100s
      ],
      newTx: expense(301, 'Food', '2026-07-15'),
    });
    // The two old 5000s are excluded, so the average is 100 and 301 is a spike.
    expect(result.kind).toBe('spend_spike');
    expect(result.average).toBe(100);
  });

  it('stays quiet when there are fewer than three entries inside the window', () => {
    const result = evaluateSpendSpike({
      ...base,
      transactions: [
        expense(100, 'Food', '2026-01-01'), // outside the window
        expense(100, 'Food', '2026-02-01'), // outside
        expense(100, 'Food', '2026-07-01'), // only one inside
      ],
      newTx: expense(9999, 'Food', '2026-07-15'),
    });
    expect(result).toBeNull();
  });

  it('honours a custom window length', () => {
    const args = {
      ...base,
      transactions: [
        expense(100, 'Food', '2026-06-01'), // 44 days before NOW
        expense(100, 'Food', '2026-06-15'),
        expense(100, 'Food', '2026-07-01'),
      ],
      newTx: expense(500, 'Food', '2026-07-15'),
    };
    // 30-day window drops everything before mid-June, leaving <3 in window.
    expect(evaluateSpendSpike({ ...args, windowDays: 30 })).toBeNull();
    expect(evaluateSpendSpike({ ...args, windowDays: 90 }).kind).toBe('spend_spike');
  });
});

describe('evaluateSavingsMilestone', () => {
  const goal = { id: 'a1b2c3d4-0000-0000-0000-000000001234', name: 'Laptop', target_amount: 1000, current_amount: 0 };

  it('returns null when disabled or the target is unusable', () => {
    expect(evaluateSavingsMilestone({ goal, nextAmount: 900, enabled: false })).toBeNull();
    expect(
      evaluateSavingsMilestone({ goal: { ...goal, target_amount: 0 }, nextAmount: 900 })
    ).toBeNull();
  });

  it('fires on each crossing', () => {
    expect(evaluateSavingsMilestone({ goal, nextAmount: 500 }).milestone).toBe(50);
    expect(
      evaluateSavingsMilestone({ goal: { ...goal, current_amount: 500 }, nextAmount: 750 }).milestone
    ).toBe(75);
    expect(
      evaluateSavingsMilestone({ goal: { ...goal, current_amount: 750 }, nextAmount: 1000 })
        .milestone
    ).toBe(100);
  });

  it('does not re-fire a milestone already passed', () => {
    expect(
      evaluateSavingsMilestone({ goal: { ...goal, current_amount: 600 }, nextAmount: 700 })
    ).toBeNull();
  });

  it('reports only the lowest crossing when several are jumped at once', () => {
    // 0 -> 100% crosses 50, 75 and 100; the original returns the first match.
    expect(evaluateSavingsMilestone({ goal, nextAmount: 1000 }).milestone).toBe(50);
  });

  // Regression guard for the rounding fix: a balance sitting within half a
  // percent below the target used to round to 100 and swallow the crossing.
  it('still fires the 100% crossing when the balance was already ~100%', () => {
    expect(
      evaluateSavingsMilestone({ goal: { ...goal, current_amount: 999 }, nextAmount: 1000 }).milestone
    ).toBe(100);
  });

  it('still fires a lower crossing when the balance was just below it', () => {
    // 49.7% -> 50% used to be eaten by rounding 49.7 up to 50.
    expect(
      evaluateSavingsMilestone({ goal: { ...goal, current_amount: 497 }, nextAmount: 500 }).milestone
    ).toBe(50);
  });

  it('uses the celebratory copy at 100% and a progress line below it', () => {
    const done = evaluateSavingsMilestone({ goal: { ...goal, current_amount: 900 }, nextAmount: 1000 });
    expect(done.title).toBe('Goal Achieved! 🎉');
    expect(done.body).toContain('fully achieved');
    expect(done.tone).toBe('success');

    const half = evaluateSavingsMilestone({ goal, nextAmount: 500 });
    expect(half.body).toContain('50% complete');
    expect(half.body).toContain('৳500/৳1,000');
  });

  it('survives a UUID id whose tail is not numeric', () => {
    const result = evaluateSavingsMilestone({ goal, nextAmount: 500 });
    expect(Number.isFinite(result.nativeId)).toBe(true);
    expect(result.nativeId).toBe(4000 + 50 + 1234);
  });

  it('has no dedupe key — the crossing test is the guard', () => {
    expect(evaluateSavingsMilestone({ goal, nextAmount: 500 }).dedupeKey).toBeNull();
  });
});
