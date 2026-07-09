import { useMemo, useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { Shield, Flame, Award, Heart } from 'lucide-react';
import { computeHealthScore } from '../utils/healthScore';

// Achievement id -> icon. The scoring logic (utils/healthScore) is icon-free;
// the component layers these on by id after computing the metrics.
const ACHIEVEMENT_ICONS = {
  budget_shield: <Shield size={18} />,
  streak_star: <Flame size={18} />,
  super_saver: <Award size={18} />,
  log_legend: <Heart size={18} />,
  recurring_master: <Award size={18} />,
};

const HealthScore = () => {
  const { 
    transactions,
    currentMonthTransactions, 
    totalIncome, 
    totalExpenses, 
    userSettings, 
    balance,
    selectedMonth,
    selectedYear,
    recurringBills,
    updateSettings,
    showToast
  } = useAppContext();

  const [confettiParticles, setConfettiParticles] = useState([]);

  // Calculations for health score & achievements (pure logic in utils/healthScore).
  const metrics = useMemo(() => {
    const m = computeHealthScore({
      currentMonthTransactions,
      budgets: userSettings.category_budgets || {},
      totalIncome,
      totalExpenses,
      balance,
      selectedMonth,
      selectedYear,
      recurringBillsCount: recurringBills.length,
      now: new Date(),
    });
    return {
      ...m,
      achievements: m.achievements.map(a => ({ ...a, icon: ACHIEVEMENT_ICONS[a.id] })),
    };
  }, [currentMonthTransactions, userSettings, totalIncome, totalExpenses, balance, selectedMonth, selectedYear, recurringBills]);

  // All-time Badge Multipliers
  const allTimeBadges = useMemo(() => {
    const history = userSettings.category_metadata?._achievements_history || {};
    const counts = {};
    Object.values(history).forEach((monthAchs) => {
      if (Array.isArray(monthAchs)) {
        monthAchs.forEach(achId => {
          counts[achId] = (counts[achId] || 0) + 1;
        });
      }
    });
    return counts;
  }, [userSettings.category_metadata?._achievements_history]);

  const monthKey = `${selectedYear}-${selectedMonth}`;
  const history = userSettings.category_metadata?._achievements_history || {};
  const unlockedThisMonthInHistory = useMemo(() => history[monthKey] || [], [history, monthKey]);

  const spawnConfetti = () => {
    const particles = [];
    const colors = ['#3eb489', '#6366f1', '#f59e0b', '#06b6d4', '#ec4899', '#f43f5e', '#a855f7'];
    for (let i = 0; i < 80; i++) {
      particles.push({
        id: i,
        left: `${Math.random() * 100}vw`,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: `${Math.random() * 6 + 6}px`,
        drift: `${Math.random() * 200 - 100}px`,
        delay: `${Math.random() * 1.5}s`,
        duration: `${Math.random() * 2 + 1.5}s`
      });
    }
    setConfettiParticles(particles);
    setTimeout(() => {
      setConfettiParticles([]);
    }, 4000);
  };

  // Track initial-load completion so achievements don't fire during the first
  // data hydration. Declared before the achievement effect that reads it.
  const [loadingSettingsAndTxs, setLoadingSettingsAndTxs] = useState(true);
  useEffect(() => {
    if (userSettings && transactions.length !== undefined) {
      // Small timeout to let things settle
      const t = setTimeout(() => setLoadingSettingsAndTxs(false), 800);
      return () => clearTimeout(t);
    }
  }, [userSettings, currentMonthTransactions]);

  useEffect(() => {
    if (loadingSettingsAndTxs) return; // wait till loaded

    const newlyUnlocked = metrics.achievements.filter(
      ach => ach.unlocked && !unlockedThisMonthInHistory.includes(ach.id)
    );

    if (newlyUnlocked.length > 0) {
      const nextHistory = { ...history };
      const currentUnlocked = [...unlockedThisMonthInHistory];

      newlyUnlocked.forEach(ach => {
        if (!currentUnlocked.includes(ach.id)) {
          currentUnlocked.push(ach.id);
          showToast(`Achievement Unlocked: ${ach.name}! 🎉`, 'success');
        }
      });

      nextHistory[monthKey] = currentUnlocked;

      const currentMetadata = { ...(userSettings.category_metadata || {}) };
      currentMetadata._achievements_history = nextHistory;
      updateSettings({ category_metadata: currentMetadata });
      // Defer the celebration one tick so its setState doesn't cascade renders
      // synchronously inside this effect.
      const celebrate = setTimeout(spawnConfetti, 0);
      return () => clearTimeout(celebrate);
    }
  }, [metrics.achievements, unlockedThisMonthInHistory, monthKey, history, userSettings.category_metadata, updateSettings, showToast]);

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
          <p style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-main)', lineHeight: 1.5, textAlign: 'justify' }}>
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
              {/* Left Side: Glowing Icon with cumulative badge count */}
              <div style={{
                position: 'relative',
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
                {allTimeBadges[ach.id] > 1 && (
                  <span style={{
                    position: 'absolute',
                    bottom: '-4px',
                    right: '-4px',
                    backgroundColor: 'var(--primary)',
                    color: 'white',
                    fontSize: '9px',
                    fontWeight: 700,
                    borderRadius: '50%',
                    width: '15px',
                    height: '15px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid var(--bg-card)'
                  }}>
                    {allTimeBadges[ach.id]}
                  </span>
                )}
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
                
                <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', lineHeight: 1.45, textAlign: 'justify' }}>
                  {ach.desc}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
      </div>{/* end ac-card-body */}

      {/* Confetti Celebration Particles */}
      {confettiParticles.length > 0 && (
        <div className="confetti-container">
          {confettiParticles.map(p => (
            <div
              key={p.id}
              className="confetti-particle"
              style={{
                left: p.left,
                backgroundColor: p.color,
                width: p.size,
                height: p.size,
                animationDelay: p.delay,
                animationDuration: p.duration,
                '--drift': p.drift
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default HealthScore;
