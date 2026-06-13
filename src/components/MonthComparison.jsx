import { useState, useMemo } from 'react';
import { useAppContext, parseLocalDate } from '../context/AppContext';
import { subMonths, format } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, ArrowRight } from 'lucide-react';
import CustomSelect from './CustomSelect';

const MonthComparison = () => {
  const { transactions, formatCurrency, getCurrencySymbol } = useAppContext();

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
      <div className="ac-card-body" style={{ paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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
            border: '1px solid var(--border-color)'
          }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total Spending Change</span>
            <div className="flex items-baseline gap-2">
              <span style={{ fontSize: '1.25rem', fontWeight: 700 }}>
                {formatCurrency(totalSpentA)}
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                vs {formatCurrency(totalSpentB)}
              </span>
            </div>
            <span style={{
              fontSize: '0.8rem',
              fontWeight: 600,
              color: totalDelta > 0 ? 'var(--danger)' : totalDelta < 0 ? 'var(--success)' : 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem'
            }}>
              {totalDelta > 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              {totalDelta > 0 ? '+' : ''}{formatCurrency(totalDelta)} ({Math.round(totalDeltaPct)}%)
            </span>
          </div>

          {/* Biggest Increase */}
          <div className="flex-col gap-2" style={{
            backgroundColor: 'var(--bg-input)',
            padding: '1rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)'
          }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Biggest Spending Jump</span>
            {biggestIncrease ? (
              <>
                <span style={{ fontSize: '1rem', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {biggestIncrease.category}
                </span>
                <span style={{
                  fontSize: '0.8rem',
                  color: 'var(--danger)',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem'
                }}>
                  <TrendingUp size={14} />
                  +{formatCurrency(biggestIncrease.valA - biggestIncrease.valB)} (↑{Math.round(biggestIncrease.pct)}%)
                </span>
              </>
            ) : (
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>None detected</span>
            )}
          </div>

          {/* Biggest Decrease */}
          <div className="flex-col gap-2" style={{
            backgroundColor: 'var(--bg-input)',
            padding: '1rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)'
          }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Biggest Spending Drop</span>
            {biggestDecrease ? (
              <>
                <span style={{ fontSize: '1rem', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {biggestDecrease.category}
                </span>
                <span style={{
                  fontSize: '0.8rem',
                  color: 'var(--success)',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem'
                }}>
                  <TrendingDown size={14} />
                  -{formatCurrency(biggestDecrease.valB - biggestDecrease.valA)} (↓{Math.round(Math.abs(biggestDecrease.pct))}%)
                </span>
              </>
            ) : (
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>None detected</span>
            )}
          </div>
        </div>

        {/* Grouped Horizontal Bar Chart */}
        {combinedData.length > 0 ? (
          <div style={{ width: '100%', minHeight: '260px', marginTop: '0.5rem' }}>
            <ResponsiveContainer width="100%" height={Math.max(260, combinedData.length * 48)}>
              <BarChart
                data={combinedData}
                layout="vertical"
                margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" horizontal={false} />
                <XAxis type="number" stroke="var(--text-muted)" tickFormatter={(v) => getCurrencySymbol() + v} />
                <YAxis dataKey="category" type="category" stroke="var(--text-muted)" width={90} style={{ fontSize: '0.72rem' }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'var(--bg-card)', 
                    borderColor: 'var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--text-main)',
                    fontSize: '0.8rem'
                  }}
                  formatter={(value) => [formatCurrency(value), '']}
                />
                <Legend wrapperStyle={{ fontSize: '0.72rem', marginTop: '10px' }} />
                <Bar dataKey={labelB} fill="rgba(16, 185, 129, 0.4)" stroke="rgba(16, 185, 129, 0.8)" strokeWidth={1} radius={[0, 4, 4, 0]} />
                <Bar dataKey={labelA} fill="var(--primary)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex items-center justify-center" style={{ height: '180px', color: 'var(--text-muted)', border: '1px dashed var(--border-color)', borderRadius: 'var(--radius-md)' }}>
            No expense transactions found in selected months.
          </div>
        )}
      </div>
    </div>
  );
};

export default MonthComparison;
