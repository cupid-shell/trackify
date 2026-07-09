// Pure financial-health scoring extracted from HealthScore.jsx so the score,
// grade, streaks and achievement conditions are unit-testable. Behavior-identical
// to the component, which imports these and only layers the icons on top.

import { parseLocalDate } from './date';

// Letter grade + feedback + glow colour for an overall 0–100 score.
export const gradeFor = (overallScore) => {
  if (overallScore >= 95) return { grade: 'A+', feedback: 'Outstanding financial discipline! You have immaculate budgeting and exceptional saving habits.', glowColor: 'rgba(16, 185, 129, 0.5)' };
  if (overallScore >= 90) return { grade: 'A', feedback: 'Excellent habits! Budget is under full control, and you are saving a healthy chunk of your income.', glowColor: 'rgba(16, 185, 129, 0.4)' };
  if (overallScore >= 80) return { grade: 'B', feedback: 'Solid performance. You maintain a good financial cushion, but look for small areas to optimize.', glowColor: 'rgba(6, 182, 212, 0.4)' };
  if (overallScore >= 70) return { grade: 'C', feedback: 'Fair health. Some budgets are getting tight or exceeded. Keep check of discretionary expenses.', glowColor: 'rgba(245, 158, 11, 0.4)' };
  if (overallScore >= 60) return { grade: 'D', feedback: 'Vulnerable status. Saving rate is low and/or multiple budgets are exceeded. Action is advised.', glowColor: 'rgba(239, 68, 68, 0.3)' };
  return { grade: 'F', feedback: 'Critical alert. Your expenditures exceed your targets/income. Time to review habits immediately!', glowColor: 'rgba(239, 68, 68, 0.5)' };
};

// The five monthly achievements — data only (the component maps `id` -> icon).
export const buildAchievements = ({ budgetedCount, exceededCount, maxStreak, savingsRate, txCount, recurringBillsCount }) => [
  {
    id: 'budget_shield',
    name: 'Budget Shield',
    desc: 'Keep all budgeted categories within their limits this month.',
    unlocked: budgetedCount > 0 && exceededCount === 0,
    progress: budgetedCount > 0 ? Math.round(((budgetedCount - exceededCount) / budgetedCount) * 100) : 100,
    statusLabel: budgetedCount > 0 ? `${budgetedCount - exceededCount}/${budgetedCount} categories` : 'No active budgets',
    color: '#10b981',
  },
  {
    id: 'streak_star',
    name: 'Streak Star',
    desc: 'Log a streak of 3+ consecutive no-spend days.',
    unlocked: maxStreak >= 3,
    progress: Math.min(100, Math.round((maxStreak / 3) * 100)),
    statusLabel: `${maxStreak}/3 days streak`,
    color: '#f59e0b',
  },
  {
    id: 'super_saver',
    name: 'Super Saver',
    desc: 'Save more than 30% of your total income.',
    unlocked: savingsRate >= 0.3,
    progress: Math.min(100, Math.round((savingsRate / 0.3) * 100)),
    statusLabel: `${Math.round(savingsRate * 100)}% / 30% goal`,
    color: '#06b6d4',
  },
  {
    id: 'log_legend',
    name: 'Log Legend',
    desc: 'Log 15 or more transactions in a single month.',
    unlocked: txCount >= 15,
    progress: Math.min(100, Math.round((txCount / 15) * 100)),
    statusLabel: `${txCount}/15 transactions`,
    color: '#a855f7',
  },
  {
    id: 'recurring_master',
    name: 'Punctual Saver',
    desc: 'Have active recurring bills set up for automatic logging.',
    unlocked: recurringBillsCount > 0,
    progress: recurringBillsCount > 0 ? 100 : 0,
    statusLabel: recurringBillsCount > 0 ? 'Active' : 'No bills configured',
    color: '#f43f5e',
  },
];

// Overall monthly health: 50% budget adherence, 30% savings rate, 20% no-spend days.
// `now` is injected so the "current month" / active-days logic is deterministic in tests.
export const computeHealthScore = ({
  currentMonthTransactions,
  budgets = {},
  totalIncome,
  totalExpenses,
  balance,
  selectedMonth,
  selectedYear,
  recurringBillsCount = 0,
  now = new Date(),
}) => {
  const isCurrentMonth = selectedMonth === now.getMonth() && selectedYear === now.getFullYear();
  const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
  const activeDays = isCurrentMonth ? Math.max(1, now.getDate()) : daysInMonth;

  // 1. Budget adherence
  const budgetedCategories = Object.keys(budgets);
  let budgetScore;
  let exceededCount = 0;

  if (budgetedCategories.length > 0) {
    const spentByCategory = {};
    currentMonthTransactions
      .filter((tx) => tx.type === 'expense')
      .forEach((tx) => {
        spentByCategory[tx.category] = (spentByCategory[tx.category] || 0) + Number(tx.amount);
      });

    budgetedCategories.forEach((cat) => {
      if ((spentByCategory[cat] || 0) > budgets[cat]) exceededCount++;
    });
    budgetScore = Math.max(0, 100 * (1 - exceededCount / budgetedCategories.length));
  } else {
    // Fallback when nothing is budgeted: spending vs income.
    const ratio = totalIncome > 0 ? totalExpenses / totalIncome : 1;
    budgetScore = Math.max(0, (1 - ratio) * 100);
  }

  // 2. Savings rate (30% is the gold standard)
  const savingsRate = totalIncome > 0 ? balance / totalIncome : 0;
  const savingsScore = Math.min(100, Math.max(0, (savingsRate / 0.3) * 100));

  // 3. No-spend days (target 8/month)
  const uniqueSpendDates = new Set(
    currentMonthTransactions
      .filter((tx) => tx.type === 'expense')
      .map((tx) => parseLocalDate(tx.date).getDate())
  );
  const noSpendDays = Math.max(0, activeDays - uniqueSpendDates.size);
  const noSpendScore = Math.min(100, (noSpendDays / 8) * 100);

  const overallScore = Math.round((budgetScore * 0.5) + (savingsScore * 0.3) + (noSpendScore * 0.2));

  // Longest run of consecutive no-spend days within the active days.
  const spendDaysMap = Array(daysInMonth + 1).fill(false);
  currentMonthTransactions
    .filter((tx) => tx.type === 'expense')
    .forEach((tx) => {
      const day = parseLocalDate(tx.date).getDate();
      if (day >= 1 && day <= daysInMonth) spendDaysMap[day] = true;
    });

  let maxStreak = 0;
  let currentStreak = 0;
  for (let d = 1; d <= activeDays; d++) {
    if (!spendDaysMap[d]) {
      currentStreak++;
      if (currentStreak > maxStreak) maxStreak = currentStreak;
    } else {
      currentStreak = 0;
    }
  }

  const achievements = buildAchievements({
    budgetedCount: budgetedCategories.length,
    exceededCount,
    maxStreak,
    savingsRate,
    txCount: currentMonthTransactions.length,
    recurringBillsCount,
  });

  return {
    overallScore,
    ...gradeFor(overallScore),
    achievements,
    noSpendDays,
    maxStreak,
    savingsRate: Math.round(savingsRate * 100),
  };
};
