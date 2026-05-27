import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { PlusCircle, Trash2, Plus } from 'lucide-react';

// --- Helpers ---

const evaluateMath = (str) => {
  const safe = String(str).replace(/[^0-9+\-*/().\s]/g, '');
  if (!safe.trim()) return '';
  try {
    // eslint-disable-next-line no-new-func
    const result = new Function(`return (${safe})`)();
    if (typeof result === 'number' && isFinite(result)) {
      return Math.round(result * 100) / 100;
    }
  } catch { /* ignore */ }
  return str;
};

const createRow = (defaults = {}) => ({
  id: `row-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  amount: '',
  note: '',
  category: defaults.category || '',
  date: new Date().toISOString().split('T')[0],
  paymentMethod: defaults.paymentMethod || 'Cash',
  ...defaults
});

// --- Sub-component: a single row in the grid ---
const GridRow = ({
  row,
  index,
  showDelete,
  categories,
  paymentMethods,
  onUpdate,
  onRemove,
  getCategoryStyle
}) => {
  const handleAmountBlur = () => {
    const result = evaluateMath(row.amount);
    if (result !== row.amount) onUpdate(index, 'amount', String(result));
  };

  return (
    <div className="grid-item-row">
      {/* Row header: index badge + delete */}
      <div className="grid-row-line" style={{ justifyContent: 'space-between' }}>
        <span className="grid-row-index">{index + 1}</span>
        {showDelete && (
          <button
            type="button"
            className="grid-row-delete-btn"
            onClick={() => onRemove(index)}
            title="Remove this item"
          >
            <Trash2 size={15} />
          </button>
        )}
      </div>

      {/* Line 1: Note  |  Amount */}
      <div className="grid-row-line">
        <input
          type="text"
          className="grid-note-input"
          value={row.note}
          onChange={e => onUpdate(index, 'note', e.target.value)}
          placeholder="Description (optional)"
        />
        <input
          type="text"
          className="grid-amount-input"
          value={row.amount}
          onChange={e => onUpdate(index, 'amount', e.target.value)}
          onBlur={handleAmountBlur}
          placeholder="Amount"
          required
        />
      </div>

      {/* Line 2: Category  |  Payment */}
      <div className="grid-row-line">
        <select
          className="grid-category-select"
          value={row.category}
          onChange={e => onUpdate(index, 'category', e.target.value)}
        >
          {categories.map(cat => {
            const style = getCategoryStyle(cat);
            return (
              <option key={cat} value={cat}>
                {style.emoji} {cat}
              </option>
            );
          })}
        </select>
        <select
          className="grid-payment-select"
          value={row.paymentMethod}
          onChange={e => onUpdate(index, 'paymentMethod', e.target.value)}
        >
          {paymentMethods.map(m => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
      </div>

      {/* Line 3: Date */}
      <div className="grid-row-line">
        <input
          type="date"
          className="grid-date-input"
          value={row.date}
          onChange={e => onUpdate(index, 'date', e.target.value)}
          required
          style={{ flex: 1 }}
        />
      </div>
    </div>
  );
};

// --- Main Component ---
const TransactionForm = () => {
  const {
    addTransactions,
    userSettings,
    presets,
    getCategoryStyle,
    showToast
  } = useAppContext();

  const [type, setType] = useState('expense');
  const [rows, setRows] = useState([]);

  const expenseCategories = userSettings.expense_categories || [];
  const incomeCategories = userSettings.income_categories || [];
  const paymentMethods = ['Cash', 'bKash', 'Bank'];

  const activeCategories = type === 'expense' ? expenseCategories : incomeCategories;

  const activePresets = useMemo(
    () => presets.filter(p => expenseCategories.includes(p.category)),
    [presets, expenseCategories]
  );

  // Initialise with one blank row when categories are ready
  useEffect(() => {
    if (activeCategories.length > 0 && rows.length === 0) {
      setRows([createRow({ category: activeCategories[0] })]);
    }
  }, [activeCategories]);

  // When type changes, reset categories on existing rows to first valid one
  useEffect(() => {
    if (activeCategories.length === 0) return;
    setRows(prev =>
      prev.map(r => ({
        ...r,
        category: activeCategories.includes(r.category) ? r.category : activeCategories[0]
      }))
    );
  }, [type]);

  // --- Row management ---
  const addRow = useCallback(() => {
    setRows(prev => [
      ...prev,
      createRow({ category: activeCategories[0] || '' })
    ]);
  }, [activeCategories]);

  const removeRow = useCallback((index) => {
    setRows(prev => prev.filter((_, i) => i !== index));
  }, []);

  const updateRow = useCallback((index, field, value) => {
    setRows(prev => prev.map((r, i) => i === index ? { ...r, [field]: value } : r));
  }, []);

  // --- Preset: append pre-filled row ---
  const handlePresetClick = useCallback((preset) => {
    setRows(prev => [
      ...prev,
      createRow({
        category: preset.category,
        amount: String(preset.amount),
        note: preset.note || '',
        paymentMethod: preset.payment || 'Cash'
      })
    ]);
    showToast(`Preset "${preset.label}" added to the list`, 'info');
  }, [showToast]);

  // --- Submit ---
  const handleSubmit = (e) => {
    e.preventDefault();

    const invalids = rows.filter(r => {
      const val = evaluateMath(r.amount);
      return !val || isNaN(Number(val)) || Number(val) <= 0;
    });

    if (invalids.length > 0) {
      showToast(`${invalids.length} row(s) have an invalid amount. Please fix them.`, 'warning');
      return;
    }

    const payload = rows.map(r => ({
      type,
      amount: Number(evaluateMath(r.amount)),
      category: r.category,
      note: r.note,
      date: r.date,
      payment_method: r.paymentMethod
    }));

    addTransactions(payload);

    const count = payload.length;
    showToast(
      count === 1
        ? `${type === 'expense' ? 'Expense' : 'Income'} of ৳${payload[0].amount} added!`
        : `${count} transactions added successfully!`,
      'success'
    );

    // Reset to a single blank row
    setRows([createRow({ category: activeCategories[0] || '' })]);
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
    border: `1px solid ${type === btnType
      ? (btnType === 'income' ? 'var(--success)' : 'var(--danger)')
      : 'transparent'}`
  });

  const totalAmount = rows.reduce((sum, r) => {
    const v = Number(evaluateMath(r.amount));
    return sum + (isNaN(v) ? 0 : v);
  }, 0);

  return (
    <div className="glass-card flex-col gap-6" style={{ height: '100%' }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 style={{ fontSize: '1.25rem' }}>Add Transaction</h2>
        {rows.length > 1 && (
          <span style={{
            fontSize: '0.8rem',
            color: 'var(--text-muted)',
            background: 'var(--bg-input)',
            padding: '0.2rem 0.6rem',
            borderRadius: 'var(--radius-full)',
            border: '1px solid var(--border-color)'
          }}>
            Total: ৳{totalAmount.toFixed(2)}
          </span>
        )}
      </div>

      {/* Type Toggle */}
      <div className="flex gap-4">
        <button style={btnStyle('expense')} onClick={() => setType('expense')} type="button">
          Expense
        </button>
        <button style={btnStyle('income')} onClick={() => setType('income')} type="button">
          Income
        </button>
      </div>

      {/* Quick Presets (expense mode only) */}
      {type === 'expense' && activePresets.length > 0 && (
        <div className="flex-col gap-2" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>
            Quick Presets — click to add a row
          </span>
          <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
            {activePresets.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handlePresetClick(preset)}
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
                onMouseOver={e => {
                  e.currentTarget.style.borderColor = 'var(--primary)';
                  e.currentTarget.style.backgroundColor = 'var(--bg-hover)';
                }}
                onMouseOut={e => {
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

      {/* Multi-Item Grid Form */}
      <form onSubmit={handleSubmit} className="flex-col gap-3">
        {rows.map((row, index) => (
          <GridRow
            key={row.id}
            row={row}
            index={index}
            showDelete={rows.length > 1}
            categories={activeCategories}
            paymentMethods={paymentMethods}
            onUpdate={updateRow}
            onRemove={removeRow}
            getCategoryStyle={getCategoryStyle}
          />
        ))}

        {/* Add Row Button */}
        <button
          type="button"
          className="grid-add-btn"
          onClick={addRow}
        >
          <Plus size={16} />
          Add another item
        </button>

        {/* Submit Button */}
        <button type="submit" className="grid-submit-btn">
          <PlusCircle size={20} />
          {rows.length === 1
            ? `Add ${type === 'expense' ? 'Expense' : 'Income'}`
            : `Add ${rows.length} Items`}
        </button>
      </form>
    </div>
  );
};

export default TransactionForm;
