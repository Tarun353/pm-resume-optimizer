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
        redirectTo: window.location.href,
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
    console.log('Initiating sign out...');

    // Clear transient browser state used by auth UX
    sessionStorage.removeItem('loginInProgress');
    sessionStorage.removeItem('resumeState');

    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Supabase signout error:', error);
      }
    } catch (error) {
      console.error('Unexpected error during sign out:', error);
    }

    setUser(null);
    setDbUser(null);
  };

  // Initialize auth state
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        void fetchUserProfile(session.user.id);

        // Check if we just came back from login
        const loginInProgress = sessionStorage.getItem('loginInProgress');
        if (loginInProgress === 'true') {
          sessionStorage.removeItem('loginInProgress');
          // Trigger event to notify page
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent('login-complete'));
          }, 500);
        }
      }
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);

      if (session?.user) {
        void fetchUserProfile(session.user.id);

        const loginInProgress = sessionStorage.getItem('loginInProgress');
        if (event === 'SIGNED_IN' && loginInProgress === 'true') {
          sessionStorage.removeItem('loginInProgress');
          setTimeout(() => {
            window.dispatchEvent(new Event('login-complete'));
          }, 300);
        }
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
