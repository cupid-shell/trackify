import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';

const AppContext = createContext();

export const useAppContext = () => useContext(AppContext);

export const AppProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [debts, setDebts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Initialize dynamic theme accent on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('trackify_theme') || 'indigo';
    const themes = {
      indigo: { primary: '#6366f1', hover: '#4f46e5', glow: 'rgba(99, 102, 241, 0.4)' },
      emerald: { primary: '#10b981', hover: '#059669', glow: 'rgba(16, 185, 129, 0.4)' },
      rose: { primary: '#f43f5e', hover: '#e11d48', glow: 'rgba(244, 63, 94, 0.4)' },
      cyan: { primary: '#06b6d4', hover: '#0891b2', glow: 'rgba(6, 182, 212, 0.4)' },
      amber: { primary: '#f59e0b', hover: '#d97706', glow: 'rgba(245, 158, 11, 0.4)' }
    };
    const theme = themes[savedTheme] || themes.indigo;
    document.documentElement.style.setProperty('--primary', theme.primary);
    document.documentElement.style.setProperty('--primary-hover', theme.hover);
    document.documentElement.style.setProperty('--primary-glow', theme.glow);
  }, []);
  
  // Settings state
  const [userSettings, setUserSettings] = useState({
    base_income: 15000,
    savings_goal: 3000,
    expense_categories: ["Seat Rent", "Utility Bill", "Gas Bill (Cylinder)", "Personal Expenses", "Food & Dining", "Transport", "Other / Miscellaneous"],
    income_categories: ["Allowance", "Bonus", "Other"],
    category_budgets: {},
    savings_goals: [],
    category_metadata: {}
  });

  const [presets, setPresets] = useState(() => {
    const saved = localStorage.getItem('trackify_presets');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // use default
      }
    }
    return [
      { label: '৳15 Bus', amount: 15, category: 'Transport', note: 'Bus fare', payment: 'Cash' },
      { label: '৳50 Snack', amount: 50, category: 'Food & Dining', note: 'Snacks', payment: 'Cash' },
      { label: '৳120 Lunch', amount: 120, category: 'Food & Dining', note: 'Lunch', payment: 'Cash' },
      { label: '৳100 Mobile', amount: 100, category: 'Utilities & Bills', note: 'Mobile recharge', payment: 'bKash' }
    ];
  });

  const updatePresets = (newPresets) => {
    setPresets(newPresets);
    localStorage.setItem('trackify_presets', JSON.stringify(newPresets));
  };

  const [recurringBills, setRecurringBills] = useState(() => {
    const saved = localStorage.getItem('trackify_recurring_bills');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // use default
      }
    }
    return [
      { name: 'Home WiFi Bill', amount: 525, category: 'Utilities & Bills', dueDate: 20, payment: 'bKash' },
      { name: 'Seat Rent', amount: 3000, category: 'Rent', dueDate: 5, payment: 'Cash' }
    ];
  });

  const updateRecurringBills = (newBills) => {
    setRecurringBills(newBills);
    localStorage.setItem('trackify_recurring_bills', JSON.stringify(newBills));
  };

  // Notifications state & persistence
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (session?.user?.id) {
      const saved = localStorage.getItem(`trackify_notifications_${session.user.id}`);
      if (saved) {
        try {
          setNotifications(JSON.parse(saved));
        } catch (e) {
          setNotifications([]);
        }
      } else {
        setNotifications([]);
      }
    } else {
      setNotifications([]);
    }
  }, [session]);

  const addNotification = (title, message, type = 'info') => {
    const newNotif = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title,
      message,
      date: new Date().toISOString(),
      read: false,
      type
    };
    setNotifications(prev => {
      const updated = [newNotif, ...prev];
      if (session?.user?.id) {
        localStorage.setItem(`trackify_notifications_${session.user.id}`, JSON.stringify(updated));
      }
      return updated;
    });
  };

  const markAllNotificationsRead = () => {
    setNotifications(prev => {
      const updated = prev.map(n => ({ ...n, read: true }));
      if (session?.user?.id) {
        localStorage.setItem(`trackify_notifications_${session.user.id}`, JSON.stringify(updated));
      }
      return updated;
    });
  };

  const clearNotifications = () => {
    setNotifications([]);
    if (session?.user?.id) {
      localStorage.removeItem(`trackify_notifications_${session.user.id}`);
    }
  };

  const [skippedBills, setSkippedBills] = useState(() => {
    const saved = localStorage.getItem('trackify_skipped_bills');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  const skipBillForMonth = (billName, year, month) => {
    const key = `${year}-${month}-${billName}`;
    setSkippedBills(prev => {
      const next = prev.includes(key) ? prev : [...prev, key];
      localStorage.setItem('trackify_skipped_bills', JSON.stringify(next));
      return next;
    });
  };

  const unskipBillForMonth = (billName, year, month) => {
    const key = `${year}-${month}-${billName}`;
    setSkippedBills(prev => {
      const next = prev.filter(k => k !== key);
      localStorage.setItem('trackify_skipped_bills', JSON.stringify(next));
      return next;
    });
  };

  // Auth state listener
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        fetchTransactions(session.user.id);
        fetchSettings(session.user.id);
        fetchDebts(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      if (session) {
        fetchTransactions(session.user.id, true);
        fetchSettings(session.user.id);
        fetchDebts(session.user.id, true);
      } else {
        setTransactions([]);
        setDebts([]);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchSettings = async (userId) => {
    const { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (!error && data) {
      setUserSettings({
        base_income: data.base_income || 15000,
        savings_goal: data.savings_goal || 3000,
        expense_categories: data.expense_categories || ["Seat Rent", "Utility Bill", "Gas Bill (Cylinder)", "Personal Expenses", "Food & Dining", "Transport", "Other / Miscellaneous"],
        income_categories: data.income_categories || ["Allowance", "Bonus", "Other"],
        category_budgets: data.category_budgets || {},
        savings_goals: data.savings_goals || [],
        category_metadata: data.category_metadata || {}
      });
    }
  };

  const updateSettings = async (newSettings) => {
    if (!session?.user) return;
    
    // Optimistic UI update
    setUserSettings(prev => ({ ...prev, ...newSettings }));

    const { error } = await supabase
      .from('user_settings')
      .upsert({
        user_id: session.user.id,
        ...newSettings,
        updated_at: new Date().toISOString()
      });

    if (error) {
      alert('Error saving settings: ' + error.message);
    }
  };

  const fetchTransactions = async (userId, background = false) => {
    if (!background) setLoading(true);
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });

    if (!error && data) {
      setTransactions(data);
    }
    if (!background) setLoading(false);
  };

  const fetchDebts = async (userId, background = false) => {
    if (!background) setLoading(true);
    const { data, error } = await supabase
      .from('debts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setDebts(data);
    }
    if (!background) setLoading(false);
  };

  const addDebt = async (debt, logAsTransaction) => {
    if (!session?.user) return;

    const tempId = `temp-${Date.now()}`;
    const newDebt = { 
      ...debt, 
      id: tempId, 
      user_id: session.user.id, 
      settled_amount: 0, 
      status: 'active',
      payments: []
    };
    setDebts(prev => [newDebt, ...prev]);

    const { data, error } = await supabase
      .from('debts')
      .insert([
        {
          user_id: session.user.id,
          type: debt.type,
          person: debt.person,
          amount: debt.amount,
          due_date: debt.due_date || null,
          note: debt.note || null,
          date: debt.date || new Date().toISOString().split('T')[0],
          payments: []
        }
      ])
      .select()
      .single();

    if (!error && data) {
      setDebts(prev => prev.map(d => d.id === tempId ? data : d));
      
      if (logAsTransaction) {
        const txType = debt.type === 'lent' ? 'expense' : 'income';
        const txCategory = 'Debt/Loan';
        const txNote = debt.type === 'lent' 
          ? `Lent to ${debt.person}${debt.note ? `: ${debt.note}` : ''}`
          : `Borrowed from ${debt.person}${debt.note ? `: ${debt.note}` : ''}`;
        
        await addTransaction({
          type: txType,
          amount: debt.amount,
          category: txCategory,
          date: debt.date || new Date().toISOString().split('T')[0],
          note: txNote,
          payment_method: 'Cash',
          debt_id: data.id
        });
      }
    } else {
      setDebts(prev => prev.filter(d => d.id !== tempId));
      alert('Error adding debt record: ' + error?.message);
    }
  };

  const recordDebtRepayment = async (debtId, amount, note, logAsTransaction) => {
    if (!session?.user) return;

    const debt = debts.find(d => d.id === debtId);
    if (!debt) return;

    const newSettledAmount = Number(debt.settled_amount || 0) + Number(amount);
    const newStatus = newSettledAmount >= Number(debt.amount) ? 'settled' : 'active';
    const newPayment = {
      date: new Date().toISOString().split('T')[0],
      amount: Number(amount),
      note: note || ''
    };
    const newPayments = [...(debt.payments || []), newPayment];

    const originalDebts = [...debts];
    setDebts(prev => prev.map(d => d.id === debtId ? { 
      ...d, 
      settled_amount: newSettledAmount, 
      status: newStatus,
      payments: newPayments
    } : d));

    const { data, error } = await supabase
      .from('debts')
      .update({
        settled_amount: newSettledAmount,
        status: newStatus,
        payments: newPayments,
        updated_at: new Date().toISOString()
      })
      .eq('id', debtId)
      .eq('user_id', session.user.id)
      .select();

    if (error || !data || data.length === 0) {
      setDebts(originalDebts);
      alert('Error updating debt repayment: ' + (error?.message || 'Update failed'));
      return;
    }

    setDebts(prev => prev.map(d => d.id === debtId ? data[0] : d));

    if (logAsTransaction) {
      const txType = debt.type === 'lent' ? 'income' : 'expense';
      const txCategory = 'Debt/Loan';
      const txNote = debt.type === 'lent'
        ? `Repayment from ${debt.person}${note ? `: ${note}` : ''}`
        : `Repay to ${debt.person}${note ? `: ${note}` : ''}`;

      await addTransaction({
        type: txType,
        amount: Number(amount),
        category: txCategory,
        date: new Date().toISOString().split('T')[0],
        note: txNote,
        payment_method: 'Cash',
        debt_id: debtId
      });
    }
  };

  const deleteDebt = async (debtId) => {
    const originalDebts = [...debts];
    const originalTransactions = [...transactions];
    setDebts(prev => prev.filter(d => d.id !== debtId));
    setTransactions(prev => prev.filter(tx => tx.debt_id !== debtId));

    const { error } = await supabase
      .from('debts')
      .delete()
      .eq('id', debtId)
      .eq('user_id', session.user.id);

    if (error) {
      setDebts(originalDebts);
      setTransactions(originalTransactions);
      alert('Error deleting debt record: ' + error.message);
    }
  };

  const addTransaction = async (transaction) => {
    if (!session?.user) return;

    // Optimistic UI update
    const tempId = `temp-${Date.now()}`;
    const newTx = { ...transaction, id: tempId, user_id: session.user.id };
    setTransactions(prev => [newTx, ...prev]);

    const { data, error } = await supabase
      .from('transactions')
      .insert([
        {
          user_id: session.user.id,
          type: transaction.type,
          amount: transaction.amount,
          category: transaction.category,
          date: transaction.date,
          note: transaction.note,
          payment_method: transaction.payment_method || 'Cash',
          debt_id: transaction.debt_id || null
        }
      ])
      .select()
      .single();

    if (!error && data) {
      setTransactions(prev => prev.map(tx => tx.id === tempId ? data : tx));
    } else {
      setTransactions(prev => prev.filter(tx => tx.id !== tempId));
      alert('Error adding transaction: ' + error.message);
    }
  };

  const deleteTransaction = async (id) => {
    const originalTransactions = [...transactions];
    setTransactions(prev => prev.filter(tx => tx.id !== id));

    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id);

    if (error) {
      setTransactions(originalTransactions);
      alert('Error deleting transaction: ' + error.message);
    }
  };

  const updateTransaction = async (id, updatedFields) => {
    if (!session?.user) return false;

    // Optimistic UI update
    const originalTransactions = [...transactions];
    setTransactions(prev => prev.map(tx => tx.id === id ? { ...tx, ...updatedFields } : tx));

    const { data, error } = await supabase
      .from('transactions')
      .update(updatedFields)
      .eq('id', id)
      .eq('user_id', session.user.id)  // belt-and-suspenders: ensures RLS match
      .select();

    if (error) {
      setTransactions(originalTransactions);
      alert('Error updating transaction: ' + error.message);
      return false;
    }

    // If no rows came back, the DB silently rejected the update (e.g. missing UPDATE policy)
    if (!data || data.length === 0) {
      setTransactions(originalTransactions);
      alert('Update failed: the change was not saved to the database. Please run the missing UPDATE policy SQL in your Supabase dashboard:\n\nCREATE POLICY "Users can update own transactions" ON transactions FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);');
      return false;
    }

    setTransactions(prev => prev.map(tx => tx.id === id ? data[0] : tx));
    return true;
  };

  const renameCategory = async (oldName, newName, type) => {
    if (!session?.user || oldName === newName || !newName.trim()) return;
    
    const trimmedNewName = newName.trim();

    // 1. Update user settings locally
    const newSettings = { ...userSettings };
    const listKey = type === 'expense' ? 'expense_categories' : 'income_categories';
    const index = newSettings[listKey].indexOf(oldName);
    
    if (index !== -1) {
      newSettings[listKey][index] = trimmedNewName;
    } else {
      // If the old category wasn't in the list (e.g. an orphaned category), just return.
      return;
    }

    if (type === 'expense' && newSettings.category_budgets && newSettings.category_budgets[oldName]) {
      const budgetValue = newSettings.category_budgets[oldName];
      delete newSettings.category_budgets[oldName];
      newSettings.category_budgets[trimmedNewName] = budgetValue;
    }
    
    // Optistic UI for settings
    setUserSettings(newSettings);

    // 3. Save settings to DB
    const { error: settingsError } = await supabase
      .from('user_settings')
      .upsert({
        user_id: session.user.id,
        ...newSettings,
        updated_at: new Date().toISOString()
      });

    if (settingsError) {
      alert('Error saving renamed category setting: ' + settingsError.message);
    }

    // 4. Update transactions in DB (Preserve old category in note!)
    const { data: txsToUpdate } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', session.user.id)
      .eq('type', type)
      .eq('category', oldName);

    if (txsToUpdate && txsToUpdate.length > 0) {
      const updatedTxs = txsToUpdate.map(tx => {
        // If they are merging "Snacks" into "Food", we save "Snacks" in the note.
        const newNote = tx.note ? `[${oldName}] ${tx.note}` : oldName;
        return {
          ...tx,
          category: trimmedNewName,
          note: newNote
        };
      });

      const { error: txError } = await supabase
        .from('transactions')
        .upsert(updatedTxs);

      if (txError) {
        alert('Error migrating past transactions: ' + txError.message);
      } else {
        // Also update local state notes so UI reflects it immediately
        setTransactions(prev => prev.map(tx => {
          if (tx.type === type && tx.category === oldName) {
            const newNote = tx.note ? `[${oldName}] ${tx.note}` : oldName;
            return { ...tx, category: trimmedNewName, note: newNote };
          }
          return tx;
        }));
      }
    }
  };

  const addSavingsGoal = async (goal) => {
    if (!session?.user) return;
    const newGoals = [...(userSettings.savings_goals || []), goal];
    await updateSettings({ savings_goals: newGoals });
  };

  const deleteSavingsGoal = async (id) => {
    if (!session?.user) return;
    const newGoals = (userSettings.savings_goals || []).filter(g => g.id !== id);
    await updateSettings({ savings_goals: newGoals });
  };

  const updateSavingsGoalProgress = async (id, amount, isContribution) => {
    if (!session?.user) return;
    const newGoals = (userSettings.savings_goals || []).map(g => {
      if (g.id === id) {
        const change = Number(amount);
        const current = Number(g.current_amount || 0);
        const next = isContribution ? current + change : Math.max(0, current - change);
        return { ...g, current_amount: next };
      }
      return g;
    });
    await updateSettings({ savings_goals: newGoals });
  };

  const updateCategoryMetadata = async (categoryName, metadata) => {
    if (!session?.user) return;
    const newMetadata = {
      ...(userSettings.category_metadata || {}),
      [categoryName]: {
        ...(userSettings.category_metadata?.[categoryName] || {}),
        ...metadata
      }
    };
    await updateSettings({ category_metadata: newMetadata });
  };

  const getCategoryStyle = (catName) => {
    const defaults = {
      "Rent": { emoji: "🏠", color: "#6366f1" },
      "Seat Rent": { emoji: "🏠", color: "#6366f1" },
      "Utilities & Bills": { emoji: "⚡", color: "#06b6d4" },
      "Utility Bill": { emoji: "⚡", color: "#06b6d4" },
      "Gas Bill (Cylinder)": { emoji: "🔥", color: "#ec4899" },
      "Food & Dining": { emoji: "🍔", color: "#f59e0b" },
      "Transport": { emoji: "🚗", color: "#10b981" },
      "Daily Living": { emoji: "🛒", color: "#a855f7" },
      "Personal Expenses": { emoji: "🛍️", color: "#a855f7" },
      "Education": { emoji: "🎓", color: "#84cc16" },
      "AI Subscription": { emoji: "🤖", color: "#8b5cf6" },
      "Ai Subscription": { emoji: "🤖", color: "#8b5cf6" },
      "Other / Unexpected": { emoji: "❓", color: "#f43f5e" },
      "Other / Miscellaneous": { emoji: "❓", color: "#f43f5e" }
    };
    const metadata = userSettings.category_metadata || {};
    if (metadata[catName]) {
      return {
        emoji: metadata[catName].emoji || "🏷️",
        color: metadata[catName].color || "#94a3b8"
      };
    }
    return defaults[catName] || { emoji: "🏷️", color: "#94a3b8" };
  };

  const currentRealDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentRealDate.getMonth());
  const [selectedYear, setSelectedYear] = useState(currentRealDate.getFullYear());

  const currentMonthTransactions = transactions.filter(tx => {
    const txDate = new Date(tx.date);
    return txDate.getMonth() === selectedMonth && txDate.getFullYear() === selectedYear;
  });

  const totalAllowances = currentMonthTransactions
    .filter(tx => tx.type === 'income')
    .reduce((sum, tx) => sum + Number(tx.amount), 0);

  const totalIncome = Number(userSettings.base_income) + totalAllowances;

  const totalExpenses = currentMonthTransactions
    .filter(tx => tx.type === 'expense')
    .reduce((sum, tx) => sum + Number(tx.amount), 0);

  const balance = totalIncome - totalExpenses;

  const value = {
    session,
    transactions,
    debts,
    userSettings,
    updateSettings,
    presets,
    updatePresets,
    recurringBills,
    updateRecurringBills,
    baseIncome: Number(userSettings.base_income),
    savingsGoal: Number(userSettings.savings_goal),
    loading,
    addTransaction,
    deleteTransaction,
    updateTransaction,
    renameCategory,
    currentMonthTransactions,
    selectedMonth,
    setSelectedMonth,
    selectedYear,
    setSelectedYear,
    totalIncome,
    totalExpenses,
    balance,
    notifications,
    addNotification,
    markAllNotificationsRead,
    clearNotifications,
    addSavingsGoal,
    deleteSavingsGoal,
    updateSavingsGoalProgress,
    updateCategoryMetadata,
    getCategoryStyle,
    addDebt,
    recordDebtRepayment,
    deleteDebt,
    skippedBills,
    skipBillForMonth,
    unskipBillForMonth
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
