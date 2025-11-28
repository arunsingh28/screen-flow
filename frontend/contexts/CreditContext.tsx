import React, { createContext, useContext, useState, ReactNode } from 'react';

interface CreditContextType {
  credits: number;
  maxCredits: number;
  consumeCredit: (amount?: number) => boolean;
  addCredits: (amount: number) => void;
  resetCredits: () => void;
}

const CreditContext = createContext<CreditContextType | undefined>(undefined);

export const useCredits = () => {
  const context = useContext(CreditContext);
  if (!context) {
    throw new Error('useCredits must be used within a CreditProvider');
  }
  return context;
};

interface CreditProviderProps {
  children: ReactNode;
  initialCredits?: number;
}

export const CreditProvider: React.FC<CreditProviderProps> = ({
  children,
  initialCredits = 100
}) => {
  const maxCredits = 100;
  const [credits, setCredits] = useState<number>(() => {
    // Try to load from localStorage
    const saved = localStorage.getItem('userCredits');
    return saved ? parseInt(saved, 10) : initialCredits;
  });

  const consumeCredit = (amount: number = 1): boolean => {
    if (credits >= amount) {
      const newCredits = credits - amount;
      setCredits(newCredits);
      localStorage.setItem('userCredits', newCredits.toString());
      return true;
    }
    return false;
  };

  const addCredits = (amount: number) => {
    const newCredits = Math.min(credits + amount, maxCredits);
    setCredits(newCredits);
    localStorage.setItem('userCredits', newCredits.toString());
  };

  const resetCredits = () => {
    setCredits(initialCredits);
    localStorage.setItem('userCredits', initialCredits.toString());
  };

  return (
    <CreditContext.Provider
      value={{
        credits,
        maxCredits,
        consumeCredit,
        addCredits,
        resetCredits
      }}
    >
      {children}
    </CreditContext.Provider>
  );
};
