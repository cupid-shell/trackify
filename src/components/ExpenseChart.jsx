import React, { useMemo, useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { BarChart2, PieChart as PieIcon } from 'lucide-react';

const ExpenseChart = () => {
  const { currentMonthTransactions } = useAppContext();
  const [chartType, setChartType] = useState('donut'); // 'donut' or 'bar'

  const data = useMemo(() => {
    const expenses = currentMonthTransactions.filter(tx => tx.type === 'expense');
    
    const categoryTotals = expenses.reduce((acc, tx) => {
      acc[tx.category] = (acc[tx.category] || 0) + tx.amount;
      return acc;
    }, {});

    return Object.entries(categoryTotals)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [currentMonthTransactions]);

  const totalExpenseValue = useMemo(() => {
    return data.reduce((sum, item) => sum + item.value, 0);
  }, [data]);

  const colors = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

  return (
    <div className="glass-card flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 style={{ fontSize: '1.25rem' }}>Expenses by Category</h2>
        {data.length > 0 && (
          <div className="flex gap-1" style={{ backgroundColor: 'var(--bg-input)', padding: '2px', borderRadius: 'var(--radius-sm)' }}>
            <button
              onClick={() => setChartType('donut')}
              style={{
                padding: '0.25rem 0.5rem',
                borderRadius: '4px',
                backgroundColor: chartType === 'donut' ? 'var(--bg-hover)' : 'transparent',
                color: chartType === 'donut' ? 'var(--primary)' : 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center'
              }}
              title="Donut Chart"
            >
              <PieIcon size={16} />
            </button>
            <button
              onClick={() => setChartType('bar')}
              style={{
                padding: '0.25rem 0.5rem',
                borderRadius: '4px',
                backgroundColor: chartType === 'bar' ? 'var(--bg-hover)' : 'transparent',
                color: chartType === 'bar' ? 'var(--primary)' : 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center'
              }}
              title="Bar Chart"
            >
              <BarChart2 size={16} />
            </button>
          </div>
        )}
      </div>
      
      {data.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--text-muted)' }}>
          <p>No expenses to analyze yet.</p>
        </div>
      ) : (
        <div style={{ height: '300px', width: '100%', position: 'relative' }}>
          {chartType === 'donut' && (
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center',
              pointerEvents: 'none'
            }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Expenses</span>
              <h3 style={{ fontSize: '1.35rem', fontWeight: 700, marginTop: '2px' }}>৳{totalExpenseValue.toLocaleString('en-IN')}</h3>
            </div>
          )}
          
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'bar' ? (
              <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <XAxis 
                  dataKey="name" 
                  stroke="var(--text-muted)" 
                  fontSize={11} 
                  tickLine={false} 
                  axisLine={false} 
                  interval={0} 
                  tickFormatter={(name) => name.length > 12 ? `${name.substring(0, 10)}...` : name} 
                />
                <YAxis 
                  stroke="var(--text-muted)" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                  width={65}
                  tickFormatter={(val) => `৳${val.toLocaleString('en-IN')}`} 
                />
                <Tooltip 
                  cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                  contentStyle={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}
                  itemStyle={{ color: 'var(--text-main)' }}
                  formatter={(value) => [`৳${value.toLocaleString('en-IN')}`, 'Amount']}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                  ))}
                </Bar>
              </BarChart>
            ) : (
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}
                  itemStyle={{ color: 'var(--text-main)' }}
                  formatter={(val) => `৳${val.toLocaleString('en-IN')}`}
                />
              </PieChart>
            )}
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default ExpenseChart;
