
"use client";

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, type User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Loader2 } from 'lucide-react';

export type UserRole = 'admin' | 'analyst' | 'viewer';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  role: UserRole | null;
  signup: typeof createUserWithEmailAndPassword;
  login: typeof signInWithEmailAndPassword;
  logout: () => Promise<void>;
  forceRefreshUserToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserRole = useCallback(async (user: User | null) => {
    if (!user) {
      setRole(null);
      return;
    }
    try {
      const idTokenResult = await user.getIdTokenResult(true); // Force refresh to get latest claims
      setRole(idTokenResult.claims.role as UserRole || 'viewer');
    } catch (error) {
      console.error("Error fetching user role:", error);
      setRole('viewer'); // Default to viewer on error
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setLoading(true);
      setUser(user);
      if (user) {
        await fetchUserRole(user);
      } else {
        setRole(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [fetchUserRole]);

  const forceRefreshUserToken = useCallback(async () => {
    if (!auth.currentUser) return null;
    try {
      const token = await auth.currentUser.getIdToken(true); // Force refresh
      await fetchUserRole(auth.currentUser); // Re-fetch role after token refresh
      return token;
    } catch (error) {
      console.error("Error forcing token refresh:", error);
      return null;
    }
  }, [fetchUserRole]);

  const value: AuthContextType = {
    user,
    loading,
    role,
    signup: (email, password) => createUserWithEmailAndPassword(auth, email, password),
    login: (email, password) => signInWithEmailAndPassword(auth, email, password),
    logout: async () => {
        await signOut(auth);
        setUser(null);
        setRole(null);
    },
    forceRefreshUserToken,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
