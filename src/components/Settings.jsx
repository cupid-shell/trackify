import { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { Save, Plus, Trash2, Edit2, X, Check, RotateCcw, Palette, Download, AlertTriangle, DollarSign, Zap, Calendar, List, Bell, Sliders } from 'lucide-react';
import { format } from 'date-fns';
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import CategoryIcon from './CategoryIcon';
import Header from './Header';
import Footer from './Footer';

const SettingsPage = () => {
  const { 
    userSettings, 
    updateSettings, 
    renameCategory, 
    transactions, 
    presets, 
    recurringBills, 
    updateCategoryMetadata,
    getCategoryStyle,
    rescheduleNotifications,
    showToast
  } = useAppContext();

  const [activeTab, setActiveTab] = useState(0);

  const tabs = [
    { label: 'Financials', icon: <DollarSign size={18} /> },
    { label: 'Quick Presets', icon: <Zap size={18} /> },
    { label: 'Recurring Bills', icon: <Calendar size={18} /> },
    { label: 'Categories & Budgets', icon: <List size={18} /> },
    { label: 'Notifications', icon: <Bell size={18} /> },
    { label: 'Theme & Backup', icon: <Sliders size={18} /> }
  ];

  // Notification Preferences State (from localStorage)
  const [dailyReminder, setDailyReminder] = useState(
    localStorage.getItem('trackify_daily_reminder') !== 'false'
  );
  const [dailyReminderTime, setDailyReminderTime] = useState(
    localStorage.getItem('trackify_daily_reminder_time') || '21:30'
  );
  const [weeklyDigest, setWeeklyDigest] = useState(
    localStorage.getItem('trackify_weekly_digest') !== 'false'
  );
  const [weeklyDigestDay, setWeeklyDigestDay] = useState(
    localStorage.getItem('trackify_weekly_digest_day') || 'Saturday'
  );
  const [budgetAlerts, setBudgetAlerts] = useState(
    localStorage.getItem('trackify_budget_alerts') !== 'false'
  );
  const [budgetThreshold, setBudgetThreshold] = useState(
    localStorage.getItem('trackify_budget_threshold') || '85'
  );
  const [savingsMilestones, setSavingsMilestones] = useState(
    localStorage.getItem('trackify_savings_milestones') !== 'false'
  );
  const [billReminders, setBillReminders] = useState(
    localStorage.getItem('trackify_bill_reminders') !== 'false'
  );
  const [spendSpikeAlerts, setSpendSpikeAlerts] = useState(
    localStorage.getItem('trackify_spend_spike_alerts') !== 'false'
  );
  const [monthlyReview, setMonthlyReview] = useState(
    localStorage.getItem('trackify_monthly_review') !== 'false'
  );
  const [zeroSpendStreak, setZeroSpendStreak] = useState(
    localStorage.getItem('trackify_zero_spend_streak') !== 'false'
  );
  const [budgetExhaustion, setBudgetExhaustion] = useState(
    localStorage.getItem('trackify_budget_exhaustion') !== 'false'
  );
  const [weeklySavingsMotivation, setWeeklySavingsMotivation] = useState(
    localStorage.getItem('trackify_weekly_savings_motivation') !== 'false'
  );
  
  const [permissionStatus, setPermissionStatus] = useState('granted');

  useEffect(() => {
    const checkPerms = async () => {
      if (Capacitor.isNativePlatform()) {
        try {
          const status = await LocalNotifications.checkPermissions();
          setPermissionStatus(status.display);
        } catch (e) {
          console.error('Error checking notification permissions:', e);
        }
      }
    };
    checkPerms();
  }, []);

  const [baseIncome, setBaseIncome] = useState(userSettings.base_income);
  const [savingsGoal, setSavingsGoal] = useState(userSettings.savings_goal);
  const [expenseCategories, setExpenseCategories] = useState(userSettings.expense_categories || []);
  const [incomeCategories, setIncomeCategories] = useState(userSettings.income_categories || []);
  const [categoryBudgets, setCategoryBudgets] = useState(userSettings.category_budgets || {});
  const [newExpenseCat, setNewExpenseCat] = useState('');
  const [newIncomeCat, setNewIncomeCat] = useState('');
  
  const [editingExpenseCat, setEditingExpenseCat] = useState(null);
  const [editExpenseCatName, setEditExpenseCatName] = useState('');
  
  const [editingIncomeCat, setEditingIncomeCat] = useState(null);
  const [editIncomeCatName, setEditIncomeCatName] = useState('');
  
  const [saving, setSaving] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState(localStorage.getItem('trackify_theme') || 'indigo');

  const [activeCustomizeCat, setActiveCustomizeCat] = useState(null);
  const [customEmojiInput, setCustomEmojiInput] = useState('');

  const [localPresets, setLocalPresets] = useState(presets);
  const [newPresetLabel, setNewPresetLabel] = useState('');
  const [newPresetAmount, setNewPresetAmount] = useState('');
  const [newPresetCategory, setNewPresetCategory] = useState('');
  const [newPresetNote, setNewPresetNote] = useState('');
  const [newPresetPayment, setNewPresetPayment] = useState('Cash');

  const [localRecurringBills, setLocalRecurringBills] = useState(recurringBills);
  const [newBillName, setNewBillName] = useState('');
  const [newBillAmount, setNewBillAmount] = useState('');
  const [newBillCategory, setNewBillCategory] = useState('');
  const [newBillDueDate, setNewBillDueDate] = useState('');
  const [newBillPayment, setNewBillPayment] = useState('Cash');

  useEffect(() => {
    setTimeout(() => {
      if (expenseCategories.length > 0 && !newPresetCategory) {
        setNewPresetCategory(expenseCategories[0]);
      }
      if (expenseCategories.length > 0 && !newBillCategory) {
        setNewBillCategory(expenseCategories[0]);
      }
    }, 0);
  }, [expenseCategories, newPresetCategory, newBillCategory]);

  useEffect(() => {
    setTimeout(() => {
      setLocalPresets(presets);
    }, 0);
  }, [presets]);

  useEffect(() => {
    setTimeout(() => {
      setLocalRecurringBills(recurringBills);
    }, 0);
  }, [recurringBills]);

  const addPreset = () => {
    if (!newPresetLabel.trim() || !newPresetAmount || isNaN(newPresetAmount)) return;
    const newPreset = {
      label: newPresetLabel.trim(),
      amount: Number(newPresetAmount),
      category: newPresetCategory || expenseCategories[0] || 'Other / Unexpected',
      note: newPresetNote.trim() || '',
      payment: newPresetPayment
    };
    setLocalPresets(prev => [...prev, newPreset]);
    setNewPresetLabel('');
    setNewPresetAmount('');
    setNewPresetNote('');
  };

  const removePreset = (idx) => {
    setLocalPresets(prev => prev.filter((_, i) => i !== idx));
  };

  const addRecurringBill = () => {
    if (!newBillName.trim() || !newBillAmount || isNaN(newBillAmount) || !newBillDueDate || isNaN(newBillDueDate)) return;
    const newBill = {
      name: newBillName.trim(),
      amount: Number(newBillAmount),
      category: newBillCategory || expenseCategories[0] || 'Other / Unexpected',
      dueDate: Number(newBillDueDate),
      payment: newBillPayment
    };
    setLocalRecurringBills(prev => [...prev, newBill]);
    setNewBillName('');
    setNewBillAmount('');
    setNewBillDueDate('');
  };

  const removeRecurringBill = (idx) => {
    setLocalRecurringBills(prev => prev.filter((_, i) => i !== idx));
  };

  const handleExportAllTimeCSV = () => {
    if (transactions.length === 0) return;

    const headers = ['Date', 'Type', 'Category', 'Payment Method', 'Amount (BDT)', 'Note'];
    const sortedAllTime = [...transactions].sort((a, b) => new Date(a.date) - new Date(b.date));
    
    const csvRows = sortedAllTime.map(tx => {
      const formattedDate = format(new Date(tx.date), 'yyyy-MM-dd');
      const escapedNote = tx.note ? `"${tx.note.replace(/"/g, '""')}"` : '';
      return [formattedDate, tx.type, tx.category, tx.payment_method || 'Cash', tx.amount, escapedNote].join(',');
    });

    const csvContent = [headers.join(','), ...csvRows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `trackify_all_time_backup_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const themes = [
    { name: 'indigo', label: 'Indigo', color: '#6366f1', hover: '#4f46e5', glow: 'rgba(99, 102, 241, 0.4)' },
    { name: 'emerald', label: 'Emerald', color: '#10b981', hover: '#059669', glow: 'rgba(16, 185, 129, 0.4)' },
    { name: 'rose', label: 'Rose', color: '#f43f5e', hover: '#e11d48', glow: 'rgba(244, 63, 94, 0.4)' },
    { name: 'cyan', label: 'Cyan', color: '#06b6d4', hover: '#0891b2', glow: 'rgba(6, 182, 212, 0.4)' },
    { name: 'amber', label: 'Amber', color: '#f59e0b', hover: '#d97706', glow: 'rgba(245, 158, 11, 0.4)' }
  ];

  const handleThemeChange = (themeName) => {
    setSelectedTheme(themeName);
    localStorage.setItem('trackify_theme', themeName);
    const theme = themes.find(t => t.name === themeName);
    if (theme) {
      document.documentElement.style.setProperty('--primary', theme.color);
      document.documentElement.style.setProperty('--primary-hover', theme.hover);
      document.documentElement.style.setProperty('--primary-glow', theme.glow);
    }
  };

  const handleResetDefaults = () => {
    if (window.confirm('Are you sure you want to reset all settings to defaults? This will reset base income, savings goals, categories, and category budgets. (Your transactions list will NOT be deleted)')) {
      setBaseIncome(15000);
      setSavingsGoal(3000);
      setExpenseCategories(["Rent", "Utilities & Bills", "Food & Dining", "Transport", "Daily Living", "Education", "Other / Unexpected"]);
      setIncomeCategories(["Allowance", "Bonus", "Other"]);
      setCategoryBudgets({
        "Rent": 3000,
        "Transport": 500,
        "Utilities & Bills": 850,
        "Food & Dining": 3500,
        "Daily Living": 3000
      });
      setLocalPresets([
        { label: '৳15 Bus', amount: 15, category: 'Transport', note: 'Bus fare', payment: 'Cash' },
        { label: '৳50 Snack', amount: 50, category: 'Food & Dining', note: 'Snacks', payment: 'Cash' },
        { label: '৳120 Lunch', amount: 120, category: 'Food & Dining', note: 'Lunch', payment: 'Cash' },
        { label: '৳100 Mobile', amount: 100, category: 'Utilities & Bills', note: 'Mobile recharge', payment: 'bKash' }
      ]);
      setLocalRecurringBills([
        { name: 'Home WiFi Bill', amount: 525, category: 'Utilities & Bills', dueDate: 20, payment: 'bKash' },
        { name: 'Seat Rent', amount: 3000, category: 'Rent', dueDate: 5, payment: 'Cash' }
      ]);
      showToast('Settings reset to defaults. Click "Save All Settings" to commit the changes.', 'info');
    }
  };

  useEffect(() => {
    setTimeout(() => {
      setBaseIncome(userSettings.base_income);
      setSavingsGoal(userSettings.savings_goal);
      setExpenseCategories(userSettings.expense_categories || []);
      setIncomeCategories(userSettings.income_categories || []);
      setCategoryBudgets(userSettings.category_budgets || {});
    }, 0);
  }, [userSettings]);

  const handleSave = async () => {
    setSaving(true);
    
    let finalExpenseCats = [...expenseCategories];
    if (newExpenseCat.trim() && !finalExpenseCats.includes(newExpenseCat.trim())) {
      finalExpenseCats.push(newExpenseCat.trim());
      setNewExpenseCat('');
    }

    let finalIncomeCats = [...incomeCategories];
    if (newIncomeCat.trim() && !finalIncomeCats.includes(newIncomeCat.trim())) {
      finalIncomeCats.push(newIncomeCat.trim());
      setNewIncomeCat('');
    }

    // Clean up category budgets for deleted categories
    const cleanedBudgets = { ...categoryBudgets };
    Object.keys(cleanedBudgets).forEach(cat => {
      if (!finalExpenseCats.includes(cat)) {
        delete cleanedBudgets[cat];
      }
    });

    await updateSettings({
      base_income: Number(baseIncome),
      savings_goal: Number(savingsGoal),
      expense_categories: finalExpenseCats,
      income_categories: finalIncomeCats,
      category_budgets: cleanedBudgets,
      presets: localPresets,
      recurring_bills: localRecurringBills,
      notification_preferences: {
        daily_reminder: dailyReminder,
        daily_reminder_time: dailyReminderTime,
        weekly_digest: weeklyDigest,
        weekly_digest_day: weeklyDigestDay,
        budget_alerts: budgetAlerts,
        budget_threshold: budgetThreshold,
        savings_milestones: savingsMilestones,
        bill_reminders: billReminders,
        spend_spike_alerts: spendSpikeAlerts,
        monthly_review: monthlyReview,
        zero_spend_streak: zeroSpendStreak,
        budget_exhaustion: budgetExhaustion,
        weekly_savings_motivation: weeklySavingsMotivation
      }
    });
    
    if (rescheduleNotifications) {
      await rescheduleNotifications();
    }

    setSaving(false);
    showToast('Settings saved successfully!', 'success');
  };

  const addExpenseCat = () => {
    if (newExpenseCat.trim() && !expenseCategories.includes(newExpenseCat.trim())) {
      setExpenseCategories([...expenseCategories, newExpenseCat.trim()]);
      setNewExpenseCat('');
    }
  };

  const removeExpenseCat = (cat) => {
    setExpenseCategories(expenseCategories.filter(c => c !== cat));
  };

  const addIncomeCat = () => {
    if (newIncomeCat.trim() && !incomeCategories.includes(newIncomeCat.trim())) {
      setIncomeCategories([...incomeCategories, newIncomeCat.trim()]);
      setNewIncomeCat('');
    }
  };

  const removeIncomeCat = (cat) => {
    setIncomeCategories(incomeCategories.filter(c => c !== cat));
  };

  const handleRenameExpense = async (oldName) => {
    if (editExpenseCatName.trim() && editExpenseCatName.trim() !== oldName) {
      await renameCategory(oldName, editExpenseCatName.trim(), 'expense');
    }
    setEditingExpenseCat(null);
  };

  const handleRenameIncome = async (oldName) => {
    if (editIncomeCatName.trim() && editIncomeCatName.trim() !== oldName) {
      await renameCategory(oldName, editIncomeCatName.trim(), 'income');
    }
    setEditingIncomeCat(null);
  };

  return (
    <>
      <Header />
      <main className="container animate-fade-in" style={{ flex: 1 }}>
        <div className="animate-fade-in stagger-1" style={{ marginBottom: '2rem', textAlign: 'center' }}>
          <h2 style={{ fontSize: '1.875rem', marginBottom: '0.5rem' }}>Settings</h2>
          <p>Customize your tracking experience.</p>
        </div>

        <div className="settings-layout animate-fade-in stagger-2">
          {/* Sidebar Tabs */}
          <aside className="settings-sidebar">
            {tabs.map((tab, idx) => (
              <button
                key={idx}
                onClick={() => setActiveTab(idx)}
                className={`settings-tab-btn ${activeTab === idx ? 'active' : ''}`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </aside>

          {/* Active Tab Panel */}
          <div className="settings-content flex-col gap-6" style={{ flex: 1, minWidth: 0 }}>
            
            {/* Tab 0: Financials */}
            {activeTab === 0 && (
              <div className="glass-card flex-col gap-4">
                <h3 style={{ fontSize: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Financial Goals</h3>
                
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Base Monthly Income (BDT)</label>
                  <input 
                    type="number" 
                    value={baseIncome} 
                    onChange={(e) => setBaseIncome(e.target.value)}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Monthly Savings Goal (BDT)</label>
                  <input 
                    type="number" 
                    value={savingsGoal} 
                    onChange={(e) => setSavingsGoal(e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* Tab 1: Quick Presets */}
            {activeTab === 1 && (
              <div className="glass-card flex-col gap-4">
                <h3 style={{ fontSize: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Quick Presets (One-Tap Log)</h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Configure your one-tap expense logging presets shown on the transaction form.</p>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {localPresets.map((preset, idx) => (
                    <div key={idx} className="flex items-center justify-between" style={{ padding: '0.75rem', backgroundColor: 'var(--bg-input)', borderRadius: 'var(--radius-md)', gap: '0.5rem' }}>
                      <div className="flex-col" style={{ gap: '0.25rem' }}>
                        <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{preset.label}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          ৳{preset.amount} • {preset.category} • {preset.payment} {preset.note ? `• ${preset.note}` : ''}
                        </span>
                      </div>
                      <button 
                        onClick={() => removePreset(idx)} 
                        style={{ 
                          color: 'var(--danger)', 
                          padding: '0.5rem', 
                          backgroundColor: 'var(--danger-bg)', 
                          border: '1px solid rgba(255, 123, 114, 0.2)', 
                          borderRadius: 'var(--radius-md)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer'
                        }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.75rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem', marginTop: '0.5rem' }}>
                  <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>Add New Preset</span>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
                    <div className="flex-col" style={{ gap: '0.25rem' }}>
                      <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Preset Label</label>
                      <input 
                        type="text" 
                        placeholder="e.g. ৳15 Bus" 
                        value={newPresetLabel}
                        onChange={(e) => setNewPresetLabel(e.target.value)}
                      />
                    </div>
                    <div className="flex-col" style={{ gap: '0.25rem' }}>
                      <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Amount (BDT)</label>
                      <input 
                        type="number" 
                        placeholder="e.g. 15" 
                        value={newPresetAmount}
                        onChange={(e) => setNewPresetAmount(e.target.value)}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem' }}>
                    <div className="flex-col" style={{ gap: '0.25rem' }}>
                      <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Category</label>
                      <select 
                        value={newPresetCategory} 
                        onChange={(e) => setNewPresetCategory(e.target.value)}
                      >
                        {expenseCategories.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex-col" style={{ gap: '0.25rem' }}>
                      <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Payment Method</label>
                      <select 
                        value={newPresetPayment} 
                        onChange={(e) => setNewPresetPayment(e.target.value)}
                      >
                        <option value="Cash">Cash</option>
                        <option value="bKash">bKash</option>
                        <option value="Bank">Bank</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex-col" style={{ gap: '0.25rem' }}>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Note (Optional)</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Bus fare" 
                      value={newPresetNote}
                      onChange={(e) => setNewPresetNote(e.target.value)}
                    />
                  </div>

                  <div className="flex justify-end" style={{ marginTop: '0.5rem' }}>
                    <button 
                      onClick={addPreset} 
                      style={{ 
                        padding: '0.75rem 1.25rem', 
                        backgroundColor: 'var(--primary)', 
                        color: 'white', 
                        borderRadius: 'var(--radius-md)',
                        fontWeight: 600,
                        fontSize: '0.875rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        boxShadow: 'var(--shadow-glow)',
                        cursor: 'pointer'
                      }}
                    >
                      <Plus size={16} /> Add Preset
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: Recurring Bills */}
            {activeTab === 2 && (
              <div className="glass-card flex-col gap-4">
                <h3 style={{ fontSize: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Recurring Bills & Subscriptions</h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Configure your monthly subscriptions and recurring bills.</p>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {localRecurringBills.map((bill, idx) => (
                    <div key={idx} className="flex items-center justify-between" style={{ padding: '0.75rem', backgroundColor: 'var(--bg-input)', borderRadius: 'var(--radius-md)', gap: '0.5rem' }}>
                      <div className="flex-col" style={{ gap: '0.25rem' }}>
                        <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{bill.name}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          ৳{bill.amount} • {bill.category} • Due on {bill.dueDate}th • {bill.payment}
                        </span>
                      </div>
                      <button 
                        onClick={() => removeRecurringBill(idx)} 
                        style={{ 
                          color: 'var(--danger)', 
                          padding: '0.5rem', 
                          backgroundColor: 'var(--danger-bg)', 
                          border: '1px solid rgba(255, 123, 114, 0.2)', 
                          borderRadius: 'var(--radius-md)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer'
                        }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.75rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem', marginTop: '0.5rem' }}>
                  <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>Add New Recurring Bill</span>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
                    <div className="flex-col" style={{ gap: '0.25rem' }}>
                      <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Bill Name</label>
                      <input 
                        type="text" 
                        placeholder="e.g. Netflix" 
                        value={newBillName}
                        onChange={(e) => setNewBillName(e.target.value)}
                      />
                    </div>
                    <div className="flex-col" style={{ gap: '0.25rem' }}>
                      <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Amount (BDT)</label>
                      <input 
                        type="number" 
                        placeholder="e.g. 525" 
                        value={newBillAmount}
                        onChange={(e) => setNewBillAmount(e.target.value)}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem' }}>
                    <div className="flex-col" style={{ gap: '0.25rem' }}>
                      <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Category</label>
                      <select 
                        value={newBillCategory} 
                        onChange={(e) => setNewBillCategory(e.target.value)}
                      >
                        {expenseCategories.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex-col" style={{ gap: '0.25rem' }}>
                      <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Due Day (1-31)</label>
                      <input 
                        type="number" 
                        placeholder="e.g. 20" 
                        value={newBillDueDate}
                        min="1"
                        max="31"
                        onChange={(e) => setNewBillDueDate(e.target.value)}
                      />
                    </div>
                    <div className="flex-col" style={{ gap: '0.25rem' }}>
                      <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Payment Method</label>
                      <select 
                        value={newBillPayment} 
                        onChange={(e) => setNewBillPayment(e.target.value)}
                      >
                        <option value="Cash">Cash</option>
                        <option value="bKash">bKash</option>
                        <option value="Bank">Bank</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end" style={{ marginTop: '0.5rem' }}>
                    <button 
                      onClick={addRecurringBill} 
                      style={{ 
                        padding: '0.75rem 1.25rem', 
                        backgroundColor: 'var(--primary)', 
                        color: 'white', 
                        borderRadius: 'var(--radius-md)',
                        fontWeight: 600,
                        fontSize: '0.875rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        boxShadow: 'var(--shadow-glow)',
                        cursor: 'pointer'
                      }}
                    >
                      <Plus size={16} /> Add Bill
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 3: Categories & Budgets */}
            {activeTab === 3 && (
              <div className="flex-col gap-6">
                
                {/* Expense Categories */}
                <div className="glass-card flex-col gap-4">
                  <h3 style={{ fontSize: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Expense Categories</h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', width: '100%' }}>
                    {expenseCategories.map(cat => (
                      <div key={cat} style={{ 
                        display: 'flex', alignItems: 'center', gap: '0.5rem', 
                        backgroundColor: 'var(--bg-input)', padding: '0.5rem 0.75rem', 
                        borderRadius: 'var(--radius-md)',
                        maxWidth: '100%',
                        flexShrink: 0
                      }}>
                        {editingExpenseCat === cat ? (
                          <div className="flex gap-2 items-center">
                            <input 
                              type="text" 
                              value={editExpenseCatName} 
                              onChange={e => setEditExpenseCatName(e.target.value)}
                              onKeyPress={e => e.key === 'Enter' && handleRenameExpense(cat)}
                              style={{ padding: '0.25rem 0.5rem', width: '120px' }}
                              autoFocus
                            />
                            <button onClick={() => handleRenameExpense(cat)} style={{ color: 'var(--success)', cursor: 'pointer' }}><Check size={16}/></button>
                            <button onClick={() => setEditingExpenseCat(null)} style={{ color: 'var(--text-muted)', cursor: 'pointer' }}><X size={16}/></button>
                          </div>
                        ) : (
                          <>
                            <span style={{ fontSize: '0.875rem', wordBreak: 'break-word' }}>{cat}</span>
                            <button onClick={() => { setEditingExpenseCat(cat); setEditExpenseCatName(cat); }} style={{ color: 'var(--primary)', flexShrink: 0, marginLeft: 'auto', cursor: 'pointer' }}><Edit2 size={14}/></button>
                            <button onClick={() => removeExpenseCat(cat)} style={{ color: 'var(--danger)', flexShrink: 0, cursor: 'pointer' }}><Trash2 size={14}/></button>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="New Expense Category" 
                      value={newExpenseCat}
                      onChange={(e) => setNewExpenseCat(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addExpenseCat()}
                    />
                    <button onClick={addExpenseCat} style={{ padding: '0.75rem', backgroundColor: 'var(--bg-input)', borderRadius: 'var(--radius-md)', cursor: 'pointer' }}>
                      <Plus size={20} />
                    </button>
                  </div>
                </div>

                {/* Income Categories */}
                <div className="glass-card flex-col gap-4">
                  <h3 style={{ fontSize: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Income Categories</h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', width: '100%' }}>
                    {incomeCategories.map(cat => (
                      <div key={cat} style={{ 
                        display: 'flex', alignItems: 'center', gap: '0.5rem', 
                        backgroundColor: 'var(--bg-input)', padding: '0.5rem 0.75rem', 
                        borderRadius: 'var(--radius-md)',
                        maxWidth: '100%',
                        flexShrink: 0
                      }}>
                        {editingIncomeCat === cat ? (
                          <div className="flex gap-2 items-center">
                            <input 
                              type="text" 
                              value={editIncomeCatName} 
                              onChange={e => setEditIncomeCatName(e.target.value)}
                              onKeyPress={e => e.key === 'Enter' && handleRenameIncome(cat)}
                              style={{ padding: '0.25rem 0.5rem', width: '120px' }}
                              autoFocus
                            />
                            <button onClick={() => handleRenameIncome(cat)} style={{ color: 'var(--success)', cursor: 'pointer' }}><Check size={16}/></button>
                            <button onClick={() => setEditingIncomeCat(null)} style={{ color: 'var(--text-muted)', cursor: 'pointer' }}><X size={16}/></button>
                          </div>
                        ) : (
                          <>
                            <span style={{ fontSize: '0.875rem', wordBreak: 'break-word' }}>{cat}</span>
                            <button onClick={() => { setEditingIncomeCat(cat); setEditIncomeCatName(cat); }} style={{ color: 'var(--primary)', flexShrink: 0, marginLeft: 'auto', cursor: 'pointer' }}><Edit2 size={14}/></button>
                            <button onClick={() => removeIncomeCat(cat)} style={{ color: 'var(--danger)', flexShrink: 0, cursor: 'pointer' }}><Trash2 size={14}/></button>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="New Income Category" 
                      value={newIncomeCat}
                      onChange={(e) => setNewIncomeCat(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addIncomeCat()}
                    />
                    <button onClick={addIncomeCat} style={{ padding: '0.75rem', backgroundColor: 'var(--bg-input)', borderRadius: 'var(--radius-md)', cursor: 'pointer' }}>
                      <Plus size={20} />
                    </button>
                  </div>
                </div>

                {/* Category Budgets */}
                <div className="glass-card flex-col gap-4">
                  <h3 style={{ fontSize: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Category Budgets</h3>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Set maximum monthly limits for specific expense categories.</p>
                  <div className="flex-col gap-3">
                    {expenseCategories.map(cat => (
                      <div key={cat} className="flex items-center justify-between" style={{ padding: '0.5rem', backgroundColor: 'var(--bg-input)', borderRadius: 'var(--radius-md)' }}>
                        <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{cat}</span>
                        <div className="flex items-center gap-2">
                          <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Limit:</span>
                          <input 
                            type="number" 
                            placeholder="No Limit"
                            value={categoryBudgets[cat] || ''}
                            onChange={(e) => {
                              const newBudgets = { ...categoryBudgets };
                              if (e.target.value) {
                                newBudgets[cat] = Number(e.target.value);
                              } else {
                                delete newBudgets[cat];
                              }
                              setCategoryBudgets(newBudgets);
                            }}
                            style={{ width: '100px', padding: '0.25rem 0.5rem' }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Category Styling & Emojis */}
                <div className="glass-card flex-col gap-4">
                  <h3 style={{ fontSize: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Palette size={18} />
                    Category Styling & Emojis
                  </h3>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Customize the visual indicators for your expense categories.</p>
                  
                  <div className="flex-col gap-3">
                    {expenseCategories.map(cat => {
                      const style = getCategoryStyle(cat);
                      const isCustomizing = activeCustomizeCat === cat;
                      
                      return (
                        <div key={cat} className="flex-col gap-2" style={{ padding: '0.75rem', backgroundColor: 'var(--bg-input)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span style={{ 
                                width: '32px', 
                                height: '32px', 
                                borderRadius: 'var(--radius-full)', 
                                backgroundColor: `${style.color}15`, 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center',
                                fontSize: '1.15rem',
                                color: style.color,
                                border: `1px solid ${style.color}33`,
                                boxShadow: `0 0 8px ${style.color}22`
                              }}>
                                <CategoryIcon category={cat} size={18} />
                              </span>
                              <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{cat}</span>
                            </div>
                            <button 
                              onClick={() => {
                                if (isCustomizing) {
                                  setActiveCustomizeCat(null);
                                } else {
                                  setActiveCustomizeCat(cat);
                                  setCustomEmojiInput('');
                                }
                              }}
                              style={{
                                fontSize: '0.75rem',
                                color: 'var(--primary)',
                                fontWeight: 600,
                                cursor: 'pointer'
                              }}
                            >
                              {isCustomizing ? 'Close' : 'Customize'}
                            </button>
                          </div>

                          {isCustomizing && (
                            <div className="flex-col gap-3" style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.75rem', marginTop: '0.25rem' }}>
                              {/* Emojis Selector */}
                              <div className="flex-col gap-1.5">
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Select Emoji / Icon</span>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                                  {['🍔', '🏠', '⚡', '🚗', '🛒', '🎓', '🤖', '🎁', '🎮', '🩺', '✈️', '💵', '🛍️', '❓'].map(emojiChoice => (
                                    <button
                                      key={emojiChoice}
                                      type="button"
                                      onClick={() => updateCategoryMetadata(cat, { emoji: emojiChoice })}
                                      style={{
                                        padding: '0.4rem',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        backgroundColor: style.emoji === emojiChoice ? 'rgba(255,255,255,0.08)' : 'transparent',
                                        borderRadius: 'var(--radius-sm)',
                                        border: style.emoji === emojiChoice ? '1px solid rgba(255,255,255,0.2)' : '1px solid transparent',
                                        transition: 'transform 0.15s ease, background-color 0.15s ease',
                                        cursor: 'pointer'
                                      }}
                                      onMouseOver={e => e.currentTarget.style.transform = 'scale(1.15)'}
                                      onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
                                    >
                                      <CategoryIcon emoji={emojiChoice} color={style.color} size={20} />
                                    </button>
                                  ))}
                                </div>
                                
                                {/* Custom emoji input */}
                                <div className="flex gap-2 items-center" style={{ marginTop: '0.25rem' }}>
                                  <input 
                                    type="text" 
                                    placeholder="Or enter custom emoji..." 
                                    value={customEmojiInput}
                                    onChange={e => setCustomEmojiInput(e.target.value)}
                                    style={{ padding: '0.35rem 0.5rem', fontSize: '0.8rem', flex: 1 }}
                                  />
                                  <button
                                    onClick={() => {
                                      if (customEmojiInput.trim()) {
                                        updateCategoryMetadata(cat, { emoji: customEmojiInput.trim() });
                                        setCustomEmojiInput('');
                                      }
                                    }}
                                    style={{
                                      padding: '0.35rem 0.75rem',
                                      backgroundColor: 'var(--bg-hover)',
                                      borderRadius: 'var(--radius-sm)',
                                      fontSize: '0.8rem',
                                      border: '1px solid var(--border-color)',
                                      color: 'var(--text-main)',
                                      cursor: 'pointer'
                                    }}
                                  >
                                    Apply
                                  </button>
                                </div>
                              </div>

                              {/* Colors Selector */}
                              <div className="flex-col gap-1.5" style={{ marginTop: '0.25rem' }}>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Select Color Accent</span>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
                                  {[
                                    '#f43f5e', '#ff6b6b', '#f97316', '#f59e0b', 
                                    '#e3b341', '#84cc16', '#10b981', '#39d353', 
                                    '#06b6d4', '#14b8a6', '#58a6ff', '#38bdf8', 
                                    '#6366f1', '#8b5cf6', '#a855f7', '#ec4899'
                                  ].map(color => (
                                    <button
                                      key={color}
                                      type="button"
                                      onClick={() => updateCategoryMetadata(cat, { color })}
                                      style={{
                                        width: '24px',
                                        height: '24px',
                                        borderRadius: 'var(--radius-full)',
                                        backgroundColor: color,
                                        border: style.color === color ? '2px solid white' : '1px solid transparent',
                                        boxShadow: style.color === color ? `0 0 8px ${color}` : 'none',
                                        padding: 0,
                                        transition: 'transform 0.15s ease',
                                        cursor: 'pointer'
                                      }}
                                      onMouseOver={e => e.currentTarget.style.transform = 'scale(1.15)'}
                                      onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
                                    />
                                  ))}
                                  
                                  {/* Native Hex Color Picker */}
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginLeft: '0.5rem' }}>
                                    <input 
                                      type="color" 
                                      value={style.color} 
                                      onChange={e => updateCategoryMetadata(cat, { color: e.target.value })} 
                                      style={{ 
                                        width: '28px', 
                                        height: '28px', 
                                        borderRadius: 'var(--radius-full)', 
                                        border: '1px solid rgba(255,255,255,0.2)',
                                        cursor: 'pointer',
                                        padding: 0,
                                        backgroundColor: 'transparent',
                                        outline: 'none'
                                      }} 
                                      title="Choose custom color"
                                    />
                                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Custom</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>
            )}

            {/* Tab 4: Notifications */}
            {activeTab === 4 && (
              <div className="glass-card flex-col gap-4">
                <h3 style={{ fontSize: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '18px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>🔔</span>
                  Native Notification Preferences
                </h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                  Customize when and how the app notifies you on your Android device.
                </p>
                
                {permissionStatus === 'denied' && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.75rem',
                    padding: '0.75rem 1rem',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: 'var(--radius-md)',
                    color: '#ef4444',
                    fontSize: '0.8rem',
                    marginTop: '0.5rem',
                    lineHeight: '1.4'
                  }}>
                    <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                    <div>
                      <strong style={{ display: 'block', marginBottom: '0.15rem' }}>Notification Permission Denied</strong>
                      To receive alerts and reminders, please enable notifications for Trackify in your device's Android System Settings.
                    </div>
                  </div>
                )}
                
                <div className="flex-col gap-4" style={{ marginTop: '0.5rem' }}>
                  {/* Daily Activity Reminder */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <span style={{ fontWeight: 600, fontSize: '0.9rem', display: 'block' }}>Daily Log Reminder</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Reminds you to log transactions if none were logged all day.</span>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={dailyReminder} 
                        onChange={(e) => setDailyReminder(e.target.checked)}
                        style={{ width: 'auto', cursor: 'pointer' }}
                      />
                    </div>
                    {dailyReminder && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', paddingLeft: '1rem', borderLeft: '2px solid var(--border-color)', marginTop: '0.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Reminder Time:</span>
                          <input 
                            type="time" 
                            value={dailyReminderTime} 
                            onChange={(e) => setDailyReminderTime(e.target.value)}
                            style={{ width: '120px', padding: '0.35rem 0.5rem', fontSize: '0.8rem' }}
                          />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.25rem' }}>
                          <div>
                            <span style={{ fontWeight: 500, fontSize: '0.85rem', display: 'block' }}>Zero-Spend Day Celebration</span>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Get a congratulatory alert if you log 0 expenses all day.</span>
                          </div>
                          <input 
                            type="checkbox" 
                            checked={zeroSpendStreak} 
                            onChange={(e) => setZeroSpendStreak(e.target.checked)}
                            style={{ width: 'auto', cursor: 'pointer' }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Weekly Digest */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <span style={{ fontWeight: 600, fontSize: '0.9rem', display: 'block' }}>Weekly Spending Digest</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Get a weekly summary of your expenses.</span>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={weeklyDigest} 
                        onChange={(e) => setWeeklyDigest(e.target.checked)}
                        style={{ width: 'auto', cursor: 'pointer' }}
                      />
                    </div>
                    {weeklyDigest && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Delivery Day:</span>
                        <select 
                          value={weeklyDigestDay} 
                          onChange={(e) => setWeeklyDigestDay(e.target.value)}
                          style={{ width: '140px', padding: '0.35rem 0.5rem', fontSize: '0.8rem' }}
                        >
                          <option value="Saturday">Saturday</option>
                          <option value="Sunday">Sunday</option>
                          <option value="Monday">Monday</option>
                          <option value="Tuesday">Tuesday</option>
                          <option value="Wednesday">Wednesday</option>
                          <option value="Thursday">Thursday</option>
                          <option value="Friday">Friday</option>
                        </select>
                      </div>
                    )}
                  </div>

                  {/* Weekly Savings Motivation */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
                    <div>
                      <span style={{ fontWeight: 600, fontSize: '0.9rem', display: 'block' }}>Weekly Savings Motivation</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Receive a weekend prompt to keep you motivated on active savings goals.</span>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={weeklySavingsMotivation} 
                      onChange={(e) => setWeeklySavingsMotivation(e.target.checked)}
                      style={{ width: 'auto', cursor: 'pointer' }}
                    />
                  </div>

                  {/* Monthly Financial Review */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
                    <div>
                      <span style={{ fontWeight: 600, fontSize: '0.9rem', display: 'block' }}>Monthly Financial Review</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Get a summary reminder on the 1st of each month to review progress.</span>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={monthlyReview} 
                      onChange={(e) => setMonthlyReview(e.target.checked)}
                      style={{ width: 'auto', cursor: 'pointer' }}
                    />
                  </div>

                  {/* Budget Alerts */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <span style={{ fontWeight: 600, fontSize: '0.9rem', display: 'block' }}>Budget Limit Warnings</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Get warned when you cross a budget threshold.</span>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={budgetAlerts} 
                        onChange={(e) => setBudgetAlerts(e.target.checked)}
                        style={{ width: 'auto', cursor: 'pointer' }}
                      />
                    </div>
                    {budgetAlerts && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', paddingLeft: '1rem', borderLeft: '2px solid var(--border-color)', marginTop: '0.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Warn Threshold:</span>
                          <input 
                            type="number" 
                            min="50"
                            max="100"
                            value={budgetThreshold} 
                            onChange={(e) => setBudgetThreshold(e.target.value)}
                            style={{ width: '70px', padding: '0.35rem 0.5rem', fontSize: '0.8rem' }}
                          />
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>% of monthly budget</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.25rem' }}>
                          <div>
                            <span style={{ fontWeight: 500, fontSize: '0.85rem', display: 'block' }}>Budget Exhaustion Warnings</span>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Instant alert when category spending reaches/crosses 100%.</span>
                          </div>
                          <input 
                            type="checkbox" 
                            checked={budgetExhaustion} 
                            onChange={(e) => setBudgetExhaustion(e.target.checked)}
                            style={{ width: 'auto', cursor: 'pointer' }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Unusual Spending Spike Alerts */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
                    <div>
                      <span style={{ fontWeight: 600, fontSize: '0.9rem', display: 'block' }}>Unusual Spending Spike Alerts</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Notify if a single expense is 3x larger than typical for its category.</span>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={spendSpikeAlerts} 
                      onChange={(e) => setSpendSpikeAlerts(e.target.checked)}
                      style={{ width: 'auto', cursor: 'pointer' }}
                    />
                  </div>

                  {/* Savings Milestones */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
                    <div>
                      <span style={{ fontWeight: 600, fontSize: '0.9rem', display: 'block' }}>Savings Goal Milestones</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Celebrate crossing 50%, 75%, and 100% of your goals.</span>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={savingsMilestones} 
                      onChange={(e) => setSavingsMilestones(e.target.checked)}
                      style={{ width: 'auto', cursor: 'pointer' }}
                    />
                  </div>

                  {/* Bill Reminders */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span style={{ fontWeight: 600, fontSize: '0.9rem', display: 'block' }}>Recurring Bill Reminders</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Reminds you at 9:00 AM on the day recurring bills are due.</span>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={billReminders} 
                      onChange={(e) => setBillReminders(e.target.checked)}
                      style={{ width: 'auto', cursor: 'pointer' }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Tab 5: Theme & Backup */}
            {activeTab === 5 && (
              <div className="flex-col gap-6">
                
                {/* Theme Accent Picker */}
                <div className="glass-card flex-col gap-4">
                  <h3 style={{ fontSize: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Palette size={18} />
                    Theme Customization
                  </h3>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Choose your preferred accent color for the interface.</p>
                  <div className="flex gap-4" style={{ padding: '0.5rem 0' }}>
                    {themes.map(t => (
                      <button
                        key={t.name}
                        onClick={() => handleThemeChange(t.name)}
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: 'var(--radius-full)',
                          backgroundColor: t.color,
                          border: selectedTheme === t.name ? '3px solid white' : '3px solid transparent',
                          boxShadow: selectedTheme === t.name ? '0 0 10px ' + t.color : 'none',
                          transition: 'var(--transition)',
                          cursor: 'pointer'
                        }}
                        title={t.label}
                      />
                    ))}
                  </div>
                </div>

                {/* CSV Export */}
                <div className="glass-card flex-col gap-4">
                  <h3 style={{ fontSize: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Download size={18} />
                    Data Backup & Export
                  </h3>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                    Download your entire financial history to a CSV file (compatible with Excel, Google Sheets, etc.).
                  </p>
                  <button
                    onClick={handleExportAllTimeCSV}
                    disabled={transactions.length === 0}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      padding: '0.75rem 1rem',
                      backgroundColor: 'var(--bg-input)',
                      color: transactions.length === 0 ? 'var(--text-muted)' : 'var(--text-main)',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      border: '1px solid var(--border-color)',
                      cursor: transactions.length === 0 ? 'not-allowed' : 'pointer',
                      opacity: transactions.length === 0 ? 0.6 : 1
                    }}
                  >
                    <Download size={16} />
                    Export All-Time Data ({transactions.length} records)
                  </button>
                </div>

              </div>
            )}

            {/* Global Actions (Reset & Save) - visible on all tabs at the bottom */}
            <div className="flex gap-4" style={{ marginTop: '1.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
              <button 
                onClick={handleResetDefaults}
                style={{
                  flex: 1,
                  backgroundColor: 'var(--bg-hover)',
                  color: 'var(--text-main)',
                  padding: '1rem',
                  borderRadius: 'var(--radius-md)',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  border: '1px solid var(--border-color)',
                  cursor: 'pointer'
                }}
              >
                <RotateCcw size={20} />
                Reset Defaults
              </button>
              <button 
                onClick={handleSave}
                disabled={saving}
                style={{
                  flex: 2,
                  backgroundColor: 'var(--primary)',
                  color: 'white',
                  padding: '1rem',
                  borderRadius: 'var(--radius-md)',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  opacity: saving ? 0.7 : 1,
                  boxShadow: 'var(--shadow-glow)',
                  cursor: 'pointer'
                }}
              >
                <Save size={20} />
                {saving ? 'Saving...' : 'Save All Settings'}
              </button>
            </div>

          </div>
        </div>
      </main>
      <Footer />
    </>
  );
};

export default SettingsPage;
