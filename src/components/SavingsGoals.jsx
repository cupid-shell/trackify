import { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { Plus, Trash2, Calendar, Target, PlusCircle, MinusCircle, PiggyBank } from 'lucide-react';
import { format, parseISO } from 'date-fns';

const SavingsGoals = () => {
  const { userSettings, addSavingsGoal, deleteSavingsGoal, updateSavingsGoalProgress, showToast, showConfirm, formatCurrency } = useAppContext();
  const goals = userSettings.savings_goals || [];

  const [showAddForm, setShowAddForm] = useState(false);
  const [goalName, setGoalName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('0');
  const [targetDate, setTargetDate] = useState('');
  const [selectedColor, setSelectedColor] = useState('#6366f1');

  // Local state for contributions per goal
  const [contribAmounts, setContribAmounts] = useState({});

  const colors = [
    { value: '#6366f1', label: 'Indigo' },
    { value: '#10b981', label: 'Emerald' },
    { value: '#f43f5e', label: 'Rose' },
    { value: '#06b6d4', label: 'Cyan' },
    { value: '#f59e0b', label: 'Amber' },
    { value: '#a855f7', label: 'Purple' }
  ];

  const handleAddGoal = async (e) => {
    e.preventDefault();
    if (!goalName.trim() || !targetAmount || isNaN(targetAmount) || Number(targetAmount) <= 0) {
      showToast('Please fill in all details with valid numbers.', 'warning');
      return;
    }

    const newGoal = {
      id: Date.now().toString(),
      name: goalName.trim(),
      target_amount: Number(targetAmount),
      current_amount: Number(currentAmount) || 0,
      target_date: targetDate || format(new Date(), 'yyyy-MM-dd'),
      color: selectedColor
    };

    await addSavingsGoal(newGoal);

    // Reset form
    setGoalName('');
    setTargetAmount('');
    setCurrentAmount('0');
    setTargetDate('');
    setSelectedColor('#6366f1');
    setShowAddForm(false);
  };

  const handleContribution = async (goalId, isContribution) => {
    const amount = Number(contribAmounts[goalId]);
    if (isNaN(amount) || amount <= 0) {
      showToast('Please enter a valid amount.', 'warning');
      return;
    }

    await updateSavingsGoalProgress(goalId, amount, isContribution);
    
    // Clear contribution input
    setContribAmounts(prev => ({ ...prev, [goalId]: '' }));
  };

  const handleInputChange = (goalId, value) => {
    setContribAmounts(prev => ({ ...prev, [goalId]: value }));
  };

  return (
    <div className="glass-card flex-col gap-0" style={{ height: '100%' }}>
      {/* Header — pinned */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid var(--border-color)',
        paddingBottom: '0.75rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <PiggyBank size={20} style={{ color: 'var(--primary)' }} />
          <div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600 }}>Savings Goals</h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Target savings tracking</span>
          </div>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          style={{
            padding: '0.4rem 0.8rem',
            fontSize: '0.75rem',
            backgroundColor: showAddForm ? 'var(--bg-input)' : 'var(--primary)',
            color: 'white',
            borderRadius: 'var(--radius-sm)',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem'
          }}
        >
          {showAddForm ? 'Cancel' : <><Plus size={14} /> Add Goal</>}
        </button>
      </div>

      {/* Scrollable body: form + goals list */}
      <div className="ac-card-body" style={{ paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem', fontVariantNumeric: 'tabular-nums' }}>

      {showAddForm && (
        <form onSubmit={handleAddGoal} className="flex-col gap-3" style={{
          padding: '1rem',
          backgroundColor: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
        }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Goal Name</label>
            <input
              type="text"
              placeholder="e.g. Emergency Fund"
              value={goalName}
              onChange={e => setGoalName(e.target.value)}
              required
              style={{ padding: '0.5rem', fontSize: '0.875rem' }}
            />
          </div>

          <div className="flex gap-2">
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Target Amount (BDT)</label>
              <input
                type="number"
                placeholder="10000"
                value={targetAmount}
                onChange={e => setTargetAmount(e.target.value)}
                required
                style={{ padding: '0.5rem', fontSize: '0.875rem' }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Starting Amount</label>
              <input
                type="number"
                placeholder="0"
                value={currentAmount}
                onChange={e => setCurrentAmount(e.target.value)}
                style={{ padding: '0.5rem', fontSize: '0.875rem' }}
              />
            </div>
          </div>

          <div className="flex gap-2">
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Target Date</label>
              <input
                type="date"
                value={targetDate}
                onChange={e => setTargetDate(e.target.value)}
                style={{ padding: '0.5rem', fontSize: '0.875rem' }}
              />
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Color Theme</label>
              <div className="flex gap-1" style={{ flex: 1, alignItems: 'center' }}>
                {colors.map(c => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setSelectedColor(c.value)}
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: 'var(--radius-full)',
                      backgroundColor: c.value,
                      border: selectedColor === c.value ? '2px solid white' : '1px solid transparent',
                      padding: 0
                    }}
                    title={c.label}
                  />
                ))}
              </div>
            </div>
          </div>

          <button
            type="submit"
            style={{
              padding: '0.6rem 1rem',
              backgroundColor: 'var(--primary)',
              color: 'white',
              borderRadius: 'var(--radius-md)',
              fontWeight: 600,
              fontSize: '0.875rem',
              marginTop: '0.5rem'
            }}
          >
            Create Savings Goal
          </button>
        </form>
      )}

      {goals.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--text-muted)' }}>
          <p style={{ fontSize: '0.875rem' }}>No savings goals created yet. Plan your next milestone!</p>
        </div>
      ) : (
        <div className="flex-col gap-4">
          {goals.map(goal => {
            const current = Number(goal.current_amount || 0);
            const target = Number(goal.target_amount || 1);
            const percent = Math.min(100, Math.round((current / target) * 100));

            // Circular Progress setup
            const radius = 32;
            const stroke = 6;
            const circumference = 2 * Math.PI * radius;
            const strokeDashoffset = circumference - (percent / 100) * circumference;

            let formattedDate = '';
            if (goal.target_date) {
              try {
                formattedDate = format(parseISO(goal.target_date), 'MMM dd, yyyy');
              } catch {
                formattedDate = goal.target_date;
              }
            }

            return (
              <div
                key={goal.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  padding: '1rem',
                  backgroundColor: 'var(--bg-input)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-color)',
                  flexWrap: 'wrap',
                  transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.2s ease, box-shadow 0.2s ease',
                  cursor: 'default',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.borderColor = 'var(--border-color)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                {/* SVG Progress Ring */}
                <div className="relative-container" style={{ width: '76px', height: '76px', flexShrink: 0 }}>
                  <svg width="76" height="76" style={{ transform: 'rotate(-90deg)' }}>
                    <circle
                      stroke="rgba(255, 255, 255, 0.05)"
                      fill="transparent"
                      strokeWidth={stroke}
                      r={radius}
                      cx="38"
                      cy="38"
                    />
                    <circle
                      stroke={goal.color || '#6366f1'}
                      fill="transparent"
                      strokeWidth={stroke}
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeDashoffset}
                      strokeLinecap="round"
                      r={radius}
                      cx="38"
                      cy="38"
                      style={{
                        transition: 'stroke-dashoffset 0.35s',
                        filter: `drop-shadow(0 0 3px ${goal.color || '#6366f1'}77)`
                      }}
                    />
                  </svg>
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.8rem',
                    fontWeight: 700
                  }}>
                    {percent}%
                  </div>
                </div>

                {/* Info and Progress detail */}
                <div style={{ flex: '1 1 200px', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'between' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>{goal.name}</span>
                    <button
                      onClick={() => {
                        showConfirm({
                          title: 'Delete Savings Goal?',
                          message: `Are you sure you want to delete the goal "${goal.name}"?`,
                          confirmLabel: 'Delete',
                          onConfirm: () => deleteSavingsGoal(goal.id)
                        });
                      }}
                      style={{ color: 'var(--text-muted)', padding: '2px' }}
                      onMouseOver={e => e.currentTarget.style.color = 'var(--danger)'}
                      onMouseOut={e => e.currentTarget.style.color = 'var(--text-muted)'}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  
                  <div className="flex gap-4" style={{ fontSize: '0.75rem', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Target size={12} />
                      Target: {formatCurrency(target)}
                    </span>
                    {formattedDate && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Calendar size={12} />
                        By: {formattedDate}
                      </span>
                    )}
                  </div>
                  
                  <span style={{ fontSize: '0.85rem', fontWeight: 500, marginTop: '0.25rem' }}>
                    Saved: {formatCurrency(current)}
                  </span>
                </div>

                {/* Contribute Form */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  width: '100%',
                  marginTop: '0.5rem',
                  borderTop: '1px solid rgba(255,255,255,0.05)',
                  paddingTop: '0.5rem',
                  justifyContent: 'flex-end'
                }}>
                  <input
                    type="number"
                    placeholder="Amount"
                    value={contribAmounts[goal.id] || ''}
                    onChange={e => handleInputChange(goal.id, e.target.value)}
                    style={{
                      width: '90px',
                      padding: '0.35rem 0.5rem',
                      fontSize: '0.8rem',
                      borderRadius: 'var(--radius-sm)'
                    }}
                  />
                  <button
                    onClick={() => handleContribution(goal.id, true)}
                    style={{
                      padding: '0.35rem 0.6rem',
                      backgroundColor: 'var(--success-bg)',
                      color: 'var(--success)',
                      borderRadius: 'var(--radius-sm)',
                      fontWeight: 600,
                      fontSize: '0.75rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem'
                    }}
                  >
                    <PlusCircle size={14} /> Save
                  </button>
                  <button
                    onClick={() => handleContribution(goal.id, false)}
                    style={{
                      padding: '0.35rem 0.6rem',
                      backgroundColor: 'var(--danger-bg)',
                      color: 'var(--danger)',
                      borderRadius: 'var(--radius-sm)',
                      fontWeight: 600,
                      fontSize: '0.75rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem'
                    }}
                  >
                    <MinusCircle size={14} /> Draw
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
      </div>{/* end ac-card-body */}
    </div>
  );
};

export default SavingsGoals;
