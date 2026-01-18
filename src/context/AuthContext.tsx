import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { onAuthChange, signIn, signUp, signOut, getCurrentUser, isAdmin as checkIsAdmin } from '../services/auth';

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  error: string | null;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check for existing user on mount
    const currentUser = getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
    }

    // Listen for auth changes
    const unsubscribe = onAuthChange((authUser) => {
      setUser(authUser);
      setIsLoading(false);
    });

    // Set loading to false after a timeout in case auth doesn't fire
    const timeout = setTimeout(() => setIsLoading(false), 2000);

    return () => {
      unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  const login = async (email: string, password: string) => {
    setError(null);
    setIsLoading(true);
    try {
      const authUser = await signIn(email, password);
      setUser(authUser);
    } catch (err: any) {
      const message = getErrorMessage(err.code);
      setError(message);
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, password: string) => {
    setError(null);
    setIsLoading(true);
    try {
      const authUser = await signUp(email, password);
      setUser(authUser);
    } catch (err: any) {
      const message = getErrorMessage(err.code);
      setError(message);
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setError(null);
    try {
      await signOut();
      setUser(null);
    } catch (err: any) {
      setError('Failed to sign out');
    }
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        isAdmin: checkIsAdmin(),
        login,
        register,
        logout,
        error,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

function getErrorMessage(code: string): string {
  switch (code) {
    case 'auth/email-already-in-use':
      return 'This email is already registered';
    case 'auth/invalid-email':
      return 'Invalid email address';
    case 'auth/weak-password':
      return 'Password must be at least 6 characters';
    case 'auth/user-not-found':
      return 'No account found with this email';
    case 'auth/wrong-password':
      return 'Incorrect password';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please try again later';
    case 'auth/invalid-credential':
      return 'Invalid email or password';
    default:
      return 'An error occurred. Please try again';
  }
}
