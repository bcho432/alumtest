import fetch from 'node-fetch';
import { Request, Headers } from 'node-fetch';
import '@testing-library/jest-dom';
import { FirebaseError } from 'firebase/app';
import { User } from 'firebase/auth';
import { MockServices } from './types/mock-services';

// Assign fetch, Request, Headers to global
(global as any).fetch = fetch as any;
(global as any).Request = Request as any;
(global as any).Headers = Headers as any;

// Mock Firebase modules
jest.mock('firebase/app', () => ({
  initializeApp: jest.fn(() => ({})),
  getApp: jest.fn(() => ({})),
  getApps: jest.fn(() => [{}]),
  FirebaseError: class extends Error {
    code: string;
    constructor(code: string, message: string) {
      super(message);
      this.name = 'FirebaseError';
      this.code = code;
    }
  }
}));

jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(() => ({
    currentUser: null,
    onAuthStateChanged: jest.fn((callback) => {
      callback(null);
      return () => {};
    }),
    signInWithEmailAndPassword: jest.fn(() => Promise.resolve({ user: {} })),
    createUserWithEmailAndPassword: jest.fn(() => Promise.resolve({ user: {} })),
    signOut: jest.fn(() => Promise.resolve()),
    updateProfile: jest.fn(() => Promise.resolve()),
    updateEmail: jest.fn(() => Promise.resolve()),
    updatePassword: jest.fn(() => Promise.resolve()),
    sendPasswordResetEmail: jest.fn(() => Promise.resolve()),
  })),
  signInWithEmailAndPassword: jest.fn(() => Promise.resolve({ user: {} })),
  createUserWithEmailAndPassword: jest.fn(() => Promise.resolve({ user: {} })),
  signOut: jest.fn(() => Promise.resolve()),
  sendPasswordResetEmail: jest.fn(() => Promise.resolve()),
  updatePassword: jest.fn(() => Promise.resolve()),
  updateEmail: jest.fn(() => Promise.resolve()),
  updateProfile: jest.fn(() => Promise.resolve()),
  onAuthStateChanged: jest.fn((auth, callback) => {
    callback(null);
    return () => {};
  }),
}));

// --- Firestore Mocks ---
const mockDoc = jest.fn(() => ({
  get: jest.fn(() => Promise.resolve({ exists: true, data: () => ({}) })),
  set: jest.fn(() => Promise.resolve()),
  update: jest.fn(() => Promise.resolve()),
  delete: jest.fn(() => Promise.resolve()),
  onSnapshot: jest.fn((callback) => {
    callback({ exists: true, data: () => ({}) });
    return () => {};
  }),
}));

const mockCollection = jest.fn(() => ({
  doc: mockDoc,
  where: jest.fn(() => ({
    get: jest.fn(() => Promise.resolve({ docs: [] })),
  })),
  get: jest.fn(() => Promise.resolve({ docs: [] })),
  add: jest.fn(() => Promise.resolve({ id: 'mock-doc-id' })),
}));

const mockGetDoc = jest.fn(() => Promise.resolve({ exists: true, data: () => ({}) }));
const mockGetDocs = jest.fn(() => Promise.resolve({ docs: [] }));
const mockSetDoc = jest.fn(() => Promise.resolve());
const mockUpdateDoc = jest.fn(() => Promise.resolve());
const mockDeleteDoc = jest.fn(() => Promise.resolve());
const mockAddDoc = jest.fn(() => Promise.resolve({ id: 'mock-doc-id' }));

jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(() => ({
    collection: mockCollection,
    batch: jest.fn(() => ({
      set: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      commit: jest.fn(() => Promise.resolve()),
    })),
    runTransaction: jest.fn((callback) => Promise.resolve(callback({ get: () => Promise.resolve({}) }))),
  })),
  collection: mockCollection,
  doc: mockDoc,
  getDoc: mockGetDoc,
  getDocs: mockGetDocs,
  setDoc: mockSetDoc,
  updateDoc: mockUpdateDoc,
  deleteDoc: mockDeleteDoc,
  onSnapshot: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  limit: jest.fn(),
  startAfter: jest.fn(),
  endBefore: jest.fn(),
  batch: jest.fn(),
  runTransaction: jest.fn(),
  serverTimestamp: jest.fn(() => 'mock-timestamp'),
  Timestamp: {
    now: jest.fn(() => 'mock-timestamp'),
    fromDate: jest.fn((date) => 'mock-timestamp'),
    fromMillis: jest.fn((millis) => 'mock-timestamp'),
  },
  addDoc: mockAddDoc,
}));

jest.mock('firebase/storage', () => ({
  getStorage: jest.fn(() => ({
    ref: jest.fn((path) => ({
      put: jest.fn(() => Promise.resolve()),
      getDownloadURL: jest.fn(() => Promise.resolve('https://test-url.com/image.jpg')),
      delete: jest.fn(() => Promise.resolve()),
      listAll: jest.fn(() => Promise.resolve({ items: [] })),
    })),
  })),
  ref: jest.fn((storage, path) => storage.ref(path)),
  uploadBytes: jest.fn(() => Promise.resolve()),
  getDownloadURL: jest.fn(() => Promise.resolve('https://test-url.com/image.jpg')),
  deleteObject: jest.fn(() => Promise.resolve()),
  listAll: jest.fn(() => Promise.resolve({ items: [] })),
}));

