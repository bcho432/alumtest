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

// Debug: Log raw environment variables
if (typeof window !== 'undefined') {
  console.log('Raw environment variables:', {
    NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    NEXT_PUBLIC_FIREBASE_DATABASE_URL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  });
}

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

// Debug: Log the config (without sensitive values)
if (typeof window !== 'undefined') {
  console.log('Firebase config:', {
    hasApiKey: !!firebaseConfig.apiKey,
    hasAuthDomain: !!firebaseConfig.authDomain,
    hasProjectId: !!firebaseConfig.projectId,
    hasStorageBucket: !!firebaseConfig.storageBucket,
    hasMessagingSenderId: !!firebaseConfig.messagingSenderId,
    hasAppId: !!firebaseConfig.appId,
  });
}

// Initialize Firebase in all environments (browser and Node.js)
let firebaseApp: FirebaseApp | undefined;
let firebaseAuth: Auth | undefined;
let firebaseDb: Firestore | undefined;
let firebaseStorage: FirebaseStorage | undefined;
let firebaseAnalytics: Analytics | null = null;

// Helper function to check if we're in a browser environment
const isBrowser = () => typeof window !== 'undefined';

// Always initialize app, auth, db, storage
if (firebaseConfig.apiKey && firebaseConfig.projectId) {
  try {
    firebaseApp = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    firebaseAuth = getAuth(firebaseApp);
    firebaseDb = getFirestore(firebaseApp);
    firebaseStorage = getStorage(firebaseApp);
  } catch (error) {
    console.error('Error initializing Firebase:', error);
  }
} else {
  console.warn('Firebase not initialized: Missing required configuration');
}

// Only initialize Analytics in the browser
if (isBrowser() && firebaseApp) {
  isSupported().then((supported) => {
    if (supported) {
      firebaseAnalytics = getAnalytics(firebaseApp!);
    }
  });
}

// Helper functions
const getDb = async (): Promise<Firestore> => {
  if (!isBrowser()) {
    throw new Error('Firebase services are not available during server-side rendering');
  }

  if (!firebaseDb) {
    console.error('Firebase Firestore is not initialized. Environment variables:', {
      hasApiKey: !!firebaseConfig.apiKey,
      hasProjectId: !!firebaseConfig.projectId,
      hasAuthDomain: !!firebaseConfig.authDomain,
    });
    throw new Error('Firebase Firestore is not initialized. Please check your environment variables.');
  }
  return firebaseDb;
};

// For backward compatibility
const db = firebaseDb;

// Add getFirebaseServices function
export const getFirebaseServices = async () => {
  // Ensure we're in a browser environment
  if (!isBrowser()) {
    throw new Error('Firebase services are not available during server-side rendering');
  }

  // If Firebase isn't initialized yet, try to initialize it
  if (!firebaseApp) {
    console.log('Firebase not initialized, attempting initialization...');
    try {
      if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
        console.error('Missing required Firebase configuration:', {
          hasApiKey: !!firebaseConfig.apiKey,
          hasProjectId: !!firebaseConfig.projectId,
          hasAuthDomain: !!firebaseConfig.authDomain,
          hasStorageBucket: !!firebaseConfig.storageBucket,
          hasMessagingSenderId: !!firebaseConfig.messagingSenderId,
          hasAppId: !!firebaseConfig.appId,
        });
        throw new Error('Missing required Firebase configuration');
      }

      console.log('Initializing Firebase with config:', {
        projectId: firebaseConfig.projectId,
        authDomain: firebaseConfig.authDomain,
      });
      
      firebaseApp = !getApps().length ? initializeApp(firebaseConfig) : getApp();
      console.log('Firebase app initialized:', !!firebaseApp);
      
      firebaseAuth = getAuth(firebaseApp);
      console.log('Firebase auth initialized:', !!firebaseAuth);
      
      firebaseDb = getFirestore(firebaseApp);
      console.log('Firebase Firestore initialized:', !!firebaseDb);
      
      firebaseStorage = getStorage(firebaseApp);
      console.log('Firebase Storage initialized:', !!firebaseStorage);
      
      // Initialize Analytics conditionally
      const analyticsSupported = await isSupported();
      if (analyticsSupported && firebaseApp) {
        firebaseAnalytics = getAnalytics(firebaseApp);
        console.log('Firebase Analytics initialized:', !!firebaseAnalytics);
      }
    } catch (error) {
      console.error('Error initializing Firebase:', error);
      throw new Error('Failed to initialize Firebase services');
    }
  }

  // Verify all required services are initialized
  if (!firebaseApp || !firebaseAuth || !firebaseDb || !firebaseStorage) {
    console.error('Firebase services not fully initialized:', {
      hasApp: !!firebaseApp,
      hasAuth: !!firebaseAuth,
      hasDb: !!firebaseDb,
      hasStorage: !!firebaseStorage,
    });
    throw new Error('One or more Firebase services failed to initialize');
  }

  console.log('Firebase services successfully retrieved');
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

// Remove duplicate export
// export const firestoreDb = firebaseDb; 