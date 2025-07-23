'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

interface Profile {
  id: string;
  email: string;
  username: string;
  role: string;
  scope: string;
  full_name: string;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
  };

  useEffect(() => {
    let isMounted = true;

    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!isMounted) return;
        
        if (session?.user) {
          setUser(session.user);
          const userProfile = await fetchProfile(session.user.id);
          if (isMounted) {
            setProfile(userProfile);
          }
        }
        
        if (isMounted) {
          setLoading(false);
        }
      } catch (error) {
        console.error('Error getting initial session:', error);
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id);
        
        if (!isMounted) return;
        
        if (session?.user) {
          setUser(session.user);
          const userProfile = await fetchProfile(session.user.id);
          if (isMounted) {
            setProfile(userProfile);
          }
        } else {
          setUser(null);
          setProfile(null);
        }
        
        if (isMounted) {
          setLoading(false);
        }
      }
    );

    // Handle tab visibility changes - VERY conservative auth refresh
    let lastAuthVisibilityCheck = 0;
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !loading) {
        const now = Date.now();
        
        // Only check auth if it's been more than 15 minutes since last check
        if (now - lastAuthVisibilityCheck < 900000) {
          console.log('👁️ Tab became visible but skipping auth check (too recent)');
          return;
        }
        
        lastAuthVisibilityCheck = now;
        console.log('👁️ Tab became visible after long absence, checking auth state');
        
        // Small delay to ensure everything is ready
        setTimeout(() => {
          if (!isMounted || loading) return;
          
          // Only refresh if we don't have a user or if the session might be stale
          supabase.auth.getSession().then(({ data: { session } }) => {
            if (!isMounted) return;
            
            // Only refresh if there's a clear mismatch
            const hasSessionButNoUser = session?.user && !user;
            const hasUserButNoSession = user && !session?.user;
            
            if (hasSessionButNoUser || hasUserButNoSession) {
              console.log('🔄 Auth state mismatch detected after long absence, refreshing session');
              supabase.auth.refreshSession();
            } else {
              console.log('✅ Auth state is consistent after long absence');
            }
          }).catch(error => {
            console.error('Error checking session on visibility change:', error);
          });
        }, 1000); // Even longer delay
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      isMounted = false;
      subscription.unsubscribe();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const signOut = async () => {
    try {
      // Clear local state immediately for better UX
      setUser(null);
      setProfile(null);
      
      // Sign out from Supabase
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Error signing out:', error);
        throw error;
      }
      
      console.log('Successfully signed out');
    } catch (error) {
      console.error('Error during sign out:', error);
      // Even if Supabase signOut fails, we've cleared local state
      // This ensures the user appears logged out in the UI
      setUser(null);
      setProfile(null);
      throw error;
    }
  };

  const value = {
    user,
    profile,
    loading,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 