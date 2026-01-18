import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LICENSE_KEY_STORAGE = '@cuecontrol_license_key';

// License key format: DJRQ-XXXX-XXXX-XXXX
const LICENSE_KEY_REGEX = /^DJRQ-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;

interface LicenseContextValue {
  licenseKey: string | null;
  isValidFormat: boolean;
  isLoading: boolean;
  setLicenseKey: (key: string) => Promise<void>;
  clearLicenseKey: () => Promise<void>;
  formatLicenseKey: (input: string) => string;
}

const LicenseContext = createContext<LicenseContextValue | undefined>(undefined);

export function LicenseProvider({ children }: { children: ReactNode }) {
  const [licenseKey, setLicenseKeyState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadLicenseKey();
  }, []);

  const loadLicenseKey = async () => {
    try {
      const stored = await AsyncStorage.getItem(LICENSE_KEY_STORAGE);
      if (stored) {
        setLicenseKeyState(stored);
      }
    } catch (error) {
      console.error('Failed to load license key:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const setLicenseKey = async (key: string) => {
    const formatted = key.toUpperCase().trim();
    try {
      await AsyncStorage.setItem(LICENSE_KEY_STORAGE, formatted);
      setLicenseKeyState(formatted);
    } catch (error) {
      console.error('Failed to save license key:', error);
      throw error;
    }
  };

  const clearLicenseKey = async () => {
    try {
      await AsyncStorage.removeItem(LICENSE_KEY_STORAGE);
      setLicenseKeyState(null);
    } catch (error) {
      console.error('Failed to clear license key:', error);
      throw error;
    }
  };

  // Format input as user types (auto-add dashes)
  const formatLicenseKey = (input: string): string => {
    // Remove all non-alphanumeric characters and convert to uppercase
    const cleaned = input.toUpperCase().replace(/[^A-Z0-9]/g, '');

    // Add DJRQ prefix if not present
    let formatted = cleaned;
    if (!formatted.startsWith('DJRQ')) {
      if (formatted.length > 0) {
        // User is typing, prepend DJRQ
        formatted = 'DJRQ' + formatted;
      }
    }

    // Insert dashes at appropriate positions
    const parts: string[] = [];
    if (formatted.length > 0) parts.push(formatted.slice(0, 4)); // DJRQ
    if (formatted.length > 4) parts.push(formatted.slice(4, 8));
    if (formatted.length > 8) parts.push(formatted.slice(8, 12));
    if (formatted.length > 12) parts.push(formatted.slice(12, 16));

    return parts.join('-');
  };

  const isValidFormat = licenseKey ? LICENSE_KEY_REGEX.test(licenseKey) : false;

  return (
    <LicenseContext.Provider
      value={{
        licenseKey,
        isValidFormat,
        isLoading,
        setLicenseKey,
        clearLicenseKey,
        formatLicenseKey,
      }}
    >
      {children}
    </LicenseContext.Provider>
  );
}

export function useLicense() {
  const context = useContext(LicenseContext);
  if (!context) {
    throw new Error('useLicense must be used within a LicenseProvider');
  }
  return context;
}

// Helper to sanitize license key for Firebase path (remove dashes)
export function licenseKeyToPath(licenseKey: string): string {
  return licenseKey.replace(/-/g, '');
}
