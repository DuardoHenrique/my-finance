'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

type Currency = 'BRL' | 'USD';

interface CurrencyContextType {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  exchangeRate: number; // 1 USD = X BRL
  convertAmount: (amountUSD: number) => number;
  formatAmount: (amountUSD: number) => string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState<Currency>('BRL');
  const [exchangeRate, setExchangeRate] = useState<number>(5.45); // Sensible fallback

  useEffect(() => {
    // Read from localStorage on mount safely via microtask to avoid synchronous render warning
    const saved = localStorage.getItem('myfinance_currency');
    if (saved === 'BRL' || saved === 'USD') {
      Promise.resolve().then(() => {
        setCurrencyState(saved);
      });
    }

    // Fetch live exchange rate
    async function fetchRate() {
      try {
        const res = await fetch('https://economia.awesomeapi.com.br/json/last/USD-BRL');
        if (res.ok) {
          const data = await res.json();
          if (data && data.USDBRL && data.USDBRL.bid) {
            const rate = parseFloat(data.USDBRL.bid);
            if (!isNaN(rate) && rate > 0) {
              setExchangeRate(rate);
              return;
            }
          }
        }
      } catch (err) {
        console.warn('Failed to fetch from awesomeapi, trying fallback API...', err);
      }

      // Try fallback API
      try {
        const res = await fetch('https://open.er-api.com/v6/latest/USD');
        if (res.ok) {
          const data = await res.json();
          if (data && data.rates && typeof data.rates.BRL === 'number') {
            setExchangeRate(data.rates.BRL);
          }
        }
      } catch (err) {
        console.error('Failed to fetch currency exchange rate:', err);
      }
    }

    fetchRate();
  }, []);

  const setCurrency = (cur: Currency) => {
    setCurrencyState(cur);
    localStorage.setItem('myfinance_currency', cur);
  };

  // Converts USD internally to selected currency
  const convertAmount = (amountUSD: number) => {
    if (currency === 'USD') {
      return amountUSD;
    }
    return amountUSD * exchangeRate;
  };

  // Formats value according to selected currency
  const formatAmount = (amountUSD: number) => {
    const converted = convertAmount(amountUSD);
    if (currency === 'BRL') {
      return `R$ ${converted.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    } else {
      return `US$ ${converted.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
  };

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, exchangeRate, convertAmount, formatAmount }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
}
