import { useAppContext } from '../context/AppContext';
import { CheckCircle, AlertCircle, Calendar, MinusCircle } from 'lucide-react';
import { format } from 'date-fns';

const RecurringTracker = () => {
  const { 
    recurringBills, 
    currentMonthTransactions, 
    addTransaction,
    selectedMonth,
    selectedYear,
    skippedBills,
    skipBillForMonth,
    unskipBillForMonth,
    showToast
  } = useAppContext();

  // Helper to check if a bill is paid in the currently selected month
  const getPaidTransaction = (bill) => {
    const billNameLower = bill.name.toLowerCase();
    return currentMonthTransactions.find(tx => 
      tx.type === 'expense' && 
      (tx.category === bill.category || tx.note?.toLowerCase().includes(billNameLower)) &&
      (tx.note?.toLowerCase().includes(billNameLower) || 
      (tx.note?.toLowerCase().includes('recurring') && Number(tx.amount) === Number(bill.amount)))
    );
  };

  const handlePayBill = (bill) => {
    addTransaction({
      type: 'expense',
      amount: Number(bill.amount),
      category: bill.category,
      note: `[Recurring] ${bill.name}`,
      date: new Date().toISOString().split('T')[0],
      payment_method: bill.payment || 'Cash'
    });
    showToast(`Logged payment for: ${bill.name}!`, 'success');
  };

  const handleSkipBill = (bill) => {
    skipBillForMonth(bill.name, selectedYear, selectedMonth);
  };

  const handleUnskipBill = (bill) => {
    unskipBillForMonth(bill.name, selectedYear, selectedMonth);
  };

  if (recurringBills.length === 0) {
    return (
      <div className="glass-card flex-col gap-3">
        <h3 style={{ fontSize: '1.125rem' }}>Recurring Bills</h3>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
          No recurring bills set up. Configure them in Settings to track your monthly subscriptions.
        </p>
      </div>
    );
  }

  // Filter out skipped bills from progress computations
  const activeBills = recurringBills.filter(bill => {
    const isSkipped = skippedBills.includes(`${selectedYear}-${selectedMonth}-${bill.name}`);
    return !isSkipped;
  });

  const paidCount = activeBills.filter(bill => getPaidTransaction(bill)).length;
  const totalCount = activeBills.length;
  const allPaid = totalCount > 0 && paidCount === totalCount;
  const allSkipped = totalCount === 0 && recurringBills.length > 0;

  return (
    <div className="glass-card flex-col gap-4">
      <div className="flex items-center justify-between" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
        <div className="flex-col" style={{ gap: '0.25rem' }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 600 }}>Recurring Bills</h3>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Track fixed monthly commitments and subscriptions
          </span>
        </div>
        <div style={{
          fontSize: '0.75rem',
          fontWeight: 600,
          padding: '0.25rem 0.6rem',
          borderRadius: 'var(--radius-full)',
          backgroundColor: allPaid ? 'rgba(16, 185, 129, 0.15)' : allSkipped ? 'rgba(148, 163, 184, 0.15)' : 'rgba(99, 102, 241, 0.15)',
          color: allPaid ? 'var(--success)' : allSkipped ? 'var(--text-muted)' : 'var(--primary)'
        }}>
          {allSkipped ? 'All Skipped' : `${paidCount} / ${totalCount} Paid`}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.75rem' }}>
        {recurringBills.map((bill, idx) => {
          const paidTx = getPaidTransaction(bill);
          const isPaid = !!paidTx;
          const isSkipped = skippedBills.includes(`${selectedYear}-${selectedMonth}-${bill.name}`);

          let borderLeftColor = 'var(--primary)';
          let iconColor = 'var(--primary)';
          let iconBg = 'rgba(99, 102, 241, 0.1)';
          let statusIcon = <AlertCircle size={18} />;

          if (isPaid) {
            borderLeftColor = 'var(--success)';
            iconColor = 'var(--success)';
            iconBg = 'rgba(16, 185, 129, 0.1)';
            statusIcon = <CheckCircle size={18} />;
          } else if (isSkipped) {
            borderLeftColor = 'var(--text-muted)';
            iconColor = 'var(--text-muted)';
            iconBg = 'rgba(148, 163, 184, 0.1)';
            statusIcon = <MinusCircle size={18} />;
          }

          return (
            <div 
              key={idx} 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'between',
                padding: '0.75rem', 
                backgroundColor: 'var(--bg-input)', 
                borderRadius: 'var(--radius-md)',
                borderLeft: `4px solid ${borderLeftColor}`,
                gap: '1rem',
                flexWrap: 'wrap',
                opacity: isSkipped ? 0.6 : 1
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: '200px' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: iconBg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: iconColor,
                  flexShrink: 0
                }}>
                  {statusIcon}
                </div>
                <div className="flex-col" style={{ gap: '0.15rem' }}>
                  <span style={{ fontSize: '0.875rem', fontWeight: 600, textDecoration: isSkipped ? 'line-through' : 'none' }}>
                    {bill.name}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Calendar size={12} /> Due on the {bill.dueDate}th • ৳{bill.amount.toLocaleString('en-IN')} via {bill.payment}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3" style={{ marginLeft: 'auto' }}>
                {isPaid ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.1rem' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--success)', fontWeight: 600 }}>Paid</span>
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                      {format(new Date(paidTx.date), 'MMM dd')}
                    </span>
                  </div>
                ) : isSkipped ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Skipped</span>
                    <button 
                      onClick={() => handleUnskipBill(bill)}
                      style={{
                        padding: '0.25rem 0.5rem',
                        fontSize: '0.65rem',
                        fontWeight: 600,
                        backgroundColor: 'var(--bg-hover)',
                        color: 'var(--text-main)',
                        border: '1px solid var(--border-color)',
                        borderRadius: 'var(--radius-sm)',
                        cursor: 'pointer'
                      }}
                    >
                      Restore
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleSkipBill(bill)}
                      style={{
                        padding: '0.4rem 0.6rem',
                        fontSize: '0.75rem',
                        fontWeight: 500,
                        backgroundColor: 'transparent',
                        color: 'var(--text-muted)',
                        border: '1px solid var(--border-color)',
                        borderRadius: 'var(--radius-sm)',
                        cursor: 'pointer',
                        transition: 'var(--transition)'
                      }}
                      onMouseOver={(e) => e.currentTarget.style.color = 'var(--text-main)'}
                      onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                    >
                      Skip
                    </button>
                    <button 
                      onClick={() => handlePayBill(bill)}
                      style={{
                        padding: '0.4rem 0.8rem',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        backgroundColor: 'var(--primary)',
                        color: 'white',
                        borderRadius: 'var(--radius-sm)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        boxShadow: 'var(--shadow-glow)',
                        cursor: 'pointer',
                        transition: 'var(--transition)'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--primary-hover)';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--primary)';
                      }}
                    >
                      Pay Now
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RecurringTracker;
