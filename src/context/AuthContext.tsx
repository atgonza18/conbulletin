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
    console.log('🔄 AuthContext useEffect mounted');

    // Get initial session
    const getInitialSession = async () => {
      try {
        console.log('📡 Getting initial session...');
        const { data: { session } } = await supabase.auth.getSession();
        console.log('📊 Initial session result:', {
          hasSession: !!session,
          hasUser: !!session?.user,
          userId: session?.user?.id,
          sessionExpiry: session?.expires_at ? new Date(session.expires_at * 1000).toISOString() : 'no expiry'
        });
        
        if (!isMounted) {
          console.log('⚠️ Component unmounted during initial session fetch');
          return;
        }
        
        if (session?.user) {
          console.log('✅ Setting user from initial session:', session.user.id);
          setUser(session.user);
          const userProfile = await fetchProfile(session.user.id);
          if (isMounted) {
            console.log('✅ Setting profile from initial session:', userProfile?.full_name);
            setProfile(userProfile);
          }
        } else {
          console.log('❌ No session found in initial fetch');
        }
        
        if (isMounted) {
          setLoading(false);
          console.log('✅ Initial auth setup complete');
        }
      } catch (error) {
        console.error('❌ Error getting initial session:', error);
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Auth state changed:', {
          event,
          hasSession: !!session,
          hasUser: !!session?.user,
          userId: session?.user?.id,
          timestamp: new Date().toISOString(),
          sessionExpiry: session?.expires_at ? new Date(session.expires_at * 1000).toISOString() : 'no expiry'
        });
        
        if (!isMounted) {
          console.log('⚠️ Component unmounted during auth state change');
          return;
        }
        
        if (session?.user) {
          console.log('✅ Setting user from auth change:', session.user.id);
          setUser(session.user);
          const userProfile = await fetchProfile(session.user.id);
          if (isMounted) {
            console.log('✅ Setting profile from auth change:', userProfile?.full_name);
            setProfile(userProfile);
          }
        } else {
          console.log('❌ Clearing user and profile due to null session');
          setUser(null);
          setProfile(null);
        }
        
        if (isMounted) {
          setLoading(false);
        }
      }
    );

    // TEMPORARILY DISABLED - Handle tab visibility changes for auth
    // let lastAuthVisibilityCheck = 0;
    // const handleVisibilityChange = () => {
    //   console.log('👁️ Auth tab visibility change handler DISABLED');
    // };

    // document.addEventListener('visibilitychange', handleVisibilityChange);

    // Add visibility logging for diagnostics (not changing behavior)
    const handleVisibilityChangeLogging = () => {
      const isVisible = !document.hidden;
      console.log('👁️ Tab visibility changed:', {
        isVisible,
        timestamp: new Date().toISOString(),
        currentUser: user?.id || 'no user',
        visibilityState: document.visibilityState
      });
    };

    document.addEventListener('visibilitychange', handleVisibilityChangeLogging);

    return () => {
      console.log('🧹 AuthContext cleanup');
      isMounted = false;
      subscription.unsubscribe();
      document.removeEventListener('visibilitychange', handleVisibilityChangeLogging);
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