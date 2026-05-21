import React from 'react';
import { useAppContext } from '../context/AppContext';
import { CheckCircle, AlertCircle, Calendar, PlusCircle, CreditCard } from 'lucide-react';
import { format } from 'date-fns';

const RecurringTracker = () => {
  const { recurringBills, currentMonthTransactions, addTransaction } = useAppContext();

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
    // Log the transaction
    addTransaction({
      type: 'expense',
      amount: Number(bill.amount),
      category: bill.category,
      note: `[Recurring] ${bill.name}`,
      date: new Date().toISOString().split('T')[0],
      payment_method: bill.payment || 'Cash'
    });
    alert(`Logged payment for: ${bill.name}!`);
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

  const paidCount = recurringBills.filter(bill => getPaidTransaction(bill)).length;
  const totalCount = recurringBills.length;
  const allPaid = paidCount === totalCount;

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
          backgroundColor: allPaid ? 'rgba(16, 185, 129, 0.15)' : 'rgba(99, 102, 241, 0.15)',
          color: allPaid ? 'var(--success)' : 'var(--primary)'
        }}>
          {paidCount} / {totalCount} Paid
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.75rem' }}>
        {recurringBills.map((bill, idx) => {
          const paidTx = getPaidTransaction(bill);
          const isPaid = !!paidTx;

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
                borderLeft: `4px solid ${isPaid ? 'var(--success)' : 'var(--primary)'}`,
                gap: '1rem',
                flexWrap: 'wrap'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: '200px' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: isPaid ? 'rgba(16, 185, 129, 0.1)' : 'rgba(99, 102, 241, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: isPaid ? 'var(--success)' : 'var(--primary)',
                  flexShrink: 0
                }}>
                  {isPaid ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
                </div>
                <div className="flex-col" style={{ gap: '0.15rem' }}>
                  <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{bill.name}</span>
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
                ) : (
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
