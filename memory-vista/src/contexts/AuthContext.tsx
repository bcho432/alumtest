'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { getAuth, getDb } from '@/lib/firebase';

export interface UserRoles {
  isUniversityAdmin: boolean;
  universityAdminFor: string[]; // Array of university IDs
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  userRoles: UserRoles | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, organizationName: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUserRoles: () => Promise<void>;
}

const defaultUserRoles: UserRoles = {
  isUniversityAdmin: false,
  universityAdminFor: [],
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [initializing, setInitializing] = useState(true);
  const [userRoles, setUserRoles] = useState<UserRoles | null>(null);

  // Load user roles when user changes
  const loadUserRoles = async (user: User | null) => {
    if (!user) {
      setUserRoles(null);
      return;
    }

    try {
      const db = getDb();
      
      // Check if user is a university admin
      const universityRef = doc(db, 'universities', user.uid);
      const universityDoc = await getDoc(universityRef);
      
      const roles: UserRoles = {
        isUniversityAdmin: universityDoc.exists(),
        universityAdminFor: universityDoc.exists() ? [user.uid] : [],
      };
      
      // In future: we could check other roles here
      
      setUserRoles(roles);
    } catch (error) {
      console.error('Error loading user roles:', error);
      setUserRoles(defaultUserRoles);
    }
  };

  // Refresh user roles (can be called after changes)
  const refreshUserRoles = async () => {
    await loadUserRoles(user);
  };

  // Handle initial auth state
  useEffect(() => {
    const auth = getAuth();
    setInitializing(true);
    
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('Auth state changed:', user?.uid);
      setUser(user);
      
      // Load user roles
      await loadUserRoles(user);
      
      setLoading(false);
      setInitializing(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      const auth = getAuth();
      await signInWithEmailAndPassword(auth, email, password);
      // Auth state change will trigger role loading
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const signUp = async (email: string, password: string, organizationName: string) => {
    setLoading(true);
    console.log("Starting signup process:", { email, organizationName });
    const auth = getAuth();
    const db = getDb();
    
    try {
      // Create user account
      console.log("Creating user account...");
      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      console.log("User account created:", { uid: user.uid, email: user.email });
      
      // Wait for user to be fully authenticated
      console.log("Waiting for full authentication...");
      await new Promise((resolve) => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
          if (user) {
            console.log("User fully authenticated:", user.uid);
            unsubscribe();
            resolve(user);
          }
        });
      });
      
      // Create university document
      const universityRef = doc(db, 'universities', user.uid);
      console.log("Creating university document:", { path: universityRef.path });
      
      const universityData = {
        id: user.uid,
        email: user.email,
        name: organizationName,
        adminIds: [user.uid],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      console.log("University document data:", universityData);
      await setDoc(universityRef, universityData);
      console.log("University document created successfully");
      
      // Verify the document was created
      const verifyDoc = await getDoc(universityRef);
      console.log("University document verification:", { 
        exists: verifyDoc.exists(),
        data: verifyDoc.data()
      });
      
      // Update user roles
      await refreshUserRoles();
    } catch (error) {
      console.error("Error in signup process:", {
        error,
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      setLoading(false);
      throw error;
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      const auth = getAuth();
      await firebaseSignOut(auth);
      // Auth state change will update user state
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  // If we're initializing, show nothing
  if (initializing) {
    return null;
  }

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      userRoles, 
      signIn, 
      signUp, 
      signOut, 
      refreshUserRoles 
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