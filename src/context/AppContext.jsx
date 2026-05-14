import React, { createContext, useContext, useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';

const AppContext = createContext();

export const useAppContext = () => useContext(AppContext);

export const AppProvider = ({ children }) => {
  // Base configuration
  const baseIncome = 15000;
  
  // State
  const [transactions, setTransactions] = useState(() => {
    const saved = localStorage.getItem('trackify_transactions');
    return saved ? JSON.parse(saved) : [];
  });

  const [savingsGoal, setSavingsGoal] = useState(() => {
    const saved = localStorage.getItem('trackify_goal');
    return saved ? JSON.parse(saved) : 5000;
  });

  // Save to localStorage whenever state changes
  useEffect(() => {
    localStorage.setItem('trackify_transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('trackify_goal', JSON.stringify(savingsGoal));
  }, [savingsGoal]);

  // Actions
  const addTransaction = (transaction) => {
    const newTx = {
      ...transaction,
      id: uuidv4(),
      createdAt: new Date().toISOString()
    };
    setTransactions(prev => [newTx, ...prev]);
  };

  const deleteTransaction = (id) => {
    setTransactions(prev => prev.filter(tx => tx.id !== id));
  };

  const updateSavingsGoal = (amount) => {
    setSavingsGoal(amount);
  };

  // Derived state (helper logic can be placed here or in components)
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const currentMonthTransactions = transactions.filter(tx => {
    const txDate = new Date(tx.date);
    return txDate.getMonth() === currentMonth && txDate.getFullYear() === currentYear;
  });

  const totalAllowances = currentMonthTransactions
    .filter(tx => tx.type === 'income')
    .reduce((sum, tx) => sum + Number(tx.amount), 0);

  const totalIncome = baseIncome + totalAllowances;

  const totalExpenses = currentMonthTransactions
    .filter(tx => tx.type === 'expense')
    .reduce((sum, tx) => sum + Number(tx.amount), 0);

  const balance = totalIncome - totalExpenses;

  const value = {
    transactions,
    baseIncome,
    savingsGoal,
    addTransaction,
    deleteTransaction,
    updateSavingsGoal,
    currentMonthTransactions,
    totalIncome,
    totalExpenses,
    balance
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
