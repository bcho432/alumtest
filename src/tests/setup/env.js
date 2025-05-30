// Set test environment variables
process.env.NEXT_PUBLIC_FIREBASE_API_KEY = 'test-api-key';
process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN = 'test-auth-domain';
process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = 'test-project-id';
process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET = 'test-storage-bucket';
process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID = 'test-messaging-sender-id';
process.env.NEXT_PUBLIC_FIREBASE_APP_ID = 'test-app-id';
process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID = 'test-measurement-id';

// Set NODE_ENV to test
process.env.NODE_ENV = 'test';

// Mock window.URL
if (typeof window !== 'undefined') {
  window.URL.createObjectURL = jest.fn();
  window.URL.revokeObjectURL = jest.fn();
}

// Mock window.performance
if (typeof window !== 'undefined') {
  window.performance = {
    now: jest.fn(() => 0),
    mark: jest.fn(),
    measure: jest.fn(),
    clearMarks: jest.fn(),
    clearMeasures: jest.fn(),
    getEntriesByType: jest.fn(() => []),
    getEntriesByName: jest.fn(() => []),
  };
}

// Mock window.requestAnimationFrame
if (typeof window !== 'undefined') {
  window.requestAnimationFrame = jest.fn((callback) => setTimeout(callback, 0));
  window.cancelAnimationFrame = jest.fn();
}

// Mock window.matchMedia
if (typeof window !== 'undefined') {
  window.matchMedia = jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  }));
}

// Mock window.ResizeObserver
if (typeof window !== 'undefined') {
  window.ResizeObserver = jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
  }));
}

// Mock window.IntersectionObserver
if (typeof window !== 'undefined') {
  window.IntersectionObserver = jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
  }));
}

// Mock window.getComputedStyle
if (typeof window !== 'undefined') {
  window.getComputedStyle = jest.fn(() => ({
    getPropertyValue: jest.fn(),
  }));
}

// Mock window.scrollTo
if (typeof window !== 'undefined') {
  window.scrollTo = jest.fn();
}

// Mock window.alert
if (typeof window !== 'undefined') {
  window.alert = jest.fn();
}

// Mock window.confirm
if (typeof window !== 'undefined') {
  window.confirm = jest.fn();
}

// Mock window.prompt
if (typeof window !== 'undefined') {
  window.prompt = jest.fn();
}

// Mock window.open
if (typeof window !== 'undefined') {
  window.open = jest.fn();
}

// Mock window.location
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'location', {
    value: {
      href: '',
      assign: jest.fn(),
      replace: jest.fn(),
      reload: jest.fn(),
    },
    writable: true,
  });
}

// Mock window.history
if (typeof window !== 'undefined') {
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
}

// Mock window.navigator
if (typeof window !== 'undefined') {
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
}

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