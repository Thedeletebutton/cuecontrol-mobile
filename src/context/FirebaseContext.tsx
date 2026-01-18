import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { initializeFirebase, isCloudConnected, disconnectFirebase, testFirebaseConnection } from '../services/firebase';
import { FirebaseConfig } from '../types/request';

interface FirebaseContextValue {
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  config: FirebaseConfig | null;
  connect: (config: FirebaseConfig) => Promise<boolean>;
  disconnect: () => void;
  saveConfig: (config: FirebaseConfig) => Promise<void>;
  loadSavedConfig: () => Promise<FirebaseConfig | null>;
}

const FirebaseContext = createContext<FirebaseContextValue | undefined>(undefined);

const CONFIG_STORAGE_KEY = 'firebase_config';

export function FirebaseProvider({ children }: { children: React.ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [config, setConfig] = useState<FirebaseConfig | null>(null);

  useEffect(() => {
    loadAndConnect();
  }, []);

  async function loadAndConnect() {
    const savedConfig = await loadSavedConfig();
    if (savedConfig) {
      await connect(savedConfig);
    }
  }

  async function connect(newConfig: FirebaseConfig): Promise<boolean> {
    setIsConnecting(true);
    setError(null);

    try {
      const success = initializeFirebase(newConfig);
      setIsConnected(success);
      setConfig(newConfig);

      if (!success) {
        setError('Failed to connect to Firebase');
      }
      return success;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Connection failed';
      setError(errorMessage);
      setIsConnected(false);
      return false;
    } finally {
      setIsConnecting(false);
    }
  }

  function disconnect() {
    disconnectFirebase();
    setIsConnected(false);
    setConfig(null);
  }

  async function saveConfig(newConfig: FirebaseConfig): Promise<void> {
    try {
      await SecureStore.setItemAsync(
        CONFIG_STORAGE_KEY,
        JSON.stringify(newConfig)
      );
    } catch (err) {
      console.error('Failed to save Firebase config:', err);
    }
  }

  async function loadSavedConfig(): Promise<FirebaseConfig | null> {
    try {
      const saved = await SecureStore.getItemAsync(CONFIG_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved) as FirebaseConfig;
      }
    } catch (err) {
      console.error('Failed to load Firebase config:', err);
    }
    return null;
  }

  return (
    <FirebaseContext.Provider
      value={{
        isConnected,
        isConnecting,
        error,
        config,
        connect,
        disconnect,
        saveConfig,
        loadSavedConfig,
      }}
    >
      {children}
    </FirebaseContext.Provider>
  );
}

export function useFirebase(): FirebaseContextValue {
  const context = useContext(FirebaseContext);
  if (!context) {
    throw new Error('useFirebase must be used within a FirebaseProvider');
  }
  return context;
}
