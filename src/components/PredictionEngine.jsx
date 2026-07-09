import { useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { Sparkles, AlertTriangle, CheckCircle, TrendingUp, Zap, Target, Calendar } from 'lucide-react';
import {
  RadialBarChart, RadialBar, PolarAngleAxis,
  ResponsiveContainer
} from 'recharts';
import CategoryIcon from './CategoryIcon';

const PredictionEngine = () => {
  const { totalIncome, totalExpenses, savingsGoal, currentMonthTransactions, selectedMonth, selectedYear, balance, getCategoryStyle, formatCurrency } = useAppContext();

  const prediction = useMemo(() => {
    const today = new Date();
    const isCurrentMonth = selectedMonth === today.getMonth() && selectedYear === today.getFullYear();
    const isPastMonth = new Date(selectedYear, selectedMonth, 1) < new Date(today.getFullYear(), today.getMonth(), 1);
    const totalDaysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    const currentDay = isCurrentMonth ? today.getDate() : totalDaysInMonth;
    const daysRemaining = isCurrentMonth ? totalDaysInMonth - currentDay : 0;

    const knownFixed = ['Rent', 'Utilities & Bills', 'Education'];
    const knownVariable = ['Daily Living', 'Food & Dining', 'Transport'];
    let variableExpensesSum = 0;

    currentMonthTransactions.forEach(tx => {
      if (tx.type === 'expense') {
        if (knownFixed.includes(tx.category)) return;
        if (knownVariable.includes(tx.category)) {
          variableExpensesSum += Number(tx.amount);
        } else if (Number(tx.amount) < 1000) {
          variableExpensesSum += Number(tx.amount);
        }
      }
    });

    const dailyBurnRate = currentDay > 0 ? variableExpensesSum / currentDay : 0;
    const projectedExpenses = totalExpenses + (dailyBurnRate * daysRemaining);
    const projectedBalance = totalIncome - projectedExpenses;
    const isOnTrack = projectedBalance >= savingsGoal;
    const spendPct = totalIncome > 0 ? Math.min(100, (totalExpenses / totalIncome) * 100) : 0;
    const savingsPct = totalIncome > 0 ? Math.max(0, (balance / totalIncome) * 100) : 0;
    const projectedSavingsPct = totalIncome > 0 ? Math.max(0, Math.min(100, (projectedBalance / totalIncome) * 100)) : 0;

    // Category breakdown for chart
    const catMap = {};
    currentMonthTransactions.forEach(tx => {
      if (tx.type === 'expense') {
        catMap[tx.category] = (catMap[tx.category] || 0) + Number(tx.amount);
      }
    });
    const topCats = Object.entries(catMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, val]) => ({ name, value: Math.round(val) }));

    return {
      dailyBurnRate,
      projectedBalance: isPastMonth ? (totalIncome - totalExpenses) : projectedBalance,
      isOnTrack,
      daysRemaining,
      isPastMonth,
      spendPct: Math.round(spendPct),
      savingsPct: Math.round(savingsPct),
      projectedSavingsPct: Math.round(projectedSavingsPct),
      currentDay,
      totalDaysInMonth,
      topCats,
    };
  }, [totalExpenses, totalIncome, savingsGoal, currentMonthTransactions, selectedMonth, selectedYear, balance]);

  const ringData = [{ value: prediction.spendPct, fill: prediction.isOnTrack ? 'var(--success)' : 'var(--danger)' }];

  return (
    <div className="glass-card flex-col gap-0" style={{
      background: 'linear-gradient(145deg, var(--bg-card) 0%, rgba(62,180,137,0.02) 100%)',
      border: '1px solid rgba(62,180,137,0.12)',
      height: '100%'
    }}>

      {/* ── Header ─────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0, paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-color)' }}>
        <Sparkles size={20} color="var(--primary)" />
        <div>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--primary)' }}>AI Prediction Engine</h2>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Real-time burn rate & end-of-month forecast</span>
        </div>
      </div>

      {/* ── Scrollable body ─────────────────────────────── */}
      <div className="ac-card-body" style={{ paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>

        {/* Row 1: Radial gauge + key stats */}
        <div className="pred-stats-row" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>

          {/* Radial gauge */}
          <div style={{ position: 'relative', width: 110, height: 110, flexShrink: 0, margin: '0 auto' }}>
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart
                cx="50%" cy="50%"
                innerRadius="68%" outerRadius="100%"
                startAngle={225} endAngle={-45}
                data={ringData}
              >
                <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                <RadialBar
                  background={{ fill: 'rgba(255,255,255,0.05)' }}
                  dataKey="value"
                  cornerRadius={8}
                  clockWise
                />
              </RadialBarChart>
            </ResponsiveContainer>
            {/* Center label */}
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
            }}>
              <span style={{ fontSize: '1.4rem', fontWeight: 800, color: prediction.isOnTrack ? 'var(--primary)' : 'var(--danger)', lineHeight: 1 }}>
                {prediction.spendPct}%
              </span>
              <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>spent</span>
            </div>
          </div>

          {/* Key stat tiles */}
          <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '0.6rem', width: '100%' }}>
            {[
              { label: 'Daily Burn', value: formatCurrency(Math.round(prediction.dailyBurnRate)), icon: <Zap size={13} />, color: 'var(--warning)' },
              { label: 'Days Left', value: prediction.isPastMonth ? '—' : prediction.daysRemaining, icon: <Calendar size={13} />, color: 'var(--primary)' },
              { label: 'Savings Rate', value: `${prediction.savingsPct}%`, icon: <TrendingUp size={13} />, color: 'var(--success)' },
              { label: 'Projected Save', value: `${prediction.projectedSavingsPct}%`, icon: <Target size={13} />, color: prediction.isOnTrack ? 'var(--success)' : 'var(--danger)' },
            ].map(stat => ( stat.value !== undefined &&
              <div key={stat.label} style={{
                padding: '0.55rem 0.7rem',
                background: 'var(--bg-input)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                display: 'flex', flexDirection: 'column', gap: '0.2rem',
              }}>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <span style={{ color: stat.color }}>{stat.icon}</span>{stat.label}
                </span>
                <span style={{ fontSize: '1.05rem', fontWeight: 700, color: stat.color, lineHeight: 1 }}>{stat.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Projected end balance banner */}
        <div style={{
          padding: '0.7rem 0.9rem',
          borderRadius: 'var(--radius-md)',
          background: prediction.isOnTrack ? 'var(--success-bg)' : 'var(--danger-bg)',
          border: `1px solid ${prediction.isOnTrack ? 'rgba(16,185,129,0.25)' : 'rgba(248,81,73,0.25)'}`,
          display: 'flex', alignItems: 'flex-start', gap: '0.5rem',
        }}>
          {prediction.isOnTrack
            ? <CheckCircle size={17} color="var(--success)" style={{ marginTop: 2, flexShrink: 0 }} />
            : <AlertTriangle size={17} color="var(--danger)" style={{ marginTop: 2, flexShrink: 0 }} />}
          <div style={{ flex: 1 }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: prediction.isOnTrack ? 'var(--success)' : 'var(--danger)' }}>
              {prediction.isPastMonth ? 'Final Balance: ' : 'Projected End Balance: '}
              {formatCurrency(Math.round(prediction.projectedBalance))}
            </span>
            <p style={{ fontSize: '0.75rem', color: prediction.isOnTrack ? 'var(--success)' : 'var(--danger)', marginTop: '0.2rem', opacity: 0.85 }}>
              {prediction.isPastMonth
                ? (prediction.isOnTrack ? `Goal achieved! You saved at least ${formatCurrency(savingsGoal)}.` : `You missed your ${formatCurrency(savingsGoal)} savings goal.`)
                : (prediction.isOnTrack ? `On track to save ${formatCurrency(savingsGoal)}. Keep it up!` : `At this burn rate, you'll miss your ${formatCurrency(savingsGoal)} goal. Cut variable spending.`)}
            </p>
          </div>
        </div>

        {/* Month progress bar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
          <div style={{ display: 'flex', justifycontent: 'space-between', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            <span>Month Progress</span>
            <span>Day {prediction.currentDay} / {prediction.totalDaysInMonth}</span>
          </div>
          <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: '4px',
              width: `${(prediction.currentDay / prediction.totalDaysInMonth) * 100}%`,
              background: 'linear-gradient(90deg, var(--primary), var(--primary-hover))',
              transition: 'width 0.5s ease',
            }} />
          </div>
        </div>

        {/* Top spending categories custom progress bars */}
        {prediction.topCats.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginTop: '0.25rem' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-main)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Top Spending Categories
            </span>
            <div className="flex-col gap-2" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {prediction.topCats.map((cat) => {
                const style = getCategoryStyle(cat.name);
                const color = style.color || 'var(--primary)';
                const catMax = prediction.topCats[0]?.value || 1;
                const pctOfMax = Math.max(4, (cat.value / catMax) * 100);
                const pctOfTotal = totalExpenses > 0 ? Math.round((cat.value / totalExpenses) * 100) : 0;

                return (
                  <div 
                    key={cat.name} 
                    className="flex-col gap-1.5" 
                    style={{ 
                      padding: '0.65rem 0.85rem', 
                      backgroundColor: 'var(--bg-input)', 
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-color)',
                      transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.2s ease, box-shadow 0.2s ease',
                      cursor: 'default'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-1.5px)';
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.2)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.borderColor = 'var(--border-color)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    {/* Category info header */}
                    <div className="flex items-center justify-between" style={{ width: '100%' }}>
                      <div className="flex items-center gap-1.5">
                        <CategoryIcon category={cat.name} size={15} />
                        <span style={{ fontWeight: 600, fontSize: '0.82rem', color: 'var(--text-main)' }}>
                          {cat.name}
                        </span>
                      </div>
                      <div className="flex items-baseline gap-1.5">
                        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)' }}>
                          {formatCurrency(cat.value)}
                        </span>
                        <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                          ({pctOfTotal}%)
                        </span>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div style={{ height: '6px', backgroundColor: 'rgba(255, 255, 255, 0.02)', borderRadius: 'var(--radius-sm)', overflow: 'hidden', width: '100%' }}>
                      <div 
                        style={{
                          height: '100%',
                          width: `${pctOfMax}%`,
                          backgroundColor: color,
                          borderRadius: 'var(--radius-sm)',
                          transition: 'width 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
                          boxShadow: `0 0 6px ${color}44`
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>{/* end ac-card-body */}
    </div>
  );
};

export default PredictionEngine;
