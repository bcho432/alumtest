'use client';

import { createContext, useContext, useState, useLayoutEffect, ReactNode } from 'react';
import { User as SupabaseUser, Session } from '@supabase/supabase-js';
import { supabase, getCurrentUser, getSession, signOut as supabaseSignOut, signInWithEmail, signUpWithEmail } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/use-toast';
import type { AuthContextType, SignUpFormData, SignInFormData, UserRoles, UserProfile } from '@/types/auth';
import { userService } from '@/lib/supabase-services';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function SupabaseAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [initializing, setInitializing] = useState(true);
  const [lastError, setLastError] = useState<Error | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null); // Add userProfile state
  const [userRoles, setUserRoles] = useState<UserRoles>({
    isAdmin: false,
    profileRoles: {},
    isLoading: true,
    error: null
  });
  const router = useRouter();
  const { toast } = useToast();

  useLayoutEffect(() => {
    console.log('[Supabase Auth Context] Setting up auth state listener');
    
    const initAuth = async () => {
      try {
        // Get initial session
        const initialSession = await getSession();
        setSession(initialSession);
        setUser(initialSession?.user || null);
        
        if (initialSession?.user) {
          await loadUserData(initialSession.user);
        }

        // Set up auth state listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            console.log('[Supabase Auth Context] Auth state changed:', {
              event,
              userId: session?.user?.id,
              email: session?.user?.email
            });
            
            setSession(session);
            setUser(session?.user || null);
            console.log('[Supabase Auth Context] User state set to:', session?.user || null);
            
            if (session?.user) {
              await loadUserData(session.user);
            } else {
              setIsAdmin(false);
              setUserRoles({
                isAdmin: false,
                profileRoles: {},
                isLoading: false,
                error: null
              });
            }
            
            setLoading(false);
            setInitializing(false);
          }
        );

        setLoading(false);
        setInitializing(false);

        return () => subscription.unsubscribe();
      } catch (error) {
        console.error('[Supabase Auth Context] Error initializing auth:', error);
        setLastError(error as Error);
        setLoading(false);
        setInitializing(false);
      }
    };

    initAuth();
  }, []);

  const loadUserData = async (user: SupabaseUser) => {
    try {
      console.log('[Supabase Auth Context] Loading user data for:', user.id);
      
      // Get user profile from our users table
      try {
        const userProfile = await userService.getUserProfile(user.id);
        console.log('[Supabase Auth Context] User profile found:', userProfile);
        
        if (userProfile) {
          const isUserAdmin = userProfile.is_platform_admin || false;
          setIsAdmin(isUserAdmin);
          setUserProfile(userProfile); // Store the user profile
          
          setUserRoles({
            isAdmin: isUserAdmin,
            profileRoles: {}, // We'll implement this later
            isLoading: false,
            error: null
          });
        } else {
          console.log('[Supabase Auth Context] No user profile found, creating one...');
          // Create user profile if it doesn't exist
          const newProfile = await userService.updateUserProfile(user.id, {
            email: user.email,
            display_name: user.user_metadata?.full_name || user.email?.split('@')[0],
            email_verified: user.email_confirmed_at ? true : false,
            photo_url: undefined,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
          
          console.log('[Supabase Auth Context] Created user profile:', newProfile);
          setUserProfile(newProfile); // Store the new user profile
          
          setIsAdmin(false);
          setUserRoles({
            isAdmin: false,
            profileRoles: {},
            isLoading: false,
            error: null
          });
        }
      } catch (error) {
        console.error('[Supabase Auth Context] Error with user profile:', error);
        // If there's an error, still set basic user state
        setIsAdmin(false);
        setUserProfile(null); // Clear user profile on error
        setUserRoles({
          isAdmin: false,
          profileRoles: {},
          isLoading: false,
          error: null
        });
      }
    } catch (error) {
      console.error('[Supabase Auth Context] Error loading user data:', error);
      setUserProfile(null); // Clear user profile on error
      setUserRoles({
        isAdmin: false,
        profileRoles: {},
        isLoading: false,
        error: error as Error
      });
    }
  };

  const signIn = async (data: SignInFormData) => {
    try {
      setLoading(true);
      setLastError(null);

      const authData = await signInWithEmail(data.email, data.password);
      
      // authData.user should be available after successful sign in
      if (authData && authData.user) {
        console.log('[Supabase Auth Context] Setting user directly after sign in:', authData.user);
        setUser(authData.user);
        await loadUserData(authData.user);
        toast('Signed in successfully', 'success');
      } else {
        throw new Error('No user data received after sign in');
      }

      return { success: true };
    } catch (error) {
      console.error('[Supabase Auth Context] Sign in error:', error);
      setLastError(error as Error);
      
      let errorMessage = 'Failed to sign in';
      if (error instanceof Error) {
        if (error.message.includes('Invalid login credentials')) {
          errorMessage = 'Invalid email or password';
        } else if (error.message.includes('Email not confirmed')) {
          errorMessage = 'Please check your email and confirm your account';
        } else {
          errorMessage = error.message;
        }
      }

      toast(errorMessage, 'error');

      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (data: SignUpFormData) => {
    try {
      setLoading(true);
      setLastError(null);

      const authData = await signUpWithEmail(data.email, data.password);
      
      // Note: authData.user might be null if email confirmation is required
      // We'll create the user profile when they first sign in after confirming email
      toast('Account created successfully! Please check your email to confirm your account.', 'success');

      return { success: true };
    } catch (error) {
      console.error('[Supabase Auth Context] Sign up error:', error);
      setLastError(error as Error);
      
      let errorMessage = 'Failed to create account';
      if (error instanceof Error) {
        if (error.message.includes('User already registered')) {
          errorMessage = 'An account with this email already exists';
        } else if (error.message.includes('Password should be at least')) {
          errorMessage = 'Password must be at least 6 characters long';
        } else {
          errorMessage = error.message;
        }
      }

      toast(errorMessage, 'error');

      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      await supabaseSignOut();
      setUser(null);
      setSession(null);
      setUserProfile(null); // Clear user profile on sign out
      setIsAdmin(false);
      setUserRoles({
        isAdmin: false,
        profileRoles: {},
        isLoading: false,
        error: null
      });
      
      toast('Signed out successfully', 'success');
      
      router.push('/auth/login');
    } catch (error) {
      console.error('[Supabase Auth Context] Sign out error:', error);
      setLastError(error as Error);
      
      toast('Error signing out', 'error');
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) throw error;

      toast('Password reset email sent. Please check your inbox.', 'success');

      return { success: true };
    } catch (error) {
      console.error('[Supabase Auth Context] Reset password error:', error);
      setLastError(error as Error);
      
      toast('Error sending password reset email', 'error');

      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  };

  const updatePassword = async (password: string) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) throw error;

      toast('Password updated successfully', 'success');

      return { success: true };
    } catch (error) {
      console.error('[Supabase Auth Context] Update password error:', error);
      setLastError(error as Error);
      
      toast('Error updating password', 'error');

      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  };

  const updateEmail = async (email: string) => {
    try {
      const { error } = await supabase.auth.updateUser({
        email: email
      });

      if (error) throw error;

      toast('Email update request sent. Please check your email to confirm.', 'success');

      return { success: true };
    } catch (error) {
      console.error('[Supabase Auth Context] Update email error:', error);
      setLastError(error as Error);
      
      toast('Error updating email', 'error');

      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  };

  const updateProfile = async (data: Partial<UserProfile>) => {
    try {
      if (!user) throw new Error('No user logged in');

      const { error } = await userService.updateUserProfile(user.id, {
        display_name: data.displayName,
        photo_url: data.photoURL,
        updatedAt: new Date().toISOString()
      });

      if (error) throw error;

      toast('Profile updated successfully', 'success');

      return { success: true };
    } catch (error) {
      console.error('[Supabase Auth Context] Update profile error:', error);
      setLastError(error as Error);
      
      toast('Error updating profile', 'error');

      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  };

  const value: AuthContextType = {
    user,
    session,
    loading,
    initializing,
    lastError,
    isAdmin,
    userProfile, // Add userProfile to the context value
    userRoles,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
    updateEmail,
    updateProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useSupabaseAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useSupabaseAuth must be used within a SupabaseAuthProvider');
  }
  return context;
} 