import { useMemo, useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { PieChart, Pie, Cell, Sector, ResponsiveContainer } from 'recharts';
import { BarChart2, PieChart as PieIcon } from 'lucide-react';
import CategoryIcon from './CategoryIcon';

const ExpenseChart = () => {
  const { currentMonthTransactions, getCategoryStyle, formatCurrency } = useAppContext();
  const [chartType, setChartType] = useState('donut'); // 'donut' or 'bar'
  const [activeIndex, setActiveIndex] = useState(-1);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);

  const renderActiveShape = (props) => {
    const RADIAN = Math.PI / 180;
    const {
      cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle,
      fill, payload, percent, value
    } = props;
    
    const cos = Math.cos(-RADIAN * midAngle);
    const sin = Math.sin(-RADIAN * midAngle);
    
    const isMobile = window.innerWidth < 640;
    const lineElbow = isMobile ? 5 : 10;
    const lineExtension = isMobile ? 8 : 12;
    const textSpacing = isMobile ? 3 : 5;

    const sx = cx + (outerRadius + 2) * cos;
    const sy = cy + (outerRadius + 2) * sin;
    const mx = cx + (outerRadius + lineElbow) * cos;
    const my = cy + (outerRadius + lineElbow) * sin;
    const ex = mx + (cos >= 0 ? 1 : -1) * lineExtension;
    const ey = my;
    
    const textAnchor = cos >= 0 ? 'start' : 'end';
    const tx = ex + (cos >= 0 ? 1 : -1) * textSpacing;
    const ty = ey;

    return (
      <g>
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
        
        <path
          className="leader-line"
          d={`M${sx},${sy}L${mx},${my}H${ex}`}
          stroke={fill}
          strokeWidth={1.5}
          fill="none"
        />
        
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
            {`${formatCurrency(value)} (${(percent * 100).toFixed(1)}%)`}
          </text>
        </g>
      </g>
    );
  };

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
    <div className="glass-card flex-col gap-0" style={{ height: '100%' }}>
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
      
      {/* Header — pinned */}
      <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 600 }}>Expenses by Category</h3>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Breakdown of your expenditures this month
          </span>
        </div>
        
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
                alignItems: 'center',
                border: 'none',
                cursor: 'pointer'
              }}
              title="Donut Chart"
            >
              <PieIcon size={14} />
            </button>
            <button
              onClick={() => setChartType('bar')}
              style={{
                padding: '0.25rem 0.5rem',
                borderRadius: '4px',
                backgroundColor: chartType === 'bar' ? 'var(--bg-hover)' : 'transparent',
                color: chartType === 'bar' ? 'var(--primary)' : 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                border: 'none',
                cursor: 'pointer'
              }}
              title="Category Bar Progress"
            >
              <BarChart2 size={14} />
            </button>
          </div>
        )}
      </div>

      <div className="ac-card-body" style={{ paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {data.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--text-muted)' }}>
            <p>No expenses to analyze yet.</p>
          </div>
        ) : chartType === 'donut' ? (
          <>
            <div className="relative-container" style={{ height: '220px', width: '100%', flexShrink: 0 }}>
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
                width: isMobile ? '80px' : '120px',
                zIndex: 10
              }}>
                <span style={{ fontSize: isMobile ? '0.52rem' : '0.62rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>Total Expenses</span>
                <span style={{ fontSize: isMobile ? '0.95rem' : '1.25rem', fontFamily: 'Hubot Sans Variable', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.15rem' }}>{formatCurrency(totalExpenseValue)}</span>
              </div>
              
              <ResponsiveContainer width="100%" height="100%">
                <PieChart margin={{ left: 10, right: 10, top: 0, bottom: 0 }}>
                  <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    innerRadius={isMobile ? 45 : 65}
                    outerRadius={isMobile ? 60 : 82}
                    paddingAngle={3}
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
              </ResponsiveContainer>
            </div>

            {/* Category Breakdown List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginTop: '0.25rem' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Category Breakdown</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {data.map((item, idx) => {
                  const pct = totalExpenseValue > 0 ? (item.value / totalExpenseValue) * 100 : 0;
                  const color = colors[idx % colors.length];
                  const style = getCategoryStyle(item.name);
                  return (
                    <div 
                      key={item.name} 
                      className="flex items-center gap-3" 
                      style={{ 
                        padding: '0.65rem 0.85rem', 
                        backgroundColor: 'var(--bg-input)', 
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-color)',
                        transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.2s ease, box-shadow 0.2s ease',
                        cursor: 'default',
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
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-md)', border: `1px solid ${style.color || 'rgba(255,255,255,0.04)'}`, flexShrink: 0 }}>
                        <CategoryIcon category={item.name} size={15} />
                      </div>
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                          <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{item.name}</span>
                          <span style={{ fontWeight: 700, color: style.color || 'var(--text-main)' }}>
                            {formatCurrency(item.value)}{' '}
                            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 500 }}>({pct.toFixed(1)}%)</span>
                          </span>
                        </div>
                        <div style={{ height: '5px', background: 'rgba(255,255,255,0.04)', borderRadius: '2.5px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${pct}%`, background: style.color || color, borderRadius: '2.5px', boxShadow: `0 0 5px ${style.color || color}33` }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        ) : (
          /* Bar chart list view: Shows all categories in a full visual list of custom progress cards */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', paddingBottom: '1.5rem' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Category Spending Progress</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {data.map((item, idx) => {
                const pct = totalExpenseValue > 0 ? (item.value / totalExpenseValue) * 100 : 0;
                const maxVal = Math.max(...data.map(d => d.value), 1);
                const pctOfMax = Math.max(4, (item.value / maxVal) * 100);
                const color = colors[idx % colors.length];
                const style = getCategoryStyle(item.name);
                return (
                  <div 
                    key={item.name} 
                    className="flex-col gap-2" 
                    style={{ 
                      padding: '0.75rem 1rem', 
                      backgroundColor: 'var(--bg-input)', 
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-color)',
                      transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.2s ease, box-shadow 0.2s ease',
                      cursor: 'default',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.2)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.borderColor = 'var(--border-color)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <div className="flex items-center justify-between" style={{ width: '100%' }}>
                      <div className="flex items-center gap-2">
                        <CategoryIcon category={item.name} size={16} />
                        <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-main)' }}>
                          {item.name}
                        </span>
                      </div>
                      <div className="flex items-baseline gap-1.5">
                        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: style.color || 'var(--text-main)' }}>
                          {formatCurrency(item.value)}
                        </span>
                        <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                          ({pct.toFixed(1)}%)
                        </span>
                      </div>
                    </div>

                    <div style={{ height: '6px', backgroundColor: 'rgba(255, 255, 255, 0.02)', borderRadius: 'var(--radius-sm)', overflow: 'hidden', width: '100%' }}>
                      <div 
                        style={{
                          height: '100%',
                          width: `${pctOfMax}%`,
                          backgroundColor: style.color || color,
                          borderRadius: 'var(--radius-sm)',
                          transition: 'width 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
                          boxShadow: `0 0 6px ${style.color || color}44`
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExpenseChart;
