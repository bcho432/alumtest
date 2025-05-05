import { initializeApp, getApps, getApp as getFirebaseApp } from 'firebase/app';
import { getAuth as getFirebaseAuth } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage as getFirebaseStorage } from 'firebase/storage';
import { getAnalytics as getFirebaseAnalytics, isSupported } from 'firebase/analytics';

// Clean environment variable values
const cleanEnvValue = (value: string | undefined): string | undefined => {
  if (!value) return undefined;
  return value.replace(/["',\s]/g, '');
};

// Get Firebase config from environment variables
const getFirebaseConfig = () => {
  // For client-side, use NEXT_PUBLIC_ prefixed variables
  const config = {
    apiKey: cleanEnvValue(process.env.NEXT_PUBLIC_FIREBASE_API_KEY),
    authDomain: cleanEnvValue(process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN),
    projectId: cleanEnvValue(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID),
    storageBucket: cleanEnvValue(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET),
    messagingSenderId: cleanEnvValue(process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID),
    appId: cleanEnvValue(process.env.NEXT_PUBLIC_FIREBASE_APP_ID),
    measurementId: cleanEnvValue(process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID)
  };

  // Log config check (without sensitive values)
  console.log('Firebase config check:', {
    hasApiKey: !!config.apiKey,
    hasAuthDomain: !!config.authDomain,
    hasProjectId: !!config.projectId,
    hasStorageBucket: !!config.storageBucket,
    hasMessagingSenderId: !!config.messagingSenderId,
    hasAppId: !!config.appId,
    hasMeasurementId: !!config.measurementId
  });

  return config;
};

type FirebaseServices = {
  app: ReturnType<typeof getFirebaseApp>;
  auth: ReturnType<typeof getFirebaseAuth>;
  db: ReturnType<typeof getFirestore>;
  storage: ReturnType<typeof getFirebaseStorage>;
  analytics: ReturnType<typeof getFirebaseAnalytics> | null;
};

let firebaseInstance: FirebaseServices | null = null;

// Initialize Firebase
const initializeFirebase = (): FirebaseServices | null => {
  if (firebaseInstance) {
    return firebaseInstance;
  }

  const config = getFirebaseConfig();
  
  // Initialize Firebase only if we have the required config
  if (!config.apiKey || !config.authDomain || !config.projectId) {
    console.error('Missing required Firebase configuration');
    return null;
  }

  // Initialize Firebase app
  const app = getApps().length ? getFirebaseApp() : initializeApp(config);
  
  // Initialize services
  const auth = getFirebaseAuth(app);
  const db = getFirestore(app);
  const storage = getFirebaseStorage(app);
  
  // Initialize analytics only on client side and if supported
  let analytics = null;
  if (typeof window !== 'undefined') {
    isSupported().then(yes => yes && (analytics = getFirebaseAnalytics(app)));
  }

  // After initializing Firestore but before exporting it
  // Check if we're in development mode and connect to emulator
  // DISABLED: Using production Firebase instead of emulators
  /*
  if (process.env.NODE_ENV === 'development') {
    try {
      // Connect to local emulator
      console.log('Connecting to Firestore emulator');
      connectFirestoreEmulator(db, 'localhost', 8080);
      console.log('Connected to Firestore emulator successfully');
    } catch (error) {
      console.error('Failed to connect to Firestore emulator:', error);
    }
  }
  */

  firebaseInstance = { app, auth, db, storage, analytics };
  return firebaseInstance;
};

// Export a function to get Firebase services
export const getFirebaseServices = () => {
  if (!firebaseInstance) {
    firebaseInstance = initializeFirebase();
  }
  if (!firebaseInstance) {
    throw new Error('Firebase services not initialized');
  }
  return firebaseInstance;
};

// Export individual services
export const getApp = () => getFirebaseServices().app;
export const getAuth = () => getFirebaseServices().auth;
export const getDb = () => getFirebaseServices().db;
export const getStorage = () => getFirebaseServices().storage;
export const getAnalytics = () => getFirebaseServices().analytics; 