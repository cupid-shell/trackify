import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { PlusCircle } from 'lucide-react';

const TransactionForm = () => {
  const { addTransaction } = useAppContext();
  const [type, setType] = useState('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Food');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const expenseCategories = ['Food', 'Transport', 'Utilities', 'Entertainment', 'Shopping', 'Other'];
  const incomeCategories = ['Allowance', 'Bonus', 'Other'];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!amount || isNaN(amount)) return;

    addTransaction({
      type,
      amount: parseFloat(amount),
      category,
      note,
      date
    });

    setAmount('');
    setNote('');
  };

  const btnStyle = (btnType) => ({
    flex: 1,
    padding: '0.75rem',
    borderRadius: 'var(--radius-md)',
    fontWeight: 600,
    backgroundColor: type === btnType 
      ? (btnType === 'income' ? 'var(--success-bg)' : 'var(--danger-bg)') 
      : 'var(--bg-input)',
    color: type === btnType 
      ? (btnType === 'income' ? 'var(--success)' : 'var(--danger)') 
      : 'var(--text-muted)',
    border: `1px solid ${type === btnType ? (btnType === 'income' ? 'var(--success)' : 'var(--danger)') : 'transparent'}`
  });

  return (
    <div className="glass-card flex-col gap-6" style={{ height: 'fit-content' }}>
      <h2 style={{ fontSize: '1.25rem' }}>Add Transaction</h2>
      
      <div className="flex gap-4">
        <button 
          style={btnStyle('expense')} 
          onClick={() => { setType('expense'); setCategory('Food'); }}
        >
          Expense
        </button>
        <button 
          style={btnStyle('income')} 
          onClick={() => { setType('income'); setCategory('Allowance'); }}
        >
          Income
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex-col gap-4">
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>Amount (BDT)</label>
          <input 
            type="number" 
            value={amount} 
            onChange={(e) => setAmount(e.target.value)}
            placeholder="e.g. 500"
            required
            min="1"
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>Category</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            {(type === 'expense' ? expenseCategories : incomeCategories).map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>Date</label>
          <input 
            type="date" 
            value={date} 
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>Note (Optional)</label>
          <input 
            type="text" 
            value={note} 
            onChange={(e) => setNote(e.target.value)}
            placeholder="What was this for?"
          />
        </div>

        <button 
          type="submit"
          style={{
            backgroundColor: 'var(--primary)',
            color: 'white',
            padding: '1rem',
            borderRadius: 'var(--radius-md)',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            marginTop: '0.5rem',
            boxShadow: 'var(--shadow-glow)'
          }}
        >
          <PlusCircle size={20} />
          Add {type === 'expense' ? 'Expense' : 'Income'}
        </button>
      </form>
    </div>
  );
};

export default TransactionForm;
