import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '../api/types';
import { api } from '../api';
import { getFriendlyAuthErrorMessage } from './errors';
import { AUTH_EXPIRED_EVENT, getAccessToken, setAccessToken } from './session';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, pass: string) => Promise<void>;
  signUp: (name: string, email: string, pass: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateCurrentUser: (data: Partial<User>) => Promise<User>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const restore = async () => {
      const token = getAccessToken();
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const me = await api.me();
        setUser(me);
      } catch {
        setAccessToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    restore();
  }, []);

  useEffect(() => {
    const onExpired = () => setUser(null);
    window.addEventListener(AUTH_EXPIRED_EVENT, onExpired);
    return () => window.removeEventListener(AUTH_EXPIRED_EVENT, onExpired);
  }, []);

  const signIn = async (email: string, pass: string) => {
    try {
      const result = await api.login(email.trim(), pass);
      setUser(result.user);
    } catch (err: any) {
      throw new Error(getFriendlyAuthErrorMessage(err));
    }
  };

  const signUp = async (name: string, email: string, pass: string) => {
    try {
      const result = await api.register(name.trim(), email.trim(), pass);
      setUser(result.user);
    } catch (err: any) {
      throw new Error(getFriendlyAuthErrorMessage(err));
    }
  };

  const signOut = async () => {
    setAccessToken(null);
    setUser(null);
  };

  const updateCurrentUser = async (data: Partial<User>): Promise<User> => {
    if (!user) throw new Error('No active user to update');
    const updated = await api.updateProfile('me', data);
    setUser(updated);
    return updated;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signIn,
        signUp,
        signOut,
        updateCurrentUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
