import React from 'react';
import { useAppContext } from '../context/AppContext';
import { TrendingUp, TrendingDown, DollarSign, Target } from 'lucide-react';

const OverviewCards = () => {
  const { totalIncome, totalExpenses, balance, savingsGoal } = useAppContext();

  const cards = [
    {
      title: 'Current Balance',
      amount: balance,
      icon: <DollarSign size={24} color="var(--primary)" />,
      color: 'var(--primary)',
      bg: 'var(--primary-glow)',
    },
    {
      title: 'Monthly Income',
      amount: totalIncome,
      icon: <TrendingUp size={24} color="var(--success)" />,
      color: 'var(--success)',
      bg: 'var(--success-bg)',
      subtitle: 'Includes 15K base + allowances'
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
      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
      gap: '1.5rem',
      marginBottom: '2rem'
    }}>
      {cards.map((card, idx) => (
        <div key={idx} className="glass-card flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 style={{ color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: 500 }}>
              {card.title}
            </h3>
            <div style={{
              background: card.bg,
              padding: '0.5rem',
              borderRadius: 'var(--radius-md)'
            }}>
              {card.icon}
            </div>
          </div>
          
          <div>
            <h2 style={{ fontSize: '1.875rem', fontWeight: 700 }}>
              ৳{card.amount.toLocaleString('en-IN')}
            </h2>
            {card.subtitle && (
              <p style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>{card.subtitle}</p>
            )}
          </div>

          {card.progress !== undefined && (
            <div style={{ width: '100%', backgroundColor: 'var(--bg-input)', borderRadius: 'var(--radius-full)', height: '6px', overflow: 'hidden' }}>
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
