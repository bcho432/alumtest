'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
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

  const { isStoriatsAdmin } = useStoriatsAdmins();

  useEffect(() => {
    console.log('[Auth Context] Setting up auth state listener');
    
    const setupAuth = async () => {
      const { auth } = await getFirebaseServices();
      if (!auth) {
        console.error('[Auth Context] No auth instance available');
        setLoading(false);
        return;
      }

      const unsubscribe = onAuthStateChanged(auth, (user) => {
        console.log('[Auth Context] Auth state changed:', {
          userId: user?.uid,
          email: user?.email,
          isAnonymous: user?.isAnonymous,
          providerId: user?.providerId
        });
        
        setUser(user);
        setLoading(false);
      });

      return () => {
        console.log('[Auth Context] Cleaning up auth state listener');
        unsubscribe();
      };
    };

    setupAuth();
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const { auth } = await getFirebaseServices();
        if (!auth) {
          throw new Error('Firebase Auth is not initialized');
        }

        return onAuthStateChanged(auth, async (user) => {
          console.log('Auth state changed:', user?.uid);
          setUser(user);
          
          if (user) {
            try {
              const db = await getDb();
              const userDoc = await getDoc(doc(db, 'users', user.uid));
              
              if (userDoc.exists()) {
                const userData = userDoc.data();
                // First check local admin status
                const isLocalAdmin = userData.isAdmin || false;
                
                // Then check Storiats admin status
                const isStoriatsAdminUser = user.email ? isStoriatsAdmin(user.email.toLowerCase()) : false;
                
                const isUserAdmin = isLocalAdmin || isStoriatsAdminUser;
                
                console.log('Admin status check:', {
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
                console.warn('User document not found for:', user.uid);
                setIsAdmin(false);
                setUserRoles({
                  isAdmin: false,
                  profileRoles: {},
                  isLoading: false,
                  error: new Error('User profile not found')
                });
              }
            } catch (error) {
              console.error('Error checking admin status:', error);
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
        console.error('Error initializing auth:', error);
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
  }, [isStoriatsAdmin]);

  const signIn = async (data: SignInFormData) => {
    const { auth } = await getFirebaseServices();
    if (!auth) {
      throw new Error('Firebase Auth is not initialized. Please check your environment variables.');
    }

    // Validate inputs
    const emailError = validateEmail(data.email);
    if (emailError) throw new Error(emailError);

    // Check rate limiting
    const rateLimitResult = checkRateLimit(`signin_${data.email}`);
    if (!rateLimitResult.allowed) {
      throw new Error(rateLimitResult.message);
    }

    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, data.email, data.password);
      // Reset rate limit on successful sign in
      resetRateLimit(`signin_${data.email}`);
      
      // Check admin status
      const db = await getDb();
      const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setIsAdmin(userData.isAdmin || isStoriatsAdmin(userCredential.user.email?.toLowerCase() || ''));
      }
      
      return userCredential.user;
    } catch (error) {
      console.error('Sign in error:', error);
      if (error instanceof FirebaseError) {
        throw new Error(error.message);
      }
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (data: SignUpFormData) => {
    const { auth } = await getFirebaseServices();
    if (!auth) {
      throw new Error('Firebase Auth is not initialized. Please check your environment variables.');
    }

    // Validate inputs
    const emailError = validateEmail(data.email);
    if (emailError) throw new Error(emailError);

    // Check rate limiting
    const rateLimitResult = checkRateLimit(`signup_${data.email}`);
    if (!rateLimitResult.allowed) {
      throw new Error(rateLimitResult.message);
    }

    setLoading(true);
    try {
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
      
      return userCredential.user;
    } catch (error) {
      console.error('Sign up error:', error);
      if (error instanceof FirebaseError) {
        throw new Error(error.message);
      }
      throw error;
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
    return Promise.resolve();
  };

  const updatePassword = async (password: string) => {
    // Implement your update password logic here
    return Promise.resolve();
  };

  const updateEmail = async (email: string) => {
    // Implement your update email logic here
    return Promise.resolve();
  };

  const updateProfile = async (data: Partial<UserProfile>) => {
    // Implement your update profile logic here
    return Promise.resolve();
  };

  const value = {
    user,
    loading,
    error: lastError,
    isAdmin,
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