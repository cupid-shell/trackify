import { useState, useMemo } from 'react';
import { useAppContext, parseLocalDate } from '../context/AppContext';
import { subMonths, format } from 'date-fns';
import { TrendingUp, TrendingDown } from 'lucide-react';
import CustomSelect from './CustomSelect';
import CategoryIcon from './CategoryIcon';

const MonthComparison = () => {
  const { transactions, formatCurrency } = useAppContext();

  // Create options list for the past 12 months
  const monthOptions = useMemo(() => {
    const options = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const d = subMonths(now, i);
      const val = `${d.getFullYear()}-${d.getMonth()}`;
      const label = format(d, 'MMMM yyyy');
      options.push({ value: val, label });
    }
    return options;
  }, []);

  const [monthA, setMonthA] = useState(monthOptions[0]?.value || ''); // Default: Current Month
  const [monthB, setMonthB] = useState(monthOptions[1]?.value || ''); // Default: Previous Month

  const labelA = useMemo(() => monthOptions.find(o => o.value === monthA)?.label || 'Month A', [monthA, monthOptions]);
  const labelB = useMemo(() => monthOptions.find(o => o.value === monthB)?.label || 'Month B', [monthB, monthOptions]);

  const monthNameB = useMemo(() => {
    if (!monthB) return '';
    const [y, m] = monthB.split('-').map(Number);
    return format(new Date(y, m, 1), 'MMM');
  }, [monthB]);

  const monthNameA = useMemo(() => {
    if (!monthA) return '';
    const [y, m] = monthA.split('-').map(Number);
    return format(new Date(y, m, 1), 'MMM');
  }, [monthA]);

  // Aggregation helper
  const getMonthData = (monthYearStr, txs) => {
    if (!monthYearStr) return { totals: {}, totalSpent: 0 };
    const [year, month] = monthYearStr.split('-').map(Number);
    const monthlyTxs = txs.filter(tx => {
      const txDate = parseLocalDate(tx.date);
      return txDate.getMonth() === month && txDate.getFullYear() === year;
    });

    const categorySums = {};
    monthlyTxs.forEach(tx => {
      if (tx.type === 'expense') {
        categorySums[tx.category] = (categorySums[tx.category] || 0) + Number(tx.amount);
      }
    });

    return {
      totals: categorySums,
      totalSpent: Object.values(categorySums).reduce((s, a) => s + a, 0)
    };
  };

  // Combine and compute changes
  const { combinedData, totalSpentA, totalSpentB, biggestIncrease, biggestDecrease } = useMemo(() => {
    const dataA = getMonthData(monthA, transactions);
    const dataB = getMonthData(monthB, transactions);

    const allCategories = Array.from(new Set([
      ...Object.keys(dataA.totals),
      ...Object.keys(dataB.totals)
    ]));

    let maxIncPercent = -Infinity;
    let maxDecPercent = Infinity;
    let biggestIncCat = null;
    let biggestDecCat = null;

    const data = allCategories.map(cat => {
      const valA = dataA.totals[cat] || 0;
      const valB = dataB.totals[cat] || 0;
      
      let pctChange = 0;
      if (valB > 0) {
        pctChange = ((valA - valB) / valB) * 100;
      } else if (valA > 0) {
        pctChange = 100;
      }

      // Track biggest absolute/percentage changes
      if (valB > 0 || valA > 0) {
        const diff = valA - valB;
        if (diff > 0 && pctChange > maxIncPercent) {
          maxIncPercent = pctChange;
          biggestIncCat = { category: cat, pct: pctChange, valA, valB };
        } else if (diff < 0 && pctChange < maxDecPercent) {
          maxDecPercent = pctChange;
          biggestDecCat = { category: cat, pct: pctChange, valA, valB };
        }
      }

      return {
        category: cat,
        [labelA]: valA,
        [labelB]: valB,
        pctChange: Math.round(pctChange)
      };
    }).sort((a, b) => {
      const sumA = (a[labelA] || 0) + (a[labelB] || 0);
      const sumB = (b[labelA] || 0) + (b[labelB] || 0);
      return sumB - sumA;
    });

    return {
      combinedData: data,
      totalSpentA: dataA.totalSpent,
      totalSpentB: dataB.totalSpent,
      biggestIncrease: biggestIncCat,
      biggestDecrease: biggestDecCat
    };
  }, [monthA, monthB, transactions, labelA, labelB]);

  const totalDelta = totalSpentA - totalSpentB;
  const totalDeltaPct = totalSpentB > 0 ? (totalDelta / totalSpentB) * 100 : (totalSpentA > 0 ? 100 : 0);

  // Compute maximum category spend value for proportional scaling
  const maxVal = useMemo(() => {
    if (combinedData.length === 0) return 1;
    return Math.max(
      ...combinedData.map(item => Math.max(item[labelA] || 0, item[labelB] || 0)),
      1
    );
  }, [combinedData, labelA, labelB]);

  return (
    <div className="glass-card flex-col gap-0" style={{ height: '100%', width: '100%' }}>
      {/* Pinned Header */}
      <div className="flex items-center justify-between" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', flexShrink: 0, flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 600 }}>Compare Spending</h2>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Compare expense categories across two months</span>
        </div>
        
        <div className="flex items-center gap-2" style={{ flexWrap: 'nowrap' }}>
          <CustomSelect
            options={monthOptions}
            value={monthB}
            onChange={setMonthB}
            label="Base Month"
            triggerStyle={{ padding: '0.45rem 0.65rem', fontSize: '0.8rem', height: '2.1rem' }}
            style={{ width: '125px' }}
          />
          <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600, flexShrink: 0 }}>vs</span>
          <CustomSelect
            options={monthOptions}
            value={monthA}
            onChange={setMonthA}
            label="Comparison Month"
            triggerStyle={{ padding: '0.45rem 0.65rem', fontSize: '0.8rem', height: '2.1rem' }}
            style={{ width: '125px' }}
          />
        </div>
      </div>

      {/* Scrollable body */}
      <div className="ac-card-body" style={{ paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem', fontVariantNumeric: 'tabular-nums' }}>
        
        {/* Summary Stats Row */}
        <div className="grid-summary" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
          width: '100%',
          flexShrink: 0
        }}>
          {/* Total Spend Comparison */}
          <div className="flex-col gap-2" style={{
            backgroundColor: 'var(--bg-input)',
            padding: '1rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)',
            justifyContent: 'space-between'
          }}>
            <div className="flex-col gap-1">
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>Total Spending Change</span>
              <div className="flex-col gap-1" style={{ marginTop: '0.2rem' }}>
                <div className="flex items-center justify-between">
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{monthNameB} (Base):</span>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>{formatCurrency(totalSpentB)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-main)', fontWeight: 600 }}>{monthNameA} (Comp.):</span>
                  <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--primary)' }}>{formatCurrency(totalSpentA)}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between" style={{ marginTop: '0.4rem', borderTop: '1px dashed var(--border-color)', paddingTop: '0.4rem' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Difference:</span>
              <span style={{
                fontSize: '0.8rem',
                fontWeight: 700,
                color: totalDelta > 0 ? 'var(--danger)' : totalDelta < 0 ? 'var(--success)' : 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem'
              }}>
                {totalDelta > 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                {totalDelta > 0 ? '+' : ''}{formatCurrency(totalDelta)} ({Math.round(totalDeltaPct)}%)
              </span>
            </div>
          </div>

          {/* Biggest Increase */}
          <div className="flex-col justify-between" style={{
            backgroundColor: 'var(--bg-input)',
            padding: '1rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)'
          }}>
            <div className="flex-col gap-1">
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Biggest Spending Jump</span>
              {biggestIncrease ? (
                <>
                  <div className="flex items-center gap-1.5" style={{ marginTop: '0.2rem' }}>
                    <CategoryIcon category={biggestIncrease.category} size={16} />
                    <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {biggestIncrease.category}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
                    {monthNameB}: {formatCurrency(biggestIncrease.valB)} → {monthNameA}: {formatCurrency(biggestIncrease.valA)}
                  </div>
                </>
              ) : (
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic', marginTop: '0.2rem' }}>None detected</span>
              )}
            </div>
            {biggestIncrease && (
              <div className="flex items-center justify-between" style={{ marginTop: '0.4rem', borderTop: '1px dashed var(--border-color)', paddingTop: '0.4rem' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Jump:</span>
                <span style={{
                  fontSize: '0.8rem',
                  color: 'var(--danger)',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem'
                }}>
                  <TrendingUp size={14} />
                  +{formatCurrency(biggestIncrease.valA - biggestIncrease.valB)} (↑{Math.round(biggestIncrease.pct)}%)
                </span>
              </div>
            )}
          </div>

          {/* Biggest Decrease */}
          <div className="flex-col justify-between" style={{
            backgroundColor: 'var(--bg-input)',
            padding: '1rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)'
          }}>
            <div className="flex-col gap-1">
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Biggest Spending Drop</span>
              {biggestDecrease ? (
                <>
                  <div className="flex items-center gap-1.5" style={{ marginTop: '0.2rem' }}>
                    <CategoryIcon category={biggestDecrease.category} size={16} />
                    <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {biggestDecrease.category}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
                    {monthNameB}: {formatCurrency(biggestDecrease.valB)} → {monthNameA}: {formatCurrency(biggestDecrease.valA)}
                  </div>
                </>
              ) : (
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic', marginTop: '0.2rem' }}>None detected</span>
              )}
            </div>
            {biggestDecrease && (
              <div className="flex items-center justify-between" style={{ marginTop: '0.4rem', borderTop: '1px dashed var(--border-color)', paddingTop: '0.4rem' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Drop:</span>
                <span style={{
                  fontSize: '0.8rem',
                  color: 'var(--success)',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem'
                }}>
                  <TrendingDown size={14} />
                  -{formatCurrency(biggestDecrease.valB - biggestDecrease.valA)} (↓{Math.round(Math.abs(biggestDecrease.pct))}%)
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Custom HTML Legend */}
        {combinedData.length > 0 && (
          <div className="flex items-center justify-center gap-6" style={{
            fontSize: '0.75rem',
            fontWeight: 600,
            padding: '0.5rem 1rem',
            backgroundColor: 'rgba(255, 255, 255, 0.02)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)',
            marginTop: '0.5rem',
            flexShrink: 0
          }}>
            <div className="flex items-center gap-2">
              <span style={{ display: 'inline-block', width: '12px', height: '12px', borderRadius: '3px', backgroundColor: '#64748b' }}></span>
              <span style={{ color: 'var(--text-muted)' }}>{labelB} (Base Month)</span>
            </div>
            <div className="flex items-center gap-2">
              <span style={{ display: 'inline-block', width: '12px', height: '12px', borderRadius: '3px', backgroundColor: 'var(--primary)', boxShadow: '0 0 6px var(--primary-glow)' }}></span>
              <span style={{ color: 'var(--text-main)' }}>{labelA} (Comparison Month)</span>
            </div>
          </div>
        )}

        {/* Custom Comparison Bars Visualizer */}
        {combinedData.length > 0 ? (
          <div className="flex-col gap-3" style={{ width: '100%', marginTop: '0.5rem', paddingBottom: '1.5rem' }}>
            {combinedData.map(item => {
              const valA = item[labelA] || 0;
              const valB = item[labelB] || 0;
              const diff = valA - valB;
              const pct = item.pctChange;
              
              let diffColor = 'var(--text-muted)';
              let diffBg = 'rgba(255, 255, 255, 0.05)';
              let diffText = '0%';
              let isIncrease = false;
              let isDecrease = false;

              if (diff > 0) {
                diffColor = 'var(--danger)';
                diffBg = 'var(--danger-bg)';
                diffText = `+${formatCurrency(diff)} (↑${pct}%)`;
                isIncrease = true;
              } else if (diff < 0) {
                diffColor = 'var(--success)';
                diffBg = 'var(--success-bg)';
                diffText = `-${formatCurrency(Math.abs(diff))} (↓${Math.abs(pct)}%)`;
                isDecrease = true;
              }

              // Calculate proportional width percentages relative to maxVal
              const pctB = Math.max(4, (valB / maxVal) * 100);
              const pctA = Math.max(4, (valA / maxVal) * 100);

              return (
                <div 
                  key={item.category} 
                  className="flex-col gap-2" 
                  style={{ 
                    padding: '0.85rem 1rem', 
                    backgroundColor: 'var(--bg-input)', 
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-color)',
                    transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.2s ease, box-shadow 0.2s ease',
                    cursor: 'default',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.25)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.borderColor = 'var(--border-color)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  {/* Category Header Row */}
                  <div className="flex items-center justify-between" style={{ width: '100%' }}>
                    <div className="flex items-center gap-2">
                      <CategoryIcon category={item.category} size={18} />
                      <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-main)' }}>
                        {item.category}
                      </span>
                    </div>
                    <span 
                      style={{
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        color: diffColor,
                        backgroundColor: diffBg,
                        padding: '0.2rem 0.5rem',
                        borderRadius: '4px',
                        border: `1px solid ${diff > 0 ? 'rgba(244, 63, 94, 0.15)' : diff < 0 ? 'rgba(16, 185, 129, 0.15)' : 'transparent'}`,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.2rem'
                      }}
                    >
                      {isIncrease && <TrendingUp size={12} />}
                      {isDecrease && <TrendingDown size={12} />}
                      {diffText}
                    </span>
                  </div>

                  {/* Double Bar Visualizer */}
                  <div className="flex-col gap-2" style={{ width: '100%', marginTop: '0.25rem' }}>
                    {/* Base Month Bar (Slate Gray) */}
                    <div className="flex items-center gap-3" style={{ width: '100%' }}>
                      <span style={{ width: '50px', fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 500, textAlign: 'right', flexShrink: 0 }}>
                        {monthNameB}
                      </span>
                      <div style={{ flexGrow: 1, height: '14px', backgroundColor: 'rgba(255, 255, 255, 0.02)', borderRadius: 'var(--radius-sm)', position: 'relative', overflow: 'hidden' }}>
                        <div 
                          style={{
                            width: `${pctB}%`,
                            height: '100%',
                            backgroundColor: '#64748b', // Slate Gray
                            borderRadius: 'var(--radius-sm)',
                            transition: 'width 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
                            position: 'relative'
                          }}
                        />
                      </div>
                      <span style={{ width: '75px', fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, textAlign: 'left', flexShrink: 0 }}>
                        {formatCurrency(valB)}
                      </span>
                    </div>

                    {/* Comparison Month Bar (Primary Accent) */}
                    <div className="flex items-center gap-3" style={{ width: '100%' }}>
                      <span style={{ width: '50px', fontSize: '0.72rem', color: 'var(--text-main)', fontWeight: 600, textAlign: 'right', flexShrink: 0 }}>
                        {monthNameA}
                      </span>
                      <div style={{ flexGrow: 1, height: '14px', backgroundColor: 'rgba(255, 255, 255, 0.02)', borderRadius: 'var(--radius-sm)', position: 'relative', overflow: 'hidden' }}>
                        <div 
                          style={{
                            width: `${pctA}%`,
                            height: '100%',
                            backgroundColor: 'var(--primary)', // Theme primary Mint
                            borderRadius: 'var(--radius-sm)',
                            transition: 'width 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
                            position: 'relative',
                            boxShadow: '0 0 6px var(--primary-glow)'
                          }}
                        />
                      </div>
                      <span style={{ width: '75px', fontSize: '0.78rem', color: 'var(--primary)', fontWeight: 700, textAlign: 'left', flexShrink: 0 }}>
                        {formatCurrency(valA)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex items-center justify-center" style={{ height: '180px', color: 'var(--text-muted)', border: '1px dashed var(--border-color)', borderRadius: 'var(--radius-md)', marginTop: '0.5rem' }}>
            No expense transactions found in selected months.
          </div>
        )}
      </div>
    </div>
  );
};

export default MonthComparison;
