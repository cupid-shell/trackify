import { useState, useCallback, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { PlusCircle, Trash2, Plus, Camera } from 'lucide-react';
import CustomSelect from './CustomSelect';
import TimePicker from './TimePicker';
import { Capacitor } from '@capacitor/core';

// Light haptic tap — safe no-op on web
const hapticLight = async () => {
  if (!Capacitor.isNativePlatform()) return;
  try {
    const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
    await Haptics.impact({ style: ImpactStyle.Light });
  } catch { /* ignore */ }
};

// Medium haptic tap — used on successful save
const hapticMedium = async () => {
  if (!Capacitor.isNativePlatform()) return;
  try {
    const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
    await Haptics.impact({ style: ImpactStyle.Medium });
  } catch { /* ignore */ }
};

// --- Helpers ---

const evaluateMath = (str) => {
    const safe = String(str).replace(/[^0-9+\-*/().\s]/g, '');
  if (!safe.trim()) return '';
  try {
    const result = new Function(`return (${safe})`)();
    if (typeof result === 'number' && isFinite(result)) {
      return Math.round(result * 100) / 100;
    }
  } catch { /* ignore */ }
  return str;
};

const getLocalDateString = (d) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getLocalTimeString = (d) => {
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
};

const combineDateTime = (dateStr, timeStr) => {
  const [year, month, day] = dateStr.split('-').map(Number);
  const [hours, minutes] = timeStr.split(':').map(Number);
  const localDate = new Date(year, month - 1, day, hours, minutes);
  return localDate.toISOString();
};

const createRow = (defaults = {}) => {
  const now = defaults.date ? new Date(defaults.date) : new Date();
  const dateStr = getLocalDateString(now);
  const timeStr = getLocalTimeString(now);
  
  return {
    id: `row-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    amount: '',
    note: '',
    category: defaults.category || '',
    paymentMethod: defaults.paymentMethod || 'Cash',
    receiptFile: null,
    receiptPreview: null,
    reimbursable: false,
    reimbursePerson: '',
    reimburseAmount: '',
    reimburseDue: '',
    ...defaults,
    date: dateStr,
    time: timeStr
  };
};

// --- Sub-component: a single row in the grid ---
const GridRow = ({
  row,
  index,
  showDelete,
  categories,
  paymentMethods,
  onUpdate,
  onRemove,
  getCategoryStyle,
  isExpense
}) => {
  const { showToast } = useAppContext();

  const handleAmountBlur = () => {
    const result = evaluateMath(row.amount);
    if (result !== row.amount) onUpdate(index, 'amount', String(result));
  };

  return (
    <div className="grid-item-row">
      {/* Row header: index badge + camera + delete */}
      <div className="grid-row-line" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span className="grid-row-index">{index + 1}</span>
          {row.receiptPreview && (
            <div style={{ position: 'relative', width: '32px', height: '32px', borderRadius: 'var(--radius-sm)', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
              <img src={row.receiptPreview} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="receipt preview" />
              <button 
                type="button" 
                onClick={() => {
                  onUpdate(index, 'receiptFile', null);
                  onUpdate(index, 'receiptPreview', null);
                }}
                style={{
                  position: 'absolute', top: 0, right: 0, background: 'rgba(0,0,0,0.6)', border: 'none', color: '#fff', fontSize: '8px', cursor: 'pointer', padding: '0 2px', borderRadius: '50%'
                }}
              >
                ×
              </button>
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <input
            type="file"
            id={`receipt-input-${row.id}`}
            accept="image/*,application/pdf"
            style={{ display: 'none' }}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                // Size validation: 5MB limit
                const MAX_SIZE = 5 * 1024 * 1024;
                if (file.size > MAX_SIZE) {
                  showToast('File size exceeds the 5MB limit. Please choose a smaller file.', 'warning');
                  e.target.value = '';
                  return;
                }
                // Format/MIME type validation: JPG, PNG, WEBP, GIF, HEIC, PDF
                const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'application/pdf'];
                if (!allowedTypes.includes(file.type)) {
                  showToast('Invalid file format. Only JPG, PNG, WEBP, GIF, HEIC, and PDF are allowed.', 'warning');
                  e.target.value = '';
                  return;
                }
                onUpdate(index, 'receiptFile', file);
                onUpdate(index, 'receiptPreview', URL.createObjectURL(file));
              }
            }}
          />
          <label
            htmlFor={`receipt-input-${row.id}`}
            style={{
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '28px',
              height: '28px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: row.receiptFile ? 'var(--primary-glow)' : 'var(--bg-input)',
              border: `1px solid ${row.receiptFile ? 'var(--primary)' : 'var(--border-color)'}`,
              color: row.receiptFile ? 'var(--primary)' : 'var(--text-muted)',
              transition: 'var(--transition)'
            }}
            title="Attach Receipt Photo"
          >
            <Camera size={14} />
          </label>
          
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
        <CustomSelect
          options={categories}
          value={row.category}
          onChange={val => onUpdate(index, 'category', val)}
          getCategoryStyle={getCategoryStyle}
          label="Category"
          style={{ flex: 1 }}
        />
        <CustomSelect
          options={paymentMethods}
          value={row.paymentMethod}
          onChange={val => onUpdate(index, 'paymentMethod', val)}
          label="Payment Method"
          style={{ width: '110px', flexShrink: 0 }}
        />
      </div>

      {/* Line 3: Date & Time side-by-side */}
      <div className="grid-row-line" style={{ display: 'flex', gap: '0.5rem' }}>
        <input
          type="date"
          className="grid-date-input"
          value={row.date}
          onChange={e => onUpdate(index, 'date', e.target.value)}
          required
          style={{ flex: 1 }}
        />
        <TimePicker value={row.time} onChange={val => onUpdate(index, 'time', val)} />
      </div>

      {/* Line 4: Reimbursable (expenses only) — creates a linked 'lent' receivable in the Ledger */}
      {isExpense && (
      <div className="grid-row-line" style={{ flexDirection: 'column', gap: '0.5rem' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)', cursor: 'pointer', userSelect: 'none' }}>
          <input
            type="checkbox"
            checked={row.reimbursable}
            onChange={e => onUpdate(index, 'reimbursable', e.target.checked)}
            style={{ width: 'auto', cursor: 'pointer' }}
          />
          Someone owes me back
        </label>
        {row.reimbursable && (
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <input
              type="text"
              value={row.reimbursePerson}
              onChange={e => onUpdate(index, 'reimbursePerson', e.target.value)}
              placeholder="Who owes you?"
              style={{ flex: '1 1 120px', padding: '0.5rem', fontSize: '0.8rem' }}
            />
            <input
              type="text"
              inputMode="decimal"
              value={row.reimburseAmount}
              onChange={e => onUpdate(index, 'reimburseAmount', e.target.value)}
              placeholder="Owed (full)"
              title="Amount owed back — leave blank for the full amount"
              style={{ width: '110px', padding: '0.5rem', fontSize: '0.8rem' }}
            />
            <input
              type="date"
              value={row.reimburseDue}
              onChange={e => onUpdate(index, 'reimburseDue', e.target.value)}
              title="Due date (optional)"
              style={{ width: '150px', padding: '0.5rem', fontSize: '0.8rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-input)', color: 'var(--text-main)' }}
            />
          </div>
        )}
      </div>
      )}
    </div>
  );
};

// --- Main Component ---
const TransactionForm = () => {
  const {
    addTransactions,
    uploadReceiptFile,
    addReceiptAttachment,
    markTransactionsReimbursable,
    userSettings,
    presets,
    paymentMethods,
    getCategoryStyle,
    showToast,
    formatCurrency
  } = useAppContext();

  const [type, setType] = useState('expense');
  
  const expenseCategories = useMemo(() => userSettings.expense_categories || [], [userSettings.expense_categories]);
  const incomeCategories = useMemo(() => userSettings.income_categories || [], [userSettings.income_categories]);
  
  const [rows, setRows] = useState(() => {
    const activeCats = userSettings.expense_categories || [];
    return activeCats.length > 0 ? [createRow({ category: activeCats[0] })] : [];
  });

  const activeCategories = type === 'expense' ? expenseCategories : incomeCategories;

  const activePresets = useMemo(
    () => presets.filter(p => expenseCategories.includes(p.category)),
    [presets, expenseCategories]
  );

  const handleTypeChange = (newType) => {
    if (newType === type) return;
    setType(newType);
    const newActiveCategories = newType === 'expense' ? expenseCategories : incomeCategories;
    if (newActiveCategories.length > 0) {
      setRows(prev =>
        prev.map(r => ({
          ...r,
          category: newActiveCategories.includes(r.category) ? r.category : newActiveCategories[0]
        }))
      );
    }
  };

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
    hapticLight();
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
  const handleSubmit = async (e) => {
    e.preventDefault();

    const invalids = rows.filter(r => {
      const val = evaluateMath(r.amount);
      return !val || isNaN(Number(val)) || Number(val) <= 0;
    });

    if (invalids.length > 0) {
      showToast(`${invalids.length} row(s) have an invalid amount. Please fix them.`, 'warning');
      return;
    }

    try {
      // 1. Upload files first if any
      const uploadPromises = rows.map(async (row) => {
        if (row.receiptFile) {
          try {
            const publicUrl = await uploadReceiptFile(row.receiptFile);
            return { id: row.id, url: publicUrl };
          } catch (err) {
            showToast(`Error uploading receipt for row: ${row.note || 'item'}. ${err.message}`, 'error');
            return { id: row.id, url: null };
          }
        }
        return { id: row.id, url: null };
      });

      const uploadResults = await Promise.all(uploadPromises);
      const receiptUrlsByRowId = {};
      uploadResults.forEach(res => {
        if (res.url) {
          receiptUrlsByRowId[res.id] = res.url;
        }
      });

      const payload = rows.map(r => ({
        type,
        amount: Number(evaluateMath(r.amount)),
        category: r.category,
        note: r.note,
        date: combineDateTime(r.date, r.time),
        payment_method: r.paymentMethod
      }));

      const result = await addTransactions(payload);
      hapticMedium();

      // Bail before claiming success. This used to announce "N transactions
      // added successfully!" unconditionally, so a failed save produced a
      // success toast and an error toast together.
      if (!result || !result.rows || result.rows.length === 0) return;

      const createdTxs = result.rows;
      const count = payload.length;

      if (result.queued) {
        // Parked offline — addTransactions has already said so; don't also
        // claim it was added. Receipts and reimbursables both need the network,
        // so they're skipped here (their controls are disabled while offline).
        setRows([createRow({ category: activeCategories[0] || '' })]);
        return;
      }

      showToast(
        count === 1
          ? `${type === 'expense' ? 'Expense' : 'Income'} of ${formatCurrency(payload[0].amount)} added!`
          : `${count} transactions added successfully!`,
        'success'
      );

      // Associate receipt URLs with created transaction IDs
      if (createdTxs && createdTxs.length > 0) {
        for (let i = 0; i < rows.length; i++) {
          const row = rows[i];
          const url = receiptUrlsByRowId[row.id];
          if (url && createdTxs[i]) {
            await addReceiptAttachment(createdTxs[i].id, url);
          }
        }
      }

      // Bridge any reimbursable expenses to the Ledger as 'lent' receivables.
      if (type === 'expense' && createdTxs && createdTxs.length > 0) {
        const pairs = [];
        for (let i = 0; i < rows.length; i++) {
          const row = rows[i];
          const tx = createdTxs[i];
          if (!row.reimbursable || !tx) continue;
          const owedRaw = Number(evaluateMath(row.reimburseAmount));
          const amount = owedRaw > 0 ? owedRaw : payload[i].amount; // blank => full amount
          pairs.push({ tx, person: row.reimbursePerson, amount, dueDate: row.reimburseDue });
        }
        if (pairs.length > 0) await markTransactionsReimbursable(pairs);
      }

      // Reset to a single blank row
      setRows([createRow({ category: activeCategories[0] || '' })]);
    } catch (error) {
      console.error(error);
      showToast('Error saving transactions: ' + error.message, 'error');
    }
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
    <div className="glass-card flex-col gap-6" style={{ height: '100%', fontVariantNumeric: 'tabular-nums' }}>
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
            Total: {formatCurrency(totalAmount)}
          </span>
        )}
      </div>

      {/* Type Toggle */}
      <div className="flex gap-4">
        <button style={btnStyle('expense')} onClick={() => handleTypeChange('expense')} type="button">
          Expense
        </button>
        <button style={btnStyle('income')} onClick={() => handleTypeChange('income')} type="button">
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
            isExpense={type === 'expense'}
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
