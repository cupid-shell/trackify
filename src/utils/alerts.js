// Pure alert decisions extracted from AppContext so the rules that decide when
// you get warned — budget threshold, budget exhaustion, spend spike, savings
// milestone — are unit-testable in isolation.
//
// These decide WHETHER to alert and WHAT it says. They deliberately know nothing
// about how it is delivered; the context layers that on top (an in-app
// notification everywhere, plus a scheduled OS notification on Android).
// Behavior-identical to the inline versions they replace.

import { parseLocalDate } from './date';
import { formatCurrency } from './currency';

// Stable per-category notification id so Android replaces an existing alert
// instead of stacking duplicates. A djb2-style string hash, kept exactly as it
// was inline — changing it would orphan already-posted notifications.
export const categoryNotificationId = (base, category) =>
  base +
  (Math.abs(category.split('').reduce((h, c) => (h << 5) - h + c.charCodeAt(0), 0)) % 400);

// Month key used in the budget dedupe keys. 1-indexed and NOT zero-padded
// ("2026-7", not "2026-07") — matching the keys already written to localStorage.
export const budgetMonthKey = (date) => `${date.getFullYear()}-${date.getMonth() + 1}`;

// Day key (YYYY-MM-DD) used in the spend-spike dedupe key.
//
// The LOCAL date, so the once-a-day throttle rolls over at local midnight. The
// original used `new Date().toISOString()`, i.e. the UTC date, which in UTC+6
// reset the window at 6am local. On the one changeover day this switch may let a
// single already-throttled spike fire once more — harmless for a throttle key.
export const spikeDayKey = (date) => {
  const d = new Date(date);
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${month}-${day}`;
};

// Budget warning / exhaustion for the category a new expense just landed in.
//
// `transactions` must NOT already contain `newTx` — the caller fires this right
// after an optimistic insert, while the state closure is still the pre-insert
// list, so the new amount is added on separately.
//
// Returns a descriptor, or null when nothing should fire. At most one of the two
// ever fires: exhaustion takes precedence. If exhaustion is switched off but
// warnings are on, crossing 100% still produces a warning — that is the existing
// behavior of the original if/else-if chain, kept intentionally.
export const evaluateBudgetAlert = ({
  transactions,
  newTx,
  budgets = {},
  thresholdPercent = 85,
  warningEnabled = true,
  exhaustionEnabled = true,
  currency = 'BDT',
  now,
}) => {
  if (!warningEnabled && !exhaustionEnabled) return null;

  const cat = newTx.category;
  const limit = budgets[cat];
  if (!limit || limit <= 0) return null;

  const month = now.getMonth();
  const year = now.getFullYear();

  const spentSoFar = transactions
    .filter((tx) => {
      const txDate = parseLocalDate(tx.date);
      return (
        tx.type === 'expense' &&
        tx.category === cat &&
        txDate.getMonth() === month &&
        txDate.getFullYear() === year
      );
    })
    .reduce((sum, tx) => sum + Number(tx.amount), 0);

  const totalSpent = spentSoFar + Number(newTx.amount);
  const monthKey = budgetMonthKey(now);

  if (exhaustionEnabled && totalSpent >= limit) {
    return {
      kind: 'budget_exhausted',
      tone: 'danger',
      category: cat,
      totalSpent,
      limit,
      title: 'Budget Exhausted! 🛑',
      body: `You have spent ${formatCurrency(totalSpent, currency)} out of your ${formatCurrency(limit, currency)} budget limit for ${cat}.`,
      dedupeKey: `trackify_notified_budget_exhaust_${cat}_${monthKey}`,
      nativeId: categoryNotificationId(3500, cat),
    };
  }

  if (warningEnabled && totalSpent >= (limit * thresholdPercent) / 100) {
    return {
      kind: 'budget_warning',
      tone: 'warning',
      category: cat,
      totalSpent,
      limit,
      title: `Budget Warning: ${cat} ⚠️`,
      body: `You have spent ${formatCurrency(totalSpent, currency)} out of your ${formatCurrency(limit, currency)} budget limit for ${cat} (${Math.round((totalSpent / limit) * 100)}%).`,
      dedupeKey: `trackify_notified_budget_${cat}_${monthKey}`,
      nativeId: categoryNotificationId(3000, cat),
    };
  }

  return null;
};

// An expense far above what this category normally costs.
//
// NOTE: the average is over the category's ENTIRE history, not the current
// month, and needs at least 3 prior entries. Preserved as-is.
export const evaluateSpendSpike = ({
  transactions,
  newTx,
  enabled = true,
  currency = 'BDT',
  now,
}) => {
  if (!enabled) return null;

  const cat = newTx.category;
  const categoryTxs = transactions.filter((tx) => tx.type === 'expense' && tx.category === cat);
  if (categoryTxs.length < 3) return null;

  const total = categoryTxs.reduce((sum, tx) => sum + Number(tx.amount), 0);
  const average = total / categoryTxs.length;
  if (Number(newTx.amount) <= 3 * average) return null;

  return {
    kind: 'spend_spike',
    tone: 'warning',
    category: cat,
    amount: Number(newTx.amount),
    average,
    title: 'Unusual Spending Spike 🚨',
    body: `You just logged a ${formatCurrency(newTx.amount, currency)} expense for ${cat}, which is significantly higher than your typical average (${formatCurrency(Math.round(average), currency)}).`,
    // Throttled to one spike per category per day.
    dedupeKey: `trackify_notified_spike_${cat}_${spikeDayKey(now)}`,
    nativeId: categoryNotificationId(5000, cat),
  };
};

const MILESTONE_TITLES = {
  50: 'Halfway there! 🎯',
  75: 'Almost completed! 🚀',
  100: 'Goal Achieved! 🎉',
};

// A savings goal crossing 50 / 75 / 100%.
//
// Unlike the others this has no dedupe key: the crossing test itself is the
// guard, since it compares the percentage before against the percentage after.
export const evaluateSavingsMilestone = ({
  goal,
  nextAmount,
  enabled = true,
  currency = 'BDT',
}) => {
  if (!enabled) return null;

  const target = Number(goal.target_amount);
  if (!target || target <= 0) return null;

  // Compare raw ratios, not rounded percentages. Rounding the "before" value
  // UP — 99.6% became 100 — used to make `before < 100` false and swallow the
  // very crossing we most want to celebrate. The same bug ate the 50% and 75%
  // milestones whenever the balance sat within half a percent below them.
  const before = (Number(goal.current_amount) || 0) / target;
  const after = Number(nextAmount) / target;

  // First (lowest) crossing wins, so jumping 0 -> 100% reports 50, as before.
  let milestone = null;
  for (const t of [50, 75, 100]) {
    if (before < t / 100 && after >= t / 100) {
      milestone = t;
      break;
    }
  }

  if (!milestone) return null;

  const body =
    milestone === 100
      ? `Congratulations! You have fully achieved your "${goal.name}" savings goal!`
      : `Your savings goal "${goal.name}" is now ${milestone}% complete (${formatCurrency(nextAmount, currency)}/${formatCurrency(target, currency)}).`;

  return {
    kind: 'savings_milestone',
    tone: milestone === 100 ? 'success' : 'info',
    milestone,
    goalName: goal.name,
    title: MILESTONE_TITLES[milestone],
    body,
    dedupeKey: null,
    // `goal.id` is a UUID, so the last four characters are usually hex and
    // Number() gives NaN -> 0. Kept as-is; collisions only replace a
    // notification the user has already seen.
    nativeId: 4000 + milestone + (Number(String(goal.id).slice(-4)) || 0),
  };
};
