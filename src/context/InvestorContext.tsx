"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';

// ---- Static imports of each investor JSON file ----
import brianData from '@/data/brian_schmidt.json';
import bennettData from '@/data/equity_bennett_williamson.json';

// Map of available investors (extend as needed)
export const investors = {
  brian: {
    name: 'Brian Schmidt',
    data: brianData as any[],
  },
  bennett: {
    name: 'Bennett Williamson',
    data: bennettData as any[],
  },
} as const;

type InvestorKey = keyof typeof investors;

type InvestorContextValue = {
  investorKey: InvestorKey;
  setInvestorKey: (key: InvestorKey) => void;
  investorName: string;
  equityData: any[];
};

const InvestorContext = createContext<InvestorContextValue | undefined>(undefined);

export function InvestorProvider({ children }: { children: ReactNode }) {
  // Default to the first key in the investors object
  const defaultKey = Object.keys(investors)[0] as InvestorKey;
  const [investorKey, setInvestorKey] = useState<InvestorKey>(defaultKey);

  const value: InvestorContextValue = {
    investorKey,
    setInvestorKey,
    investorName: investors[investorKey].name,
    equityData: investors[investorKey].data,
  };

  return (
    <InvestorContext.Provider value={value}>
      {children}
    </InvestorContext.Provider>
  );
}

export function useInvestor() {
  const ctx = useContext(InvestorContext);
  if (!ctx) {
    throw new Error('useInvestor must be used within an InvestorProvider');
  }
  return ctx;
} 