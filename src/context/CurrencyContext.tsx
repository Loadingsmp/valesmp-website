import React, { createContext, useContext, useState, useCallback } from "react";

export type Currency = "USD" | "HUF" | "GBP" | "EUR" | "JPY";

type ExchangeRates = {
  [key in Currency]: number;
};

interface CurrencyContextType {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  convertPrice: (priceInUSD: number) => number;
  formatPrice: (price: number) => string;
}

const EXCHANGE_RATES: ExchangeRates = {
  USD: 1,
  HUF: 380, // 1 USD = ~380 HUF
  GBP: 0.79, // 1 USD = ~0.79 GBP
  EUR: 0.92, // 1 USD = ~0.92 EUR
  JPY: 150, // 1 USD = ~150 JPY
};

const CURRENCY_SYMBOLS: { [key in Currency]: string } = {
  USD: "$",
  HUF: "Ft",
  GBP: "£",
  EUR: "€",
  JPY: "¥",
};

const CurrencyContext = createContext<CurrencyContextType | null>(null);

export const useCurrency = () => {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error("useCurrency must be used within CurrencyProvider");
  return ctx;
};

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currency, setCurrency] = useState<Currency>(() => {
    const saved = localStorage.getItem("currency") as Currency | null;
    return saved || "USD";
  });

  const handleSetCurrency = useCallback((newCurrency: Currency) => {
    setCurrency(newCurrency);
    localStorage.setItem("currency", newCurrency);
  }, []);

  const convertPrice = useCallback((priceInUSD: number) => {
    return priceInUSD * EXCHANGE_RATES[currency];
  }, [currency]);

  const formatPrice = useCallback((price: number) => {
    const symbol = CURRENCY_SYMBOLS[currency];
    
    // Format based on currency
    if (currency === "JPY") {
      return `${Math.round(price)}${symbol}`;
    } else if (currency === "HUF") {
      return `${Math.round(price)} ${symbol}`;
    }
    
    return `${symbol}${price.toFixed(2)}`;
  }, [currency]);

  return (
    <CurrencyContext.Provider value={{
      currency,
      setCurrency: handleSetCurrency,
      convertPrice,
      formatPrice,
    }}>
      {children}
    </CurrencyContext.Provider>
  );
};
