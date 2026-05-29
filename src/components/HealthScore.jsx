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
        icon: <Shield size={18} />,
        unlocked: budgetedCategories.length > 0 && exceededCount === 0,
        progress: budgetedCategories.length > 0 ? Math.round(((budgetedCategories.length - exceededCount) / budgetedCategories.length) * 100) : 100,
        statusLabel: budgetedCategories.length > 0 ? `${budgetedCategories.length - exceededCount}/${budgetedCategories.length} categories` : 'No active budgets',
        color: '#10b981'
      },
      {
        id: 'streak_star',
        name: 'Streak Star',
        desc: 'Log a streak of 3+ consecutive no-spend days.',
        icon: <Flame size={18} />,
        unlocked: maxStreak >= 3,
        progress: Math.min(100, Math.round((maxStreak / 3) * 100)),
        statusLabel: `${maxStreak}/3 days streak`,
        color: '#f59e0b'
      },
      {
        id: 'super_saver',
        name: 'Super Saver',
        desc: 'Save more than 30% of your total income.',
        icon: <Award size={18} />,
        unlocked: savingsRate >= 0.3,
        progress: Math.min(100, Math.round((savingsRate / 0.3) * 100)),
        statusLabel: `${Math.round(savingsRate * 100)}% / 30% goal`,
        color: '#06b6d4'
      },
      {
        id: 'log_legend',
        name: 'Log Legend',
        desc: 'Log 15 or more transactions in a single month.',
        icon: <Heart size={18} />,
        unlocked: currentMonthTransactions.length >= 15,
        progress: Math.min(100, Math.round((currentMonthTransactions.length / 15) * 100)),
        statusLabel: `${currentMonthTransactions.length}/15 transactions`,
        color: '#a855f7'
      },
      {
        id: 'recurring_master',
        name: 'Punctual Saver',
        desc: 'Have active recurring bills set up for automatic logging.',
        icon: <Award size={18} />,
        unlocked: recurringBills.length > 0,
        progress: recurringBills.length > 0 ? 100 : 0,
        statusLabel: recurringBills.length > 0 ? 'Active' : 'No bills configured',
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

  const indicatorCoords = useMemo(() => {
    const score = metrics.overallScore;
    const angleRad = (210 - (score / 100) * 240) * Math.PI / 180;
    const x = 50 + 35 * Math.cos(angleRad);
    const y = 50 - 35 * Math.sin(angleRad);
    return { x, y };
  }, [metrics.overallScore]);

  return (
    <div className="glass-card flex-col gap-0" style={{ height: '100%' }}>
      <style>{`
        .ach-list {
          display: flex;
          flex-direction: column;
          gap: 0.65rem;
        }
        .ach-row {
          background: var(--bg-input);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          padding: 0.65rem 0.85rem;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .ach-row:hover {
          transform: translateY(-2px);
          background: var(--bg-hover);
          border-color: var(--primary);
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }
        .ach-row.locked {
          background: var(--bg-input);
          border-color: var(--border-color);
          opacity: 0.55;
        }
        .ach-row.locked:hover {
          opacity: 0.75;
          background: var(--bg-hover);
          border-color: var(--border-color);
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
        gap: '1rem',
        flexWrap: 'wrap',
        justifyContent: 'flex-start'
      }}>
        {/* Large Semicircular Segmented Gauge */}
        <div style={{ position: 'relative', width: '135px', height: '80px', display: 'flex', justifyContent: 'center', flexShrink: 0 }}>
          <svg viewBox="0 0 100 75" style={{ width: '100%', height: '100%' }}>
            {/* Segment 1: Red/Orange (Low) */}
            <path 
              d="M 19.7 67.5 A 35 35 0 0 1 23.2 27.5" 
              fill="none" 
              stroke="#f43f5e" 
              strokeWidth="7.5" 
              strokeLinecap="round"
              opacity={metrics.overallScore >= 0 ? 1 : 0.15}
            />
            {/* Segment 2: Cyan/Blue (Medium) */}
            <path 
              d="M 27.5 23.2 A 35 35 0 0 1 67.5 19.7" 
              fill="none" 
              stroke="#06b6d4" 
              strokeWidth="7.5" 
              strokeLinecap="round"
              opacity={metrics.overallScore > 35 ? 1 : 0.15}
            />
            {/* Segment 3: Indigo/Purple (High) */}
            <path 
              d="M 72.5 23.2 A 35 35 0 0 1 80.3 67.5" 
              fill="none" 
              stroke="#6366f1" 
              strokeWidth="7.5" 
              strokeLinecap="round"
              opacity={metrics.overallScore > 70 ? 1 : 0.15}
            />
            
            {/* Indicator Dot */}
            <circle 
              cx={indicatorCoords.x} 
              cy={indicatorCoords.y} 
              r="4.5" 
              fill="#ffffff" 
              stroke={progressColor}
              strokeWidth="2.5"
              style={{
                filter: 'drop-shadow(0 0 3px rgba(255,255,255,0.95))',
                transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
            />
          </svg>
          {/* Centered Grade / Score info */}
          <div style={{
            position: 'absolute',
            top: '65%',
            left: 0,
            right: 0,
            transform: 'translateY(-50%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none'
          }}>
            <span style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--text-main)', lineHeight: 1 }}>
              {metrics.grade}
            </span>
            <span style={{ fontSize: '0.65rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginTop: '2px' }}>
              Score: {metrics.overallScore}
            </span>
          </div>
        </div>

        {/* Breakdown details */}
        <div style={{ flex: 1, minWidth: 0, width: '100%' }} className="flex-col gap-2">
          <p style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-main)', lineHeight: 1.4 }}>
            {metrics.feedback}
          </p>
          <div style={{ display: 'flex', gap: '0.65rem', fontSize: '0.72rem', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
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
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
          <span>Financial Health Progress</span>
          <span>{metrics.overallScore}%</span>
        </div>
        <div style={{
          width: '100%',
          height: '7px',
          backgroundColor: 'var(--bg-input)',
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
      <div className="flex-col gap-2" style={{ marginTop: '0.25rem' }}>
        <span style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-main)' }}>
          Achievements &amp; Goals
        </span>
        <div className="ach-list">
          {metrics.achievements.map(ach => (
            <div 
              key={ach.id} 
              className={`ach-row ${ach.unlocked ? '' : 'locked'}`}
            >
              {/* Left Side: Glowing Icon */}
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: ach.unlocked ? `${ach.color}15` : 'var(--bg-input)',
                color: ach.unlocked ? ach.color : 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                boxShadow: ach.unlocked ? `0 0 10px ${ach.color}22` : 'none'
              }}>
                {ach.icon}
              </div>

              {/* Middle: Title, Progress track, and Description */}
              <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.825rem', color: ach.unlocked ? 'var(--text-main)' : 'var(--text-muted)' }}>
                    {ach.name}
                  </span>
                  <span style={{ fontSize: '0.68rem', color: ach.unlocked ? 'var(--text-main)' : 'var(--text-muted)', fontWeight: 500 }}>
                    {ach.statusLabel}
                  </span>
                </div>
                
                {/* Horizontal progress bar */}
                <div style={{
                  width: '100%',
                  height: '5px',
                  backgroundColor: 'var(--bg-input)',
                  borderRadius: 'var(--radius-full)',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: `${ach.progress}%`,
                    height: '100%',
                    backgroundColor: ach.unlocked ? ach.color : 'var(--text-muted)',
                    borderRadius: 'var(--radius-full)',
                    transition: 'width 0.4s ease'
                  }} />
                </div>
                
                <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {ach.desc}
                </span>
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
