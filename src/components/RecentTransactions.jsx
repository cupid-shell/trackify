import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext, parseLocalDate } from '../context/AppContext';
import { format } from 'date-fns';
import { Trash2, TrendingUp, Download, Edit2, X, Repeat, Search } from 'lucide-react';
import CategoryIcon from './CategoryIcon';
import CustomSelect from './CustomSelect';
import TimePicker from './TimePicker';

// Shared base so every filter control (search, category, dates, reimbursable)
// lines up at the same height and shares one visual language.
const CONTROL_BASE = {
  height: '2.75rem',
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--border-color)',
  backgroundColor: 'var(--bg-input)',
  color: 'var(--text-main)',
  fontSize: '0.875rem',
};

const RecentTransactions = ({ 
  selectedDay = null, 
  setSelectedDay = null,
  searchTerm: propSearchTerm,
  setSearchTerm: propSetSearchTerm,
  selectedCategory: propSelectedCategory,
  setSelectedCategory: propSetSelectedCategory,
  startDate: propStartDate,
  setStartDate: propSetStartDate,
  endDate: propEndDate,
  setEndDate: propSetEndDate,
  reimbursableOnly: propReimbursableOnly,
  setReimbursableOnly: propSetReimbursableOnly,
  clearFilters: propClearFilters
}) => {
  const { 
    currentMonthTransactions, 
    deleteTransaction, 
    updateTransaction, 
    userSettings,
    getCategoryStyle,
    showToast,
    showConfirm,
    selectedMonth,
    selectedYear,
    formatCurrency,
    currency,
    paymentMethods,
    reimbursements,
    debts,
    recordDebtRepayment,
    dataUnavailable,
    syncState,
    refreshAll,
    session
  } = useAppContext();

  const navigate = useNavigate();

  const [localSearchTerm, localSetSearchTerm] = useState('');
  const [localSelectedCategory, localSetSelectedCategory] = useState('All');
  const [localStartDate, localSetStartDate] = useState('');
  const [localEndDate, localSetEndDate] = useState('');
  const [localReimbursableOnly, localSetReimbursableOnly] = useState(false);
  const [activeReceiptUrl, setActiveReceiptUrl] = useState(null);

  const searchTerm = propSearchTerm !== undefined ? propSearchTerm : localSearchTerm;
  const setSearchTerm = propSetSearchTerm !== undefined ? propSetSearchTerm : localSetSearchTerm;

  const selectedCategory = propSelectedCategory !== undefined ? propSelectedCategory : localSelectedCategory;
  const setSelectedCategory = propSetSelectedCategory !== undefined ? propSetSelectedCategory : localSetSelectedCategory;

  const startDate = propStartDate !== undefined ? propStartDate : localStartDate;
  const setStartDate = propSetStartDate !== undefined ? propSetStartDate : localSetStartDate;

  const endDate = propEndDate !== undefined ? propEndDate : localEndDate;
  const setEndDate = propSetEndDate !== undefined ? propSetEndDate : localSetEndDate;

  const showReimbursableOnly = propReimbursableOnly !== undefined ? propReimbursableOnly : localReimbursableOnly;
  const setShowReimbursableOnly = propSetReimbursableOnly !== undefined ? propSetReimbursableOnly : localSetReimbursableOnly;

  // Edit mode states
  const [editingId, setEditingId] = useState(null);
  const [editAmount, setEditAmount] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editNote, setEditNote] = useState('');
  const [editPaymentMethod, setEditPaymentMethod] = useState('Cash');
  const [editDate, setEditDate] = useState('');
  const [editTime, setEditTime] = useState('');

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

  const startEditing = (tx) => {
    const txDate = new Date(tx.date);
    const dateStr = getLocalDateString(txDate);
    const timeStr = getLocalTimeString(txDate);

    setEditingId(tx.id);
    setEditAmount(tx.amount.toString());
    setEditCategory(tx.category);
    setEditNote(tx.note || '');
    setEditPaymentMethod(tx.payment_method || 'Cash');
    setEditDate(dateStr);
    setEditTime(timeStr);
  };

  const saveEdit = async (txId) => {
    if (!editAmount || isNaN(Number(editAmount)) || Number(editAmount) <= 0) {
      showToast('Please enter a valid amount', 'warning');
      return;
    }
    const combined = combineDateTime(editDate, editTime);
    const success = await updateTransaction(txId, {
      amount: Number(editAmount),
      category: editCategory,
      note: editNote,
      payment_method: editPaymentMethod,
      date: combined
    });
    if (success) {
      setEditingId(null);
    }
  };

  // Get unique categories for the current month to populate the dropdown
  const uniqueCategories = ['All', ...new Set(currentMonthTransactions.map(tx => tx.category))].sort();

  // Resolve the linked Ledger receivable (a 'lent' debt) for a reimbursable tx.
  const reimburseDebtFor = (txId) => {
    const debtId = reimbursements[txId];
    return debtId ? debts.find(d => d.id === debtId) : null;
  };

  // Filter by search term AND selected category AND calendar day click
  const filteredTx = currentMonthTransactions.filter(tx => {
    const txDate = parseLocalDate(tx.date);

    // Day filter
    if (selectedDay !== null) {
      if (txDate.getDate() !== selectedDay) {
        return false;
      }
    }

    if (showReimbursableOnly && !reimbursements[tx.id]) return false;

    const matchesSearch = 
      tx.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (tx.note && tx.note.toLowerCase().includes(searchTerm.toLowerCase())) ||
      tx.amount.toString().includes(searchTerm);
      
    const matchesCategory = selectedCategory === 'All' || tx.category === selectedCategory;
    
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

  const anyFilterActive = !!(searchTerm || (selectedCategory && selectedCategory !== 'All') || startDate || endDate || showReimbursableOnly || selectedDay !== null);
  const clearAllFilters = () => {
    // On the History page the setters write to the URL and can't be batched
    // (see HistoryPage.clearFilters); use the single-call prop when provided.
    if (propClearFilters) { propClearFilters(); return; }
    setSearchTerm('');
    setSelectedCategory('All');
    setStartDate('');
    setEndDate('');
    setShowReimbursableOnly(false);
    if (setSelectedDay) setSelectedDay(null);
  };

  const handleExportCSV = () => {
    if (currentMonthTransactions.length === 0) return;

    // Create CSV headers
    const headers = ['Date', 'Type', 'Category', 'Payment Method', `Amount (${currency})`, 'Note'];
    
    // CSV Field Sanitizer (Mitigates CSV Injection and escapes delimiters/quotes)
    const escapeCSVField = (val) => {
      if (val === undefined || val === null) return '';
      let str = String(val);
      // Mitigate CSV Formula Injection: prepend a single quote if starting with =, +, -, @
      if (/^[=+\-@]/.test(str)) {
        str = `'${str}`;
      }
      // Escape double quotes and enclose in quotes if it contains commas, double quotes, or newlines
      if (/[",\n\r]/.test(str)) {
        str = `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    // Map transactions to CSV rows
    const csvRows = sortedTx.map(tx => {
      let formattedDate;
      try {
        formattedDate = format(new Date(tx.date), 'yyyy-MM-dd');
      } catch {
        formattedDate = tx.date;
      }
      return [
        escapeCSVField(formattedDate),
        escapeCSVField(tx.type),
        escapeCSVField(tx.category),
        escapeCSVField(tx.payment_method || 'Cash'),
        escapeCSVField(tx.amount),
        escapeCSVField(tx.note)
      ].join(',');
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

  const handleExportPDF = () => {
    if (sortedTx.length === 0) return;

    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow.document;
    doc.open();

    const incTotal = sortedTx.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
    const expTotal = sortedTx.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);
    const netBal = incTotal - expTotal;

    const dateRangeStr = startDate || endDate
      ? `${startDate ? 'From ' + startDate : ''} ${endDate ? 'To ' + endDate : ''}`
      : `Month: ${format(new Date(selectedYear, selectedMonth, 1), 'MMMM yyyy')}`;

    const rowsHtml = sortedTx.map((tx, idx) => {
      const formattedDate = format(new Date(tx.date), 'yyyy-MM-dd HH:mm');
      const isIncome = tx.type === 'income';
      return `
        <tr style="background-color: ${idx % 2 === 0 ? '#ffffff' : '#f8f9fa'};">
          <td style="padding: 10px; border-bottom: 1px solid #dee2e6;">${formattedDate}</td>
          <td style="padding: 10px; border-bottom: 1px solid #dee2e6; font-weight: 600; color: ${isIncome ? '#2b8a3e' : '#c92a2a'};">${tx.type.toUpperCase()}</td>
          <td style="padding: 10px; border-bottom: 1px solid #dee2e6;">${tx.category}</td>
          <td style="padding: 10px; border-bottom: 1px solid #dee2e6;">${tx.payment_method || 'Cash'}</td>
          <td style="padding: 10px; border-bottom: 1px solid #dee2e6; text-align: right; font-weight: 600;">${isIncome ? '+' : '-'}${formatCurrency(tx.amount)}</td>
          <td style="padding: 10px; border-bottom: 1px solid #dee2e6; color: #495057;">${tx.note || ''}</td>
        </tr>
      `;
    }).join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Trackify Financial Statement</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
              color: #212529;
              padding: 20px;
              line-height: 1.5;
            }
            .header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              border-bottom: 2px solid #3eb489;
              padding-bottom: 15px;
              margin-bottom: 20px;
            }
            .logo {
              font-size: 24px;
              font-weight: 800;
              color: #3eb489;
              letter-spacing: 0.5px;
            }
            .statement-title {
              font-size: 18px;
              font-weight: 600;
              color: #495057;
              text-align: right;
            }
            .meta {
              font-size: 12px;
              color: #868e96;
              margin-bottom: 25px;
            }
            .summary-cards {
              display: flex;
              gap: 15px;
              margin-bottom: 30px;
            }
            .card {
              flex: 1;
              padding: 15px;
              background-color: #f8f9fa;
              border: 1px solid #e9ecef;
              border-radius: 8px;
            }
            .card-title {
              font-size: 11px;
              text-transform: uppercase;
              color: #868e96;
              margin-bottom: 5px;
              font-weight: 700;
            }
            .card-value {
              font-size: 20px;
              font-weight: 700;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              font-size: 13px;
              margin-top: 15px;
            }
            th {
              background-color: #f1f3f5;
              font-weight: 700;
              text-align: left;
              padding: 12px 10px;
              border-bottom: 2px solid #dee2e6;
            }
            @media print {
              body { padding: 0; }
              .card { border: 1px solid #dee2e6; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo">TRACKIFY</div>
            <div class="statement-title">Financial Statement</div>
          </div>
          <div class="meta">
            <div><strong>Statement Period:</strong> ${dateRangeStr}</div>
            <div><strong>Generated On:</strong> ${new Date().toLocaleString()}</div>
          </div>
          <div class="summary-cards">
            <div class="card">
              <div class="card-title">Total Income</div>
              <div class="card-value" style="color: #2b8a3e;">${formatCurrency(incTotal)}</div>
            </div>
            <div class="card">
              <div class="card-title">Total Expenses</div>
              <div class="card-value" style="color: #c92a2a;">${formatCurrency(expTotal)}</div>
            </div>
            <div class="card">
              <div class="card-title">Net Balance</div>
              <div class="card-value" style="color: ${netBal >= 0 ? '#2b8a3e' : '#c92a2a'};">${formatCurrency(netBal)}</div>
            </div>
          </div>
          <h3>Transaction History (${sortedTx.length} records)</h3>
          <table>
            <thead>
              <tr>
                <th style="width: 15%;">Date</th>
                <th style="width: 10%;">Type</th>
                <th style="width: 20%;">Category</th>
                <th style="width: 15%;">Payment</th>
                <th style="text-align: right; width: 15%;">Amount</th>
                <th style="width: 25%;">Note</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
        </body>
      </html>
    `;

    doc.write(htmlContent);
    doc.close();

    iframe.contentWindow.focus();
    setTimeout(() => {
      iframe.contentWindow.print();
      document.body.removeChild(iframe);
    }, 500);
  };

  return (
    <div className="glass-card flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 style={{ fontSize: '1.25rem' }}>Monthly Transactions</h2>
        {currentMonthTransactions.length > 0 && (
          <div className="flex gap-2" style={{ flexShrink: 0 }}>
            <button 
              onClick={handleExportCSV}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.45rem 0.75rem',
                backgroundColor: 'var(--bg-input)',
                color: 'var(--text-main)',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.85rem',
                fontWeight: 500,
                border: '1px solid var(--border-color)',
                cursor: 'pointer'
              }}
              title="Export as CSV spreadsheet"
            >
              <Download size={14} />
              CSV
            </button>
            <button 
              onClick={handleExportPDF}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.45rem 0.75rem',
                backgroundColor: 'var(--bg-input)',
                color: 'var(--text-main)',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.85rem',
                fontWeight: 500,
                border: '1px solid var(--border-color)',
                cursor: 'pointer'
              }}
              title="Print statement to PDF"
            >
              <Download size={14} />
              PDF Statement
            </button>
          </div>
        )}
      </div>

      {selectedDay !== null && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.45rem 0.85rem',
          background: 'var(--primary-glow)',
          border: '1px solid rgb(from var(--primary) r g b / 0.3)',
          borderRadius: 'var(--radius-md)',
          color: 'var(--primary)',
          fontSize: '0.82rem',
          fontWeight: 600,
          width: 'fit-content',
          marginTop: '-0.5rem',
          boxShadow: '0 0 10px rgb(from var(--primary) r g b / 0.05)'
        }}>
          <span>Filtered by Date: {format(new Date(selectedYear, selectedMonth, selectedDay), 'MMMM dd, yyyy')}</span>
          <button 
            onClick={() => setSelectedDay(null)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--primary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              padding: '0.1rem',
              marginLeft: '0.25rem',
              transition: 'transform 0.15s ease'
            }}
            onMouseOver={e => e.currentTarget.style.transform = 'scale(1.15)'}
            onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
            title="Clear date filter"
          >
            <X size={13} strokeWidth={2.5} />
          </button>
        </div>
      )}

      <div className="flex-col gap-3" style={{ marginBottom: '1.25rem' }}>
        {/* Search — full width with a leading icon */}
        <div style={{ position: 'relative', width: '100%' }}>
          <Search
            size={16}
            style={{ position: 'absolute', left: '0.95rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }}
          />
          <input
            type="text"
            placeholder="Search by category, note, or amount…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ ...CONTROL_BASE, width: '100%', padding: '0 1rem 0 2.5rem' }}
          />
        </div>

        {/* Facets — one height-aligned row: category · reimbursable · date range · clear */}
        <div className="flex items-center" style={{ flexWrap: 'wrap', gap: '0.75rem' }}>
          <CustomSelect
            options={uniqueCategories}
            value={selectedCategory}
            onChange={val => setSelectedCategory(val)}
            getCategoryStyle={getCategoryStyle}
            label="Category"
            style={{ flex: '0 0 auto', width: 'auto', minWidth: '180px' }}
            triggerStyle={{ height: '2.75rem', padding: '0 1rem', fontSize: '0.875rem' }}
          />

          <button
            type="button"
            onClick={() => setShowReimbursableOnly(!showReimbursableOnly)}
            aria-pressed={showReimbursableOnly}
            title="Show only expenses someone owes you back"
            style={{
              ...CONTROL_BASE,
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0 1rem',
              fontWeight: 600,
              cursor: 'pointer',
              color: showReimbursableOnly ? 'var(--primary)' : 'var(--text-muted)',
              backgroundColor: showReimbursableOnly ? 'var(--primary-glow)' : 'var(--bg-input)',
              border: `1px solid ${showReimbursableOnly ? 'rgb(from var(--primary) r g b / 0.35)' : 'var(--border-color)'}`,
            }}
          >
            <Repeat size={14} /> Reimbursable
          </button>

          {/* Date range */}
          <div className="flex items-center" style={{ gap: '0.5rem' }}>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              aria-label="From date"
              title="From date"
              style={{ ...CONTROL_BASE, padding: '0 0.75rem', width: '150px' }}
            />
            <span style={{ color: 'var(--text-muted)', flexShrink: 0 }}>–</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              aria-label="To date"
              title="To date"
              style={{ ...CONTROL_BASE, padding: '0 0.75rem', width: '150px' }}
            />
          </div>

          {anyFilterActive && (
            <button
              type="button"
              onClick={clearAllFilters}
              title="Clear all filters"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                height: '2.75rem',
                padding: '0 0.9rem',
                fontSize: '0.8rem',
                fontWeight: 600,
                color: 'var(--danger)',
                backgroundColor: 'var(--danger-bg)',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                marginLeft: 'auto',
              }}
            >
              <X size={14} /> Clear
            </button>
          )}
        </div>
      </div>

      {sortedTx.length === 0 ? (
        // Three distinct empty states. The third used to be missing: when the
        // fetch failed we still said "No transactions yet", which reads as
        // "your data is gone" rather than "we couldn't reach the server".
        dataUnavailable ? (
          <div className="empty-state">
            <div className="empty-state-icon">📡</div>
            <h3>Couldn&apos;t load your transactions</h3>
            <p>
              {syncState?.lastError
                ? 'We couldn’t reach the server, so nothing is shown here. Your data is safe — this is a connection problem, not a missing-data one.'
                : 'We couldn’t reach the server. Your data is safe.'}
            </p>
            <button
              type="button"
              disabled={syncState?.syncing}
              onClick={() => session?.user?.id && refreshAll(session.user.id)}
              style={{
                marginTop: '1rem',
                height: '2.5rem',
                padding: '0 1.25rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-input)',
                color: 'var(--text-main)',
                fontSize: '0.875rem',
                fontWeight: 600,
                cursor: syncState?.syncing ? 'default' : 'pointer',
                opacity: syncState?.syncing ? 0.6 : 1,
              }}
            >
              {syncState?.syncing ? 'Retrying…' : 'Try again'}
            </button>
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon">
              {searchTerm || selectedCategory !== 'All' || startDate || endDate || selectedDay !== null || showReimbursableOnly ? '🔍' : '📭'}
            </div>
            <h3>
              {searchTerm || selectedCategory !== 'All' || startDate || endDate || selectedDay !== null || showReimbursableOnly
                ? 'No matching transactions'
                : 'No transactions yet'}
            </h3>
            <p>
              {searchTerm || selectedCategory !== 'All' || startDate || endDate || selectedDay !== null || showReimbursableOnly
                ? 'Try adjusting your filters or search term.'
                : 'Add your first transaction above to start tracking your finances.'}
            </p>
          </div>
        )
      ) : (
        <div className="flex-col gap-3">
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
                      <CustomSelect
                        options={tx.type === 'expense' ? userSettings.expense_categories : userSettings.income_categories}
                        value={editCategory}
                        onChange={val => setEditCategory(val)}
                        getCategoryStyle={getCategoryStyle}
                        label="Category"
                        triggerStyle={{ padding: '0.5rem', fontSize: '0.875rem', height: '2.25rem' }}
                      />
                    </div>
                    <div style={{ flex: '1 1 120px' }}>
                      <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Payment Method</label>
                      <CustomSelect
                        options={paymentMethods.includes(editPaymentMethod) ? paymentMethods : [editPaymentMethod, ...paymentMethods]}
                        value={editPaymentMethod}
                        onChange={val => setEditPaymentMethod(val)}
                        label="Payment Method"
                        triggerStyle={{ padding: '0.5rem', fontSize: '0.875rem', height: '2.25rem' }}
                      />
                    </div>
                    <div style={{ flex: '1 1 200px', display: 'flex', gap: '0.5rem' }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Date</label>
                        <input 
                          type="date" 
                          value={editDate} 
                          onChange={e => setEditDate(e.target.value)} 
                          style={{ padding: '0.5rem', fontSize: '0.875rem', width: '100%', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-input)', color: 'var(--text-main)' }}
                        />
                      </div>
                      <div style={{ width: '100px' }}>
                        <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Time</label>
                        <TimePicker value={editTime} onChange={val => setEditTime(val)} style={{ width: '100%' }} />
                      </div>
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
                className="tx-row"
              >
                <div className="tx-left-col">
                  <div style={{
                    width: '40px',
                    height: '40px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 'var(--radius-full)',
                    backgroundColor: tx.type === 'income' ? 'var(--success-bg)' : `${getCategoryStyle(tx.category).color}15`,
                    border: `1px solid ${tx.type === 'income' ? 'rgb(from var(--success) r g b / 0.2)' : `${getCategoryStyle(tx.category).color}30`}`,
                    fontSize: tx.type === 'income' ? '1rem' : '1.25rem',
                    flexShrink: 0
                  }}>
                    {tx.type === 'income' ? <TrendingUp size={20} style={{ color: 'var(--success)' }} /> : <CategoryIcon category={tx.category} size={20} />}
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <h4 style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tx.category}</h4>
                    <div className="flex items-center flex-wrap" style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem', columnGap: '0.5rem', rowGap: '0.25rem' }}>
                      <span style={{ 
                        backgroundColor: 'rgba(255,255,255,0.1)', 
                        padding: '2px 6px', 
                        borderRadius: '4px',
                        fontSize: '0.7rem',
                        flexShrink: 0
                      }}>
                        {tx.payment_method || 'Cash'}
                      </span>
                      <span style={{ flexShrink: 0 }}>{format(new Date(tx.date), 'MMM dd, yyyy • hh:mm a')}</span>
                      {userSettings.category_metadata?._receipt_attachments?.[tx.id] && (
                        <button
                          onClick={() => setActiveReceiptUrl(userSettings.category_metadata._receipt_attachments[tx.id])}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '2px',
                            background: 'var(--primary-glow)',
                            border: '1px solid var(--primary)',
                            color: 'var(--primary)',
                            borderRadius: '4px',
                            padding: '1px 5px',
                            fontSize: '0.7rem',
                            cursor: 'pointer',
                            flexShrink: 0
                          }}
                          title="View Receipt"
                        >
                          📷 Receipt
                        </button>
                      )}
                      {reimbursements[tx.id] && (() => {
                        const rDebt = reimburseDebtFor(tx.id);
                        // Linked debt gone (deleted in the Ledger) → treat as resolved.
                        const settled = !rDebt || rDebt.status === 'settled';
                        const remaining = rDebt ? Math.max(Number(rDebt.amount) - Number(rDebt.settled_amount || 0), 0) : 0;
                        return (
                          <button
                            onClick={() => {
                              if (settled) { navigate('/ledger'); return; }
                              showConfirm({
                                title: 'Mark as repaid?',
                                message: `Settle the ${formatCurrency(remaining)} ${rDebt.person} owes you for this expense.`,
                                confirmLabel: 'Mark repaid',
                                variant: 'info',
                                checkbox: { label: `Also log ${formatCurrency(remaining)} as income` },
                                onConfirm: (logIncome) => recordDebtRepayment(rDebt.id, remaining, 'Reimbursed', logIncome),
                              });
                            }}
                            title={settled ? 'Reimbursed — view in Ledger' : 'Owed back — tap to mark repaid'}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '3px',
                              background: settled ? 'var(--success-bg)' : 'var(--warning-bg)',
                              border: `1px solid ${settled ? 'rgb(from var(--success) r g b / 0.3)' : 'rgb(from var(--warning) r g b / 0.35)'}`,
                              color: settled ? 'var(--success)' : 'var(--warning)',
                              borderRadius: '4px',
                              padding: '1px 5px',
                              fontSize: '0.7rem',
                              cursor: 'pointer',
                              flexShrink: 0,
                            }}
                          >
                            <Repeat size={11} />
                            {settled ? 'Reimbursed' : `Owed ${formatCurrency(remaining)}`}
                          </button>
                        );
                      })()}
                      {tx.note && (
                        <>
                          <span style={{ flexShrink: 0, opacity: 0.5 }}>•</span>
                          <span style={{ 
                            wordBreak: 'break-word',
                            overflowWrap: 'anywhere'
                          }}>{tx.note}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="tx-right-col">
                  <span style={{
                    fontWeight: 700,
                    fontSize: '1.125rem',
                    color: tx.type === 'income' ? 'var(--success)' : 'var(--text-main)',
                    whiteSpace: 'nowrap',
                    flexShrink: 0
                  }}>
                    {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                  </span>
                  <div className="flex items-center gap-2" style={{ flexShrink: 0 }}>
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
                      onClick={() => {
                        const rDebt = reimburseDebtFor(tx.id);
                        const hasPayments = rDebt && (Number(rDebt.settled_amount) > 0 || (rDebt.payments && rDebt.payments.length > 0));
                        showConfirm({
                          title: 'Delete Transaction?',
                          message: rDebt
                            ? `This expense has a linked receivable in your Ledger — ${rDebt.person} owes ${formatCurrency(Math.max(Number(rDebt.amount) - Number(rDebt.settled_amount || 0), 0))}.`
                            : 'Are you sure you want to permanently delete this transaction record?',
                          confirmLabel: 'Delete',
                          checkbox: rDebt ? { label: 'Also remove the linked Ledger receivable', defaultValue: !hasPayments } : undefined,
                          onConfirm: (alsoDeleteDebt) => deleteTransaction(tx.id, { alsoDeleteDebt: !!alsoDeleteDebt })
                        });
                      }}
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

      {/* Lightbox Modal */}
      {activeReceiptUrl && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(10px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem'
          }}
          onClick={() => setActiveReceiptUrl(null)}
        >
          <div 
            style={{
              position: 'relative',
              maxWidth: '90%',
              maxHeight: '90%',
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-lg)',
              padding: '1.5rem 1rem 1rem 1rem',
              boxShadow: 'var(--shadow-lg)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center'
            }}
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setActiveReceiptUrl(null)}
              style={{
                position: 'absolute',
                top: '8px',
                right: '8px',
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer'
              }}
            >
              <X size={20} />
            </button>
            <img 
              src={activeReceiptUrl} 
              alt="Receipt Attachment" 
              style={{
                maxWidth: '100%',
                maxHeight: '75vh',
                objectFit: 'contain',
                borderRadius: 'var(--radius-md)',
                marginTop: '0.5rem'
              }} 
            />
            <div style={{ marginTop: '1rem', width: '100%', display: 'flex', justifyContent: 'center' }}>
              <a 
                href={activeReceiptUrl} 
                target="_blank" 
                rel="noreferrer"
                style={{
                  padding: '0.5rem 1rem',
                  fontSize: '0.85rem',
                  backgroundColor: 'var(--primary)',
                  color: 'white',
                  borderRadius: 'var(--radius-md)',
                  fontWeight: 600,
                  textDecoration: 'none',
                  textAlign: 'center'
                }}
              >
                Open in New Tab
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecentTransactions;
