import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const AppContext = createContext();

export const useAppContext = () => useContext(AppContext);

export const AppProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Settings state
  const [userSettings, setUserSettings] = useState({
    base_income: 15000,
    savings_goal: 3000,
    expense_categories: ["Seat Rent", "Utility Bill", "Gas Bill (Cylinder)", "Personal Expenses", "Food & Dining", "Transport", "Other / Miscellaneous"],
    income_categories: ["Allowance", "Bonus", "Other"],
    category_budgets: {}
  });

  // Auth state listener
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        fetchTransactions(session.user.id);
        fetchSettings(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        fetchTransactions(session.user.id);
        fetchSettings(session.user.id);
      } else {
        setTransactions([]);
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
        category_budgets: data.category_budgets || {}
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

  const fetchTransactions = async (userId) => {
    setLoading(true);
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });

    if (!error && data) {
      setTransactions(data);
    }
    setLoading(false);
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
          payment_method: transaction.payment_method || 'Cash'
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
    userSettings,
    updateSettings,
    baseIncome: Number(userSettings.base_income),
    savingsGoal: Number(userSettings.savings_goal),
    loading,
    addTransaction,
    deleteTransaction,
    currentMonthTransactions,
    selectedMonth,
    setSelectedMonth,
    selectedYear,
    setSelectedYear,
    totalIncome,
    totalExpenses,
    balance
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
