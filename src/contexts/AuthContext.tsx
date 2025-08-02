'use client';

import { createContext, useContext, useState, useLayoutEffect, ReactNode } from 'react';
import { 
  User as FirebaseUser,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { getDb, getFirebaseServices } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/use-toast';
import type { AuthContextType, SignUpFormData, SignInFormData, UserRoles, UserProfile } from '@/types/auth';
import { useStoriatsAdmins } from '@/hooks/useStoriatsAdmins';
import { validateEmail, checkRateLimit, resetRateLimit } from '@/lib/validation';
import { FirebaseError } from 'firebase/app';

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [initializing, setInitializing] = useState(true);
  const [lastError, setLastError] = useState<Error | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userRoles, setUserRoles] = useState<UserRoles>({
    isAdmin: false,
    profileRoles: {},
    isLoading: true,
    error: null
  });
  const router = useRouter();
  const { toast } = useToast();

  const { isStoriatsAdmin, loading: storiatsAdminsLoading, error: storiatsAdminsError } = useStoriatsAdmins();

  useLayoutEffect(() => {
    console.log('[Auth Context] Setting up auth state listener');
    
    const initAuth = async () => {
      try {
        const { auth } = await getFirebaseServices();
        if (!auth) {
          throw new Error('Firebase Auth is not initialized');
        }

        return onAuthStateChanged(auth, async (user) => {
          console.log('[Auth Context] Auth state changed:', {
            userId: user?.uid,
            email: user?.email,
            isAnonymous: user?.isAnonymous,
            providerId: user?.providerId
          });
          
          setUser(user);
          
          if (user) {
            try {
              const db = await getDb();
              const userDoc = await getDoc(doc(db, 'users', user.uid));
              
              // Wait for admin settings to load
              if (storiatsAdminsLoading) {
                console.log('[Auth Context] Waiting for admin settings to load...');
                setLoading(true);
                return;
              }
              if (storiatsAdminsError) {
                console.error('[Auth Context] Error loading admin settings:', storiatsAdminsError);
                setIsAdmin(false);
                setUserRoles({
                  isAdmin: false,
                  profileRoles: {},
                  isLoading: false,
                  error: storiatsAdminsError
                });
                setLoading(false);
                setInitializing(false);
                return;
              }

              if (userDoc.exists()) {
                const userData = userDoc.data();
                // First check local admin status
                const isLocalAdmin = userData.isAdmin || false;
                // Then check Storiats admin status
                const isStoriatsAdminUser = user.email ? isStoriatsAdmin(user.email.toLowerCase()) : false;
                const isUserAdmin = isLocalAdmin || isStoriatsAdminUser;
                console.log('[Auth Context] Admin status check:', {
                  email: user.email,
                  isLocalAdmin,
                  isStoriatsAdminUser,
                  isUserAdmin
                });
                setIsAdmin(isUserAdmin);
                setUserRoles({
                  isAdmin: isUserAdmin,
                  profileRoles: userData.profileRoles || {},
                  isLoading: false,
                  error: null
                });
              } else {
                // Handle case where user document doesn't exist
                console.warn('[Auth Context] User document not found for:', user.uid);
                setIsAdmin(false);
                setUserRoles({
                  isAdmin: false,
                  profileRoles: {},
                  isLoading: false,
                  error: new Error('User profile not found')
                });
              }
            } catch (error) {
              console.error('[Auth Context] Error checking admin status:', error);
              setIsAdmin(false);
              setUserRoles({
                isAdmin: false,
                profileRoles: {},
                isLoading: false,
                error: error instanceof Error ? error : new Error('Failed to check admin status')
              });
            }
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
        });
      } catch (error) {
        console.error('[Auth Context] Error initializing auth:', error);
        setInitializing(false);
        setLoading(false);
        setLastError(error instanceof Error ? error : new Error('Failed to initialize auth'));
        setUserRoles((prev: UserRoles) => ({
          ...prev,
          isLoading: false,
          error: error instanceof Error ? error : new Error('Failed to initialize auth')
        }));
      }
    };

    const unsubscribe = initAuth();
    return () => {
      if (unsubscribe) {
        unsubscribe.then(unsub => unsub && unsub());
      }
    };
  }, [isStoriatsAdmin, storiatsAdminsLoading, storiatsAdminsError]);

  const signIn = async (data: SignInFormData) => {
    setLoading(true);
    setLastError(null);

    try {
      const { auth } = await getFirebaseServices();
      if (!auth) {
        throw new Error('Firebase Auth is not initialized');
      }
      
      const userCredential = await signInWithEmailAndPassword(auth, data.email, data.password);
      // Reset rate limit on successful sign in
      resetRateLimit(`signin_${data.email}`);
      
      return { success: true };
    } catch (error) {
      console.error('Sign in error:', error);
      if (error instanceof FirebaseError) {
        setLastError(new Error(error.message));
        return { success: false, error: error.message };
      }
      setLastError(new Error('Sign in failed'));
      return { success: false, error: 'Sign in failed' };
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (data: SignUpFormData) => {
    setLoading(true);
    setLastError(null);

    try {
      const { auth } = await getFirebaseServices();
      if (!auth) {
        throw new Error('Firebase Auth is not initialized');
      }
      
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      // Reset rate limit on successful sign up
      resetRateLimit(`signup_${data.email}`);
      
      // Create user document
      const db = await getDb();
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        email: data.email,
        isAdmin: false,
        profileRoles: {},
        createdAt: new Date()
      });
      
      return { success: true };
    } catch (error) {
      console.error('Sign up error:', error);
      if (error instanceof FirebaseError) {
        setLastError(new Error(error.message));
        return { success: false, error: error.message };
      }
      setLastError(new Error('Sign up failed'));
      return { success: false, error: 'Sign up failed' };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    const { auth } = await getFirebaseServices();
    if (!auth) {
      throw new Error('Firebase Auth is not initialized');
    }

    try {
      await firebaseSignOut(auth);
      setUser(null);
      setIsAdmin(false);
      setUserRoles({
        isAdmin: false,
        profileRoles: {},
        isLoading: false,
        error: null
      });
    } catch (error) {
      console.error('Sign out error:', error);
      if (error instanceof FirebaseError) {
        throw new Error(error.message);
      }
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    // Implement your reset password logic here
    return { success: true };
  };

  const updatePassword = async (password: string) => {
    // Implement your update password logic here
    return { success: true };
  };

  const updateEmail = async (email: string) => {
    // Implement your update email logic here
    return { success: true };
  };

  const updateProfile = async (data: Partial<UserProfile>) => {
    // Implement your update profile logic here
    return { success: true };
  };

  const value = {
    user,
    session: null, // Add missing session property
    loading,
    initializing: loading, // Add missing initializing property
    error: lastError,
    lastError, // Add missing lastError property
    isAdmin,
    userProfile: null, // Add missing userProfile property
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
    updateEmail,
    updateProfile,
    userRoles
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