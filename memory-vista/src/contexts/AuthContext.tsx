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

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, organizationName: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const auth = getAuth();
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signUp = async (email: string, password: string, organizationName: string) => {
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
    } catch (error) {
      console.error("Error in signup process:", {
        error,
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  };

  const signOut = async () => {
    const auth = getAuth();
    await firebaseSignOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
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