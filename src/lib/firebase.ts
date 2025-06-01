import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { 
  getAuth, 
  Auth, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { getAnalytics, isSupported, Analytics } from 'firebase/analytics';

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase services
let firebaseApp: FirebaseApp | undefined;
let firebaseAuth: Auth | undefined;
let firebaseDb: Firestore | undefined;
let firebaseStorage: FirebaseStorage | undefined;
let firebaseAnalytics: Analytics | null = null;

// Helper function to check if we're in a browser environment
const isBrowser = () => typeof window !== 'undefined';

// Initialize Firebase services
if (firebaseConfig.apiKey && firebaseConfig.projectId) {
  try {
    firebaseApp = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    firebaseAuth = getAuth(firebaseApp);
    firebaseDb = getFirestore(firebaseApp);
    firebaseStorage = getStorage(firebaseApp);

    // Initialize Analytics in browser only
    if (isBrowser()) {
      isSupported().then((supported) => {
        if (supported && firebaseApp) {
          firebaseAnalytics = getAnalytics(firebaseApp);
        }
      });
    }
  } catch (error) {
    console.error('Error initializing Firebase:', error);
  }
}

// Helper functions
const getDb = async (): Promise<Firestore> => {
  if (!isBrowser()) {
    throw new Error('Firebase services are not available during server-side rendering');
  }

  if (!firebaseDb) {
    throw new Error('Firebase Firestore is not initialized');
  }
  return firebaseDb;
};

// For backward compatibility
const db = firebaseDb;

// Get Firebase services
export const getFirebaseServices = async () => {
  if (!isBrowser()) {
    throw new Error('Firebase services are not available during server-side rendering');
  }

  if (!firebaseApp || !firebaseAuth || !firebaseDb || !firebaseStorage) {
    throw new Error('Firebase services not initialized');
  }

  return {
    app: firebaseApp,
    auth: firebaseAuth,
    db: firebaseDb,
    storage: firebaseStorage,
    analytics: firebaseAnalytics
  };
};

// Export Firebase functions and services
export { 
  // Auth functions
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  
  // Firestore
  getFirestore,
  getDb,
  db,
  
  // Storage
  getStorage,
  
  // Analytics
  getAnalytics,
  
  // Initialized instances
  firebaseApp,
  firebaseAuth,
  firebaseDb,
  firebaseStorage,
  firebaseAnalytics
}; 