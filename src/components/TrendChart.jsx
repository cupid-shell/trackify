import { useMemo } from 'react';
import { useAppContext, parseLocalDate } from '../context/AppContext';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format, subMonths } from 'date-fns';
import { Wallet, TrendingUp, Calendar, Award } from 'lucide-react';

// Declared at module scope (not inside the component) so it isn't recreated on
// every render. formatCurrency is passed in as a prop by the <Tooltip>.
const CustomTooltip = ({ active, payload, label, formatCurrency }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-md)',
        padding: '0.75rem 1rem',
      }}>
        <p style={{ fontWeight: 600, marginBottom: '0.5rem', fontSize: '0.8rem' }}>{label}</p>
        {payload.map((entry, index) => (
          <p key={index} style={{ color: entry.color, fontSize: '0.75rem', marginTop: '0.2rem' }}>
            {entry.name}: {formatCurrency(entry.value)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const TrendChart = () => {
  const { transactions, baseIncome, formatCurrency } = useAppContext();

  const trendData = useMemo(() => {
    const data = [];
    const now = new Date();

    // Find the earliest transaction date in history
    let earliestDate = null;
    if (transactions.length > 0) {
      earliestDate = parseLocalDate(transactions[transactions.length - 1].date);
    }

    for (let i = 5; i >= 0; i--) {
      const targetDate = subMonths(now, i);
      const month = targetDate.getMonth();
      const year = targetDate.getFullYear();

      // Check if this month is strictly before the earliest transaction month
      const isBeforeStart = earliestDate && (
        year < earliestDate.getFullYear() ||
        (year === earliestDate.getFullYear() && month < earliestDate.getMonth())
      );

      if (isBeforeStart) {
        data.push({
          name: format(targetDate, 'MMM yy'),
          Income: 0,
          Expenses: 0,
          Savings: 0,
          isPlaceholder: true
        });
        continue;
      }

      const monthTx = transactions.filter(tx => {
        const txDate = parseLocalDate(tx.date);
        return txDate.getMonth() === month && txDate.getFullYear() === year;
      });

      const isCurrentMonth = year === now.getFullYear() && month === now.getMonth();
      const hasExpense = monthTx.some(tx => tx.type === 'expense');
      const shouldAddBaseIncome = isCurrentMonth || hasExpense;

      const income = (shouldAddBaseIncome ? baseIncome : 0) + monthTx
        .filter(tx => tx.type === 'income')
        .reduce((sum, tx) => sum + Number(tx.amount), 0);

      const expenses = monthTx
        .filter(tx => tx.type === 'expense')
        .reduce((sum, tx) => sum + Number(tx.amount), 0);

      data.push({
        name: format(targetDate, 'MMM yy'),
        Income: income,
        Expenses: expenses,
        Savings: income - expenses,
        isPlaceholder: false
      });
    }

    return data;
  }, [transactions, baseIncome]);

  const stats = useMemo(() => {
    if (trendData.length === 0) return null;
    
    let totalSavings = 0;
    let totalIncome = 0;
    let maxSavings = -Infinity;
    let maxSavingsMonth = '';
    
    trendData.forEach(d => {
      if (d.isPlaceholder) return;
      totalSavings += d.Savings;
      totalIncome += d.Income;
      if (d.Savings > maxSavings) {
        maxSavings = d.Savings;
        maxSavingsMonth = d.name;
      }
    });
    
    const avgSavingsRate = totalIncome > 0 ? (totalSavings / totalIncome) * 100 : 0;
    const lastMonth = trendData[trendData.length - 1] || { Income: 0, Expenses: 0, Savings: 0 };
    const lastMonthSavingsRate = lastMonth.Income > 0 ? (lastMonth.Savings / lastMonth.Income) * 100 : 0;
    
    return {
      totalSavings,
      avgSavingsRate: Math.round(avgSavingsRate),
      maxSavings: maxSavings === -Infinity ? 0 : maxSavings,
      maxSavingsMonth,
      lastMonthSavingsRate: Math.round(lastMonthSavingsRate),
      lastMonthSavings: lastMonth.Savings
    };
  }, [trendData]);

  return (
    <div className="glass-card flex-col gap-0" style={{ height: '100%' }}>
      {/* Header — pinned */}
      <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', flexShrink: 0 }}>
        <h3 style={{ fontSize: '1.125rem', fontWeight: 600 }}>6-Month Trend</h3>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          Compare income, expenses, and savings over time
        </span>
      </div>

      <div className="ac-card-body" style={{ paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div className="relative-container" style={{ width: '100%', height: 260 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <defs>
                <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.25}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.01}/>
                </linearGradient>
                <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.25}/>
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.01}/>
                </linearGradient>
                <linearGradient id="colorSavings" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--warning)" stopOpacity={0.25}/>
                  <stop offset="95%" stopColor="var(--warning)" stopOpacity={0.01}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={11} />
              <YAxis stroke="var(--text-muted)" fontSize={11} width={55} tickFormatter={(v) => `${formatCurrency(v/1000)}k`} />
              <Tooltip content={<CustomTooltip formatCurrency={formatCurrency} />} />
              <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '0.75rem' }} />
              <Area 
                type="monotone" 
                dataKey="Income" 
                stroke="#10b981" 
                fillOpacity={1}
                fill="url(#colorIncome)"
                strokeWidth={2.5}
              />
              <Area 
                type="monotone" 
                dataKey="Expenses" 
                stroke="#f43f5e" 
                fillOpacity={1}
                fill="url(#colorExpenses)"
                strokeWidth={2.5}
              />
              <Area 
                type="monotone" 
                dataKey="Savings"
                stroke="var(--warning)"
                fillOpacity={1}
                fill="url(#colorSavings)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {stats && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '0.6rem' }}>
            {[
              { label: 'Total Saved (6M)', value: formatCurrency(stats.totalSavings), icon: <Wallet size={13} />, color: stats.totalSavings >= 0 ? 'var(--success)' : 'var(--danger)' },
              { label: 'Avg Savings Rate', value: `${stats.avgSavingsRate}%`, icon: <TrendingUp size={13} />, color: 'var(--primary)' },
              { label: 'Best Month', value: `${stats.maxSavingsMonth} (${formatCurrency(stats.maxSavings)})`, icon: <Award size={13} />, color: 'var(--warning)', fullWidth: true },
              { label: 'Recent Month Saved', value: `${formatCurrency(stats.lastMonthSavings)} (${stats.lastMonthSavingsRate}%)`, icon: <Calendar size={13} />, color: 'var(--text-main)', fullWidth: true },
            ].map((stat, i) => (
              <div key={i} style={{
                padding: '0.55rem 0.7rem',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                display: 'flex', flexDirection: 'column', gap: '0.2rem',
                gridColumn: stat.fullWidth ? 'span 2' : 'auto'
              }}>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <span style={{ color: stat.color }}>{stat.icon}</span>{stat.label}
                </span>
                <span style={{ fontSize: '0.95rem', fontWeight: 700, color: stat.color, lineHeight: 1.1 }}>{stat.value}</span>
              </div>
            ))}
          </div>
        )}
      </div>{/* end ac-card-body */}
    </div>
  );
};

export default TrendChart;
