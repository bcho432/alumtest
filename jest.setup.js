// Polyfills for Node.js environment
const { TextEncoder, TextDecoder } = require('util');
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Import Firebase mocks
require('./src/tests/setup/firebase-mocks');

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock IntersectionObserver
class MockIntersectionObserver {
  constructor(callback) {
    this.callback = callback;
  }
  observe = jest.fn();
  unobserve = jest.fn();
  disconnect = jest.fn();
}

Object.defineProperty(window, 'IntersectionObserver', {
  writable: true,
  value: MockIntersectionObserver,
});

// Mock ResizeObserver
class MockResizeObserver {
  constructor(callback) {
    this.callback = callback;
  }
  observe = jest.fn();
  unobserve = jest.fn();
  disconnect = jest.fn();
}

Object.defineProperty(window, 'ResizeObserver', {
  writable: true,
  value: MockResizeObserver,
});

// Mock Request
global.Request = class Request {
  constructor(input, init) {
    if (typeof input === 'string') {
      this.url = input;
    } else if (input instanceof Request) {
      this.url = input.url;
    } else {
      this.url = input.url;
    }
    this.method = init?.method || 'GET';
    this.headers = new Headers(init?.headers);
    this.body = init?.body;
  }
};

// Mock console.error to fail tests
const originalError = console.error;
console.error = (...args) => {
  if (
    typeof args[0] === 'string' &&
    args[0].includes('Warning: ReactDOM.render is no longer supported')
  ) {
    return;
  }
  originalError.call(console, ...args);
};

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

// Mock sessionStorage
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.sessionStorage = sessionStorageMock;

// Mock fetch
global.fetch = jest.fn();

// Mock URL.createObjectURL
global.URL.createObjectURL = jest.fn();

// Mock window.scrollTo
window.scrollTo = jest.fn();

// Mock window.alert
window.alert = jest.fn();

// Mock window.confirm
window.confirm = jest.fn();

// Mock window.prompt
window.prompt = jest.fn();

// Mock window.open
window.open = jest.fn();

// Mock window.location
Object.defineProperty(window, 'location', {
  value: {
    href: '',
    assign: jest.fn(),
    replace: jest.fn(),
    reload: jest.fn(),
  },
  writable: true,
});

// Mock window.history
Object.defineProperty(window, 'history', {
  value: {
    pushState: jest.fn(),
    replaceState: jest.fn(),
    go: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
  },
  writable: true,
});

// Mock window.navigator
Object.defineProperty(window, 'navigator', {
  value: {
    userAgent: 'node',
    language: 'en-US',
    languages: ['en-US', 'en'],
    platform: 'node',
    vendor: 'node',
  },
  writable: true,
});

// Mock window.performance
window.performance = {
  now: jest.fn(() => 0),
  mark: jest.fn(),
  measure: jest.fn(),
  clearMarks: jest.fn(),
  clearMeasures: jest.fn(),
  getEntriesByType: jest.fn(() => []),
  getEntriesByName: jest.fn(() => []),
};

// Mock window.requestAnimationFrame
window.requestAnimationFrame = jest.fn((callback) => setTimeout(callback, 0));
window.cancelAnimationFrame = jest.fn();

// Add custom matchers
require('@testing-library/jest-dom');

// Mock next/router
jest.mock('next/router', () => {
  const mockRouter = {
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    pathname: '/',
    query: {},
    asPath: '/',
    events: {
      on: jest.fn(),
      off: jest.fn(),
      emit: jest.fn(),
    },
  };

  return {
    useRouter: jest.fn(() => mockRouter),
    withRouter: jest.fn((Component) => Component),
    Router: {
      events: mockRouter.events,
    },
  };
});

// Mock next/navigation
jest.mock('next/navigation', () => {
  const mockRouter = {
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    pathname: '/',
    query: {},
    asPath: '/',
  };

  return {
    useRouter: jest.fn(() => mockRouter),
    usePathname: jest.fn(() => '/'),
    useSearchParams: jest.fn(() => new URLSearchParams()),
    useParams: jest.fn(() => ({})),
    useSelectedLayoutSegment: jest.fn(() => null),
    useSelectedLayoutSegments: jest.fn(() => []),
  };
});

// Mock next-auth
jest.mock('next-auth/react', () => ({
  useSession: () => ({
    data: null,
    status: 'unauthenticated',
  }),
  signIn: jest.fn(),
  signOut: jest.fn(),
}));

// Mock firebase/app
jest.mock('firebase/app', () => ({
  initializeApp: jest.fn(() => ({
    name: '[DEFAULT]',
    options: {},
  })),
  getApps: jest.fn(() => []),
  getApp: jest.fn(() => ({
    name: '[DEFAULT]',
    options: {},
  })),
  FirebaseError: class FirebaseError extends Error {
    constructor(code, message) {
      super(message);
      this.code = code;
      this.name = 'FirebaseError';
    }
  },
}));