jest.mock('firebase/functions', () => ({
  getFunctions: jest.fn(() => ({
    httpsCallable: jest.fn((name) => () => Promise.resolve({ data: {} })),
  })),
  httpsCallable: jest.fn((functions, name) => functions.httpsCallable(name)),
}));

jest.mock('firebase/analytics', () => ({
  getAnalytics: jest.fn(() => null),
  isSupported: jest.fn(() => Promise.resolve(false)),
}));

jest.mock('@/config/firebase', () => ({
  getFirebaseServices: jest.fn(() => Promise.resolve({
    app: {},
    auth: {},
    db: {},
    storage: {},
    functions: {},
    analytics: null,
  })),
  initializeFirebase: jest.fn(() => Promise.resolve({
    app: {},
    auth: {},
    db: {},
    storage: {},
    functions: {},
    analytics: null,
  })),
}));

// Mock window.indexedDB
Object.defineProperty(window, 'indexedDB', {
  writable: true,
  value: {
    open: jest.fn(),
    deleteDatabase: jest.fn(),
  },
});

// Mock crypto.randomUUID
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: jest.fn(() => 'mock-uuid'),
  },
});

// Mock IntersectionObserver
Object.defineProperty(window, 'IntersectionObserver', {
  writable: true,
  value: class IntersectionObserver {
    constructor(callback: any) {
      this.callback = callback;
    }
    observe() {}
    unobserve() {}
    disconnect() {}
    private callback: any;
  },
});

// Mock ResizeObserver
Object.defineProperty(window, 'ResizeObserver', {
  writable: true,
  value: class ResizeObserver {
    constructor(callback: any) {
      this.callback = callback;
    }
    observe() {}
    unobserve() {}
    disconnect() {}
    private callback: any;
  },
});

// Mock window.getComputedStyle
Object.defineProperty(window, 'getComputedStyle', {
  writable: true,
  value: jest.fn(() => ({
    getPropertyValue: jest.fn(),
  })),
});

// Mock window.scrollTo
Object.defineProperty(window, 'scrollTo', {
  writable: true,
  value: jest.fn(),
});

// Mock window.alert
Object.defineProperty(window, 'alert', {
  writable: true,
  value: jest.fn(),
});

// Mock window.confirm
Object.defineProperty(window, 'confirm', {
  writable: true,
  value: jest.fn(),
});

// Mock window.prompt
Object.defineProperty(window, 'prompt', {
  writable: true,
  value: jest.fn(),
});

// Mock window.open
Object.defineProperty(window, 'open', {
  writable: true,
  value: jest.fn(),
});

// Mock window.location
Object.defineProperty(window, 'location', {
  writable: true,
  value: {
    href: '',
    assign: jest.fn(),
    replace: jest.fn(),
    reload: jest.fn(),
  },
});

// Mock window.history
Object.defineProperty(window, 'history', {
  writable: true,
  value: {
    pushState: jest.fn(),
    replaceState: jest.fn(),
    go: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
  },
});

// Mock window.navigator
Object.defineProperty(window, 'navigator', {
  writable: true,
  value: {
    userAgent: 'node',
    language: 'en-US',
    languages: ['en-US', 'en'],
    platform: 'node',
    vendor: 'node',
  },
});

// Use a minimal TextEncoder polyfill that matches the expected type
if (typeof global.TextEncoder === 'undefined') {
  global.TextEncoder = class TextEncoder {
    encoding = 'utf-8';
    encode(str: string) {
      const utf8 = unescape(encodeURIComponent(str));
      const arr = new Uint8Array(utf8.length);
      for (let i = 0; i < utf8.length; ++i) arr[i] = utf8.charCodeAt(i);
      return arr;
    }
    encodeInto(str: string, dest: Uint8Array) {
      const arr = this.encode(str);
      dest.set(arr);
      return { read: str.length, written: arr.length };
    }
  } as any;
}

// Suppress console errors that contain 'Warning:' or 'Error:'
const originalConsoleError = console.error;
console.error = (...args: any[]) => {
  if (typeof args[0] === 'string' && (args[0].includes('Warning:') || args[0].includes('Error:'))) {
    return;
  }
  originalConsoleError(...args);
};

// --- Export test helpers for use in tests ---
export const mockUser = {
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
};

export const mockUserCredential = {
  user: mockUser,
  providerId: 'password',
  operationType: 'signIn',
};

export const mockServices: MockServices = {
  app: {},
  auth: {
    currentUser: null,
    onAuthStateChanged: jest.fn((callback: (user: User | null) => void) => {
      callback(null);
      return () => {};
    }),
    signInWithEmailAndPassword: jest.fn(),
    createUserWithEmailAndPassword: jest.fn(),
    signOut: jest.fn()
  },
  db: {
    collection: jest.fn(),
    doc: jest.fn(),
    setDoc: jest.fn(),
    getDoc: jest.fn(),
    query: jest.fn(),
    where: jest.fn(),
    getDocs: jest.fn()
  },
  storage: {},
  functions: {},
  analytics: null,
};