import { useMemo, useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Sector } from 'recharts';
import { BarChart2, PieChart as PieIcon } from 'lucide-react';

const renderActiveShape = (props) => {
  const RADIAN = Math.PI / 180;
  const {
    cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle,
    fill, payload, percent, value
  } = props;
  
  const sin = Math.sin(-RADIAN * midAngle);
  const cos = Math.cos(-RADIAN * midAngle);
  
  // Coordinates for the leader line (start, elbow, end)
  const sx = cx + (outerRadius + 2) * cos;
  const sy = cy + (outerRadius + 2) * sin;
  const mx = cx + (outerRadius + 10) * cos;
  const my = cy + (outerRadius + 10) * sin;
  const ex = mx + (cos >= 0 ? 1 : -1) * 12;
  const ey = my;
  
  // Label text position and alignment
  const textAnchor = cos >= 0 ? 'start' : 'end';
  const tx = ex + (cos >= 0 ? 1 : -1) * 5;
  const ty = ey;

  return (
    <g>
      {/* Glow Sector on hover */}
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 4}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        style={{
          filter: `drop-shadow(0 0 5px ${fill}33)`,
          transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      />
      
      {/* Animated leader line path */}
      <path
        className="leader-line"
        d={`M${sx},${sy}L${mx},${my}H${ex}`}
        stroke={fill}
        strokeWidth={1.5}
        fill="none"
      />
      
      {/* Animated Callout Label */}
      <g className="callout-text-group">
        <text
          x={tx}
          y={ty - 5}
          textAnchor={textAnchor}
          fill="var(--text-main)"
          fontSize={10.5}
          fontWeight={600}
          fontFamily="Hubot Sans Variable"
        >
          {payload.name}
        </text>
        <text
          x={tx}
          y={ty + 10}
          textAnchor={textAnchor}
          fill="var(--text-muted)"
          fontSize={9.5}
          fontWeight={500}
          fontFamily="Mona Sans Variable"
        >
          {`৳${value.toLocaleString('en-IN')} (${(percent * 100).toFixed(1)}%)`}
        </text>
      </g>
    </g>
  );
};

const ExpenseChart = () => {
  const { currentMonthTransactions } = useAppContext();
  const [chartType, setChartType] = useState('donut'); // 'donut' or 'bar'
  const [activeIndex, setActiveIndex] = useState(-1);

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
      <style>{`
        @keyframes drawLeaderLine {
          from { stroke-dashoffset: 50; }
          to { stroke-dashoffset: 0; }
        }
        @keyframes fadeInCalloutText {
          from { opacity: 0; transform: translateY(3px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .leader-line {
          stroke-dasharray: 50;
          stroke-dashoffset: 50;
          animation: drawLeaderLine 0.22s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .callout-text-group {
          opacity: 0;
          animation: fadeInCalloutText 0.18s cubic-bezier(0.16, 1, 0.3, 1) 0.20s forwards;
        }
      `}</style>
      <div className="flex items-center justify-between">
        <h2 style={{ fontSize: '1.25rem', lineHeight: '1.4', paddingTop: '2px' }}>Expenses by Category</h2>
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
              pointerEvents: 'none',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              whiteSpace: 'nowrap',
              width: '120px',
              zIndex: 10
            }}>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>Total Expenses</span>
              <span style={{ fontSize: '1.4rem', fontFamily: 'Hubot Sans Variable', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.15rem' }}>৳{totalExpenseValue.toLocaleString('en-IN')}</span>
            </div>
          )}
          
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'bar' ? (
              <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 35 }}>
                <XAxis 
                  dataKey="name" 
                  stroke="var(--text-muted)" 
                  fontSize={11} 
                  tickLine={false} 
                  axisLine={false} 
                  interval={0} 
                  tickFormatter={(name) => name.length > 12 ? `${name.substring(0, 10)}...` : name} 
                  angle={-35}
                  textAnchor="end"
                  height={60}
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
              <PieChart margin={{ left: 30, right: 30, top: 10, bottom: 10 }}>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={90}
                  paddingAngle={4}
                  dataKey="value"
                  activeIndex={activeIndex}
                  activeShape={renderActiveShape}
                  onMouseEnter={(event, index) => setActiveIndex(index)}
                  onMouseLeave={() => setActiveIndex(-1)}
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={colors[index % colors.length]} style={{ outline: 'none' }} />
                  ))}
                </Pie>
              </PieChart>
            )}
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default ExpenseChart;
