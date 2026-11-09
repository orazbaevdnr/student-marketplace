import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  sendEmailVerification,
  sendPasswordResetEmail,
  updateProfile as updateFirebaseProfile,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import { auth, googleProvider, isFirebaseConfigured } from './firebase';
import { User } from '../api/types';
import { DEMO_USER } from '../api/seed';
import { api } from '../api';
import { getFriendlyAuthErrorMessage } from './errors';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, pass: string) => Promise<void>;
  signUp: (name: string, email: string, pass: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithMicrosoft: () => Promise<void>;
  signInDemo: () => Promise<void>;
  signOut: () => Promise<void>;
  resendVerification: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  updateCurrentUser: (data: Partial<User>) => Promise<User>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_SESSION_KEY = 'student_marketplace_active_user_v1';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Sync state with local storage user profile
  const syncWithApiUser = async (baseUser: Partial<User> & { id: string; email: string }) => {
    try {
      const existing = await api.getProfile(baseUser.id);
      if (existing) {
        const merged: User = {
          ...existing,
          emailVerified: baseUser.emailVerified ?? existing.emailVerified,
          avatarUrl: baseUser.avatarUrl || existing.avatarUrl,
        };
        setUser(merged);
        localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(merged));
        return merged;
      } else {
        const created = await api.updateProfile(baseUser.id, {
          name: baseUser.name || 'Student',
          email: baseUser.email,
          avatarUrl: baseUser.avatarUrl,
          emailVerified: baseUser.emailVerified ?? false,
        });
        setUser(created);
        localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(created));
        return created;
      }
    } catch (e) {
      console.error('Error syncing profile:', e);
      const fallback: User = {
        id: baseUser.id,
        name: baseUser.name || 'Student',
        email: baseUser.email,
        emailVerified: baseUser.emailVerified ?? false,
        avatarUrl: baseUser.avatarUrl,
      };
      setUser(fallback);
      localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(fallback));
      return fallback;
    }
  };

  useEffect(() => {
    let unsubscribe = () => {};

    // 1. Check local session
    const rawStored = localStorage.getItem(LOCAL_SESSION_KEY);
    if (rawStored) {
      try {
        const parsed = JSON.parse(rawStored);
        setUser(parsed);
      } catch (e) {
        localStorage.removeItem(LOCAL_SESSION_KEY);
      }
    }

    // 2. If Firebase is configured, listen to Firebase Auth
    if (isFirebaseConfigured && auth) {
      unsubscribe = onAuthStateChanged(auth, async (fbUser: FirebaseUser | null) => {
        if (fbUser) {
          await syncWithApiUser({
            id: fbUser.uid,
            name: fbUser.displayName || fbUser.email?.split('@')[0] || 'Student',
            email: fbUser.email || '',
            avatarUrl: fbUser.photoURL || undefined,
            emailVerified: fbUser.emailVerified,
          });
        }
        setLoading(false);
      });
    } else {
      setLoading(false);
    }

    return () => unsubscribe();
  }, []);

  const signIn = async (email: string, pass: string) => {
    try {
      if (isFirebaseConfigured && auth) {
        const cred = await signInWithEmailAndPassword(auth, email.trim(), pass);
        await syncWithApiUser({
          id: cred.user.uid,
          name: cred.user.displayName || email.split('@')[0],
          email: cred.user.email || email,
          avatarUrl: cred.user.photoURL || undefined,
          emailVerified: cred.user.emailVerified,
        });
      } else {
        // Fallback mock sign-in
        const mockUser: User = {
          id: `user_${email.replace(/[^a-zA-Z0-9]/g, '_')}`,
          name: email.split('@')[0],
          email: email.trim(),
          emailVerified: true,
        };
        await syncWithApiUser(mockUser);
      }
    } catch (err: any) {
      throw new Error(getFriendlyAuthErrorMessage(err));
    }
  };

  const signUp = async (name: string, email: string, pass: string) => {
    try {
      if (isFirebaseConfigured && auth) {
        const cred = await createUserWithEmailAndPassword(auth, email.trim(), pass);
        await updateFirebaseProfile(cred.user, { displayName: name.trim() });
        try {
          await sendEmailVerification(cred.user);
        } catch (e) {
          console.warn('Failed to send verification email:', e);
        }
        await syncWithApiUser({
          id: cred.user.uid,
          name: name.trim(),
          email: cred.user.email || email,
          emailVerified: false,
        });
      } else {
        // Fallback mock sign-up
        const mockUser: User = {
          id: `user_${email.replace(/[^a-zA-Z0-9]/g, '_')}`,
          name: name.trim(),
          email: email.trim(),
          emailVerified: false,
        };
        await syncWithApiUser(mockUser);
      }
    } catch (err: any) {
      throw new Error(getFriendlyAuthErrorMessage(err));
    }
  };

  const signInWithGoogle = async () => {
    if (!isFirebaseConfigured || !auth || !googleProvider) {
      // Graceful fallback in mock mode
      await signInDemo();
      return;
    }
    try {
      const res = await signInWithPopup(auth, googleProvider);
      await syncWithApiUser({
        id: res.user.uid,
        name: res.user.displayName || 'Google Student',
        email: res.user.email || '',
        avatarUrl: res.user.photoURL || undefined,
        emailVerified: res.user.emailVerified,
      });
    } catch (err: any) {
      throw new Error(getFriendlyAuthErrorMessage(err));
    }
  };

  const signInWithMicrosoft = async () => {
    throw new Error(
      "Microsoft login is disabled. Please use email or Google instead."
    );
  };

  const signInDemo = async () => {
    // Immediate mock login without Firebase dependency
    const demo = await syncWithApiUser(DEMO_USER);
    setUser(demo);
  };

  const signOut = async () => {
    try {
      if (isFirebaseConfigured && auth) {
        await firebaseSignOut(auth);
      }
    } catch (e) {
      console.warn('Firebase signout error:', e);
    } finally {
      localStorage.removeItem(LOCAL_SESSION_KEY);
      setUser(null);
    }
  };

  const resendVerification = async () => {
    if (isFirebaseConfigured && auth && auth.currentUser) {
      await sendEmailVerification(auth.currentUser);
    }
  };

  const forgotPassword = async (email: string) => {
    if (isFirebaseConfigured && auth) {
      try {
        await sendPasswordResetEmail(auth, email.trim());
      } catch (err: any) {
        throw new Error(getFriendlyAuthErrorMessage(err));
      }
    }
  };

  const updateCurrentUser = async (data: Partial<User>): Promise<User> => {
    if (!user) throw new Error('No active user to update');
    const updated = await api.updateProfile(user.id, data);
    const merged = { ...user, ...updated };
    setUser(merged);
    localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(merged));
    return merged;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signIn,
        signUp,
        signInWithGoogle,
        signInWithMicrosoft,
        signInDemo,
        signOut,
        resendVerification,
        forgotPassword,
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
