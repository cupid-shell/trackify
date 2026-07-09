import { useAppContext } from '../context/AppContext';
import { TrendingUp, TrendingDown, DollarSign, Target } from 'lucide-react';

const OverviewCards = () => {
  const { totalIncome, totalExpenses, balance, savingsGoal, baseIncome, formatCurrency } = useAppContext();

  const cards = [
    {
      title: 'Current Balance',
      amount: balance,
      icon: <DollarSign size={24} color="#fff" />,
      color: '#fff',
      bg: 'var(--primary)',
      hero: true,
    },
    {
      title: 'Monthly Income',
      amount: totalIncome,
      icon: <TrendingUp size={24} color="var(--success)" />,
      color: 'var(--success)',
      bg: 'var(--success-bg)',
      subtitle: `Includes ${formatCurrency(baseIncome)} base + allowances`
    },
    {
      title: 'Monthly Expenses',
      amount: totalExpenses,
      icon: <TrendingDown size={24} color="var(--danger)" />,
      color: 'var(--danger)',
      bg: 'var(--danger-bg)',
    },
    {
      title: 'Savings Goal',
      amount: savingsGoal,
      icon: <Target size={24} color="var(--warning)" />,
      color: 'var(--warning)',
      bg: 'rgba(245, 158, 11, 0.1)',
      progress: Math.min((balance / savingsGoal) * 100, 100)
    }
  ];

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
      gap: '1.5rem',
      marginBottom: '2rem'
    }}>
      {cards.map((card, idx) => (
        <div
          key={idx}
          className="glass-card flex-col gap-4"
          style={card.hero ? {
            background: 'linear-gradient(0deg, rgb(from var(--primary) r g b / 0.06), rgb(from var(--primary) r g b / 0.06)), var(--bg-card)',
            border: '1px solid rgb(from var(--primary) r g b / 0.25)'
          } : undefined}
        >
          <div className="flex items-center justify-between">
            <h3 style={{
              color: 'var(--text-muted)',
              fontSize: '0.72rem',
              fontWeight: 600,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              fontFamily: "'Mona Sans Variable', sans-serif"
            }}>
              {card.title}
            </h3>
            <div 
              className="icon-badge"
              style={{
                background: card.bg,
                color: card.color,
                padding: '0.45rem',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {card.icon}
            </div>
          </div>
          
          <div>
            <h2 style={{
              fontSize: '2.1rem',
              fontWeight: 800,
              fontFamily: "'Hubot Sans Variable', sans-serif",
              letterSpacing: '-0.03em',
              fontVariantNumeric: 'tabular-nums',
              lineHeight: 1.1,
              color: card.hero && card.amount < 0 ? 'var(--danger)' : 'var(--text-main)'
            }}>
              {formatCurrency(card.amount)}
            </h2>
            {card.subtitle && (
              <div style={{ marginTop: '0.4rem', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                {card.subtitle}
              </div>
            )}
          </div>

          {card.progress !== undefined && (
            <div style={{ width: '100%', backgroundColor: 'var(--bg-input)', borderRadius: 'var(--radius-full)', height: '6px', overflow: 'hidden', marginTop: '0.25rem' }}>
              <div style={{
                width: `${Math.max(card.progress, 0)}%`,
                backgroundColor: card.color,
                height: '100%',
                borderRadius: 'var(--radius-full)',
                transition: 'width 1s ease-in-out'
              }}></div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default OverviewCards;