// Mock firebase/firestore
jest.mock('firebase/firestore', () => {
  const mockFirestore = {
    collection: jest.fn(),
    doc: jest.fn(),
    getDoc: jest.fn(),
    getDocs: jest.fn(),
    setDoc: jest.fn(),
    updateDoc: jest.fn(),
    deleteDoc: jest.fn(),
    addDoc: jest.fn(),
    query: jest.fn(),
    where: jest.fn(),
    orderBy: jest.fn(),
    limit: jest.fn(),
    startAfter: jest.fn(),
    endBefore: jest.fn(),
    writeBatch: jest.fn(),
    serverTimestamp: jest.fn(),
    Timestamp: {
      now: jest.fn(),
      fromDate: jest.fn(),
    },
  };

  return {
    getFirestore: jest.fn(() => mockFirestore),
    collection: jest.fn(),
    doc: jest.fn(),
    getDoc: jest.fn(() => Promise.resolve({
      exists: () => true,
      data: () => ({}),
      id: 'mock-doc-id'
    })),
    getDocs: jest.fn(() => Promise.resolve({
      docs: [],
      empty: true,
      size: 0,
      forEach: jest.fn()
    })),
    setDoc: jest.fn(() => Promise.resolve()),
    updateDoc: jest.fn(() => Promise.resolve()),
    deleteDoc: jest.fn(() => Promise.resolve()),
    addDoc: jest.fn(() => Promise.resolve({ id: 'mock-doc-id' })),
    query: jest.fn(),
    where: jest.fn(),
    orderBy: jest.fn(),
    limit: jest.fn(),
    startAfter: jest.fn(),
    endBefore: jest.fn(),
    writeBatch: jest.fn(() => ({
      update: jest.fn(),
      commit: jest.fn(() => Promise.resolve())
    })),
    serverTimestamp: jest.fn(() => new Date()),
    Timestamp: {
      now: () => ({ toDate: () => new Date() }),
      fromDate: (date) => ({ toDate: () => date })
    }
  };
});

// Mock firebase/auth
jest.mock('firebase/auth', () => {
  const mockAuth = {
    currentUser: null,
    onAuthStateChanged: jest.fn(),
    signInWithEmailAndPassword: jest.fn(),
    createUserWithEmailAndPassword: jest.fn(),
    signOut: jest.fn(),
    updateProfile: jest.fn(),
    sendPasswordResetEmail: jest.fn(),
  };

  return {
    getAuth: jest.fn(() => mockAuth),
    signInWithEmailAndPassword: jest.fn(),
    createUserWithEmailAndPassword: jest.fn(),
    signOut: jest.fn(),
    onAuthStateChanged: jest.fn(),
    updateProfile: jest.fn(),
    sendPasswordResetEmail: jest.fn(),
    GoogleAuthProvider: jest.fn(() => ({
      addScope: jest.fn(),
    })),
    signInWithPopup: jest.fn(),
    signInWithRedirect: jest.fn(),
    getRedirectResult: jest.fn(),
    setPersistence: jest.fn(),
    browserLocalPersistence: jest.fn(),
    browserSessionPersistence: jest.fn(),
    inMemoryPersistence: jest.fn(),
  };
});

// Mock firebase/functions
jest.mock('firebase/functions', () => ({
  getFunctions: jest.fn(() => ({
    app: {},
    region: 'us-central1',
  })),
  httpsCallable: jest.fn(() => jest.fn().mockResolvedValue({ data: {} })),
  connectFunctionsEmulator: jest.fn(),
}));

// Mock firebase/storage
jest.mock('firebase/storage', () => ({
  getStorage: jest.fn(() => ({
    app: {},
    maxOperationRetryTime: 2000,
    maxUploadRetryTime: 10000,
  })),
  ref: jest.fn(() => ({
    bucket: 'mock-bucket',
    fullPath: 'mock-path',
    name: 'mock-name',
    parent: null,
    root: {},
  })),
  uploadBytes: jest.fn(() => Promise.resolve({ ref: {} })),
  getDownloadURL: jest.fn(() => Promise.resolve('mock-url')),
  deleteObject: jest.fn(() => Promise.resolve()),
  listAll: jest.fn(() => Promise.resolve({ items: [], prefixes: [] })),
}));

// Mock @/lib/firebase
jest.mock('@/lib/firebase', () => ({
  getFirebaseServices: jest.fn(() => Promise.resolve({
    app: {},
    auth: {
      currentUser: null,
      onAuthStateChanged: jest.fn(),
    },
    firestore: {
      collection: jest.fn(),
      doc: jest.fn(),
      getDoc: jest.fn(),
      getDocs: jest.fn(),
      setDoc: jest.fn(),
      updateDoc: jest.fn(),
      deleteDoc: jest.fn(),
      addDoc: jest.fn(),
    },
    storage: {},
    functions: {},
  })),
  initializeApp: jest.fn(),
  getApps: jest.fn(() => []),
  getApp: jest.fn(),
}));

