import React, { createContext, useContext, useState, ReactNode } from 'react';

interface AppContextValue {
  isLoading: boolean;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};

// Also export as useApp for backward compatibility
export const useApp = useAppContext;

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const value: AppContextValue = {
    isLoading,
    setIsLoading,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};