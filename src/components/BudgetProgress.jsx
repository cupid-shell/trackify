import React from 'react';
import { useAppContext } from '../context/AppContext';
import { AlertTriangle } from 'lucide-react';

const BudgetProgress = () => {
  const { userSettings, currentMonthTransactions, getCategoryStyle } = useAppContext();
  const budgets = userSettings.category_budgets || {};
  const expenseCategories = userSettings.expense_categories || [];

  // Only show categories that have a budget set and exist in the current expense categories
  const budgetedCategories = Object.keys(budgets).filter(cat => budgets[cat] > 0 && expenseCategories.includes(cat));

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
          
          const diff = limit - spent;
          const diffAbs = Math.abs(diff);
          const diffText = isOver ? `৳${diffAbs.toLocaleString('en-IN')} over` : `৳${diffAbs.toLocaleString('en-IN')} left`;
          const diffColor = isOver ? 'var(--danger)' : 'var(--success)';

          return (
            <div key={cat} style={{ padding: '0.75rem', backgroundColor: 'var(--bg-input)', borderRadius: 'var(--radius-md)' }}>
              <div className="flex items-center justify-between" style={{ marginBottom: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '1rem' }}>{getCategoryStyle(cat).emoji}</span>
                  <span style={{ fontWeight: 500, fontSize: '0.875rem' }}>{cat}</span>
                </div>
                <div className="flex items-center gap-2">
                  {(isOver || isWarning) && <AlertTriangle size={14} color={isOver ? 'var(--danger)' : '#f59e0b'} />}
                  <div className="flex-col" style={{ alignItems: 'flex-end', textAlign: 'right' }}>
                    <span style={{ 
                      fontSize: '0.875rem', 
                      fontWeight: 600,
                      color: isOver ? 'var(--danger)' : isWarning ? '#f59e0b' : 'var(--text-main)',
                      display: 'block'
                    }}>
                      ৳{spent.toLocaleString('en-IN')} / ৳{limit.toLocaleString('en-IN')}
                    </span>
                    <span style={{
                      fontSize: '0.7rem',
                      fontWeight: 500,
                      color: diffColor,
                      display: 'block',
                      marginTop: '2px'
                    }}>
                      {diffText}
                    </span>
                  </div>
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
                      : `linear-gradient(90deg, ${getCategoryStyle(cat).color}, ${getCategoryStyle(cat).color}dd)`,
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
