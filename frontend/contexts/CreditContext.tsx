import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import axiosInstance from '@/lib/axios';
import { useAuth } from '@/contexts/AuthContext';

interface CreditContextType {
  credits: number;
  maxCredits: number;
  consumeCredit: (amount?: number) => Promise<boolean>;
  addCredits: (amount: number, description: string) => Promise<void>;
  refreshCredits: () => Promise<void>;
  loading: boolean;
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
}

export const CreditProvider: React.FC<CreditProviderProps> = ({
  children
}) => {
  const { isAuthenticated } = useAuth();
  const [credits, setCredits] = useState<number>(0);
  const [maxCredits, setMaxCredits] = useState<number>(100);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchCredits = useCallback(async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    try {
      const response = await axiosInstance.get('/credits');
      setCredits(response.data.credits);
      setMaxCredits(response.data.max_credits);
    } catch (error) {
      console.error('Failed to fetch credits:', error);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchCredits();
  }, [fetchCredits]);

  const consumeCredit = async (amount: number = 1): Promise<boolean> => {
    // In a real app, this would be a server-side check during the operation.
    // Here we just check locally or call an API if we had a specific "consume" endpoint.
    // For now, we'll assume the operation that consumes credits will handle the deduction on the backend,
    // and we just refresh the credits afterwards.
    if (credits >= amount) {
      // Optimistic update
      setCredits(prev => prev - amount);
      return true;
    }
    return false;
  };

  const addCredits = async (amount: number, description: string) => {
    try {
      await axiosInstance.post('/credits/purchase', { amount, description });
      await fetchCredits();
    } catch (error) {
      console.error('Failed to purchase credits:', error);
      throw error;
    }
  };

  return (
    <CreditContext.Provider
      value={{
        credits,
        maxCredits,
        consumeCredit,
        addCredits,
        refreshCredits: fetchCredits,
        loading
      }}
    >
      {children}
    </CreditContext.Provider>
  );
};
