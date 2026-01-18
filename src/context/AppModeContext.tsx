import React, { createContext, useContext } from 'react';
import { useAppMode, AppMode } from '../hooks/useAppMode';

interface AppModeContextValue {
  mode: AppMode;
  setMode: (mode: AppMode) => Promise<void>;
  channelName: string;
  setChannelName: (name: string) => Promise<void>;
  clearMode: () => Promise<void>;
  loading: boolean;
}

const AppModeContext = createContext<AppModeContextValue | undefined>(undefined);

export function AppModeProvider({ children }: { children: React.ReactNode }) {
  const appMode = useAppMode();

  return (
    <AppModeContext.Provider value={appMode}>
      {children}
    </AppModeContext.Provider>
  );
}

export function useAppModeContext(): AppModeContextValue {
  const context = useContext(AppModeContext);
  if (!context) {
    throw new Error('useAppModeContext must be used within an AppModeProvider');
  }
  return context;
}
