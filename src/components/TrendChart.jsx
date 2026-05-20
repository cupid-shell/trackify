import React, { useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format, subMonths } from 'date-fns';

const TrendChart = () => {
  const { transactions, baseIncome } = useAppContext();

  const trendData = useMemo(() => {
    const data = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const targetDate = subMonths(now, i);
      const month = targetDate.getMonth();
      const year = targetDate.getFullYear();

      const monthTx = transactions.filter(tx => {
        const txDate = new Date(tx.date);
        return txDate.getMonth() === month && txDate.getFullYear() === year;
      });

      const income = baseIncome + monthTx
        .filter(tx => tx.type === 'income')
        .reduce((sum, tx) => sum + Number(tx.amount), 0);

      const expenses = monthTx
        .filter(tx => tx.type === 'expense')
        .reduce((sum, tx) => sum + Number(tx.amount), 0);

      data.push({
        name: format(targetDate, 'MMM yy'),
        Income: income,
        Expenses: expenses,
        Savings: income - expenses
      });
    }

    return data;
  }, [transactions, baseIncome]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          padding: '0.75rem 1rem',
        }}>
          <p style={{ fontWeight: 600, marginBottom: '0.5rem' }}>{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color, fontSize: '0.875rem' }}>
              {entry.name}: ৳{Number(entry.value).toLocaleString('en-IN')}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="glass-card flex-col gap-4">
      <h2 style={{ fontSize: '1.25rem' }}>6-Month Trend</h2>
      <div style={{ width: '100%', height: 300 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={trendData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <defs>
              <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.25}/>
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0.01}/>
              </linearGradient>
              <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.25}/>
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0.01}/>
              </linearGradient>
              <linearGradient id="colorSavings" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.25}/>
                <stop offset="95%" stopColor="var(--primary)" stopOpacity={0.01}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} />
            <YAxis stroke="var(--text-muted)" fontSize={12} width={65} tickFormatter={(v) => `৳${(v/1000).toFixed(0)}k`} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Area 
              type="monotone" 
              dataKey="Income" 
              stroke="#22c55e" 
              fillOpacity={1}
              fill="url(#colorIncome)"
              strokeWidth={2.5}
            />
            <Area 
              type="monotone" 
              dataKey="Expenses" 
              stroke="#ef4444" 
              fillOpacity={1}
              fill="url(#colorExpenses)"
              strokeWidth={2.5}
            />
            <Area 
              type="monotone" 
              dataKey="Savings" 
              stroke="var(--primary)" 
              fillOpacity={1}
              fill="url(#colorSavings)"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default TrendChart;
