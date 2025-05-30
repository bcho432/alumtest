import { User, UserCredential } from 'firebase/auth';

// Mock user and credentials
const mockUser = {
  uid: 'test-uid',
  email: 'test@example.com',
  emailVerified: true,
  isAnonymous: false,
  metadata: {},
  phoneNumber: null,
  photoURL: null,
  displayName: null,
  providerData: [],
  providerId: 'password',
  refreshToken: 'test-refresh-token',
  tenantId: null,
  delete: () => Promise.resolve(),
  getIdToken: () => Promise.resolve('mock-token'),
  getIdTokenResult: () => Promise.resolve({
    authTime: new Date().toISOString(),
    claims: {},
    expirationTime: new Date(Date.now() + 3600 * 1000).toISOString(),
    issuedAtTime: new Date().toISOString(),
    signInProvider: 'password',
    signInSecondFactor: null,
    token: 'mock-token',
  }),
  reload: () => Promise.resolve(),
  toJSON: () => ({}),
} as User;

const mockUserCredential = {
  user: mockUser,
  providerId: 'password',
  operationType: 'signIn',
} as UserCredential;

// Auth mock
const mockAuth = {
  currentUser: null,
  onAuthStateChanged: jest.fn((callback) => {
    callback(null);
    return () => {};
  }),
  signInWithEmailAndPassword: jest.fn(() => Promise.resolve(mockUserCredential)),
  createUserWithEmailAndPassword: jest.fn(() => Promise.resolve(mockUserCredential)),
  signOut: jest.fn(() => Promise.resolve()),
  updateProfile: jest.fn(() => Promise.resolve()),
  updateEmail: jest.fn(() => Promise.resolve()),
  updatePassword: jest.fn(() => Promise.resolve()),
  sendPasswordResetEmail: jest.fn(() => Promise.resolve()),
  confirmPasswordReset: jest.fn(() => Promise.resolve()),
};

// Firestore mock
const mockDb = {
  collection: jest.fn((path) => ({
    doc: jest.fn((id) => ({
      get: jest.fn(() => Promise.resolve({ exists: true, data: () => ({}) })),
      set: jest.fn(() => Promise.resolve()),
      update: jest.fn(() => Promise.resolve()),
      delete: jest.fn(() => Promise.resolve()),
      onSnapshot: jest.fn((callback) => {
        callback({ exists: true, data: () => ({}) });
        return () => {};
      }),
    })),
    where: jest.fn(() => ({
      get: jest.fn(() => Promise.resolve({ docs: [] })),
    })),
    get: jest.fn(() => Promise.resolve({ docs: [] })),
    add: jest.fn(() => Promise.resolve({ id: 'mock-doc-id' })),
  })),
  batch: jest.fn(() => ({
    set: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    commit: jest.fn(() => Promise.resolve()),
  })),
  runTransaction: jest.fn((callback) => 
    Promise.resolve(callback({ get: () => Promise.resolve({}) }))),
};

// Storage mock
const mockStorage = {
  ref: jest.fn((path) => ({
    put: jest.fn(() => Promise.resolve()),
    getDownloadURL: jest.fn(() => Promise.resolve('https://test-url.com/image.jpg')),
    delete: jest.fn(() => Promise.resolve()),
    listAll: jest.fn(() => Promise.resolve({ items: [] })),
  })),
};

// Functions mock
const mockFunctions = {
  httpsCallable: jest.fn((name) => () => Promise.resolve({ data: {} })),
};

// Analytics mock
const mockAnalytics = null;

// Firebase services mock
const mockServices = {
  app: {},
  auth: mockAuth,
  db: mockDb,
  storage: mockStorage,
  functions: mockFunctions,
  analytics: mockAnalytics,
};

// Export all mocks
export {
  mockUser,
  mockUserCredential,
  mockAuth,
  mockDb,
  mockStorage,
  mockFunctions,
  mockAnalytics,
  mockServices,
};

// Export mock functions
export const getAuth = jest.fn(() => mockAuth);
export const signInWithEmailAndPassword = jest.fn(() => Promise.resolve(mockUserCredential));
export const createUserWithEmailAndPassword = jest.fn(() => Promise.resolve(mockUserCredential));
export const signOut = jest.fn(() => Promise.resolve());
export const sendPasswordResetEmail = jest.fn(() => Promise.resolve());
export const updatePassword = jest.fn(() => Promise.resolve());
export const updateEmail = jest.fn(() => Promise.resolve());
export const updateProfile = jest.fn(() => Promise.resolve());
export const onAuthStateChanged = jest.fn((auth, callback) => {
  callback(null);
  return () => {};
});

// Firestore exports
export const getFirestore = jest.fn(() => mockDb);
export const collection = jest.fn((db, path) => mockDb.collection(path));
export const doc = jest.fn((db, path, id) => mockDb.collection(path).doc(id));
export const getDoc = jest.fn(() => Promise.resolve({ exists: true, data: () => ({}) }));
export const getDocs = jest.fn(() => Promise.resolve({ docs: [] }));
export const setDoc = jest.fn(() => Promise.resolve());
export const updateDoc = jest.fn(() => Promise.resolve());
export const deleteDoc = jest.fn(() => Promise.resolve());
export const onSnapshot = jest.fn((doc, callback) => {
  callback({ exists: true, data: () => ({}) });
  return () => {};
});
export const query = jest.fn(() => ({}));
export const where = jest.fn(() => ({}));
export const orderBy = jest.fn(() => ({}));
export const limit = jest.fn(() => ({}));
export const startAfter = jest.fn(() => ({}));
export const endBefore = jest.fn(() => ({}));
export const batch = jest.fn(() => mockDb.batch());
export const runTransaction = jest.fn((db, callback) => mockDb.runTransaction(callback));
export const serverTimestamp = jest.fn(() => 'mock-timestamp');
export const Timestamp = {
  now: jest.fn(() => 'mock-timestamp'),
  fromDate: jest.fn((date) => 'mock-timestamp'),
  fromMillis: jest.fn((millis) => 'mock-timestamp'),
};
export const addDoc = jest.fn(() => Promise.resolve({ id: 'mock-doc-id' }));

// Storage exports
export const getStorage = jest.fn(() => mockStorage);
export const ref = jest.fn((storage, path) => mockStorage.ref(path));
export const uploadBytes = jest.fn(() => Promise.resolve());
export const getDownloadURL = jest.fn(() => Promise.resolve('https://test-url.com/image.jpg'));
export const deleteObject = jest.fn(() => Promise.resolve());
export const listAll = jest.fn(() => Promise.resolve({ items: [] }));

// Functions exports
export const getFunctions = jest.fn(() => mockFunctions);
export const httpsCallable = jest.fn((functions, name) => mockFunctions.httpsCallable(name));

// Analytics exports
export const getAnalytics = jest.fn(() => mockAnalytics);
export const isSupported = jest.fn(() => Promise.resolve(false));

// App exports
export const initializeApp = jest.fn(() => ({}));
export const getApp = jest.fn(() => ({}));
export const getApps = jest.fn(() => [{}]); 