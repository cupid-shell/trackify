// Pure financial calculations extracted verbatim from AppContext so the numbers
// users trust (monthly totals, balance, budget rollover) are unit-testable in
// isolation. These must stay behavior-identical to the context — the context
// imports and calls them rather than keeping its own copy.

import { parseLocalDate } from './date';

// Transactions that fall in a given month/year (local time, TZ-safe via parseLocalDate).
export const filterByMonth = (transactions, month, year) =>
  transactions.filter((tx) => {
    const d = parseLocalDate(tx.date);
    return d.getMonth() === month && d.getFullYear() === year;
  });

// Sum the amounts of all transactions of a given type ('income' | 'expense').
export const sumByType = (transactions, type) =>
  transactions
    .filter((tx) => tx.type === type)
    .reduce((sum, tx) => sum + Number(tx.amount), 0);

// Monthly totals for an already month-filtered set of transactions.
// totalIncome = base income + this month's income entries (allowances).
export const computeMonthTotals = (monthTransactions, baseIncome) => {
  const totalAllowances = sumByType(monthTransactions, 'income');
  const totalExpenses = sumByType(monthTransactions, 'expense');
  const totalIncome = Number(baseIncome) + totalAllowances;
  return {
    totalAllowances,
    totalIncome,
    totalExpenses,
    balance: totalIncome - totalExpenses,
  };
};

// Budget rollover: for each rollover-enabled category, unspent budget carries
// forward month to month (never negative). Walks every month from the oldest
// transaction up to the selected month, and returns a map of
// `${year}-${month}` -> { category: rolloverAmount } (month is 0-indexed).
export const computeRollovers = ({
  transactions,
  enabledCategories = [],
  budgets = {},
  selectedYear,
  selectedMonth,
}) => {
  if (enabledCategories.length === 0 || transactions.length === 0) return {};

  const sortedTxs = [...transactions].sort((a, b) => new Date(a.date) - new Date(b.date));
  if (sortedTxs.length === 0) return {};

  const oldestDate = parseLocalDate(sortedTxs[0].date);
  const currentDate = new Date(selectedYear, selectedMonth, 1);

  const monthsList = [];
  let d = new Date(oldestDate.getFullYear(), oldestDate.getMonth(), 1);
  while (d <= currentDate) {
    monthsList.push({ month: d.getMonth(), year: d.getFullYear() });
    d = new Date(d.getFullYear(), d.getMonth() + 1, 1);
  }

  const rollovers = {};
  const previousRollover = {};

  enabledCategories.forEach((cat) => {
    previousRollover[cat] = 0;
  });

  monthsList.forEach(({ month, year }) => {
    const monthKey = `${year}-${month}`;

    // The rollover that applies TO this month is what carried in from the prior one.
    rollovers[monthKey] = { ...previousRollover };

    const monthTxs = transactions.filter((tx) => {
      const txDate = parseLocalDate(tx.date);
      return tx.type === 'expense' && txDate.getMonth() === month && txDate.getFullYear() === year;
    });

    const spentByCategory = {};
    monthTxs.forEach((tx) => {
      spentByCategory[tx.category] = (spentByCategory[tx.category] || 0) + Number(tx.amount);
    });

    enabledCategories.forEach((cat) => {
      const baseLimit = Number(budgets[cat] || 0);
      if (baseLimit > 0) {
        const appliedRollover = previousRollover[cat] || 0;
        const effectiveLimit = baseLimit + appliedRollover;
        const spent = spentByCategory[cat] || 0;
        const surplus = effectiveLimit - spent;
        previousRollover[cat] = Math.max(0, surplus);
      } else {
        previousRollover[cat] = 0;
      }
    });
  });

  return rollovers;
};
