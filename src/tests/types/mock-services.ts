import { User, UserCredential } from 'firebase/auth';
import { DocumentReference, DocumentSnapshot } from 'firebase/firestore';

// Helper type for mock functions that return promises
export type MockPromiseFn<T> = jest.Mock<Promise<T>, any[]>;

// Helper type for mock functions that return void
export type MockVoidFn = jest.Mock<void, any[]>;

// Helper type for mock functions that return a cleanup function
export type MockCleanupFn = jest.Mock<() => void, any[]>;

export interface MockAuth {
  currentUser: User | null;
  onAuthStateChanged: MockCleanupFn;
  signInWithEmailAndPassword: MockPromiseFn<UserCredential>;
  createUserWithEmailAndPassword: MockPromiseFn<UserCredential>;
  signOut: MockPromiseFn<void>;
}

export interface MockDb {
  collection: jest.Mock<{
    doc: jest.Mock;
    where: jest.Mock;
    get: jest.Mock;
  }, any[]>;
  doc: jest.Mock<DocumentReference, any[]>;
  setDoc: MockPromiseFn<void>;
  getDoc: MockPromiseFn<DocumentSnapshot>;
  query: jest.Mock<any, any[]>;
  where: jest.Mock<any, any[]>;
  getDocs: jest.Mock<any, any[]>;
}

export interface MockServices {
  app: Record<string, unknown>;
  auth: MockAuth;
  db: MockDb;
  storage: Record<string, unknown>;
  functions: Record<string, unknown>;
  analytics: null;
} 