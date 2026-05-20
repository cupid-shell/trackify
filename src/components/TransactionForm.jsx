import React, { useState, useEffect, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { PlusCircle } from 'lucide-react';

const TransactionForm = () => {
  const { addTransaction, userSettings, presets } = useAppContext();
  const [type, setType] = useState('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(userSettings.expense_categories[0] || 'Expense');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [isMultiAdd, setIsMultiAdd] = useState(false);
  const [multiAddText, setMultiAddText] = useState('');

  const expenseCategories = userSettings.expense_categories || [];
  const incomeCategories = userSettings.income_categories || [];
  const paymentMethods = ['Cash', 'bKash', 'Bank'];

  const activePresets = useMemo(() => {
    let filtered = presets.filter(p => expenseCategories.includes(p.category));
    
    if (filtered.length === 0 && expenseCategories.length > 0) {
      filtered = expenseCategories.slice(0, 3).map(cat => ({
        label: `৳100 ${cat}`,
        amount: 100,
        category: cat,
        note: `Quick ${cat}`,
        payment: 'Cash'
      }));
    }
    return filtered;
  }, [presets, expenseCategories]);

  const handleLogPreset = (preset) => {
    addTransaction({
      type: 'expense',
      amount: preset.amount,
      category: preset.category,
      note: preset.note,
      date: new Date().toISOString().split('T')[0],
      payment_method: preset.payment
    });
    alert(`Logged preset transaction: ${preset.label}!`);
  };

  useEffect(() => {
    setCategory(type === 'expense' ? expenseCategories[0] : incomeCategories[0]);
  }, [type, userSettings]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (isMultiAdd) {
      if (!multiAddText.trim()) return;
      const lines = multiAddText.split('\n').filter(line => line.trim());
      
      lines.forEach(line => {
        // Extract the first contiguous number
        const numMatch = line.match(/\d+(\.\d+)?/);
        if (numMatch) {
          const parsedAmount = parseFloat(numMatch[0]);
          // Remove the number and trim dangling hyphens, colons, or spaces
          const parsedNote = line.replace(numMatch[0], '').replace(/^[\s:-]+|[\s:-]+$/g, '').trim() || 'Bulk Add Item';
          
          addTransaction({
            type,
            amount: parsedAmount,
            category,
            note: parsedNote,
            date,
            payment_method: paymentMethod
          });
        }
      });
      
      setMultiAddText('');
      // Optional: switch back to standard mode, or stay in multi-add. We will stay to be helpful.
      alert(`Successfully added ${lines.length} transactions!`);
      return;
    }

    if (!amount || isNaN(amount)) return;

    addTransaction({
      type,
      amount: parseFloat(amount),
      category,
      note,
      date,
      payment_method: paymentMethod
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
      <div className="flex items-center justify-between">
        <h2 style={{ fontSize: '1.25rem' }}>Add Transaction</h2>
        <div style={{ display: 'flex', gap: '0.5rem', backgroundColor: 'var(--bg-main)', padding: '0.25rem', borderRadius: 'var(--radius-full)' }}>
          <button 
            onClick={() => setIsMultiAdd(false)}
            style={{ 
              padding: '0.25rem 0.75rem', 
              fontSize: '0.75rem', 
              borderRadius: 'var(--radius-full)',
              backgroundColor: !isMultiAdd ? 'var(--bg-card)' : 'transparent',
              color: !isMultiAdd ? 'var(--text-main)' : 'var(--text-muted)'
            }}
          >
            Standard
          </button>
          <button 
            onClick={() => setIsMultiAdd(true)}
            style={{ 
              padding: '0.25rem 0.75rem', 
              fontSize: '0.75rem', 
              borderRadius: 'var(--radius-full)',
              backgroundColor: isMultiAdd ? 'var(--primary)' : 'transparent',
              color: isMultiAdd ? 'white' : 'var(--text-muted)'
            }}
          >
            Quick Multi-Add
          </button>
        </div>
      </div>
      
      {type === 'expense' && activePresets.length > 0 && (
        <div className="flex-col gap-2" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>Quick Presets (One-Tap Log)</span>
          <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
            {activePresets.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleLogPreset(preset)}
                style={{
                  fontSize: '0.75rem',
                  padding: '0.4rem 0.6rem',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--bg-input)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-main)',
                  fontWeight: 500,
                  transition: 'var(--transition)'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.borderColor = 'var(--primary)';
                  e.currentTarget.style.backgroundColor = 'var(--bg-hover)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-color)';
                  e.currentTarget.style.backgroundColor = 'var(--bg-input)';
                }}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
      )}
      
      <div className="flex gap-4">
        <button 
          style={btnStyle('expense')} 
          onClick={() => setType('expense')}
        >
          Expense
        </button>
        <button 
          style={btnStyle('income')} 
          onClick={() => setType('income')}
        >
          Income
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex-col gap-4">
        {isMultiAdd ? (
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              Paste or type items (e.g., "Snacks 150" or "100 Lunch")
            </label>
            <textarea 
              value={multiAddText}
              onChange={(e) => setMultiAddText(e.target.value)}
              placeholder="C 50&#10;Snacks 150&#10;Lunch 120"
              required
              rows={4}
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-input)',
                color: 'var(--text-main)',
                resize: 'vertical'
              }}
            />
          </div>
        ) : (
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>Amount (BDT)</label>
            <input 
              type="number" 
              value={amount} 
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g. 500"
              required={!isMultiAdd}
              min="1"
            />
          </div>
        )}

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
          <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>Payment Method</label>
          <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
            {paymentMethods.map(method => (
              <option key={method} value={method}>{method}</option>
            ))}
          </select>
        </div>

        {!isMultiAdd && (
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>Note (Optional)</label>
            <input 
              type="text" 
              value={note} 
              onChange={(e) => setNote(e.target.value)}
              placeholder="What was this for?"
            />
          </div>
        )}

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
          {isMultiAdd ? `Add ${multiAddText.split('\n').filter(l => l.trim()).length || 'Bulk'} Items` : `Add ${type === 'expense' ? 'Expense' : 'Income'}`}
        </button>
      </form>
    </div>
  );
};

export default TransactionForm;