// Mock diff-match-patch
jest.mock('diff-match-patch', () => {
  const mockDiff = {
    diff_main: jest.fn((text1, text2) => {
      if (text1 === text2) {
        return [[0, text1]];
      }
      return [[-1, text1], [1, text2]];
    }),
    diff_cleanupSemantic: jest.fn((diffs) => diffs),
    patch_make: jest.fn((text1, text2) => []),
    patch_apply: jest.fn((patches, text) => [text, [true]]),
  };

  return {
    diff_match_patch: jest.fn(() => mockDiff),
  };
});

// Mock Headers
global.Headers = class Headers {
  constructor(init) {
    this.headers = new Map();
    if (init) {
      Object.entries(init).forEach(([key, value]) => {
        this.headers.set(key.toLowerCase(), value);
      });
    }
  }
  get(name) {
    return this.headers.get(name.toLowerCase());
  }
  set(name, value) {
    this.headers.set(name.toLowerCase(), value);
  }
  has(name) {
    return this.headers.has(name.toLowerCase());
  }
};

// Add custom matchers
expect.extend({
  toBeWithinRange(received, floor, ceiling) {
    const pass = received >= floor && received <= ceiling;
    if (pass) {
      return {
        message: () =>
          `expected ${received} not to be within range ${floor} - ${ceiling}`,
        pass: true,
      };
    } else {
      return {
        message: () =>
          `expected ${received} to be within range ${floor} - ${ceiling}`,
        pass: false,
      };
    }
  },
});

// Mock fs.readFileSync for Firestore rules testing
jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  readFileSync: jest.fn().mockReturnValue(`
    rules_version = '2';
    service cloud.firestore {
      match /databases/{database}/documents {
        // Helper functions
        function isAuthenticated() {
          return request.auth != null;
        }
        
        function isAdmin() {
          return isAuthenticated() && 
            get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true;
        }
        
        function isProfileAdmin(profileId) {
          return isAuthenticated() && 
            get(/databases/$(database)/documents/profiles/$(profileId)).data.roles[request.auth.uid] == 'admin';
        }
        
        function isProfileEditor(profileId) {
          return isAuthenticated() && 
            get(/databases/$(database)/documents/profiles/$(profileId)).data.roles[request.auth.uid] == 'editor';
        }
        
        function hasValidRequestStats() {
          let stats = get(/databases/$(database)/documents/users/$(request.auth.uid)/editorRequestStats/stats).data;
          return stats.pendingRequests < 3 && 
            (stats.cooldownUntil == null || stats.cooldownUntil > request.time);
        }
        
        // Editor request stats
        match /users/{userId}/editorRequestStats/{document=**} {
          allow read: if isAuthenticated() && request.auth.uid == userId;
          allow write: if isAuthenticated() && request.auth.uid == userId;
        }
        
        // Editor requests
        match /editorRequests/{requestId} {
          allow read: if isAuthenticated() && 
            (request.auth.uid == resource.data.userId || 
             isProfileAdmin(resource.data.profileId));
          allow create: if isAuthenticated() && 
            request.auth.uid == request.resource.data.userId &&
            hasValidRequestStats();
          allow update: if isAuthenticated() && 
            request.auth.uid == resource.data.userId &&
            request.resource.data.diff(resource.data).affectedKeys()
              .hasOnly(['status', 'updatedAt']);
          allow delete: if isAuthenticated() && 
            isProfileAdmin(resource.data.profileId);
        }
        
        // Profiles
        match /profiles/{profileId} {
          allow read: if true;
          allow create: if isAuthenticated();
          allow update: if isAuthenticated() && 
            (isProfileAdmin(profileId) || isProfileEditor(profileId));
          allow delete: if isAuthenticated() && isProfileAdmin(profileId);
        }
        
        // Users
        match /users/{userId} {
          allow read: if true;
          allow write: if isAuthenticated() && request.auth.uid == userId;
        }
      }
    }
  `),
}));

// Mock crypto.randomUUID
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: () => 'mock-uuid-123',
  },
});

// Mock analytics
jest.mock('@/lib/analytics', () => {
  const mockAnalytics = {
    trackEvent: jest.fn(),
    trackError: jest.fn(),
    trackPageView: jest.fn(),
    logEvent: jest.fn(),
  };

  return {
    ...mockAnalytics,
    analytics: mockAnalytics,
    default: mockAnalytics,
  };
});

// Mock toast notifications
jest.mock('@/components/common/Toast', () => ({
  showToast: jest.fn(),
  hideToast: jest.fn(),
}));

// Mock ErrorBoundary
jest.mock('@/components/common/ErrorBoundary', () => ({
  __esModule: true,
  default: function ErrorBoundary({ children }) {
    return children;
  },
}));

// Mock uuid
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mock-uuid-123'),
}));

// Mock window.URL.revokeObjectURL
window.URL.revokeObjectURL = jest.fn();

// Mock console.warn to prevent noise in tests
console.warn = jest.fn(); 