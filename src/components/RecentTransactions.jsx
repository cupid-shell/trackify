import React from 'react';
import { useAppContext } from '../context/AppContext';
import { format } from 'date-fns';
import { Trash2, TrendingDown, TrendingUp, Download } from 'lucide-react';

const RecentTransactions = () => {
  const { currentMonthTransactions, deleteTransaction } = useAppContext();
  const [searchTerm, setSearchTerm] = React.useState('');
  const [selectedCategory, setSelectedCategory] = React.useState('All');

  // Get unique categories for the current month to populate the dropdown
  const uniqueCategories = ['All', ...new Set(currentMonthTransactions.map(tx => tx.category))].sort();

  // Filter by search term AND selected category
  const filteredTx = currentMonthTransactions.filter(tx => {
    const matchesSearch = 
      tx.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (tx.note && tx.note.toLowerCase().includes(searchTerm.toLowerCase())) ||
      tx.amount.toString().includes(searchTerm);
      
    const matchesCategory = selectedCategory === 'All' || tx.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  // Sort by newest first
  const sortedTx = [...filteredTx].sort((a, b) => new Date(b.date) - new Date(a.date));

  const handleExportCSV = () => {
    if (currentMonthTransactions.length === 0) return;

    // Create CSV headers
    const headers = ['Date', 'Type', 'Category', 'Payment Method', 'Amount (BDT)', 'Note'];
    
    // Map transactions to CSV rows
    const csvRows = sortedTx.map(tx => {
      const formattedDate = format(new Date(tx.date), 'yyyy-MM-dd');
      // Escape notes with quotes in case they contain commas
      const escapedNote = tx.note ? `"${tx.note.replace(/"/g, '""')}"` : '';
      return [formattedDate, tx.type, tx.category, tx.payment_method || 'Cash', tx.amount, escapedNote].join(',');
    });

    // Combine headers and rows
    const csvContent = [headers.join(','), ...csvRows].join('\n');
    
    // Create Blob and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `trackify_export_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="glass-card flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 style={{ fontSize: '1.25rem' }}>Monthly Transactions</h2>
        {currentMonthTransactions.length > 0 && (
          <button 
            onClick={handleExportCSV}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 0.75rem',
              backgroundColor: 'var(--bg-input)',
              color: 'var(--text-main)',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.875rem',
              fontWeight: 500,
              border: '1px solid var(--border-color)'
            }}
          >
            <Download size={16} />
            Export Excel
          </button>
        )}
      </div>

      <div className="flex gap-2" style={{ marginBottom: '0.5rem' }}>
        <input 
          type="text" 
          placeholder="Search by category, note, or amount..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            flex: 1,
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)',
            backgroundColor: 'var(--bg-input)',
            color: 'var(--text-main)'
          }}
        />
        <select 
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          style={{
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)',
            backgroundColor: 'var(--bg-input)',
            color: 'var(--text-main)',
            minWidth: '150px'
          }}
        >
          {uniqueCategories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>
      
      {sortedTx.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--text-muted)' }}>
          <p>No transactions found for this month.</p>
        </div>
      ) : (
        <div className="flex-col gap-4">
          {sortedTx.map((tx) => (
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
                    <span style={{ 
                      backgroundColor: 'rgba(255,255,255,0.1)', 
                      padding: '2px 6px', 
                      borderRadius: '4px',
                      fontSize: '0.7rem'
                    }}>
                      {tx.payment_method || 'Cash'}
                    </span>
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
