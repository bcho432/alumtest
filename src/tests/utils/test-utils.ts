import { User, Auth, UserCredential } from 'firebase/auth';
import { DocumentData } from 'firebase/firestore';

// Type definitions for mock functions
type MockFn<T = any, TArgs extends any[] = any[]> = jest.Mock<T, TArgs>;
type ResolvedValue<T> = T extends Promise<infer U> ? U : T;
type RejectedValue = Error | string;

// Type assertion utilities
export function assertMockFunction<T extends (...args: any[]) => any>(mock: unknown): asserts mock is jest.Mock<ReturnType<T>, Parameters<T>> {
  if (!mock || typeof mock !== 'object' || !('mockImplementation' in mock)) {
    throw new Error('Not a mock function');
  }
}

export function assertUserCredential(value: unknown): asserts value is UserCredential {
  if (!value || typeof value !== 'object' || !('user' in value)) {
    throw new Error('Not a UserCredential');
  }
}

export function assertDocumentData(value: unknown): asserts value is DocumentData {
  if (!value || typeof value !== 'object') {
    throw new Error('Not a DocumentData');
  }
}

// Type-safe mock creation
export function createMockFn<TArgs extends any[] = any[], TReturn = any>(): jest.Mock<TReturn, TArgs> {
  return jest.fn() as jest.Mock<TReturn, TArgs>;
}

// Mock factory functions
export function createMockUser(overrides: Partial<User> = {}): User {
  return {
    uid: 'test-uid',
    email: 'test@example.com',
    emailVerified: false,
    isAnonymous: false,
    metadata: {},
    providerData: [],
    refreshToken: 'test-refresh-token',
    tenantId: null,
    delete: jest.fn(),
    getIdToken: jest.fn(),
    getIdTokenResult: jest.fn(),
    reload: jest.fn(),
    toJSON: jest.fn(),
    ...overrides
  } as User;
}

export function createMockUserCredential(userOverrides: Partial<User> = {}): UserCredential {
  return {
    user: createMockUser(userOverrides),
    providerId: null,
    operationType: 'signIn'
  };
}

export function createMockAuth(overrides: Partial<Auth> = {}): Auth {
  return {
    app: {} as any,
    name: 'test-auth',
    config: {} as any,
    currentUser: null,
    languageCode: null,
    tenantId: null,
    settings: {} as any,
    onAuthStateChanged: jest.fn(),
    beforeAuthStateChanged: jest.fn(),
    onIdTokenChanged: jest.fn(),
    signInWithEmailAndPassword: jest.fn(),
    createUserWithEmailAndPassword: jest.fn(),
    signOut: jest.fn(),
    ...overrides
  } as Auth;
}

// Type-safe mock implementations
export function mockResolvedValue<T>(mock: jest.Mock<Promise<T>>, value: T): jest.Mock<Promise<T>> {
  return mock.mockResolvedValue(value);
}

export function mockRejectedValue<T>(mock: jest.Mock<Promise<T>>, error: RejectedValue): jest.Mock<Promise<T>> {
  return mock.mockRejectedValue(error);
}

export function mockReturnValue<T, TArgs extends any[] = any[]>(
  mock: jest.Mock<T, TArgs>,
  value: T
): jest.Mock<T, TArgs> {
  return mock.mockReturnValue(value);
}

export function mockImplementation<T, TArgs extends any[] = any[]>(
  mock: jest.Mock<T, TArgs>,
  implementation: (...args: TArgs) => T
): jest.Mock<T, TArgs> {
  return mock.mockImplementation(implementation);
}

// Type-safe mock verification
export function verifyMockCalled(mock: jest.Mock, times: number = 1): void {
  expect(mock).toHaveBeenCalledTimes(times);
}

export function verifyMockCalledWith<TArgs extends any[]>(
  mock: jest.Mock<any, TArgs>,
  ...args: TArgs
): void {
  expect(mock).toHaveBeenCalledWith(...args);
}

export function verifyMockNotCalled(mock: jest.Mock): void {
  expect(mock).not.toHaveBeenCalled();
}

// Type-safe mock reset
export function resetMock(mock: jest.Mock): void {
  mock.mockReset();
}

export function clearMock(mock: jest.Mock): void {
  mock.mockClear();
}

// Type-safe mock assertions
export function assertMockCalled(mock: jest.Mock, times: number = 1): void {
  if (mock.mock.calls.length !== times) {
    throw new Error(`Expected mock to be called ${times} times but was called ${mock.mock.calls.length} times`);
  }
}

export function assertMockCalledWith<TArgs extends any[]>(
  mock: jest.Mock,
  ...args: TArgs
): void {
  const wasCalled = mock.mock.calls.some(call =>
    call.length === args.length && call.every((arg: unknown, i: number) => arg === args[i])
  );
  if (!wasCalled) {
    throw new Error(`Expected mock to be called with ${args} but was called with ${mock.mock.calls}`);
  }
} 