"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

type CurrencyContextType = {
  currencyCode: string;
  currencySymbol: string;
  formatCurrency: (amount: number) => string;
};

const CurrencyContext = createContext<CurrencyContextType>({
  currencyCode: "INR",
  currencySymbol: "₹",
  formatCurrency: (amount: number) => `₹${amount.toFixed(2)}`
});

export const getCurrencySymbol = (code: string) => {
  switch (code) {
    case "USD": return "$";
    case "EUR": return "€";
    case "GBP": return "£";
    case "INR": return "₹";
    default: return "₹";
  }
};

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currencyCode, setCurrencyCode] = useState("INR");
  const [currencySymbol, setCurrencySymbol] = useState("₹");

  useEffect(() => {
    fetch('/api/v1/dashboard/settings')
      .then(r => r.json())
      .then(data => {
        if (data.formData?.currency) {
          const code = data.formData.currency;
          setCurrencyCode(code);
          setCurrencySymbol(getCurrencySymbol(code));
        }
      })
      .catch(console.error);
  }, []);

  const formatCurrency = (amount: number) => {
    return `${currencySymbol}${Number(amount).toFixed(2)}`;
  };

  return (
    <CurrencyContext.Provider value={{ currencyCode, currencySymbol, formatCurrency }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  return useContext(CurrencyContext);
}
