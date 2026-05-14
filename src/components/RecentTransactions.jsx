import React from 'react';
import { useAppContext } from '../context/AppContext';
import { format } from 'date-fns';
import { Trash2, TrendingDown, TrendingUp } from 'lucide-react';

const RecentTransactions = () => {
  const { transactions, deleteTransaction } = useAppContext();

  // Sort by newest first
  const sortedTx = [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <div className="glass-card flex-col gap-6">
      <h2 style={{ fontSize: '1.25rem' }}>Recent Transactions</h2>
      
      {sortedTx.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--text-muted)' }}>
          <p>No transactions yet. Add your first expense or income!</p>
        </div>
      ) : (
        <div className="flex-col gap-4">
          {sortedTx.slice(0, 10).map((tx) => (
            <div 
              key={tx.id} 
              className="flex items-center justify-between"
              style={{
                padding: '1rem',
                backgroundColor: 'var(--bg-input)',
                borderRadius: 'var(--radius-md)',
                transition: 'var(--transition)'
              }}
            >
              <div className="flex items-center gap-4">
                <div style={{
                  padding: '0.75rem',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: tx.type === 'income' ? 'var(--success-bg)' : 'var(--danger-bg)',
                  color: tx.type === 'income' ? 'var(--success)' : 'var(--danger)'
                }}>
                  {tx.type === 'income' ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                </div>
                <div>
                  <h4 style={{ fontWeight: 600 }}>{tx.category}</h4>
                  <div className="flex gap-2 items-center" style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                    <span>{format(new Date(tx.date), 'MMM dd, yyyy')}</span>
                    {tx.note && (
                      <>
                        <span>•</span>
                        <span>{tx.note}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <span style={{
                  fontWeight: 700,
                  fontSize: '1.125rem',
                  color: tx.type === 'income' ? 'var(--success)' : 'var(--text-main)'
                }}>
                  {tx.type === 'income' ? '+' : '-'}৳{tx.amount.toLocaleString('en-IN')}
                </span>
                <button 
                  onClick={() => deleteTransaction(tx.id)}
                  style={{ color: 'var(--text-muted)' }}
                  onMouseOver={(e) => e.currentTarget.style.color = 'var(--danger)'}
                  onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RecentTransactions;
