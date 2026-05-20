import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { Save, Plus, Trash2, Edit2, X, Check } from 'lucide-react';
import Header from './Header';
import Footer from './Footer';

const SettingsPage = () => {
  const { userSettings, updateSettings, renameCategory } = useAppContext();
  
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

    await updateSettings({
      base_income: Number(baseIncome),
      savings_goal: Number(savingsGoal),
      expense_categories: finalExpenseCats,
      income_categories: finalIncomeCats,
      category_budgets: categoryBudgets
    });
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

          <button 
            onClick={handleSave}
            disabled={saving}
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
              opacity: saving ? 0.7 : 1
            }}
          >
            <Save size={20} />
            {saving ? 'Saving...' : 'Save All Settings'}
          </button>
        </div>
      </main>
      <Footer />
    </>
  );
};

export default SettingsPage;
