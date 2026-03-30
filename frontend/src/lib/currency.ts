export type CurrencyCode = 'INR' | 'USD' | 'AED';

export const currencySymbols: Record<CurrencyCode, string> = {
  INR: '₹',
  USD: '$',
  AED: 'د.إ',
};

// Base currency is INR
export const currencyRates: Record<CurrencyCode, number> = {
  INR: 1,
  USD: 0.012,
  AED: 0.044,
};

export const formatCurrency = (amountInInr: number, currency: CurrencyCode) => {
  const rate = currencyRates[currency] || 1;
  const converted = amountInInr * rate;
  const decimals = currency === 'INR' ? 0 : 2;
  const symbol = currencySymbols[currency] || '₹';
  return `${symbol}${converted.toFixed(decimals)}`;
};
