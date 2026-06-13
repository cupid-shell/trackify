const CURRENCIES = {
  BDT: { symbol: '৳', locale: 'en-IN', code: 'BDT', name: 'Bangladeshi Taka' },
  USD: { symbol: '$', locale: 'en-US', code: 'USD', name: 'US Dollar' },
  EUR: { symbol: '€', locale: 'de-DE', code: 'EUR', name: 'Euro' },
  GBP: { symbol: '£', locale: 'en-GB', code: 'GBP', name: 'British Pound' },
  INR: { symbol: '₹', locale: 'en-IN', code: 'INR', name: 'Indian Rupee' },
  JPY: { symbol: '¥', locale: 'ja-JP', code: 'JPY', name: 'Japanese Yen' }
};

export const formatCurrency = (amount, currencyCode = 'BDT') => {
  const config = CURRENCIES[currencyCode] || CURRENCIES.BDT;
  const num = Number(amount);
  if (isNaN(num)) return `${config.symbol}0`;
  return `${config.symbol}${num.toLocaleString(config.locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  })}`;
};

export const getCurrencySymbol = (currencyCode = 'BDT') => {
  return (CURRENCIES[currencyCode] || CURRENCIES.BDT).symbol;
};

export { CURRENCIES };
