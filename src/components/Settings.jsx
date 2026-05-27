import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { Save, Plus, Trash2, Edit2, X, Check, RotateCcw, Palette, Download } from 'lucide-react';
import { format } from 'date-fns';
import CategoryIcon from './CategoryIcon';
import { Capacitor } from '@capacitor/core';
import Header from './Header';
import Footer from './Footer';

const SettingsPage = () => {
  const { 
    userSettings, 
    updateSettings, 
    renameCategory, 
    transactions, 
    presets, 
    updatePresets, 
    recurringBills, 
    updateRecurringBills,
    updateCategoryMetadata,
    getCategoryStyle,
    testNativeNotification
  } = useAppContext();
  
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
    if (expenseCategories.length > 0 && !newPresetCategory) {
      setNewPresetCategory(expenseCategories[0]);
    }
    if (expenseCategories.length > 0 && !newBillCategory) {
      setNewBillCategory(expenseCategories[0]);
    }
  }, [expenseCategories, newPresetCategory, newBillCategory]);

  useEffect(() => {
    setLocalPresets(presets);
  }, [presets]);

  useEffect(() => {
    setLocalRecurringBills(recurringBills);
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
      alert('Settings reset to defaults. Click "Save All Settings" to commit the changes.');
    }
  };

  useEffect(() => {
    setBaseIncome(userSettings.base_income);
    setSavingsGoal(userSettings.savings_goal);
    setExpenseCategories(userSettings.expense_categories || []);
    setIncomeCategories(userSettings.income_categories || []);
    setCategoryBudgets(userSettings.category_budgets || {});
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
      category_budgets: cleanedBudgets
    });
    updatePresets(localPresets);
    updateRecurringBills(localRecurringBills);
    setSaving(false);
    alert('Settings saved successfully!');
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
      <main className="container" style={{ flex: 1 }}>
        <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
          <h2 style={{ fontSize: '1.875rem', marginBottom: '0.5rem' }}>Settings</h2>
          <p>Customize your tracking experience.</p>
        </div>

        <div style={{ maxWidth: '600px', margin: '0 auto' }} className="flex-col gap-6">
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
                      <button onClick={() => handleRenameExpense(cat)} style={{ color: 'var(--success)' }}><Check size={16}/></button>
                      <button onClick={() => setEditingExpenseCat(null)} style={{ color: 'var(--text-muted)' }}><X size={16}/></button>
                    </div>
                  ) : (
                    <>
                      <span style={{ fontSize: '0.875rem', wordBreak: 'break-word' }}>{cat}</span>
                      <button onClick={() => { setEditingExpenseCat(cat); setEditExpenseCatName(cat); }} style={{ color: 'var(--primary)', flexShrink: 0, marginLeft: 'auto' }}><Edit2 size={14}/></button>
                      <button onClick={() => removeExpenseCat(cat)} style={{ color: 'var(--danger)', flexShrink: 0 }}><Trash2 size={14}/></button>
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
              <button onClick={addExpenseCat} style={{ padding: '0.75rem', backgroundColor: 'var(--bg-input)', borderRadius: 'var(--radius-md)' }}>
                <Plus size={20} />
              </button>
            </div>
          </div>

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
                      <button onClick={() => handleRenameIncome(cat)} style={{ color: 'var(--success)' }}><Check size={16}/></button>
                      <button onClick={() => setEditingIncomeCat(null)} style={{ color: 'var(--text-muted)' }}><X size={16}/></button>
                    </div>
                  ) : (
                    <>
                      <span style={{ fontSize: '0.875rem', wordBreak: 'break-word' }}>{cat}</span>
                      <button onClick={() => { setEditingIncomeCat(cat); setEditIncomeCatName(cat); }} style={{ color: 'var(--primary)', flexShrink: 0, marginLeft: 'auto' }}><Edit2 size={14}/></button>
                      <button onClick={() => removeIncomeCat(cat)} style={{ color: 'var(--danger)', flexShrink: 0 }}><Trash2 size={14}/></button>
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
              <button onClick={addIncomeCat} style={{ padding: '0.75rem', backgroundColor: 'var(--bg-input)', borderRadius: 'var(--radius-md)' }}>
                <Plus size={20} />
              </button>
            </div>
          </div>

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
                          fontWeight: 600
                        }}
                      >
                        {isCustomizing ? 'Close' : 'Customize'}
                      </button>
                    </div>

                    {isCustomizing && (
                      <div className="flex-col gap-3" style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.75rem', marginTop: '0.25rem' }}>
                        {/* Emojis Selector */}
                        <div className="flex-col gap-1.5">
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Select Emoji</span>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                            {['🍔', '🏠', '⚡', '🚗', '🛒', '🎓', '🤖', '🎁', '🎮', '🩺', '✈️', '💵', '🛍️', '❓'].map(emoji => (
                              <button
                                key={emoji}
                                onClick={() => updateCategoryMetadata(cat, { emoji })}
                                style={{
                                  padding: '0.35rem',
                                  fontSize: '1.2rem',
                                  backgroundColor: style.emoji === emoji ? 'rgba(255,255,255,0.08)' : 'transparent',
                                  borderRadius: 'var(--radius-sm)',
                                  border: style.emoji === emoji ? '1px solid rgba(255,255,255,0.2)' : '1px solid transparent',
                                }}
                              >
                                {emoji}
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
                                color: 'var(--text-main)'
                              }}
                            >
                              Apply
                            </button>
                          </div>
                        </div>

                        {/* Colors Selector */}
                        <div className="flex-col gap-1.5" style={{ marginTop: '0.25rem' }}>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Select Color Accent</span>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                            {['#f43f5e', '#ff6b6b', '#f59e0b', '#10b981', '#06b6d4', '#6366f1', '#a855f7', '#ec4899'].map(color => (
                              <button
                                key={color}
                                onClick={() => updateCategoryMetadata(cat, { color })}
                                style={{
                                  width: '24px',
                                  height: '24px',
                                  borderRadius: 'var(--radius-full)',
                                  backgroundColor: color,
                                  border: style.color === color ? '2px solid white' : '1px solid transparent',
                                  boxShadow: style.color === color ? `0 0 8px ${color}` : 'none',
                                  padding: 0
                                }}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

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
                  <button onClick={() => removePreset(idx)} style={{ color: 'var(--danger)', padding: '0.25rem' }}>
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem', marginTop: '0.5rem' }}>
              <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>Add New Preset</span>
              <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
                <input 
                  type="text" 
                  placeholder="Button Label (e.g. ৳15 Bus)" 
                  value={newPresetLabel}
                  onChange={(e) => setNewPresetLabel(e.target.value)}
                  style={{ flex: '1 1 200px', padding: '0.5rem 0.75rem', fontSize: '0.875rem' }}
                />
                <input 
                  type="number" 
                  placeholder="Amount (BDT)" 
                  value={newPresetAmount}
                  onChange={(e) => setNewPresetAmount(e.target.value)}
                  style={{ flex: '1 1 120px', padding: '0.5rem 0.75rem', fontSize: '0.875rem' }}
                />
              </div>
              <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
                <select 
                  value={newPresetCategory} 
                  onChange={(e) => setNewPresetCategory(e.target.value)}
                  style={{ flex: '1 1 150px', padding: '0.5rem 0.75rem', fontSize: '0.875rem' }}
                >
                  {expenseCategories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                <select 
                  value={newPresetPayment} 
                  onChange={(e) => setNewPresetPayment(e.target.value)}
                  style={{ flex: '1 1 120px', padding: '0.5rem 0.75rem', fontSize: '0.875rem' }}
                >
                  <option value="Cash">Cash</option>
                  <option value="bKash">bKash</option>
                  <option value="Bank">Bank</option>
                </select>
              </div>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="Note (Optional, e.g. Bus fare)" 
                  value={newPresetNote}
                  onChange={(e) => setNewPresetNote(e.target.value)}
                  style={{ flex: 1, padding: '0.5rem 0.75rem', fontSize: '0.875rem' }}
                />
                <button 
                  onClick={addPreset} 
                  style={{ 
                    padding: '0.5rem 1rem', 
                    backgroundColor: 'var(--primary)', 
                    color: 'white', 
                    borderRadius: 'var(--radius-md)',
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem'
                  }}
                >
                  <Plus size={16} /> Add
                </button>
              </div>
            </div>
          </div>

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
                  <button onClick={() => removeRecurringBill(idx)} style={{ color: 'var(--danger)', padding: '0.25rem' }}>
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem', marginTop: '0.5rem' }}>
              <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>Add New Recurring Bill</span>
              <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
                <input 
                  type="text" 
                  placeholder="Bill Name (e.g. Netflix)" 
                  value={newBillName}
                  onChange={(e) => setNewBillName(e.target.value)}
                  style={{ flex: '1 1 200px', padding: '0.5rem 0.75rem', fontSize: '0.875rem' }}
                />
                <input 
                  type="number" 
                  placeholder="Amount (BDT)" 
                  value={newBillAmount}
                  onChange={(e) => setNewBillAmount(e.target.value)}
                  style={{ flex: '1 1 120px', padding: '0.5rem 0.75rem', fontSize: '0.875rem' }}
                />
              </div>
              <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
                <select 
                  value={newBillCategory} 
                  onChange={(e) => setNewBillCategory(e.target.value)}
                  style={{ flex: '1 1 150px', padding: '0.5rem 0.75rem', fontSize: '0.875rem' }}
                >
                  {expenseCategories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                <input 
                  type="number" 
                  placeholder="Due Day (1-31)" 
                  value={newBillDueDate}
                  min="1"
                  max="31"
                  onChange={(e) => setNewBillDueDate(e.target.value)}
                  style={{ flex: '1 1 100px', padding: '0.5rem 0.75rem', fontSize: '0.875rem' }}
                />
                <select 
                  value={newBillPayment} 
                  onChange={(e) => setNewBillPayment(e.target.value)}
                  style={{ flex: '1 1 120px', padding: '0.5rem 0.75rem', fontSize: '0.875rem' }}
                >
                  <option value="Cash">Cash</option>
                  <option value="bKash">bKash</option>
                  <option value="Bank">Bank</option>
                </select>
              </div>
              <div className="flex justify-end">
                <button 
                  onClick={addRecurringBill} 
                  style={{ 
                    padding: '0.5rem 1rem', 
                    backgroundColor: 'var(--primary)', 
                    color: 'white', 
                    borderRadius: 'var(--radius-md)',
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem'
                  }}
                >
                  <Plus size={16} /> Add Bill
                </button>
              </div>
            </div>
          </div>

          <div className="glass-card flex-col gap-4">
            <h3 style={{ fontSize: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '18px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>🔔</span>
              Native Notifications Test
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              Test the native notification integration on your device. This will trigger a test alert instantly.
            </p>
            <button
              onClick={testNativeNotification}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1rem',
                backgroundColor: 'var(--bg-input)',
                color: 'var(--text-main)',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.875rem',
                fontWeight: 600,
                border: '1px solid var(--border-color)',
                cursor: 'pointer',
                width: 'fit-content'
              }}
            >
              <span>🔔</span> Trigger Test Notification
            </button>
          </div>

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
                    transition: 'var(--transition)'
                  }}
                  title={t.label}
                />
              ))}
            </div>
          </div>

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

          <div className="flex gap-4">
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
                border: '1px solid var(--border-color)'
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
                opacity: saving ? 0.7 : 1
              }}
            >
              <Save size={20} />
              {saving ? 'Saving...' : 'Save All Settings'}
            </button>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
};

export default SettingsPage;
