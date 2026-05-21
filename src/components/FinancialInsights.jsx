import React, { useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { TrendingUp, Sparkles, Calendar, Coffee, AlertCircle, CheckCircle2 } from 'lucide-react';

const FinancialInsights = () => {
  const { 
    currentMonthTransactions, 
    selectedMonth, 
    selectedYear, 
    totalExpenses, 
    userSettings, 
    balance,
    savingsGoal
  } = useAppContext();

  const stats = useMemo(() => {
    const today = new Date();
    const isCurrentMonth = selectedMonth === today.getMonth() && selectedYear === today.getFullYear();
    
    // Number of days to average over
    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    const activeDays = isCurrentMonth ? Math.max(1, today.getDate()) : daysInMonth;

    // Daily Average
    const dailyAverage = totalExpenses / activeDays;

    // No-Spend Days Calculation
    const uniqueSpendDates = new Set(
      currentMonthTransactions
        .filter(tx => tx.type === 'expense')
        .map(tx => {
          const dateObj = new Date(tx.date);
          return dateObj.getDate();
        })
    );
    const noSpendDays = Math.max(0, activeDays - uniqueSpendDates.size);

    // Highest Spending Day Calculation
    const spentByDay = {};
    currentMonthTransactions
      .filter(tx => tx.type === 'expense')
      .forEach(tx => {
        const day = new Date(tx.date).getDate();
        spentByDay[day] = (spentByDay[day] || 0) + Number(tx.amount);
      });

    let highestDay = null;
    let highestAmount = 0;
    Object.keys(spentByDay).forEach(day => {
      if (spentByDay[day] > highestAmount) {
        highestAmount = spentByDay[day];
        highestDay = day;
      }
    });

    // Top Category Calculation
    const categoryTotals = {};
    currentMonthTransactions
      .filter(tx => tx.type === 'expense')
      .forEach(tx => {
        categoryTotals[tx.category] = (categoryTotals[tx.category] || 0) + Number(tx.amount);
      });

    let topCategory = null;
    let topCategoryAmount = 0;
    Object.keys(categoryTotals).forEach(cat => {
      if (categoryTotals[cat] > topCategoryAmount) {
        topCategoryAmount = categoryTotals[cat];
        topCategory = cat;
      }
    });

    return {
      dailyAverage,
      noSpendDays,
      highestDay,
      highestAmount,
      topCategory,
      topCategoryAmount,
      daysInMonth
    };
  }, [currentMonthTransactions, selectedMonth, selectedYear, totalExpenses]);

  // Generate dynamic tips based on actual metrics
  const tips = useMemo(() => {
    const list = [];
    const budgetLimit = userSettings.category_budgets || {};

    // 1. Budget limits warning
    const overCategories = [];
    const spentByCategory = {};
    currentMonthTransactions
      .filter(tx => tx.type === 'expense')
      .forEach(tx => {
        spentByCategory[tx.category] = (spentByCategory[tx.category] || 0) + Number(tx.amount);
      });

    Object.keys(budgetLimit).forEach(cat => {
      if (spentByCategory[cat] > budgetLimit[cat]) {
        overCategories.push(cat);
      }
    });

    if (overCategories.length > 0) {
      list.push({
        type: 'warning',
        text: `Alert: You've exceeded your monthly budget for ${overCategories.join(', ')}. Consider scaling back non-essential spending.`,
        icon: <AlertCircle size={16} style={{ color: 'var(--danger)' }} />
      });
    }

    // 2. Savings rate warning / success
    if (balance < savingsGoal) {
      const needed = savingsGoal - balance;
      list.push({
        type: 'info',
        text: `You are currently ৳${needed.toLocaleString('en-IN')} away from hitting your monthly savings goal of ৳${savingsGoal.toLocaleString('en-IN')}.`,
        icon: <TrendingUp size={16} style={{ color: 'var(--primary)' }} />
      });
    } else if (totalExpenses > 0) {
      list.push({
        type: 'success',
        text: `Excellent job! You have reached your monthly savings goal. Current net surplus: ৳${balance.toLocaleString('en-IN')}.`,
        icon: <CheckCircle2 size={16} style={{ color: 'var(--success)' }} />
      });
    }

    // 3. No-Spend Days reinforcement
    if (stats.noSpendDays >= 8) {
      list.push({
        type: 'success',
        text: `Impressive! You logged ${stats.noSpendDays} "No-Spend Days" this month. That is keeping your minor costs in check.`,
        icon: <Sparkles size={16} style={{ color: '#f59e0b' }} />
      });
    } else {
      list.push({
        type: 'tip',
        text: `Challenge: Try to set 2 'No-Spend Days' next week (cooking at home, skipping impulsive purchases) to boost savings.`,
        icon: <Coffee size={16} style={{ color: 'var(--text-muted)' }} />
      });
    }

    // Default general advice if empty
    if (list.length === 0) {
      list.push({
        type: 'tip',
        text: "Tip: Start logging your dynamic expenses early to build a clear projection chart for this month.",
        icon: <Sparkles size={16} style={{ color: 'var(--primary)' }} />
      });
    }

    return list;
  }, [currentMonthTransactions, balance, savingsGoal, stats, userSettings]);

  if (totalExpenses === 0) {
    return (
      <div className="glass-card flex-col gap-3">
        <h3 style={{ fontSize: '1.125rem' }}>Monthly Insights</h3>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
          Insights will appear once you log expenses for the selected month.
        </p>
      </div>
    );
  }

  return (
    <div className="glass-card flex-col gap-4">
      <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
        <h3 style={{ fontSize: '1.125rem', fontWeight: 600 }}>Financial Insights</h3>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          Automated spending analysis & key metrics
        </span>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
        gap: '0.75rem'
      }}>
        <div style={{ padding: '0.75rem', backgroundColor: 'var(--bg-input)', borderRadius: 'var(--radius-md)' }} className="flex-col gap-1">
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Daily Average</span>
          <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)' }}>
            ৳{Math.round(stats.dailyAverage).toLocaleString('en-IN')}
          </span>
        </div>

        <div style={{ padding: '0.75rem', backgroundColor: 'var(--bg-input)', borderRadius: 'var(--radius-md)' }} className="flex-col gap-1">
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>No-Spend Days</span>
          <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--success)' }}>
            {stats.noSpendDays} Days
          </span>
        </div>

        {stats.highestDay && (
          <div style={{ padding: '0.75rem', backgroundColor: 'var(--bg-input)', borderRadius: 'var(--radius-md)' }} className="flex-col gap-1">
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Peak Day Spend</span>
            <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--danger)' }}>
              ৳{stats.highestAmount.toLocaleString('en-IN')}
            </span>
            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
              Day {stats.highestDay}
            </span>
          </div>
        )}

        {stats.topCategory && (
          <div style={{ padding: '0.75rem', backgroundColor: 'var(--bg-input)', borderRadius: 'var(--radius-md)' }} className="flex-col gap-1">
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Top Category</span>
            <span style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {stats.topCategory}
            </span>
            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
              ৳{stats.topCategoryAmount.toLocaleString('en-IN')}
            </span>
          </div>
        )}
      </div>

      <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }} className="flex-col gap-3">
        <span style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <Sparkles size={14} style={{ color: '#f59e0b' }} /> Smart Tips & Suggestions
        </span>
        <div className="flex-col gap-2">
          {tips.map((tip, idx) => (
            <div 
              key={idx} 
              style={{ 
                display: 'flex', 
                gap: '0.5rem', 
                fontSize: '0.8rem', 
                color: 'var(--text-main)', 
                lineHeight: '1.3',
                backgroundColor: 'rgba(255, 255, 255, 0.02)',
                padding: '0.5rem',
                borderRadius: 'var(--radius-sm)'
              }}
            >
              <div style={{ marginTop: '2px', flexShrink: 0 }}>
                {tip.icon}
              </div>
              <span>{tip.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FinancialInsights;
