// Mock Firebase services
const mockFirebaseServices = {
  app: {
    name: '[DEFAULT]',
    options: {},
  },
  auth: {
    currentUser: null,
    signInWithEmailAndPassword: jest.fn(),
    createUserWithEmailAndPassword: jest.fn(),
    signOut: jest.fn(),
    onAuthStateChanged: jest.fn(),
    updateProfile: jest.fn(),
    sendPasswordResetEmail: jest.fn(),
    GoogleAuthProvider: jest.fn(),
    signInWithPopup: jest.fn(),
  },
  firestore: {
    collection: jest.fn(),
    doc: jest.fn(),
    getDoc: jest.fn(),
    getDocs: jest.fn(),
    setDoc: jest.fn(),
    updateDoc: jest.fn(),
    deleteDoc: jest.fn(),
    query: jest.fn(),
    where: jest.fn(),
    orderBy: jest.fn(),
    limit: jest.fn(),
    startAfter: jest.fn(),
    endBefore: jest.fn(),
    Timestamp: {
      now: () => ({ toDate: () => new Date() }),
      fromDate: (date) => ({ toDate: () => date }),
    },
  },
  storage: {
    ref: jest.fn(),
    uploadBytes: jest.fn(),
    getDownloadURL: jest.fn(),
    deleteObject: jest.fn(),
  },
  functions: {
    httpsCallable: jest.fn(),
  },
};

// Mock Firebase Auth
const mockAuth = {
  ...mockFirebaseServices.auth,
  currentUser: {
    uid: 'test-uid',
    email: 'test@example.com',
    displayName: 'Test User',
    photoURL: null,
  },
};

// Mock Firebase Firestore
const mockFirestore = {
  ...mockFirebaseServices.firestore,
  collection: jest.fn(() => ({
    doc: jest.fn(),
    where: jest.fn(),
    orderBy: jest.fn(),
    limit: jest.fn(),
    get: jest.fn(),
  })),
  doc: jest.fn(() => ({
    get: jest.fn(),
    set: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  })),
};

// Mock Firebase Storage
const mockStorage = {
  ...mockFirebaseServices.storage,
  ref: jest.fn(() => ({
    put: jest.fn(),
    getDownloadURL: jest.fn(),
    delete: jest.fn(),
  })),
};

// Mock Firebase Functions
const mockFunctions = {
  ...mockFirebaseServices.functions,
  httpsCallable: jest.fn(() => jest.fn()),
};

// Mock getFirebaseServices
const mockGetFirebaseServices = jest.fn(() => Promise.resolve({
  app: mockFirebaseServices.app,
  auth: mockAuth,
  firestore: mockFirestore,
  storage: mockStorage,
  functions: mockFunctions,
}));

// Mock Firebase initialization
const mockInitializeApp = jest.fn(() => mockFirebaseServices.app);
const mockGetApps = jest.fn(() => []);
const mockGetApp = jest.fn(() => mockFirebaseServices.app);

// Mock all Firebase entry points
jest.mock('@/lib/firebase', () => ({
  getFirebaseServices: mockGetFirebaseServices,
  initializeApp: mockInitializeApp,
  getApps: mockGetApps,
  getApp: mockGetApp,
}));

jest.mock('@/config/firebase', () => ({
  getFirebaseServices: mockGetFirebaseServices,
  initializeApp: mockInitializeApp,
  getApps: mockGetApps,
  getApp: mockGetApp,
}));

jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(() => mockAuth),
  signInWithEmailAndPassword: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
  onAuthStateChanged: jest.fn(),
  updateProfile: jest.fn(),
  sendPasswordResetEmail: jest.fn(),
  GoogleAuthProvider: jest.fn(),
  signInWithPopup: jest.fn(),
}));

jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(() => mockFirestore),
  collection: jest.fn(),
  doc: jest.fn(),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  setDoc: jest.fn(),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  limit: jest.fn(),
  startAfter: jest.fn(),
  endBefore: jest.fn(),
  Timestamp: {
    now: () => ({ toDate: () => new Date() }),
    fromDate: (date) => ({ toDate: () => date }),
  },
}));

jest.mock('firebase/storage', () => ({
  getStorage: jest.fn(() => mockStorage),
  ref: jest.fn(),
  uploadBytes: jest.fn(),
  getDownloadURL: jest.fn(),
  deleteObject: jest.fn(),
}));

jest.mock('firebase/functions', () => ({
  getFunctions: jest.fn(() => mockFunctions),
  httpsCallable: jest.fn(),
}));

// Export mock services and functions for use in tests
module.exports = {
  mockFirebaseServices,
  mockAuth,
  mockFirestore,
  mockStorage,
  mockFunctions,
  mockGetFirebaseServices,
  mockInitializeApp,
  mockGetApps,
  mockGetApp,
}; 