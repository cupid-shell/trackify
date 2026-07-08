import { useState, useMemo } from 'react';
import { useAppContext, parseLocalDate } from '../context/AppContext';
import {
  Plus, Trash2, Calendar, PlusCircle,
  ArrowUpRight, ArrowDownLeft, ChevronDown, ChevronUp, Coins, Pencil
} from 'lucide-react';
import Header from './Header';
import Footer from './Footer';
import CustomSelect from './CustomSelect';
import { format, parseISO } from 'date-fns';

const typeOptions = [
  { value: 'lent', label: 'Lent (I gave money)' },
  { value: 'borrowed', label: 'Borrowed (I took money)' }
];

const LedgerPage = () => {
  const { debts, addDebt, recordDebtRepayment, updateDebt, deleteDebt, showToast, showConfirm, formatCurrency } = useAppContext();

  // Tab State: 'active' or 'settled'
  const [tab, setTab] = useState('active');

  const handleTabToggle = (mode) => {
    if (document.startViewTransition) {
      document.startViewTransition(() => {
        setTab(mode);
      });
    } else {
      setTab(mode);
    }
  };

  // New Debt Form State
  const [showAddForm, setShowAddForm] = useState(false);
  const [person, setPerson] = useState('');
  const [type, setType] = useState('lent'); // 'lent' or 'borrowed'
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [note, setNote] = useState('');
  const [logAsTx, setLogAsTx] = useState(true);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  // Local state for repayment input per debt item
  const [repayAmount, setRepayAmount] = useState({});
  const [repayNote, setRepayNote] = useState({});
  const [repayLogAsTx, setRepayLogAsTx] = useState({});
  const [showRepayFormId, setShowRepayFormId] = useState(null);
  const [expandedDebtId, setExpandedDebtId] = useState(null);

  // Edit form state: which debt is being edited + its working values
  const [editingDebtId, setEditingDebtId] = useState(null);
  const [editForm, setEditForm] = useState({ person: '', type: 'lent', amount: '', dueDate: '', note: '', date: '' });

  // Calculate Metrics
  const metrics = useMemo(() => {
    let totalLent = 0;
    let totalBorrowed = 0;

    debts.forEach(d => {
      const remaining = Number(d.amount) - Number(d.settled_amount);
      if (d.status === 'active') {
        if (d.type === 'lent') {
          totalLent += remaining;
        } else if (d.type === 'borrowed') {
          totalBorrowed += remaining;
        }
      }
    });

    const netPosition = totalLent - totalBorrowed;

    return {
      totalLent,
      totalBorrowed,
      netPosition
    };
  }, [debts]);

  // Filter debts by status
  const activeDebts = debts.filter(d => d.status === 'active');
  const settledDebts = debts.filter(d => d.status === 'settled');
  const displayDebts = tab === 'active' ? activeDebts : settledDebts;

  const handleAddDebtSubmit = async (e) => {
    e.preventDefault();
    if (!person.trim() || !amount || isNaN(amount) || Number(amount) <= 0) {
      showToast('Please enter a valid person and positive amount.', 'warning');
      return;
    }

    const debtData = {
      type,
      person: person.trim(),
      amount: Number(amount),
      due_date: dueDate || null,
      note: note.trim() || null,
      date: date
    };

    await addDebt(debtData, logAsTx);

    // Reset Form
    setPerson('');
    setAmount('');
    setDueDate('');
    setNote('');
    setDate(new Date().toISOString().split('T')[0]);
    setLogAsTx(true);
    setShowAddForm(false);
  };

  const handleRepaymentSubmit = async (debtId) => {
    const amt = Number(repayAmount[debtId]);
    if (isNaN(amt) || amt <= 0) {
      showToast('Please enter a valid payment amount.', 'warning');
      return;
    }

    const noteText = repayNote[debtId] || '';
    const logTx = repayLogAsTx[debtId] !== false; // default true

    await recordDebtRepayment(debtId, amt, noteText, logTx);

    // Reset inputs
    setRepayAmount(prev => ({ ...prev, [debtId]: '' }));
    setRepayNote(prev => ({ ...prev, [debtId]: '' }));
    setRepayLogAsTx(prev => ({ ...prev, [debtId]: true }));
    setShowRepayFormId(null);
  };

  const startEdit = (debt) => {
    setShowRepayFormId(null);
    setEditingDebtId(debt.id);
    setEditForm({
      person: debt.person || '',
      type: debt.type || 'lent',
      amount: String(debt.amount ?? ''),
      dueDate: debt.due_date || '',
      note: debt.note || '',
      date: debt.date || new Date().toISOString().split('T')[0]
    });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editForm.person.trim() || !editForm.amount || isNaN(editForm.amount) || Number(editForm.amount) <= 0) {
      showToast('Please enter a valid person and positive amount.', 'warning');
      return;
    }

    await updateDebt(editingDebtId, {
      type: editForm.type,
      person: editForm.person.trim(),
      amount: Number(editForm.amount),
      due_date: editForm.dueDate || null,
      note: editForm.note.trim() || null,
      date: editForm.date
    });

    setEditingDebtId(null);
  };

  const handleFullSettlement = async (debtId, remainingAmount) => {
    showConfirm({
      title: 'Fully Settle Debt?',
      message: `Are you sure you want to fully settle this debt with a final payment of ${formatCurrency(remainingAmount)}?`,
      confirmLabel: 'Settle Debt',
      checkbox: {
        label: 'Log final repayment to main transaction history',
        defaultValue: true
      },
      onConfirm: (logTx) => {
        recordDebtRepayment(debtId, remainingAmount, 'Final settlement', logTx);
      }
    });
  };

  const getDueDateStatus = (dueDateStr) => {
    if (!dueDateStr) return { label: '', color: 'var(--text-muted)' };
    const today = new Date();
    today.setHours(0,0,0,0);
    const due = parseLocalDate(dueDateStr);
    due.setHours(0,0,0,0);

    if (due < today) {
      return { label: 'Overdue', color: 'var(--danger)' };
    } else if (due.getTime() === today.getTime()) {
      return { label: 'Due Today', color: 'var(--warning)' };
    }
    return { label: '', color: 'var(--success)' };
  };

  return (
    <>
      <Header />
      <main className="container animate-fade-in" style={{ flex: 1 }}>
        
        {/* Title */}
        <div className="animate-fade-in stagger-1" style={{ marginBottom: '2rem', textAlign: 'center' }}>
          <h2 style={{ fontSize: '1.875rem', marginBottom: '0.5rem' }}>Debt & Loan Ledger</h2>
          <p>Lend and borrow tracker. Manage outstanding balances with friends.</p>
        </div>

        {/* Overview metrics cards */}
        <div className="animate-fade-in stagger-2" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '1rem',
          marginBottom: '2rem'
        }}>
          {/* Total Lent Card */}
          <div className="glass-card flex items-center justify-between" style={{ padding: '1.25rem 1.5rem' }}>
            <div className="flex-col gap-1">
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total Lent (Receivables)</span>
              <span style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--success)' }}>
                {formatCurrency(metrics.totalLent)}
              </span>
            </div>
            <div style={{
              background: 'var(--success-bg)',
              padding: '0.6rem',
              borderRadius: 'var(--radius-md)',
              color: 'var(--success)'
            }}>
              <ArrowUpRight size={24} />
            </div>
          </div>

          {/* Total Borrowed Card */}
          <div className="glass-card flex items-center justify-between" style={{ padding: '1.25rem 1.5rem' }}>
            <div className="flex-col gap-1">
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total Borrowed (Payables)</span>
              <span style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--danger)' }}>
                {formatCurrency(metrics.totalBorrowed)}
              </span>
            </div>
            <div style={{
              background: 'var(--danger-bg)',
              padding: '0.6rem',
              borderRadius: 'var(--radius-md)',
              color: 'var(--danger)'
            }}>
              <ArrowDownLeft size={24} />
            </div>
          </div>

          {/* Net Position Card */}
          <div className="glass-card flex items-center justify-between" style={{ 
            padding: '1.25rem 1.5rem',
            border: metrics.netPosition !== 0 ? `1px solid ${metrics.netPosition > 0 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}` : '1px solid rgba(255,255,255,0.05)'
          }}>
            <div className="flex-col gap-1">
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Net Position</span>
              <span style={{ 
                fontSize: '1.75rem', 
                fontWeight: 700, 
                color: metrics.netPosition > 0 ? 'var(--success)' : metrics.netPosition < 0 ? 'var(--danger)' : 'var(--text-main)' 
              }}>
                {metrics.netPosition > 0 ? '+' : ''}{formatCurrency(metrics.netPosition)}
              </span>
            </div>
            <div style={{
              background: metrics.netPosition > 0 ? 'var(--success-bg)' : metrics.netPosition < 0 ? 'var(--danger-bg)' : 'var(--bg-input)',
              padding: '0.6rem',
              borderRadius: 'var(--radius-md)',
              color: metrics.netPosition > 0 ? 'var(--success)' : metrics.netPosition < 0 ? 'var(--danger)' : 'var(--text-muted)'
            }}>
              <Coins size={24} />
            </div>
          </div>
        </div>

        {/* Action Button & Add Form */}
        <div className="animate-fade-in stagger-3" style={{ marginBottom: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            style={{
              padding: '0.6rem 1.25rem',
              backgroundColor: showAddForm ? 'var(--bg-input)' : 'var(--primary)',
              color: 'white',
              borderRadius: 'var(--radius-md)',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              alignSelf: 'center',
              boxShadow: showAddForm ? 'none' : 'var(--shadow-glow)'
            }}
          >
            {showAddForm ? 'Cancel' : <><Plus size={16} /> Log New Debt / Loan</>}
          </button>

          {showAddForm && (
            <form onSubmit={handleAddDebtSubmit} className="glass-card flex-col gap-4" style={{
              width: '100%',
              maxWidth: '550px',
              marginTop: '1.5rem',
              padding: '1.5rem',
              border: '1px solid var(--border-color)'
            }}>
              <h3 style={{ fontSize: '1.15rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '0.25rem' }}>
                New Debt/Loan Record
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                {/* Type Selection */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>Transaction Type</label>
                  <CustomSelect
                    options={typeOptions}
                    value={type}
                    onChange={val => setType(val)}
                    label="Transaction Type"
                  />
                </div>

                {/* Person name */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>Person / Contact Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Asif"
                    value={person}
                    onChange={e => setPerson(e.target.value)}
                    required
                    style={{ padding: '0.6rem', fontSize: '0.875rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                {/* Amount */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>Amount (BDT)</label>
                  <input
                    type="number"
                    placeholder="1000"
                    min="1"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    required
                    style={{ padding: '0.6rem', fontSize: '0.875rem' }}
                  />
                </div>

                {/* Date Lent/Borrowed */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>Date Lent/Borrowed</label>
                  <input
                    type="date"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    required
                    style={{ padding: '0.6rem', fontSize: '0.875rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                {/* Due date */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>Due Date (Optional)</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={e => setDueDate(e.target.value)}
                    style={{ padding: '0.6rem', fontSize: '0.875rem' }}
                  />
                </div>

                {/* Note */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>Description / Note</label>
                  <input
                    type="text"
                    placeholder="e.g. Seat Rent share, lunch bill (optional)"
                    value={note}
                    onChange={e => setNote(e.target.value)}
                    style={{ padding: '0.6rem', fontSize: '0.875rem' }}
                  />
                </div>
              </div>

              {/* Checkbox log to main transactions */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', marginTop: '0.25rem' }}>
                <input
                  type="checkbox"
                  id="logAsTx"
                  checked={logAsTx}
                  onChange={e => setLogAsTx(e.target.checked)}
                  style={{ width: '18px', height: '18px', cursor: 'pointer', marginTop: '3px' }}
                />
                <label htmlFor="logAsTx" style={{ fontSize: '0.825rem', color: 'var(--text-muted)', cursor: 'pointer', lineHeight: '1.4' }}>
                  Record immediately in main transaction history ({type === 'lent' ? 'Expense' : 'Income'})
                </label>
              </div>

              {/* Submit */}
              <button
                type="submit"
                style={{
                  padding: '0.65rem',
                  backgroundColor: 'var(--primary)',
                  color: 'white',
                  borderRadius: 'var(--radius-md)',
                  fontWeight: 600,
                  marginTop: '0.5rem',
                  fontSize: '0.875rem'
                }}
              >
                Create Record
              </button>
            </form>
          )}
        </div>

        {/* Tab switcher */}
        <div className="animate-fade-in stagger-3" style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
          <div style={{
            background: 'var(--bg-card)',
            padding: '4px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)',
            display: 'flex'
          }}>
            <button
              onClick={() => handleTabToggle('active')}
              style={{
                padding: '0.5rem 1.25rem',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: tab === 'active' ? 'var(--primary)' : 'transparent',
                color: tab === 'active' ? '#07090e' : 'var(--text-muted)',
                fontWeight: 600,
                fontSize: '0.875rem',
                transition: 'all 0.2s ease',
                viewTransitionName: tab === 'active' ? 'ledger-toggle-pill' : 'none'
              }}
            >
              Active Ledger ({activeDebts.length})
            </button>
            <button
              onClick={() => handleTabToggle('settled')}
              style={{
                padding: '0.5rem 1.25rem',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: tab === 'settled' ? 'var(--primary)' : 'transparent',
                color: tab === 'settled' ? '#07090e' : 'var(--text-muted)',
                fontWeight: 600,
                fontSize: '0.875rem',
                transition: 'all 0.2s ease',
                viewTransitionName: tab === 'settled' ? 'ledger-toggle-pill' : 'none'
              }}
            >
              Settled History ({settledDebts.length})
            </button>
          </div>
        </div>

        {/* Ledger Items List */}
        <div style={{ maxWidth: '750px', margin: '0 auto' }} className="flex-col gap-4 animate-fade-in stagger-4">
          {displayDebts.length === 0 ? (
            <div className="glass-card" style={{ padding: '3rem 1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              <Coins size={36} style={{ color: 'var(--text-muted)', opacity: 0.3, marginBottom: '0.75rem' }} />
              <p style={{ fontSize: '0.875rem' }}>
                No {tab} records found.
              </p>
            </div>
          ) : (
            displayDebts.map(debt => {
              const current = Number(debt.settled_amount || 0);
              const target = Number(debt.amount || 1);
              const remaining = target - current;
              const percent = Math.min(100, Math.round((current / target) * 100));

              const isLent = debt.type === 'lent';
              const typeColor = isLent ? 'var(--success)' : 'var(--danger)';
              const typeBg = isLent ? 'var(--success-bg)' : 'var(--danger-bg)';
              const dueStatus = getDueDateStatus(debt.due_date);

              let formattedDueDate = '';
              if (debt.due_date) {
                try {
                  formattedDueDate = format(parseISO(debt.due_date), 'MMM dd, yyyy');
                } catch {
                  formattedDueDate = debt.due_date;
                }
              }

              const isRepaying = showRepayFormId === debt.id;
              const isExpanded = expandedDebtId === debt.id;

              return (
                <div
                  key={debt.id}
                  className="glass-card flex-col gap-3"
                  style={{
                    border: '1px solid var(--border-color)',
                    padding: '1.25rem',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {/* Top line: Contact, Type Badge, Due Alerts */}
                  <div className="flex items-center justify-between" style={{ flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div className="flex-col gap-1">
                      <div className="flex items-center gap-2.5" style={{ flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)' }}>{debt.person}</span>
                        <span style={{ 
                          fontSize: '0.65rem', 
                          fontWeight: 700, 
                          color: typeColor, 
                          backgroundColor: typeBg,
                          padding: '2px 8px',
                          borderRadius: 'var(--radius-full)',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          border: `1px solid ${typeColor}33`
                        }}>
                          {isLent ? 'Receivable' : 'Payable'}
                        </span>
                      </div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {isLent ? 'Lent' : 'Borrowed'} on {debt.date ? format(parseISO(debt.date), 'MMM dd, yyyy') : format(parseISO(debt.created_at), 'MMM dd, yyyy')}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {debt.due_date && (
                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '0.35rem', 
                          fontSize: '0.75rem',
                          backgroundColor: dueStatus.label ? `${dueStatus.color}15` : 'var(--bg-input)',
                          padding: '0.35rem 0.6rem',
                          borderRadius: 'var(--radius-sm)',
                          border: `1px solid ${dueStatus.label ? `${dueStatus.color}33` : 'var(--border-color)'}`
                        }}>
                          <Calendar size={13} color={dueStatus.label ? dueStatus.color : 'var(--text-muted)'} />
                          <span style={{ color: dueStatus.label ? dueStatus.color : 'var(--text-muted)', fontWeight: 600 }}>
                            {dueStatus.label ? `${dueStatus.label}: ` : 'Due: '}{formattedDueDate}
                          </span>
                        </div>
                      )}
                      
                      {/* Edit */}
                      <button
                        onClick={() => {
                          if (editingDebtId === debt.id) {
                            setEditingDebtId(null);
                          } else {
                            startEdit(debt);
                          }
                        }}
                        style={{
                          color: editingDebtId === debt.id ? 'var(--primary)' : 'var(--text-muted)',
                          padding: '0.4rem',
                          borderRadius: 'var(--radius-full)',
                          backgroundColor: 'var(--bg-input)',
                          border: '1px solid var(--border-color)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          transition: 'var(--transition)'
                        }}
                        onMouseOver={e => {
                          e.currentTarget.style.color = 'var(--primary)';
                          e.currentTarget.style.borderColor = 'rgba(88, 166, 255, 0.3)';
                        }}
                        onMouseOut={e => {
                          e.currentTarget.style.color = editingDebtId === debt.id ? 'var(--primary)' : 'var(--text-muted)';
                          e.currentTarget.style.borderColor = 'var(--border-color)';
                        }}
                        title="Edit record"
                      >
                        <Pencil size={14} />
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => {
                          showConfirm({
                            title: 'Delete Debt Record?',
                            message: `Are you sure you want to delete this record for ${debt.person}?`,
                            confirmLabel: 'Delete',
                            onConfirm: () => deleteDebt(debt.id)
                          });
                        }}
                        style={{ 
                          color: 'var(--text-muted)', 
                          padding: '0.4rem', 
                          borderRadius: 'var(--radius-full)',
                          backgroundColor: 'var(--bg-input)',
                          border: '1px solid var(--border-color)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          transition: 'var(--transition)'
                        }}
                        onMouseOver={e => {
                          e.currentTarget.style.color = 'var(--danger)';
                          e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)';
                          e.currentTarget.style.backgroundColor = 'var(--danger-bg)';
                        }}
                        onMouseOut={e => {
                          e.currentTarget.style.color = 'var(--text-muted)';
                          e.currentTarget.style.borderColor = 'var(--border-color)';
                          e.currentTarget.style.backgroundColor = 'var(--bg-input)';
                        }}
                        title="Delete record"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Inline Edit form */}
                  {editingDebtId === debt.id && (
                    <form onSubmit={handleEditSubmit} style={{
                      padding: '1rem',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'var(--bg-input)',
                      border: '1px solid var(--border-color)',
                      marginTop: '0.5rem'
                    }} className="flex-col gap-3">
                      <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Edit Record</span>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Type</label>
                          <CustomSelect
                            options={typeOptions}
                            value={editForm.type}
                            onChange={val => setEditForm(prev => ({ ...prev, type: val }))}
                            label="Transaction Type"
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Person / Contact Name</label>
                          <input
                            type="text"
                            value={editForm.person}
                            onChange={e => setEditForm(prev => ({ ...prev, person: e.target.value }))}
                            style={{ padding: '0.4rem', fontSize: '0.8rem' }}
                          />
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Amount</label>
                          <input
                            type="number"
                            min="1"
                            value={editForm.amount}
                            onChange={e => setEditForm(prev => ({ ...prev, amount: e.target.value }))}
                            style={{ padding: '0.4rem', fontSize: '0.8rem' }}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Date Lent/Borrowed</label>
                          <input
                            type="date"
                            value={editForm.date}
                            onChange={e => setEditForm(prev => ({ ...prev, date: e.target.value }))}
                            style={{ padding: '0.4rem', fontSize: '0.8rem' }}
                          />
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Due Date (Optional)</label>
                          <input
                            type="date"
                            value={editForm.dueDate}
                            onChange={e => setEditForm(prev => ({ ...prev, dueDate: e.target.value }))}
                            style={{ padding: '0.4rem', fontSize: '0.8rem' }}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Description / Note (Optional)</label>
                          <input
                            type="text"
                            value={editForm.note}
                            onChange={e => setEditForm(prev => ({ ...prev, note: e.target.value }))}
                            style={{ padding: '0.4rem', fontSize: '0.8rem' }}
                          />
                        </div>
                      </div>

                      {Number(editForm.amount) < Number(debt.settled_amount || 0) && (
                        <span style={{ fontSize: '0.7rem', color: 'var(--warning)' }}>
                          Amount is below the {formatCurrency(debt.settled_amount)} already repaid — this record will be marked settled.
                        </span>
                      )}

                      <div className="flex gap-2 justify-end">
                        <button
                          type="button"
                          onClick={() => setEditingDebtId(null)}
                          style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', borderRadius: 'var(--radius-sm)', color: 'var(--text-muted)' }}
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--primary)', color: 'white', fontWeight: 600 }}
                        >
                          Save Changes
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Summary / Progress block */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '0.75rem', marginTop: '0.5rem' }}>
                    <div className="flex-col gap-1">
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Outstanding Balance</span>
                      <div className="flex items-baseline gap-1">
                        <span style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-main)' }}>
                          {formatCurrency(remaining)}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          of {formatCurrency(target)}
                        </span>
                      </div>
                      {debt.note && (
                        <div style={{
                          backgroundColor: 'rgba(255, 255, 255, 0.02)',
                          borderLeft: `2px solid var(--border-color)`,
                          padding: '0.3rem 0.6rem',
                          borderRadius: '0 4px 4px 0',
                          fontSize: '0.775rem',
                          color: 'var(--text-muted)',
                          marginTop: '0.35rem',
                          fontStyle: 'italic'
                        }}>
                          "{debt.note}"
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-col" style={{ alignItems: 'flex-end', gap: '0.15rem' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Settle Rate</span>
                      <span style={{ fontSize: '1.15rem', fontWeight: 700, color: typeColor }}>
                        {percent}%
                      </span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div style={{ 
                    width: '100%', 
                    height: '8px', 
                    backgroundColor: 'var(--bg-input)', 
                    borderRadius: 'var(--radius-full)', 
                    overflow: 'hidden',
                    border: '1px solid rgba(255, 255, 255, 0.02)'
                  }}>
                    <div style={{
                      width: `${percent}%`,
                      backgroundColor: typeColor,
                      height: '100%',
                      borderRadius: 'var(--radius-full)',
                      transition: 'width 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                      boxShadow: `0 0 8px ${typeColor}66`
                    }} />
                  </div>

                  {/* Action Bar */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.25rem', borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: '0.75rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                    <div className="flex gap-3">
                      {/* Repayment Log history toggle */}
                      {debt.payments && debt.payments.length > 0 && (
                        <button
                          onClick={() => setExpandedDebtId(isExpanded ? null : debt.id)}
                          style={{
                            fontSize: '0.75rem',
                            color: 'var(--text-muted)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            cursor: 'pointer'
                          }}
                        >
                          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          Logs ({debt.payments.length})
                        </button>
                      )}
                    </div>

                    {tab === 'active' && (
                      <div className="flex gap-2" style={{ flexWrap: 'wrap', justifyContent: 'flex-end', width: '100%', smWidth: 'auto' }}>
                        {/* Repay / Payment Button */}
                        <button
                          onClick={() => {
                            if (isRepaying) {
                              setShowRepayFormId(null);
                            } else {
                              setEditingDebtId(null);
                              setShowRepayFormId(debt.id);
                              // set default checkboxes
                              setRepayLogAsTx(prev => ({ ...prev, [debt.id]: true }));
                            }
                          }}
                          style={{
                            padding: '0.45rem 0.9rem',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            borderRadius: 'var(--radius-sm)',
                            backgroundColor: 'var(--bg-input)',
                            border: '1px solid var(--border-color)',
                            color: 'var(--text-main)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            cursor: 'pointer',
                            transition: 'var(--transition)'
                          }}
                          onMouseOver={e => {
                            e.currentTarget.style.backgroundColor = 'var(--bg-hover)';
                            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)';
                          }}
                          onMouseOut={e => {
                            e.currentTarget.style.backgroundColor = 'var(--bg-input)';
                            e.currentTarget.style.borderColor = 'var(--border-color)';
                          }}
                        >
                          <PlusCircle size={14} /> Repayment
                        </button>

                        {/* Quick Settle Fully */}
                        <button
                          onClick={() => handleFullSettlement(debt.id, remaining)}
                          style={{
                            padding: '0.45rem 0.9rem',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            borderRadius: 'var(--radius-sm)',
                            backgroundColor: typeColor,
                            color: 'white',
                            border: `1px solid transparent`,
                            cursor: 'pointer',
                            boxShadow: `0 2px 8px ${typeColor}33`,
                            transition: 'var(--transition)'
                          }}
                          onMouseOver={e => {
                            e.currentTarget.style.opacity = '0.9';
                            e.currentTarget.style.boxShadow = `0 4px 12px ${typeColor}55`;
                          }}
                          onMouseOut={e => {
                            e.currentTarget.style.opacity = '1';
                            e.currentTarget.style.boxShadow = `0 2px 8px ${typeColor}33`;
                          }}
                        >
                          Settle Fully
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Expandable repays list logs */}
                  {isExpanded && debt.payments && (
                    <div style={{
                      backgroundColor: 'rgba(0,0,0,0.15)',
                      padding: '0.75rem',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '0.8rem',
                      border: '1px solid var(--border-color)'
                    }} className="flex-col gap-2">
                      <span style={{ fontWeight: 600, fontSize: '0.725rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Repayment Log</span>
                      <div className="flex-col gap-1.5" style={{ maxHeight: '150px', overflowY: 'auto' }}>
                        {debt.payments.map((p, idx) => (
                          <div key={idx} className="flex justify-between" style={{ padding: '0.25rem 0', borderBottom: idx < debt.payments.length - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none' }}>
                            <div className="flex gap-2 text-muted">
                              <span>{format(parseISO(p.date), 'yyyy-MM-dd')}</span>
                              {p.note && <span>•</span>}
                              {p.note && <span style={{ color: 'var(--text-main)', fontStyle: 'italic' }}>"{p.note}"</span>}
                            </div>
                            <span style={{ fontWeight: 600, color: typeColor }}>
                              {formatCurrency(p.amount)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Inline Repayment form */}
                  {isRepaying && (
                    <div style={{
                      padding: '1rem',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'var(--bg-input)',
                      border: '1px solid var(--border-color)',
                      marginTop: '0.5rem'
                    }} className="flex-col gap-3">
                      <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Log Repayment for {debt.person}</span>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Payment Amount</label>
                          <input
                            type="number"
                            placeholder="e.g. 500"
                            max={remaining}
                            value={repayAmount[debt.id] || ''}
                            onChange={e => setRepayAmount(prev => ({ ...prev, [debt.id]: e.target.value }))}
                            style={{ padding: '0.4rem', fontSize: '0.8rem' }}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Payment Note (Optional)</label>
                          <input
                            type="text"
                            placeholder="e.g. cash, bkash transfer"
                            value={repayNote[debt.id] || ''}
                            onChange={e => setRepayNote(prev => ({ ...prev, [debt.id]: e.target.value }))}
                            style={{ padding: '0.4rem', fontSize: '0.8rem' }}
                          />
                        </div>
                      </div>

                      {/* log repayment to transactions */}
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                        <input
                          type="checkbox"
                          id={`repayLogTx-${debt.id}`}
                          checked={repayLogAsTx[debt.id] !== false}
                          onChange={e => setRepayLogAsTx(prev => ({ ...prev, [debt.id]: e.target.checked }))}
                          style={{ width: '16px', height: '16px', cursor: 'pointer', marginTop: '2px' }}
                        />
                        <label htmlFor={`repayLogTx-${debt.id}`} style={{ fontSize: '0.775rem', color: 'var(--text-muted)', cursor: 'pointer', lineHeight: '1.4' }}>
                          Record in main transactions ({isLent ? 'Income / cash returned' : 'Expense / cash paid'})
                        </label>
                      </div>

                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => setShowRepayFormId(null)}
                          style={{
                            padding: '0.4rem 0.8rem',
                            fontSize: '0.75rem',
                            borderRadius: 'var(--radius-sm)',
                            color: 'var(--text-muted)'
                          }}
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleRepaymentSubmit(debt.id)}
                          style={{
                            padding: '0.4rem 0.8rem',
                            fontSize: '0.75rem',
                            borderRadius: 'var(--radius-sm)',
                            backgroundColor: 'var(--primary)',
                            color: 'white',
                            fontWeight: 600
                          }}
                        >
                          Submit Payment
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </main>
      <Footer />
    </>
  );
};

export default LedgerPage;
