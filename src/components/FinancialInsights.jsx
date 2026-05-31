import { useMemo } from 'react';
import { useAppContext, parseLocalDate } from '../context/AppContext';
import { Sparkles, Calendar, Coffee, AlertCircle, CheckCircle2 } from 'lucide-react';

const FinancialInsights = () => {
  const { 
    currentMonthTransactions, 
    transactions,
    selectedMonth, 
    selectedYear, 
    totalExpenses, 
    userSettings, 
    savingsGoal,
    totalIncome
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
          const dateObj = parseLocalDate(tx.date);
          return dateObj.getDate();
        })
    );
    const noSpendDays = Math.max(0, activeDays - uniqueSpendDates.size);

    // Highest Spending Day Calculation
    const spentByDay = {};
    currentMonthTransactions
      .filter(tx => tx.type === 'expense')
      .forEach(tx => {
        const day = parseLocalDate(tx.date).getDate();
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
      daysInMonth,
      activeDays
    };
  }, [currentMonthTransactions, selectedMonth, selectedYear, totalExpenses]);

  // Calculate Month-over-Month spend velocity & budget projections
  const pacingData = useMemo(() => {
    const today = new Date();
    const isCurrentMonth = selectedMonth === today.getMonth() && selectedYear === today.getFullYear();
    const daysInMonth = stats.daysInMonth;
    const activeDays = stats.activeDays;

    // Projected Monthly Expense
    const projectedTotal = (totalExpenses / activeDays) * daysInMonth;

    // Previous month logic
    let prevMonth = selectedMonth - 1;
    let prevYear = selectedYear;
    if (prevMonth < 0) {
      prevMonth = 11;
      prevYear -= 1;
    }
    const prevDaysInMonth = new Date(prevYear, prevMonth + 1, 0).getDate();
    const prevLimitDay = isCurrentMonth ? Math.min(today.getDate(), prevDaysInMonth) : prevDaysInMonth;

    // Filter transactions up to limit day
    const currentMTD = currentMonthTransactions
      .filter(tx => tx.type === 'expense' && parseLocalDate(tx.date).getDate() <= activeDays)
      .reduce((sum, tx) => sum + Number(tx.amount), 0);

    const prevMonthTransactions = transactions.filter(tx => {
      const txDate = parseLocalDate(tx.date);
      return txDate.getMonth() === prevMonth && txDate.getFullYear() === prevYear;
    });

    const prevMTD = prevMonthTransactions
      .filter(tx => tx.type === 'expense' && parseLocalDate(tx.date).getDate() <= prevLimitDay)
      .reduce((sum, tx) => sum + Number(tx.amount), 0);

    let velocity = 0;
    if (prevMTD > 0) {
      velocity = ((currentMTD - prevMTD) / prevMTD) * 100;
    } else if (currentMTD > 0) {
      velocity = 100; // 100% increase if prev month had 0 spend
    }

    // Find the earliest transaction date in history
    let earliestDate = null;
    if (transactions.length > 0) {
      earliestDate = parseLocalDate(transactions[transactions.length - 1].date);
    }

    const isPrevPlaceholder = earliestDate && (
      prevYear < earliestDate.getFullYear() ||
      (prevYear === earliestDate.getFullYear() && prevMonth < earliestDate.getMonth())
    );

    // Budget threshold: sum of all budgets, or base income
    const categoryBudgets = userSettings.category_budgets || {};
    const hasBudgets = Object.keys(categoryBudgets).length > 0;
    const totalBudget = hasBudgets 
      ? Object.values(categoryBudgets).reduce((sum, val) => sum + val, 0)
      : Number(userSettings.base_income);

    const percentOfBudget = totalBudget > 0 ? (projectedTotal / totalBudget) * 100 : 0;

    return {
      projectedTotal,
      velocity,
      totalBudget,
      currentMTD,
      prevMTD,
      isCurrentMonth,
      percentOfBudget,
      isPrevPlaceholder
    };
  }, [currentMonthTransactions, transactions, selectedMonth, selectedYear, totalExpenses, userSettings, stats]);

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

    // 2. Savings rate warning / success based on pacing projection
    const projectedBalance = totalIncome - pacingData.projectedTotal;
    if (projectedBalance < savingsGoal) {
      const needed = savingsGoal - projectedBalance;
      list.push({
        type: 'warning',
        text: `Warning: Based on your current spending rate, you are projected to miss your monthly savings goal of ৳${savingsGoal.toLocaleString('en-IN')} by ৳${Math.ceil(needed).toLocaleString('en-IN')}. Try to reduce daily spending.`,
        icon: <AlertCircle size={16} style={{ color: 'var(--danger)' }} />
      });
    } else if (totalExpenses > 0) {
      list.push({
        type: 'success',
        text: `Excellent job! You are on track to reach your monthly savings goal. Projected net surplus: ৳${Math.round(projectedBalance).toLocaleString('en-IN')}.`,
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
  }, [currentMonthTransactions, totalIncome, pacingData, savingsGoal, stats, userSettings, totalExpenses]);

  if (totalExpenses === 0) {
    return (
      <div className="glass-card flex-col gap-3" style={{ height: '100%' }}>
        <h3 style={{ fontSize: '1.125rem' }}>Monthly Insights</h3>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
          Insights will appear once you log expenses for the selected month.
        </p>
      </div>
    );
  }

  // Determine pacing message and color
  const paceColor = pacingData.velocity < 0 ? 'var(--success)' : pacingData.velocity > 0 ? 'var(--warning)' : 'var(--text-muted)';

  return (
    <div className="glass-card flex-col gap-0" style={{ height: '100%' }}>
      <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', flexShrink: 0 }}>
        <h3 style={{ fontSize: '1.125rem', fontWeight: 600 }}>Financial Insights</h3>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          Automated spending analysis & key metrics
        </span>
      </div>

      <div className="ac-card-body" style={{ paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>

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

      {/* Spend Pacing & Projection Section */}
      <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }} className="flex-col gap-3">
        <span style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <Calendar size={14} style={{ color: 'var(--primary)' }} /> Spend Pacing & Projection
        </span>
        
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '0.75rem', 
          backgroundColor: 'rgba(255,255,255,0.01)', 
          padding: '1rem', 
          borderRadius: 'var(--radius-md)', 
          border: '1px solid var(--border-color)' 
        }}>
          {/* Comparison Text */}
          <p style={{ fontSize: '0.85rem', margin: 0, lineHeight: '1.4', color: 'var(--text-main)' }}>
            {pacingData.isPrevPlaceholder ? (
              <>Month-over-month comparison will be available next month once tracking history is established.</>
            ) : pacingData.velocity < 0 ? (
              <>
                You are spending <strong style={{ color: paceColor }}>{Math.abs(Math.round(pacingData.velocity))}% slower</strong> than last month at this date (৳{Math.round(pacingData.currentMTD).toLocaleString('en-IN')} MTD vs ৳{Math.round(pacingData.prevMTD).toLocaleString('en-IN')}). Keep it up!
              </>
            ) : pacingData.velocity > 0 ? (
              <>
                You are spending <strong style={{ color: paceColor }}>{Math.round(pacingData.velocity)}% faster</strong> than last month at this date (৳{Math.round(pacingData.currentMTD).toLocaleString('en-IN')} MTD vs ৳{Math.round(pacingData.prevMTD).toLocaleString('en-IN')}). Try to dial back.
              </>
            ) : (
              <>Spending is identical to last month at this date.</>
            )}
          </p>

          {/* Projection Indicator */}
          <div className="flex-col gap-2" style={{ marginTop: '0.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', flexWrap: 'wrap', gap: '0.25rem' }}>
              <span>Projected EOM Expense: <strong style={{ color: 'var(--text-main)' }}>৳{Math.round(pacingData.projectedTotal).toLocaleString('en-IN')}</strong></span>
              <span>Budget Limit: <strong style={{ color: 'var(--text-main)' }}>৳{pacingData.totalBudget.toLocaleString('en-IN')}</strong></span>
            </div>
            <div style={{
              width: '100%',
              height: '8px',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              borderRadius: 'var(--radius-full)',
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${Math.min(100, pacingData.percentOfBudget)}%`,
                height: '100%',
                backgroundColor: pacingData.percentOfBudget > 100 ? 'var(--danger)' : pacingData.percentOfBudget > 85 ? 'var(--warning)' : 'var(--primary)',
                borderRadius: 'var(--radius-full)',
                transition: 'width 0.4s ease'
              }} />
            </div>
            {pacingData.percentOfBudget > 100 && (
              <span style={{ fontSize: '0.75rem', color: 'var(--danger)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                ⚠️ Your current pacing projects you to exceed your monthly limit!
              </span>
            )}
          </div>
        </div>
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
      </div>{/* end ac-card-body */}
    </div>
  );
};

export default FinancialInsights;
