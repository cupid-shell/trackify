import { describe, it, expect } from 'vitest';
import { computeHealthScore, gradeFor, buildAchievements } from './healthScore';

const exp = (date, amount, category = 'Food') => ({ date, type: 'expense', amount, category });

// A non-current selected month so activeDays == daysInMonth (deterministic).
const NOT_NOW = new Date(2026, 5, 15); // June 2026

describe('gradeFor', () => {
  it('maps score bands to the right letter grade', () => {
    expect(gradeFor(100).grade).toBe('A+');
    expect(gradeFor(95).grade).toBe('A+');
    expect(gradeFor(94).grade).toBe('A');
    expect(gradeFor(90).grade).toBe('A');
    expect(gradeFor(89).grade).toBe('B');
    expect(gradeFor(80).grade).toBe('B');
    expect(gradeFor(70).grade).toBe('C');
    expect(gradeFor(60).grade).toBe('D');
    expect(gradeFor(59).grade).toBe('F');
    expect(gradeFor(0).grade).toBe('F');
  });
});

describe('buildAchievements', () => {
  it('handles the no-budget / no-bills edge labels', () => {
    const a = buildAchievements({ budgetedCount: 0, exceededCount: 0, maxStreak: 0, savingsRate: 0, txCount: 0, recurringBillsCount: 0 });
    const byId = Object.fromEntries(a.map(x => [x.id, x]));
    expect(byId.budget_shield.unlocked).toBe(false);
    expect(byId.budget_shield.progress).toBe(100);
    expect(byId.budget_shield.statusLabel).toBe('No active budgets');
    expect(byId.recurring_master.statusLabel).toBe('No bills configured');
    expect(byId.super_saver.statusLabel).toBe('0% / 30% goal');
  });

  it('reports partial category progress and unlock states', () => {
    const a = buildAchievements({ budgetedCount: 4, exceededCount: 1, maxStreak: 3, savingsRate: 0.3, txCount: 15, recurringBillsCount: 2 });
    const byId = Object.fromEntries(a.map(x => [x.id, x]));
    expect(byId.budget_shield.unlocked).toBe(false); // one exceeded
    expect(byId.budget_shield.progress).toBe(75);    // 3/4
    expect(byId.budget_shield.statusLabel).toBe('3/4 categories');
    expect(byId.streak_star.unlocked).toBe(true);
    expect(byId.super_saver.unlocked).toBe(true);     // exactly 30%
    expect(byId.log_legend.unlocked).toBe(true);      // exactly 15
  });
});

describe('computeHealthScore', () => {
  it('scores a clean month at the top with the right streak and rate', () => {
    const m = computeHealthScore({
      currentMonthTransactions: [exp('2026-01-05', 200, 'Food'), exp('2026-01-05', 100, 'Transport')],
      budgets: { Food: 500, Transport: 300 },
      totalIncome: 1000,
      totalExpenses: 300,
      balance: 700,
      selectedMonth: 0,
      selectedYear: 2026,
      recurringBillsCount: 1,
      now: NOT_NOW,
    });
    expect(m.overallScore).toBe(100);
    expect(m.grade).toBe('A+');
    expect(m.savingsRate).toBe(70);
    expect(m.noSpendDays).toBe(30); // 31 days, spending on 1 day
    expect(m.maxStreak).toBe(26);   // days 6..31 after the day-5 spend
    const byId = Object.fromEntries(m.achievements.map(x => [x.id, x]));
    expect(byId.budget_shield.unlocked).toBe(true);
    expect(byId.log_legend.progress).toBe(13); // 2/15
  });

  it('drops budget score when a category is exceeded', () => {
    const m = computeHealthScore({
      currentMonthTransactions: [exp('2026-01-02', 200, 'A'), exp('2026-01-03', 50, 'B')],
      budgets: { A: 100, B: 100 },
      totalIncome: 1000,
      totalExpenses: 250,
      balance: 750,
      selectedMonth: 0,
      selectedYear: 2026,
      recurringBillsCount: 0,
      now: NOT_NOW,
    });
    // budget 50 (1 of 2 exceeded), savings 100, no-spend 100 -> 25+30+20 = 75
    expect(m.overallScore).toBe(75);
    expect(m.grade).toBe('C');
    const shield = m.achievements.find(x => x.id === 'budget_shield');
    expect(shield.statusLabel).toBe('1/2 categories');
  });

  it('falls back to spending-vs-income when nothing is budgeted', () => {
    const m = computeHealthScore({
      currentMonthTransactions: [exp('2026-01-05', 400)],
      budgets: {},
      totalIncome: 1000,
      totalExpenses: 400,
      balance: 600,
      selectedMonth: 0,
      selectedYear: 2026,
      recurringBillsCount: 0,
      now: NOT_NOW,
    });
    // budget 60 (1 - 0.4), savings 100, no-spend 100 -> 30+30+20 = 80
    expect(m.overallScore).toBe(80);
    expect(m.grade).toBe('B');
  });

  it('handles zero income without dividing by zero', () => {
    const m = computeHealthScore({
      currentMonthTransactions: [],
      budgets: {},
      totalIncome: 0,
      totalExpenses: 100,
      balance: -100,
      selectedMonth: 0,
      selectedYear: 2026,
      recurringBillsCount: 0,
      now: NOT_NOW,
    });
    // budget 0 (ratio forced to 1), savings 0, no-spend 100 -> 0+0+20 = 20
    expect(m.overallScore).toBe(20);
    expect(m.grade).toBe('F');
    expect(m.savingsRate).toBe(0);
    expect(m.maxStreak).toBe(31); // no spending all month
  });
});
