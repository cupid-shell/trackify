import React from 'react';
import { useAppContext } from '../context/AppContext';
import { AlertTriangle } from 'lucide-react';

const BudgetProgress = () => {
  const { userSettings, currentMonthTransactions } = useAppContext();
  const budgets = userSettings.category_budgets || {};

  // Only show categories that have a budget set
  const budgetedCategories = Object.keys(budgets).filter(cat => budgets[cat] > 0);

  if (budgetedCategories.length === 0) return null;

  // Calculate spent per category
  const spentByCategory = {};
  currentMonthTransactions
    .filter(tx => tx.type === 'expense')
    .forEach(tx => {
      spentByCategory[tx.category] = (spentByCategory[tx.category] || 0) + Number(tx.amount);
    });

  return (
    <div className="glass-card flex-col gap-4">
      <h2 style={{ fontSize: '1.25rem' }}>Budget Tracker</h2>
      <div className="flex-col gap-3">
        {budgetedCategories.map(cat => {
          const limit = budgets[cat];
          const spent = spentByCategory[cat] || 0;
          const percentage = Math.min((spent / limit) * 100, 100);
          const isOver = spent >= limit;
          const isWarning = percentage >= 80 && !isOver;

          return (
            <div key={cat} style={{ padding: '0.75rem', backgroundColor: 'var(--bg-input)', borderRadius: 'var(--radius-md)' }}>
              <div className="flex items-center justify-between" style={{ marginBottom: '0.5rem' }}>
                <span style={{ fontWeight: 500, fontSize: '0.875rem' }}>{cat}</span>
                <div className="flex items-center gap-2">
                  {(isOver || isWarning) && <AlertTriangle size={14} color={isOver ? 'var(--danger)' : '#f59e0b'} />}
                  <span style={{ 
                    fontSize: '0.875rem', 
                    fontWeight: 600,
                    color: isOver ? 'var(--danger)' : isWarning ? '#f59e0b' : 'var(--text-main)'
                  }}>
                    ৳{spent.toLocaleString('en-IN')} / ৳{limit.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
              
              {/* Progress bar */}
              <div style={{
                width: '100%',
                height: '8px',
                backgroundColor: 'rgba(255,255,255,0.1)',
                borderRadius: '4px',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${percentage}%`,
                  height: '100%',
                  borderRadius: '4px',
                  background: isOver 
                    ? 'var(--danger)' 
                    : isWarning 
                      ? 'linear-gradient(90deg, #f59e0b, #ef4444)' 
                      : 'linear-gradient(90deg, var(--primary), #818cf8)',
                  transition: 'width 0.5s ease'
                }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BudgetProgress;
