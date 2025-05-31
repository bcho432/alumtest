import { useState, useLayoutEffect } from 'react';
import { 
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  getDb
} from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { User as FirebaseUser } from 'firebase/auth';

async function assertDb() {
  const db = await getDb();
  if (!db) throw new Error('Firestore is not initialized');
  return db;
}

interface UserData {
  id: string;
  organizationRoles?: {
    admin?: boolean;
    editor?: boolean;
    viewer?: boolean;
  };
  universityAdmins?: string[];
  [key: string]: any;
}

interface User extends FirebaseUser {
  userData?: UserData;
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const auth = getAuth();

  useLayoutEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const db = await assertDb();
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            const userData = { id: userDoc.id, ...userDoc.data() } as UserData;
            setUser({ ...firebaseUser, userData });
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          setUser(firebaseUser);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [auth]);

  const login = async (email: string, password: string) => {
    try {
      const auth = getAuth();
      const result = await signInWithEmailAndPassword(auth, email, password);
      try {
        const db = await assertDb();
        const userDoc = await getDoc(doc(db, 'users', result.user.uid));
        if (userDoc.exists()) {
          const userData = { id: userDoc.id, ...userDoc.data() } as UserData;
          setUser({ ...result.user, userData });
        }
      } catch (error) {
        console.error('Error fetching user data after login:', error);
        setUser(result.user);
      }
      return result;
    } catch (error) {
      console.error('Error logging in:', error);
      throw error;
    }
  };

  const signup = async (email: string, password: string) => {
    try {
      const auth = getAuth();
      const result = await createUserWithEmailAndPassword(auth, email, password);
      try {
        const db = await assertDb();
        const userDoc = await getDoc(doc(db, 'users', result.user.uid));
        if (userDoc.exists()) {
          const userData = { id: userDoc.id, ...userDoc.data() } as UserData;
          setUser({ ...result.user, userData });
        }
      } catch (error) {
        console.error('Error fetching user data after signup:', error);
        setUser(result.user);
      }
      return result;
    } catch (error) {
      console.error('Error signing up:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      const auth = getAuth();
      await signOut(auth);
      setUser(null);
    } catch (error) {
      console.error('Error logging out:', error);
      throw error;
    }
  };

  const isGlobalAdmin = user?.userData?.organizationRoles?.admin === true;
  const isEditor = user?.userData?.organizationRoles?.editor === true;
  const isViewer = user?.userData?.organizationRoles?.viewer === true;

  const isUniversityAdmin = (universityId: string) => {
    return Array.isArray(user?.userData?.universityAdmins) && 
           user.userData.universityAdmins.includes(universityId);
  };

  const hasAnyUniversityAdminRole = Array.isArray(user?.userData?.universityAdmins) && 
                                  user.userData.universityAdmins.length > 0;

  // isAdmin is true if user is either a global admin or has any university admin role
  const isAdmin = isGlobalAdmin || hasAnyUniversityAdminRole;

  return {
    user,
    loading,
    login,
    signup,
    logout,
    isAdmin,
    isGlobalAdmin,
    isEditor,
    isViewer,
    isUniversityAdmin,
    hasAnyUniversityAdminRole
  };
}; 