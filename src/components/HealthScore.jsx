import { useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { Shield, Flame, Award, Heart } from 'lucide-react';

const HealthScore = () => {
  const { 
    currentMonthTransactions, 
    totalIncome, 
    totalExpenses, 
    userSettings, 
    balance,
    selectedMonth,
    selectedYear,
    recurringBills
  } = useAppContext();

  // Calculations for health score & achievements
  const metrics = useMemo(() => {
    const today = new Date();
    const isCurrentMonth = selectedMonth === today.getMonth() && selectedYear === today.getFullYear();
    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    const activeDays = isCurrentMonth ? Math.max(1, today.getDate()) : daysInMonth;

    // 1. Budget Adherence Score
    const budgets = userSettings.category_budgets || {};
    const budgetedCategories = Object.keys(budgets);
    
    let budgetScore;
    let exceededCount = 0;

    if (budgetedCategories.length > 0) {
      const spentByCategory = {};
      currentMonthTransactions
        .filter(tx => tx.type === 'expense')
        .forEach(tx => {
          spentByCategory[tx.category] = (spentByCategory[tx.category] || 0) + Number(tx.amount);
        });

      budgetedCategories.forEach(cat => {
        if ((spentByCategory[cat] || 0) > budgets[cat]) {
          exceededCount++;
        }
      });
      budgetScore = Math.max(0, 100 * (1 - exceededCount / budgetedCategories.length));
    } else {
      // Default fallback: spending vs income
      const ratio = totalIncome > 0 ? totalExpenses / totalIncome : 1;
      budgetScore = Math.max(0, (1 - ratio) * 100);
    }

    // 2. Savings Rate Score (Gold standard is 30% savings rate)
    const savingsRate = totalIncome > 0 ? balance / totalIncome : 0;
    const savingsScore = Math.min(100, Math.max(0, (savingsRate / 0.3) * 100));

    // 3. No-Spend Days Score (Target is 8 days per month)
    const uniqueSpendDates = new Set(
      currentMonthTransactions
        .filter(tx => tx.type === 'expense')
        .map(tx => new Date(tx.date).getDate())
    );
    const noSpendDays = Math.max(0, activeDays - uniqueSpendDates.size);
    const noSpendScore = Math.min(100, (noSpendDays / 8) * 100);

    // Calculate overall score (50% budget, 30% savings, 20% no-spend)
    const overallScore = Math.round((budgetScore * 0.5) + (savingsScore * 0.3) + (noSpendScore * 0.2));

    // Consecutive no-spend days calculation
    const spendDaysMap = Array(daysInMonth + 1).fill(false); // true if spend occurred
    currentMonthTransactions
      .filter(tx => tx.type === 'expense')
      .forEach(tx => {
        const day = new Date(tx.date).getDate();
        if (day >= 1 && day <= daysInMonth) {
          spendDaysMap[day] = true;
        }
      });

    let maxStreak = 0;
    let currentStreak = 0;
    for (let d = 1; d <= activeDays; d++) {
      if (!spendDaysMap[d]) {
        currentStreak++;
        if (currentStreak > maxStreak) {
          maxStreak = currentStreak;
        }
      } else {
        currentStreak = 0;
      }
    }

    // Achievements Conditions
    const achievements = [
      {
        id: 'budget_shield',
        name: 'Budget Shield',
        desc: 'Keep all budgeted categories within their limits this month.',
        icon: <Shield size={24} />,
        unlocked: budgetedCategories.length > 0 && exceededCount === 0,
        color: '#10b981'
      },
      {
        id: 'streak_star',
        name: 'Streak Star',
        desc: 'Log a streak of 3+ consecutive no-spend days.',
        icon: <Flame size={24} />,
        unlocked: maxStreak >= 3,
        color: '#f59e0b'
      },
      {
        id: 'super_saver',
        name: 'Super Saver',
        desc: 'Save more than 30% of your total income.',
        icon: <Award size={24} />,
        unlocked: savingsRate >= 0.3,
        color: '#06b6d4'
      },
      {
        id: 'log_legend',
        name: 'Log Legend',
        desc: 'Log 15 or more transactions in a single month.',
        icon: <Heart size={24} />,
        unlocked: currentMonthTransactions.length >= 15,
        color: '#a855f7'
      },
      {
        id: 'recurring_master',
        name: 'Punctual Saver',
        desc: 'Have active recurring bills set up for automatic logging.',
        icon: <Award size={24} />,
        unlocked: recurringBills.length > 0,
        color: '#f43f5e'
      }
    ];

    // Grade and Feedback
    let grade;
    let feedback;
    let glowColor;

    if (overallScore >= 95) {
      grade = 'A+';
      feedback = 'Outstanding financial discipline! You have immaculate budgeting and exceptional saving habits.';
      glowColor = 'rgba(16, 185, 129, 0.5)';
    } else if (overallScore >= 90) {
      grade = 'A';
      feedback = 'Excellent habits! Budget is under full control, and you are saving a healthy chunk of your income.';
      glowColor = 'rgba(16, 185, 129, 0.4)';
    } else if (overallScore >= 80) {
      grade = 'B';
      feedback = 'Solid performance. You maintain a good financial cushion, but look for small areas to optimize.';
      glowColor = 'rgba(6, 182, 212, 0.4)';
    } else if (overallScore >= 70) {
      grade = 'C';
      feedback = 'Fair health. Some budgets are getting tight or exceeded. Keep check of discretionary expenses.';
      glowColor = 'rgba(245, 158, 11, 0.4)';
    } else if (overallScore >= 60) {
      grade = 'D';
      feedback = 'Vulnerable status. Saving rate is low and/or multiple budgets are exceeded. Action is advised.';
      glowColor = 'rgba(239, 68, 68, 0.3)';
    } else {
      grade = 'F';
      feedback = 'Critical alert. Your expenditures exceed your targets/income. Time to review habits immediately!';
      glowColor = 'rgba(239, 68, 68, 0.5)';
    }

    return {
      overallScore,
      grade,
      feedback,
      glowColor,
      achievements,
      noSpendDays,
      maxStreak,
      savingsRate: Math.round(savingsRate * 100)
    };
  }, [currentMonthTransactions, userSettings, totalIncome, totalExpenses, balance, selectedMonth, selectedYear, recurringBills]);

  const progressColor = useMemo(() => {
    if (metrics.overallScore >= 90) return 'var(--success)';
    if (metrics.overallScore >= 70) return 'var(--primary)';
    if (metrics.overallScore >= 60) return 'var(--warning)';
    return 'var(--danger)';
  }, [metrics.overallScore]);

  return (
    <div className="glass-card flex-col gap-0">
      <style>{`
        .badge-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
          gap: 0.75rem;
          margin-top: 1rem;
        }
        .badge-card {
          background-color: var(--bg-input);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          padding: 0.75rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 0.5rem;
          position: relative;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          cursor: pointer;
        }
        .badge-card:hover {
          transform: translateY(-4px) scale(1.02);
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
          border-color: rgba(255, 255, 255, 0.15);
        }
        .badge-card.locked {
          opacity: 0.45;
          filter: grayscale(1);
        }
        .badge-card.locked:hover {
          filter: grayscale(0.5);
          opacity: 0.65;
        }
        .badge-tooltip {
          display: none;
          position: absolute;
          bottom: 110%;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(15, 17, 21, 0.95);
          backdrop-filter: blur(8px);
          border: 1px solid var(--border-color);
          color: white;
          padding: 0.5rem 0.75rem;
          border-radius: var(--radius-sm);
          font-size: 0.7rem;
          width: 160px;
          z-index: 10;
          box-shadow: var(--shadow-lg);
          pointer-events: none;
        }
        .badge-card:hover .badge-tooltip {
          display: block;
        }
      `}</style>

      {/* Header — pinned */}
      <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', flexShrink: 0 }}>
        <h3 style={{ fontSize: '1.125rem', fontWeight: 600 }}>Financial Health Scorecard</h3>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          Real-time budget discipline &amp; savings evaluation
        </span>
      </div>

      {/* Scrollable body */}
      <div className="ac-card-body" style={{ paddingTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

      {/* Score Dashboard */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '1.5rem',
        flexWrap: 'wrap',
        justifyContent: 'space-between'
      }}>
        {/* Large Grade Circle */}
        <div style={{
          width: '96px',
          height: '96px',
          borderRadius: 'var(--radius-full)',
          background: 'rgba(255, 255, 255, 0.02)',
          border: `3px solid ${progressColor}`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: `0 0 20px ${metrics.glowColor}`,
          flexShrink: 0
        }}>
          <span style={{ fontSize: '2rem', fontWeight: 900, color: progressColor, lineHeight: 1 }}>
            {metrics.grade}
          </span>
          <span style={{ fontSize: '0.65rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Score: {metrics.overallScore}
          </span>
        </div>

        {/* Breakdown details */}
        <div style={{ flex: 1, minWidth: '200px' }} className="flex-col gap-2">
          <p style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-main)', lineHeight: 1.4 }}>
            {metrics.feedback}
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.75rem', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
            <span>Savings Rate: <strong style={{ color: 'var(--text-main)' }}>{metrics.savingsRate}%</strong></span>
            <span>•</span>
            <span>No-Spend: <strong style={{ color: 'var(--text-main)' }}>{metrics.noSpendDays} days</strong></span>
            <span>•</span>
            <span>Max Streak: <strong style={{ color: 'var(--text-main)' }}>{metrics.maxStreak} days</strong></span>
          </div>
        </div>
      </div>

      {/* Progress meter */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          <span>Financial Health Progress</span>
          <span>{metrics.overallScore}%</span>
        </div>
        <div style={{
          width: '100%',
          height: '8px',
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          borderRadius: 'var(--radius-full)',
          overflow: 'hidden'
        }}>
          <div style={{
            width: `${metrics.overallScore}%`,
            height: '100%',
            backgroundColor: progressColor,
            borderRadius: 'var(--radius-full)',
            transition: 'width 0.4s ease'
          }} />
        </div>
      </div>

      {/* Badges and Achievements */}
      <div className="flex-col gap-2">
        <span style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-main)' }}>
          Achievements & Badges
        </span>
        <div className="badge-grid">
          {metrics.achievements.map(ach => (
            <div 
              key={ach.id} 
              className={`badge-card ${ach.unlocked ? '' : 'locked'}`}
              style={{
                boxShadow: ach.unlocked ? `0 4px 10px rgba(0, 0, 0, 0.2)` : 'none'
              }}
            >
              {/* Badge Icon wrapper */}
              <div style={{
                padding: '0.5rem',
                borderRadius: 'var(--radius-full)',
                backgroundColor: ach.unlocked ? `${ach.color}18` : 'rgba(255, 255, 255, 0.03)',
                color: ach.unlocked ? ach.color : 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {ach.icon}
              </div>

              {/* Badge Title */}
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: ach.unlocked ? 'var(--text-main)' : 'var(--text-muted)' }}>
                {ach.name}
              </span>
              
              {/* Badge Status indicator */}
              <span style={{ 
                fontSize: '0.6rem', 
                fontWeight: 600, 
                color: ach.unlocked ? 'var(--success)' : 'var(--text-muted)',
                backgroundColor: ach.unlocked ? 'var(--success-bg)' : 'rgba(255, 255, 255, 0.05)',
                padding: '2px 6px',
                borderRadius: '4px'
              }}>
                {ach.unlocked ? 'Unlocked' : 'Locked'}
              </span>

              {/* Tooltip containing criteria */}
              <div className="badge-tooltip">
                <span style={{ fontWeight: 700, display: 'block', marginBottom: '2px' }}>{ach.name}</span>
                {ach.desc}
              </div>
            </div>
          ))}
        </div>
      </div>
      </div>{/* end ac-card-body */}
    </div>
  );
};

export default HealthScore;
