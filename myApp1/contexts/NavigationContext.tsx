import React, { createContext, useContext, useState } from 'react';

interface NavigationContextType {
  selectedMode: string | null;
  triggerNavigation: (mode: string) => void;
  clearNavigation: () => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export function NavigationProvider({ children }: { children: React.ReactNode }) {
  const [selectedMode, setSelectedMode] = useState<string | null>(null);

  const triggerNavigation = (mode: string) => {
    setSelectedMode(mode);
  };

  const clearNavigation = () => {
    setSelectedMode(null);
  };

  return (
    <NavigationContext.Provider value={{ selectedMode, triggerNavigation, clearNavigation }}>
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation() {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within NavigationProvider');
  }
  return context;
}
