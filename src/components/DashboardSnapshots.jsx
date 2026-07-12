import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { Scale, Heart, PiggyBank, ArrowUpRight } from 'lucide-react';
import CategoryIcon from './CategoryIcon';
import { computeHealthScore, gradeFor } from '../utils/healthScore';

const numStyle = {
  fontSize: '1.5rem',
  fontWeight: 800,
  letterSpacing: '-0.02em',
  fontVariantNumeric: 'tabular-nums',
  lineHeight: 1.1,
};

// A compact "tap to open the section" card. Whole card is a button.
const SnapshotCard = ({ label, icon, iconColor, iconBg, onClick, title, children }) => (
  <button type="button" className="glass-card snapshot-card" onClick={onClick} title={title}>
    <div className="flex items-center justify-between" style={{ marginBottom: '0.75rem' }}>
      <div style={{ background: iconBg, color: iconColor, padding: '0.4rem', borderRadius: 'var(--radius-md)', display: 'flex' }}>
        {icon}
      </div>
      <ArrowUpRight size={16} className="snapshot-arrow" style={{ color: 'var(--text-muted)' }} />
    </div>
    <div style={{ fontSize: '0.68rem', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
      {label}
    </div>
    {children}
  </button>
);

const DashboardSnapshots = () => {
  const {
    debts,
    reimbursements,
    currentMonthTransactions,
    totalIncome,
    totalExpenses,
    balance,
    savingsGoal,
    userSettings,
    selectedMonth,
    selectedYear,
    recurringBills,
    getCategoryStyle,
    formatCurrency,
  } = useAppContext();
  const navigate = useNavigate();

  // Ledger: net position + who-owes-whom + count of still-pending reimbursables.
  const ledger = useMemo(() => {
    let lent = 0;
    let borrowed = 0;
    debts.forEach((d) => {
      if (d.status !== 'active') return;
      const remaining = Number(d.amount) - Number(d.settled_amount || 0);
      if (d.type === 'lent') lent += remaining;
      else if (d.type === 'borrowed') borrowed += remaining;
    });
    const pendingReimburse = Object.values(reimbursements).filter((debtId) => {
      const d = debts.find((x) => x.id === debtId);
      return d && d.status === 'active';
    }).length;
    return { lent, borrowed, net: lent - borrowed, pendingReimburse };
  }, [debts, reimbursements]);

  // Biggest expense category this month + its share of total spending.
  const topCat = useMemo(() => {
    const byCat = {};
    let total = 0;
    currentMonthTransactions.forEach((tx) => {
      if (tx.type !== 'expense') return;
      const amt = Number(tx.amount);
      byCat[tx.category] = (byCat[tx.category] || 0) + amt;
      total += amt;
    });
    let name = null;
    let amount = 0;
    Object.entries(byCat).forEach(([c, a]) => {
      if (a > amount) { amount = a; name = c; }
    });
    return name ? { name, amount, pct: total > 0 ? Math.round((amount / total) * 100) : 0 } : null;
  }, [currentMonthTransactions]);

  // Financial-health grade (reuses the same engine the Analytics slide uses).
  const health = useMemo(() => {
    const { overallScore } = computeHealthScore({
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
    return { score: overallScore, grade: gradeFor(overallScore).grade };
  }, [currentMonthTransactions, userSettings.category_budgets, totalIncome, totalExpenses, balance, selectedMonth, selectedYear, recurringBills]);

  const saved = totalIncome - totalExpenses;
  const rate = totalIncome > 0 ? Math.round((saved / totalIncome) * 100) : 0;
  const goalPct = savingsGoal > 0 ? Math.min(Math.round((saved / savingsGoal) * 100), 100) : 0;

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '1.5rem',
      }}
    >
      {/* Ledger → net position */}
      <SnapshotCard
        label="Net Position"
        icon={<Scale size={20} />}
        iconColor="var(--primary)"
        iconBg="var(--primary-glow)"
        onClick={() => navigate('/ledger')}
        title="Open the Ledger"
      >
        <div style={{ ...numStyle, color: ledger.net > 0 ? 'var(--success)' : ledger.net < 0 ? 'var(--danger)' : 'var(--text-main)' }}>
          {ledger.net >= 0 ? '+' : ''}{formatCurrency(ledger.net)}
        </div>
        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
          <span style={{ color: 'var(--success)' }}>{formatCurrency(ledger.lent)}</span> to you ·{' '}
          <span style={{ color: 'var(--danger)' }}>{formatCurrency(ledger.borrowed)}</span> you owe
          {ledger.pendingReimburse > 0 && <> · {ledger.pendingReimburse} reimbursable</>}
        </div>
      </SnapshotCard>

      {/* Top category → History filtered to it */}
      <SnapshotCard
        label="Top Category"
        icon={topCat ? <CategoryIcon category={topCat.name} size={20} /> : <Scale size={20} />}
        iconColor={topCat ? getCategoryStyle(topCat.name).color : 'var(--text-muted)'}
        iconBg={topCat ? `${getCategoryStyle(topCat.name).color}18` : 'var(--bg-input)'}
        onClick={() => navigate(topCat ? `/history?cat=${encodeURIComponent(topCat.name)}` : '/history')}
        title={topCat ? `View ${topCat.name} transactions` : 'Open History'}
      >
        {topCat ? (
          <>
            <div style={numStyle}>{formatCurrency(topCat.amount)}</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.35rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {topCat.name} · {topCat.pct}% of spending
            </div>
          </>
        ) : (
          <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', paddingTop: '0.35rem' }}>No expenses yet this month</div>
        )}
      </SnapshotCard>

      {/* Financial health → Analytics */}
      <SnapshotCard
        label="Financial Health"
        icon={<Heart size={20} />}
        iconColor="var(--primary)"
        iconBg="var(--primary-glow)"
        onClick={() => navigate('/analytics')}
        title="Open Analytics"
      >
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
          <span style={numStyle}>{health.grade}</span>
          <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums' }}>{health.score}/100</span>
        </div>
        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>This month's score</div>
      </SnapshotCard>

      {/* Saved this month → Analytics */}
      <SnapshotCard
        label="Saved This Month"
        icon={<PiggyBank size={20} />}
        iconColor="var(--warning)"
        iconBg="var(--warning-bg)"
        onClick={() => navigate('/analytics')}
        title="Open Analytics"
      >
        <div style={{ ...numStyle, color: saved >= 0 ? 'var(--text-main)' : 'var(--danger)' }}>
          {formatCurrency(saved)}
        </div>
        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
          {rate}% saved · {goalPct}% of goal
        </div>
      </SnapshotCard>
    </div>
  );
};

export default DashboardSnapshots;
