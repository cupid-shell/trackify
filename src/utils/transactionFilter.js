// The History list's filter predicate, pulled out of RecentTransactions so it
// can be unit-tested. Every filter in the toolbar — search text, category, date
// range, a heatmap day click, reimbursable-only — funnels through here, and the
// list, the running total and both exports all read the same result.

import { parseLocalDate } from './date';

export const matchesTransactionFilters = (
  tx,
  {
    searchTerm = '',
    selectedCategory = 'All',
    startDate = '',
    endDate = '',
    selectedDay = null,
    selectedMonth = null,
    selectedYear = null,
    reimbursableOnly = false,
    reimbursements = {},
  } = {}
) => {
  const txDate = parseLocalDate(tx.date);

  // Day filter matches the WHOLE date. The chip calls this "Filtered by Date:
  // July 15, 2026", and matching the day number alone would pull in the 15th of
  // every month once the list is scoped to all time. Month/year are optional so
  // a caller that only knows the day still gets the old day-of-month behaviour.
  if (selectedDay !== null) {
    if (txDate.getDate() !== selectedDay) return false;
    if (selectedMonth !== null && txDate.getMonth() !== selectedMonth) return false;
    if (selectedYear !== null && txDate.getFullYear() !== selectedYear) return false;
  }

  if (reimbursableOnly && !reimbursements[tx.id]) return false;

  const term = searchTerm.toLowerCase();
  const matchesSearch =
    (tx.category || '').toLowerCase().includes(term) ||
    (tx.note || '').toLowerCase().includes(term) ||
    String(tx.amount).includes(searchTerm);
  if (!matchesSearch) return false;

  if (selectedCategory !== 'All' && tx.category !== selectedCategory) return false;

  // Bounds go through parseLocalDate like the row's own date does. `new
  // Date('2026-07-15')` parses as UTC midnight, which lands on the previous
  // local day at any negative UTC offset and silently shifted the range by one.
  if (startDate && txDate < parseLocalDate(startDate)) return false;
  if (endDate && txDate > parseLocalDate(endDate)) return false;

  return true;
};

export const filterTransactions = (transactions, criteria) =>
  transactions.filter((tx) => matchesTransactionFilters(tx, criteria));
