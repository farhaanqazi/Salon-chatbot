import { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import { useAuthStore } from '../store/authStore';
import type { AuthUser } from '../types';

export const useAuth = () => {
  const { user, isAuthenticated, isLoading, setUser, clearUser, setLoading } = useAuthStore();
  const navigate = useNavigate();

  // Initialize auth state from persisted store on mount
  useEffect(() => {
    const initializeAuth = async () => {
      // Skip auth initialization if Supabase is not configured
      if (!supabase) {
        setLoading(false);
        return;
      }

      try {
        // Get existing session from Supabase
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Auth session error:', error);
          clearUser();
          setLoading(false);
          return;
        }

        if (session) {
          // Fetch user profile
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single();
          
          if (userError || !userData) {
            console.error('User profile not found:', userError);
            clearUser();
          } else if (userData.is_active) {
            setUser(userData as AuthUser, session.access_token);
          } else {
            console.warn('User account is inactive');
            clearUser();
          }
        } else {
          // No active session in Supabase, clear any persisted Zustand state
          clearUser();
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Auth initialization error:', error);
        clearUser();
        setLoading(false);
      }
    };

    initializeAuth();
  }, [setLoading, setUser, clearUser]);

  // Listen for auth state changes
  useEffect(() => {
    if (!supabase) return;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event);
        
        switch (event) {
          case 'SIGNED_IN':
            if (session) {
              // Fetch user profile on sign in
              const { data: userData } = await supabase!
                .from('users')
                .select('*')
                .eq('id', session.user.id)
                .single();
              
              if (userData && userData.is_active) {
                setUser(userData as AuthUser, session.access_token);
              }
            }
            break;

          case 'SIGNED_OUT':
            clearUser();
            navigate('/login');
            break;

          case 'TOKEN_REFRESHED':
            if (session && user) {
              // Update token in store (user object stays the same)
              setUser(user, session.access_token);
            }
            break;

          case 'USER_UPDATED':
            if (session && user) {
              // Refresh user data
              const { data: userData } = await supabase!
                .from('users')
                .select('*')
                .eq('id', session.user.id)
                .single();
              
              if (userData) {
                setUser(userData as AuthUser, session.access_token);
              }
            }
            break;
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [clearUser, navigate, setUser, user]);

  const login = useCallback(async (email: string, password: string) => {
    if (!supabase) {
      // Demo mode - allow any email/password for visual testing
      console.log('Demo mode: Supabase not configured. Using demo credentials.');
      if (email && password) {
        const demoUser: AuthUser = {
          id: 'demo-user-id',
          email,
          full_name: 'Demo User',
          role: email.includes('admin') ? 'admin' : (email.includes('reception') ? 'reception' : 'salon_owner'),
          salon_id: '123e4567-e89b-12d3-a456-426614174000',
          is_active: true,
        };
        setUser(demoUser, 'demo-token');
        
        // Navigate to dashboard
        navigate('/dashboard');
        return;
      }
    }

    setLoading(true);
    
    try {
      const { data, error } = await supabase!.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error || !data.session) {
        throw new Error(error?.message || 'Login failed');
      }

      // Fetch user profile
      const { data: userData, error: userError } = await supabase!
        .from('users')
        .select('*')
        .eq('id', data.session.user.id)
        .single();
      
      if (userError || !userData) {
        throw new Error('User profile not found. Contact your administrator.');
      }
      
      if (!userData.is_active) {
        throw new Error('Your account is inactive. Contact your administrator.');
      }

      // Navigate to unified dashboard
      if (userData.role) {
        navigate('/dashboard');
      } else {
        navigate('/login');
      }
      
    } catch (error) {
      setLoading(false);
      throw error;
    }
  }, [navigate, setLoading, setUser]);

  const logout = useCallback(async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    clearUser();
    navigate('/login');
  }, [clearUser, navigate]);

  return { user, isAuthenticated, isLoading, login, logout };
};
