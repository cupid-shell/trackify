import React from 'react';
import { useAppContext } from '../context/AppContext';
import { format } from 'date-fns';
import { Trash2, TrendingDown, TrendingUp, Download, Edit2 } from 'lucide-react';

const RecentTransactions = () => {
  const { currentMonthTransactions, deleteTransaction, updateTransaction, userSettings } = useAppContext();
  const [searchTerm, setSearchTerm] = React.useState('');
  const [selectedCategory, setSelectedCategory] = React.useState('All');
  const [startDate, setStartDate] = React.useState('');
  const [endDate, setEndDate] = React.useState('');

  // Edit mode states
  const [editingId, setEditingId] = React.useState(null);
  const [editAmount, setEditAmount] = React.useState('');
  const [editCategory, setEditCategory] = React.useState('');
  const [editNote, setEditNote] = React.useState('');
  const [editPaymentMethod, setEditPaymentMethod] = React.useState('Cash');
  const [editDate, setEditDate] = React.useState('');

  const startEditing = (tx) => {
    setEditingId(tx.id);
    setEditAmount(tx.amount.toString());
    setEditCategory(tx.category);
    setEditNote(tx.note || '');
    setEditPaymentMethod(tx.payment_method || 'Cash');
    setEditDate(tx.date);
  };

  const saveEdit = async (txId) => {
    if (!editAmount || isNaN(Number(editAmount)) || Number(editAmount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }
    const success = await updateTransaction(txId, {
      amount: Number(editAmount),
      category: editCategory,
      note: editNote,
      payment_method: editPaymentMethod,
      date: editDate
    });
    if (success) {
      setEditingId(null);
    }
  };

  // Get unique categories for the current month to populate the dropdown
  const uniqueCategories = ['All', ...new Set(currentMonthTransactions.map(tx => tx.category))].sort();

  // Filter by search term AND selected category
  const filteredTx = currentMonthTransactions.filter(tx => {
    const matchesSearch = 
      tx.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (tx.note && tx.note.toLowerCase().includes(searchTerm.toLowerCase())) ||
      tx.amount.toString().includes(searchTerm);
      
    const matchesCategory = selectedCategory === 'All' || tx.category === selectedCategory;
    
    const txDate = new Date(tx.date);
    txDate.setHours(0, 0, 0, 0);

    let matchesStartDate = true;
    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      matchesStartDate = txDate >= start;
    }

    let matchesEndDate = true;
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(0, 0, 0, 0);
      matchesEndDate = txDate <= end;
    }
    
    return matchesSearch && matchesCategory && matchesStartDate && matchesEndDate;
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

      <div className="flex-col gap-4" style={{ marginBottom: '1rem' }}>
        <div className="flex gap-4" style={{ flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 200px' }}>
            <input 
              type="text" 
              placeholder="Search by category, note, or amount..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-input)',
                color: 'var(--text-main)'
              }}
            />
          </div>
          <select 
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            style={{
              flex: '0 0 auto',
              width: 'auto',
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

        <div className="flex gap-4 items-center" style={{ flexWrap: 'wrap', fontSize: '0.875rem' }}>
          <div className="flex items-center gap-2" style={{ flex: '1 1 150px' }}>
            <span style={{ color: 'var(--text-muted)', flexShrink: 0 }}>From:</span>
            <input 
              type="date" 
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-input)',
                color: 'var(--text-main)'
              }}
            />
          </div>
          <div className="flex items-center gap-2" style={{ flex: '1 1 150px' }}>
            <span style={{ color: 'var(--text-muted)', flexShrink: 0 }}>To:</span>
            <input 
              type="date" 
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-input)',
                color: 'var(--text-main)'
              }}
            />
          </div>
          {(startDate || endDate) && (
            <button
              onClick={() => { setStartDate(''); setEndDate(''); }}
              style={{
                padding: '0.5rem 1rem',
                fontSize: '0.75rem',
                color: 'var(--danger)',
                backgroundColor: 'var(--danger-bg)',
                borderRadius: 'var(--radius-sm)',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer'
              }}
            >
              Clear Dates
            </button>
          )}
        </div>
      </div>
      
      {sortedTx.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--text-muted)' }}>
          <p>No transactions found for this month.</p>
        </div>
      ) : (
        <div className="flex-col gap-4">
          {sortedTx.map((tx) => {
            const isEditing = editingId === tx.id;
            
            if (isEditing) {
              return (
                <div 
                  key={tx.id} 
                  className="flex-col gap-3"
                  style={{
                    padding: '1rem',
                    backgroundColor: 'var(--bg-hover)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--primary)',
                    transition: 'var(--transition)'
                  }}
                >
                  <div className="flex gap-2 flex-wrap">
                    <div style={{ flex: '1 1 120px' }}>
                      <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Amount (BDT)</label>
                      <input 
                        type="number" 
                        value={editAmount} 
                        onChange={e => setEditAmount(e.target.value)} 
                        style={{ padding: '0.5rem', fontSize: '0.875rem' }} 
                      />
                    </div>
                    <div style={{ flex: '1 1 150px' }}>
                      <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Category</label>
                      <select 
                        value={editCategory} 
                        onChange={e => setEditCategory(e.target.value)}
                        style={{ padding: '0.5rem', fontSize: '0.875rem' }}
                      >
                        {(tx.type === 'expense' ? userSettings.expense_categories : userSettings.income_categories).map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>
                    <div style={{ flex: '1 1 120px' }}>
                      <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Payment Method</label>
                      <select 
                        value={editPaymentMethod} 
                        onChange={e => setEditPaymentMethod(e.target.value)}
                        style={{ padding: '0.5rem', fontSize: '0.875rem' }}
                      >
                        <option value="Cash">Cash</option>
                        <option value="Card">Card</option>
                        <option value="bKash">bKash</option>
                        <option value="Nagad">Nagad</option>
                        <option value="Rocket">Rocket</option>
                      </select>
                    </div>
                    <div style={{ flex: '1 1 150px' }}>
                      <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Date</label>
                      <input 
                        type="date" 
                        value={editDate} 
                        onChange={e => setEditDate(e.target.value)} 
                        style={{ padding: '0.5rem', fontSize: '0.875rem' }}
                      />
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Note</label>
                    <input 
                      type="text" 
                      value={editNote} 
                      onChange={e => setEditNote(e.target.value)} 
                      placeholder="Optional note"
                      style={{ padding: '0.5rem', fontSize: '0.875rem' }}
                    />
                  </div>
                  <div className="flex justify-end gap-2" style={{ marginTop: '0.25rem' }}>
                    <button 
                      onClick={() => setEditingId(null)}
                      style={{
                        padding: '0.4rem 0.8rem',
                        fontSize: '0.75rem',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border-color)',
                        color: 'var(--text-muted)'
                      }}
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={() => saveEdit(tx.id)}
                      style={{
                        padding: '0.4rem 0.8rem',
                        fontSize: '0.75rem',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: 'var(--primary)',
                        color: 'white',
                        fontWeight: 600
                      }}
                    >
                      Save
                    </button>
                  </div>
                </div>
              );
            }

            return (
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
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => startEditing(tx)}
                      style={{ color: 'var(--text-muted)' }}
                      onMouseOver={(e) => e.currentTarget.style.color = 'var(--primary)'}
                      onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                      title="Edit Transaction"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                      onClick={() => deleteTransaction(tx.id)}
                      style={{ color: 'var(--text-muted)' }}
                      onMouseOver={(e) => e.currentTarget.style.color = 'var(--danger)'}
                      onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                      title="Delete Transaction"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default RecentTransactions;
