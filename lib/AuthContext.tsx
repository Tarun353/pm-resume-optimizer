'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { supabase, User as DBUser } from '@/lib/supabase';
import { User as AuthUser } from '@supabase/supabase-js';

interface AuthContextType {
  user: AuthUser | null;
  dbUser: DBUser | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [dbUser, setDbUser] = useState<DBUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch user profile from database
  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      setDbUser(data);
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  // Refresh user data
  const refreshUser = async () => {
    if (user) {
      await fetchUserProfile(user.id);
    }
  };

  // Sign in with Google
  const signInWithGoogle = async () => {
    // Mark that we're about to login
    sessionStorage.setItem('loginInProgress', 'true');
    
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.href, // Come back to same page
        queryParams: {
          access_type: 'offline',
          prompt: 'select_account',
        },
      },
    });

    if (error) {
      sessionStorage.removeItem('loginInProgress');
      throw error;
    }
  };

  // Sign out
  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setDbUser(null);
  };

  // Initialize auth state
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserProfile(session.user.id);
        
        // Check if we just came back from login
        const loginInProgress = sessionStorage.getItem('loginInProgress');
        if (loginInProgress === 'true') {
          sessionStorage.removeItem('loginInProgress');
          // Trigger event to notify page
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent('login-complete'));
          }, 500); // Small delay for state to settle
        }
      }
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        await fetchUserProfile(session.user.id);
      } else {
        setDbUser(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        dbUser,
        loading,
        signInWithGoogle,
        signOut,
        refreshUser,
      }}>
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
