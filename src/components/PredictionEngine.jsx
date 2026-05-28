import { useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { Sparkles, AlertTriangle, CheckCircle, TrendingUp, Zap, Target, Calendar } from 'lucide-react';
import {
  RadialBarChart, RadialBar, PolarAngleAxis,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell
} from 'recharts';

const CustomTooltip = ({ active, payload }) => {
  if (active && payload?.length) {
    return (
      <div style={{
        background: 'rgba(13,17,23,0.92)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '8px',
        padding: '0.4rem 0.7rem',
        fontSize: '0.75rem',
        color: '#fff',
        backdropFilter: 'blur(8px)'
      }}>
        {payload[0].payload.name}: <strong>৳{payload[0].value.toLocaleString('en-IN')}</strong>
      </div>
    );
  }
  return null;
};

const PredictionEngine = () => {
  const { totalIncome, totalExpenses, savingsGoal, currentMonthTransactions, selectedMonth, selectedYear, balance, getCategoryStyle } = useAppContext();

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

    // Category breakdown for bar chart
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

  const ringData = [{ value: prediction.spendPct, fill: prediction.isOnTrack ? '#58a6ff' : '#f85149' }];




  return (
    <div className="glass-card flex-col gap-0" style={{
      background: 'linear-gradient(145deg, var(--bg-card) 0%, rgba(99,102,241,0.04) 100%)',
      border: '1px solid rgba(99,102,241,0.18)',
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
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>

          {/* Radial gauge */}
          <div style={{ position: 'relative', width: 110, height: 110, flexShrink: 0 }}>
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
          <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
            {[
              { label: 'Daily Burn', value: `৳${Math.round(prediction.dailyBurnRate).toLocaleString('en-IN')}`, icon: <Zap size={13} />, color: 'var(--warning)' },
              { label: 'Days Left', value: prediction.isPastMonth ? '—' : prediction.daysRemaining, icon: <Calendar size={13} />, color: 'var(--primary)' },
              { label: 'Savings Rate', value: `${prediction.savingsPct}%`, icon: <TrendingUp size={13} />, color: 'var(--success)' },
              { label: 'Projected Save', value: `${prediction.projectedSavingsPct}%`, icon: <Target size={13} />, color: prediction.isOnTrack ? 'var(--success)' : 'var(--danger)' },
            ].map(stat => (
              <div key={stat.label} style={{
                padding: '0.55rem 0.7rem',
                background: 'rgba(255,255,255,0.03)',
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
              ৳{Math.round(prediction.projectedBalance).toLocaleString('en-IN')}
            </span>
            <p style={{ fontSize: '0.75rem', color: prediction.isOnTrack ? 'var(--success)' : 'var(--danger)', marginTop: '0.2rem', opacity: 0.85 }}>
              {prediction.isPastMonth
                ? (prediction.isOnTrack ? `Goal achieved! You saved at least ৳${savingsGoal.toLocaleString('en-IN')}.` : `You missed your ৳${savingsGoal.toLocaleString('en-IN')} savings goal.`)
                : (prediction.isOnTrack ? `On track to save ৳${savingsGoal.toLocaleString('en-IN')}. Keep it up!` : `At this burn rate, you'll miss your ৳${savingsGoal.toLocaleString('en-IN')} goal. Cut variable spending.`)}
            </p>
          </div>
        </div>

        {/* Month progress bar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            <span>Month Progress</span>
            <span>Day {prediction.currentDay} / {prediction.totalDaysInMonth}</span>
          </div>
          <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: '4px',
              width: `${(prediction.currentDay / prediction.totalDaysInMonth) * 100}%`,
              background: 'linear-gradient(90deg, var(--primary), #a855f7)',
              transition: 'width 0.5s ease',
            }} />
          </div>
        </div>

        {/* Top spending categories bar chart */}
        {prediction.topCats.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-main)' }}>
              Top Spending Categories
            </span>
            <div style={{ height: 150 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={prediction.topCats} margin={{ top: 5, right: 4, left: -22, bottom: 0 }}>
                  <defs>
                    {prediction.topCats.map((cat, idx) => {
                      const style = getCategoryStyle(cat.name);
                      const color = style.color || '#6366f1';
                      return (
                        <linearGradient key={idx} id={`predBarGrad-${idx}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={color} stopOpacity={0.85} />
                          <stop offset="100%" stopColor={color} stopOpacity={0.15} />
                        </linearGradient>
                      );
                    })}
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: 'var(--text-muted)', fontSize: 9, fontWeight: 500 }}
                    axisLine={false}
                    tickLine={false}
                    angle={-22}
                    textAnchor="end"
                    height={38}
                    interval={0}
                    tickFormatter={(name) => name.length > 14 ? `${name.substring(0, 11)}...` : name}
                  />
                  <YAxis
                    tick={{ fill: 'var(--text-muted)', fontSize: 9 }}
                    axisLine={false}
                    tickLine={false}
                    width={45}
                    tickFormatter={v => {
                      if (v >= 1000) {
                        const kVal = v / 1000;
                        return `৳${Number.isInteger(kVal) ? kVal : kVal.toFixed(1)}k`;
                      }
                      return `৳${v}`;
                    }}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                  <Bar dataKey="value" radius={[5, 5, 0, 0]} barSize={20}>
                    {prediction.topCats.map((entry, idx) => {
                      const style = getCategoryStyle(entry.name);
                      const color = style.color || '#6366f1';
                      return (
                        <Cell 
                          key={`cell-${idx}`} 
                          fill={`url(#predBarGrad-${idx})`} 
                          stroke={color}
                          strokeWidth={1.5}
                        />
                      );
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

      </div>{/* end ac-card-body */}
    </div>
  );
};

export default PredictionEngine;
