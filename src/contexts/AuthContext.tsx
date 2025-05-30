'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  User as FirebaseUser,
  Auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { firebaseAuth, firebaseDb, getDb } from '@/lib/firebase';
import { validateEmail, validatePassword, checkRateLimit, resetRateLimit } from '@/lib/validation';
import { FirebaseError } from 'firebase/app';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/use-toast';
import type { AuthContextType, SignUpFormData, SignInFormData, UserRoles, UserProfile } from '@/types/auth';

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

const STORIATS_ADMIN_EMAILS = [
  'matthew.bo@storiats.com',
  'derek.lee@storiats.com',
  'justin.lontoh@storiats.com'
];

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [auth, setAuth] = useState<Auth | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
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

  // Handle initial auth state with error recovery
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (!firebaseAuth) {
          console.error('Firebase Auth is not initialized. Please check your environment variables.');
          setInitializing(false);
          setLoading(false);
          return;
        }

        setAuth(firebaseAuth);

        return onAuthStateChanged(firebaseAuth, async (user) => {
          console.log('Auth state changed:', user?.uid);
          setUser(user);
          
          if (user) {
            const db = await getDb();
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            if (userDoc.exists()) {
              const userData = userDoc.data();
              const isUserAdmin = userData.isAdmin || STORIATS_ADMIN_EMAILS.includes(user.email || '');
              setIsAdmin(isUserAdmin);
              setUserRoles({
                isAdmin: isUserAdmin,
                profileRoles: userData.profileRoles || {},
                isLoading: false,
                error: null
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
  }, []);

  const signIn = async (data: SignInFormData) => {
    if (!firebaseAuth) {
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
      const userCredential = await signInWithEmailAndPassword(firebaseAuth, data.email, data.password);
      // Reset rate limit on successful sign in
      resetRateLimit(`signin_${data.email}`);
      
      // Check admin status
      const db = await getDb();
      const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setIsAdmin(userData.isAdmin || STORIATS_ADMIN_EMAILS.includes(userCredential.user.email || ''));
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

  const signUp = async (data: SignUpFormData): Promise<FirebaseUser> => {
    if (!firebaseAuth) {
      throw new Error('Firebase Auth is not initialized. Please check your environment variables.');
    }

    // Validate inputs
    const emailError = validateEmail(data.email);
    if (emailError) throw new Error(emailError);

    const passwordError = validatePassword(data.password);
    if (passwordError) throw new Error(passwordError);

    // Check rate limiting
    const rateLimitResult = checkRateLimit(`signup_${data.email}`);
    if (!rateLimitResult.allowed) {
      throw new Error(rateLimitResult.message);
    }

    setLoading(true);
    
    try {
      const userCredential = await createUserWithEmailAndPassword(
        firebaseAuth,
        data.email,
        data.password
      );

      const db = await getDb();
      const user = userCredential.user;
      const isUserAdmin = STORIATS_ADMIN_EMAILS.includes(user.email || '');

      // Create user profile
      await setDoc(doc(db, 'users', user.uid), {
        email: user.email,
        createdAt: new Date(),
        updatedAt: new Date(),
        displayName: data.email.split('@')[0], // Default display name from email
        photoURL: null,
        isAdmin: isUserAdmin
      });

      setIsAdmin(isUserAdmin);

      // Reset rate limit on successful signup
      resetRateLimit(`signup_${data.email}`);
      
      toast('Account created successfully', 'success');
      
      return user;
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
    if (!firebaseAuth) {
      throw new Error('Firebase Auth is not initialized. Please check your environment variables.');
    }

    try {
      await firebaseSignOut(firebaseAuth);
      setUser(null);
      setIsAdmin(false);
    } catch (error) {
      console.error('Error signing out:', error);
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