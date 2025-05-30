/// <reference types="@testing-library/jest-dom" />
/// <reference types="@testing-library/react" />
/// <reference types="@jest/globals" />

import React from 'react';
import { render, act, waitFor, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { User, Auth, UserCredential, getAuth } from 'firebase/auth';
import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { FirebaseError } from 'firebase/app';
import { mockUser, mockUserCredential, mockServices } from '../setup';
import type { SpyInstance } from 'jest-mock';
import { DocumentData, DocumentReference, DocumentSnapshot } from 'firebase/firestore';
import {
  createMockAuth,
  createMockUser,
  createMockUserCredential,
  createMockFn,
  mockResolvedValue,
  mockRejectedValue,
  mockReturnValue,
  mockImplementation,
  verifyMockCalled,
  verifyMockCalledWith,
  verifyMockNotCalled
} from '../utils/test-utils';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { resetRateLimit, validateEmail, validatePassword, checkRateLimit, validateOrganizationName } from '@/lib/validation';
import type { AuthContextType } from '@/types/auth';
import type { SignUpFormData, SignInFormData } from '@/types/auth';
import type { MockServices } from '../types/mock-services';
import { MockPromiseFn } from '../types/mock-services';

// Move mocks to the very top
jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(),
  signInWithEmailAndPassword: jest.fn<Promise<{ user: any }>, any[]>(),
  createUserWithEmailAndPassword: jest.fn<Promise<{ user: any }>, any[]>(),
  signOut: jest.fn<Promise<void>, any[]>(),
  onAuthStateChanged: jest.fn((auth: any, callback: (user: any) => void) => {
    callback(null);
    return () => {};
  }),
}));

jest.mock('firebase/firestore', () => ({
  doc: jest.fn(() => ({})),
  setDoc: jest.fn(() => Promise.resolve()),
  getDoc: jest.fn(() => Promise.resolve({
    exists: () => true,
    data: () => ({ roles: ['admin'] })
  })),
  collection: jest.fn(() => ({})),
  query: jest.fn(() => ({})),
  where: jest.fn(() => ({})),
  getDocs: jest.fn(() => Promise.resolve({ forEach: jest.fn() })),
}));

// Mock validation functions
jest.mock('@/lib/validation', () => ({
  validateEmail: jest.fn(() => null),
  validatePassword: jest.fn(() => null),
  checkRateLimit: jest.fn(() => ({ allowed: true })),
  resetRateLimit: jest.fn(() => undefined),
  validateOrganizationName: jest.fn(() => null)
}));

// Extended User type to include our custom properties
interface ExtendedUser extends User {
  roles?: string[];
  profileRoles?: string[];
}

// Test data
const validSignUpData: SignUpFormData = {
  email: 'test@example.com',
  password: 'password123',
  confirmPassword: 'password123'
};

const validSignInData: SignInFormData = {
  email: 'test@example.com',
  password: 'password123'
};

const invalidSignUpData: SignUpFormData = {
  email: 'test@example.com',
  password: 'invalid',
  confirmPassword: 'invalid'
};

// Test component that uses the auth context
const TestComponent = ({ onAuthStateChange }: { onAuthStateChange: (auth: AuthContextType) => void }) => {
  const auth = useAuth();
  onAuthStateChange(auth);
  return null;
};

interface RateLimitResult {
  allowed: boolean;
  message?: string;
}

describe('AuthContext', () => {
  let mockValidateEmail: jest.Mock;
  let mockValidatePassword: jest.Mock;
  let mockCheckRateLimit: jest.Mock<() => Promise<RateLimitResult>>;
  let mockResetRateLimit: jest.Mock;
  let consoleErrorSpy: SpyInstance;

  beforeEach(() => {
    // Spy on console.error to catch errors during rendering
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation((...args) => {
      // Log errors to the test output for debugging
      // @ts-ignore
      process.stdout.write('[console.error] ' + args.join(' ') + '\n');
    });

    // Spy on console.log for debugging
    jest.spyOn(console, 'log').mockImplementation((...args) => {
      // @ts-ignore
      process.stdout.write('[console.log] ' + args.join(' ') + '\n');
    });

    // Reset all mocks
    jest.clearAllMocks();

    // Set up validation mocks
    mockValidateEmail = jest.fn(() => '');
    mockValidatePassword = jest.fn(() => '');
    mockCheckRateLimit = jest.fn<() => Promise<RateLimitResult>>().mockImplementation(() => Promise.resolve({ allowed: true }));
    mockResetRateLimit = jest.fn();

    // Mock validation functions
    jest.mock('@/lib/validation', () => ({
      validateEmail: mockValidateEmail,
      validatePassword: mockValidatePassword,
      checkRateLimit: mockCheckRateLimit,
      resetRateLimit: mockResetRateLimit
    }));

    // Setup Firebase mocks
    const mockAuth = {
      onAuthStateChanged: jest.fn((callback: (user: User | null) => void) => {
        callback(null);
        return () => {};
      }),
      signInWithEmailAndPassword: jest.fn(),
      createUserWithEmailAndPassword: jest.fn(),
      signOut: jest.fn()
    };
    jest.spyOn(require('firebase/auth'), 'getAuth').mockReturnValue(mockAuth);

    // Setup Firestore mocks
    const mockDocRef = { id: 'doc-ref' };
    const mockDocSnapshot = {
      exists: () => true,
      data: () => ({ roles: ['admin'] })
    };

    (doc as jest.Mock).mockReturnValue(mockDocRef);
    (setDoc as jest.Mock).mockImplementation(() => Promise.resolve());
    (getDoc as jest.Mock).mockImplementation(() => Promise.resolve(mockDocSnapshot));

    // Reset auth state
    mockServices.auth = {
      currentUser: null,
      onAuthStateChanged: jest.fn((callback: (user: User | null) => void) => {
        callback(null);
        return () => {};
      }),
      signInWithEmailAndPassword: jest.fn(),
      createUserWithEmailAndPassword: jest.fn(),
      signOut: jest.fn()
    };
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  describe('Initial State', () => {
    it('should initialize with null user and loading state', async () => {
      let authContext: AuthContextType;

      await act(async () => {
        render(
          <AuthProvider>
            <TestComponent
              onAuthStateChange={(auth) => {
                authContext = auth;
              }}
            />
          </AuthProvider>
        );
      });

      await waitFor(() => {
        expect(authContext).toBeDefined();
        expect(authContext.user).toBeNull();
        expect(authContext.loading).toBe(true);
      });
    });

    it('should update state when auth state changes', async () => {
      let authContext: AuthContextType;
      const mockUser = createMockUser();

      // Set up auth state change
      const mockAuth = {
        onAuthStateChanged: jest.fn((callback: (user: User | null) => void) => {
          callback(mockUser);
          return () => {};
        }),
        signInWithEmailAndPassword: jest.fn(),
        createUserWithEmailAndPassword: jest.fn(),
        signOut: jest.fn()
      };

      jest.spyOn(require('firebase/auth'), 'getAuth').mockReturnValue(mockAuth);

      await act(async () => {
        render(
          <AuthProvider>
            <TestComponent
              onAuthStateChange={(auth) => {
                authContext = auth;
              }}
            />
          </AuthProvider>
        );
      });

      await waitFor(() => {
        expect(authContext).toBeDefined();
        expect(authContext.user).toEqual(mockUser);
        expect(authContext.loading).toBe(false);
      });
    });
  });

  describe('Sign In', () => {
    it('should validate email and password before signing in', async () => {
      mockValidateEmail.mockReturnValue('Invalid email');
      
      let authContext: AuthContextType;
      await act(async () => {
        render(
          <AuthProvider>
            <TestComponent
              onAuthStateChange={(auth) => {
                authContext = auth;
              }}
            />
          </AuthProvider>
        );
      });

      await waitFor(() => {
        expect(authContext).toBeDefined();
      });

      await act(async () => {
        await expect(authContext.signIn({ email: 'invalid', password: 'pass' })).rejects.toThrow('Invalid email');
      });

      expect(mockValidateEmail).toHaveBeenCalledWith('invalid');
      expect(mockServices.auth.signInWithEmailAndPassword).not.toHaveBeenCalled();
    });

    it('should check rate limiting before signing in', async () => {
      mockCheckRateLimit.mockResolvedValue({
        allowed: false,
        message: 'Too many attempts'
      });
      
      let authContext: AuthContextType;
      await act(async () => {
        render(
          <AuthProvider>
            <TestComponent
              onAuthStateChange={(auth) => {
                authContext = auth;
              }}
            />
          </AuthProvider>
        );
      });

      await waitFor(() => {
        expect(authContext).toBeDefined();
      });

      await act(async () => {
        await expect(authContext.signIn({ email: 'test@example.com', password: 'password' }))
          .rejects.toThrow('Too many attempts');
      });

      expect(mockServices.auth.signInWithEmailAndPassword).not.toHaveBeenCalled();
    });

    it('should reset rate limit on successful sign in', async () => {
      let authContext: AuthContextType;
      await act(async () => {
        render(
          <AuthProvider>
            <TestComponent
              onAuthStateChange={(auth) => {
                authContext = auth;
              }}
            />
          </AuthProvider>
        );
      });

      await waitFor(() => {
        expect(authContext).toBeDefined();
      });

      await act(async () => {
        await authContext.signIn({ email: 'test@example.com', password: 'password' });
      });

      expect(mockResetRateLimit).toHaveBeenCalledWith('signin_test@example.com');
    });

    it('should handle sign in successfully', async () => {
      const mockUser: ExtendedUser = { 
        uid: '123', 
        email: 'test@example.com',
        roles: ['user'],
        profileRoles: ['basic']
      } as ExtendedUser;

      const mockSignIn: MockPromiseFn<UserCredential> = jest.fn<Promise<UserCredential>, any[]>().mockImplementation(() => Promise.resolve({ user: mockUser }));
      mockServices.auth.signInWithEmailAndPassword = mockSignIn;

      let authContext: AuthContextType | undefined;
      await act(async () => {
        render(
          <AuthProvider>
            <TestComponent
              onAuthStateChange={(auth) => {
                authContext = auth;
              }}
            />
          </AuthProvider>
        );
      });

      await waitFor(() => {
        expect(authContext).toBeDefined();
      });

      if (!authContext) throw new Error('Auth context not initialized');
      await act(async () => {
        await authContext.signIn(validSignInData);
      });

      expect(mockServices.auth.signInWithEmailAndPassword).toHaveBeenCalledWith(
        expect.anything(),
        validSignInData.email,
        validSignInData.password
      );
    });
  });

  describe('Sign Up', () => {
    it('should validate all inputs before signing up', async () => {
      mockValidatePassword.mockReturnValue('Invalid password');
      
      let authContext: AuthContextType;
      await act(async () => {
        render(
          <AuthProvider>
            <TestComponent
              onAuthStateChange={(auth) => {
                authContext = auth;
              }}
            />
          </AuthProvider>
        );
      });

      await waitFor(() => {
        expect(authContext).toBeDefined();
      });

      await act(async () => {
        await expect(authContext.signUp(invalidSignUpData)).rejects.toThrow('Invalid password');
      });

      expect(mockValidatePassword).toHaveBeenCalledWith('invalid');
      expect(mockServices.auth.createUserWithEmailAndPassword).not.toHaveBeenCalled();
    });

    it('should create university document for organization accounts', async () => {
      let authContext: AuthContextType;
      await act(async () => {
        render(
          <AuthProvider>
            <TestComponent
              onAuthStateChange={(auth) => {
                authContext = auth;
              }}
            />
          </AuthProvider>
        );
      });

      await waitFor(() => {
        expect(authContext).toBeDefined();
      });

      await act(async () => {
        await authContext.signUp(validSignUpData);
      });

      expect(mockServices.db.collection).toHaveBeenCalledWith('universities');
    });

    it('should handle personal accounts differently', async () => {
      let authContext: AuthContextType;
      await act(async () => {
        render(
          <AuthProvider>
            <TestComponent
              onAuthStateChange={(auth) => {
                authContext = auth;
              }}
            />
          </AuthProvider>
        );
      });

      await waitFor(() => {
        expect(authContext).toBeDefined();
      });

      await act(async () => {
        await authContext.signUp(validSignUpData);
      });

      expect(mockServices.db.collection).not.toHaveBeenCalledWith('universities');
    });

    it('handles successful sign-up', async () => {
      // Mock successful sign-up
      const mockUser: ExtendedUser = { 
        uid: '123', 
        email: 'test@example.com',
        roles: ['user'],
        profileRoles: ['basic']
      } as ExtendedUser;
      
      const mockSignUp: MockPromiseFn<UserCredential> = jest.fn<Promise<UserCredential>, any[]>().mockImplementation(() => Promise.resolve({ user: mockUser }));
      mockServices.auth.createUserWithEmailAndPassword = mockSignUp;

      // Mock Firestore operations
      mockServices.db.setDoc.mockResolvedValue(undefined);
      mockServices.db.getDoc.mockResolvedValue({
        exists: true,
        data: () => ({
          roles: ['user'],
          profileRoles: ['basic']
        }),
        metadata: { fromCache: false, hasPendingWrites: false },
        id: '123',
        ref: { id: '123' },
        get: (field: string) => ({ roles: ['user'], profileRoles: ['basic'] }[field])
      } as unknown as DocumentSnapshot<DocumentData>);

      let authContext: AuthContextType | undefined;
      await act(async () => {
        render(
          <AuthProvider>
            <TestComponent
              onAuthStateChange={(auth) => {
                authContext = auth;
              }}
            />
          </AuthProvider>
        );
      });

      await waitFor(() => {
        expect(authContext).toBeDefined();
      });

      if (!authContext) throw new Error('Auth context not initialized');
      await act(async () => {
        await authContext.signUp(validSignUpData);
      });

      expect(mockServices.auth.createUserWithEmailAndPassword).toHaveBeenCalledWith(
        expect.anything(),
        validSignUpData.email,
        validSignUpData.password
      );
      expect(mockServices.db.setDoc).toHaveBeenCalled();
      expect(authContext.user?.email).toBe(validSignUpData.email);
    });
  });

  describe('Sign Out', () => {
    it('should clear user state after signing out', async () => {
      let authContext: AuthContextType;
      await act(async () => {
        render(
          <AuthProvider>
            <TestComponent
              onAuthStateChange={(auth) => {
                authContext = auth;
              }}
            />
          </AuthProvider>
        );
      });

      await waitFor(() => {
        expect(authContext).toBeDefined();
      });

      // Set initial user state
      mockServices.auth.onAuthStateChanged.mockImplementation((callback: (user: User | null) => void) => {
        callback(mockUser as User);
        return () => {};
      });

      await waitFor(() => {
        expect(authContext.user).toEqual(mockUser);
      });

      // Sign out
      await act(async () => {
        await authContext.signOut();
      });

      expect(mockServices.auth.signOut).toHaveBeenCalled();
      expect(authContext.user).toBeNull();
    });
  });

  describe('Error Handling', () => {
    it('handles Firebase errors during sign-in', async () => {
      // Mock Firebase error
      const mockSignIn: MockPromiseFn<UserCredential> = jest.fn<Promise<UserCredential>, any[]>().mockImplementation(() => {
        throw new FirebaseError('auth/error', 'Firebase error');
      });
      mockServices.auth.signInWithEmailAndPassword = mockSignIn;

      let authContext: AuthContextType | undefined;
      await act(async () => {
        render(
          <AuthProvider>
            <TestComponent
              onAuthStateChange={(auth) => {
                authContext = auth;
              }}
            />
          </AuthProvider>
        );
      });

      await waitFor(() => {
        expect(authContext).toBeDefined();
      });

      if (!authContext) throw new Error('Auth context not initialized');
      await expect(authContext.signIn(validSignInData)).rejects.toThrow('Firebase error');
    });

    it('handles network errors during sign-in', async () => {
      // Mock network error
      const mockSignIn: MockPromiseFn<UserCredential> = jest.fn<Promise<UserCredential>, any[]>().mockImplementation(() => {
        throw new Error('Network error');
      });
      mockServices.auth.signInWithEmailAndPassword = mockSignIn;

      let authContext: AuthContextType | undefined;
      await act(async () => {
        render(
          <AuthProvider>
            <TestComponent
              onAuthStateChange={(auth) => {
                authContext = auth;
              }}
            />
          </AuthProvider>
        );
      });

      await waitFor(() => {
        expect(authContext).toBeDefined();
      });

      if (!authContext) throw new Error('Auth context not initialized');
      await expect(authContext.signIn(validSignInData)).rejects.toThrow('Network error');
    });

    it('handles Firestore errors during sign-up', async () => {
      // Mock successful sign-up but Firestore error
      const mockUser: ExtendedUser = { 
        uid: '123', 
        email: 'test@example.com',
        roles: ['user'],
        profileRoles: ['basic']
      } as ExtendedUser;
      
      const mockSignUp: MockPromiseFn<UserCredential> = jest.fn<Promise<UserCredential>, any[]>().mockImplementation(() => Promise.resolve({ user: mockUser }));
      mockServices.auth.createUserWithEmailAndPassword = mockSignUp;

      // Mock Firestore error
      mockServices.db.setDoc.mockRejectedValue(new Error('Firestore error'));

      let authContext: AuthContextType | undefined;
      await act(async () => {
        render(
          <AuthProvider>
            <TestComponent
              onAuthStateChange={(auth) => {
                authContext = auth;
              }}
            />
          </AuthProvider>
        );
      });

      await waitFor(() => {
        expect(authContext).toBeDefined();
      });

      if (!authContext) throw new Error('Auth context not initialized');
      await expect(authContext.signUp(validSignUpData)).rejects.toThrow('Firestore error');
    });
  });

  describe('User Roles', () => {
    it('loads user roles after successful sign-in', async () => {
      // Mock successful sign-in
      const mockUser: ExtendedUser = { 
        uid: '123', 
        email: 'test@example.com',
        roles: ['user'],
        profileRoles: ['basic']
      } as ExtendedUser;
      
      const mockSignIn: MockPromiseFn<UserCredential> = jest.fn<Promise<UserCredential>, any[]>().mockImplementation(() => Promise.resolve({ user: mockUser }));
      mockServices.auth.signInWithEmailAndPassword = mockSignIn;

      // Mock user roles in Firestore
      const mockUserDoc = {
        exists: true,
        data: () => ({
          roles: ['user'],
          profileRoles: ['basic']
        }),
        metadata: { fromCache: false, hasPendingWrites: false },
        id: '123',
        ref: { id: '123' },
        get: (field: string) => ({ roles: ['user'], profileRoles: ['basic'] }[field])
      } as unknown as DocumentSnapshot<DocumentData>;

      mockServices.db.getDoc.mockResolvedValue(mockUserDoc);

      let authContext: AuthContextType | undefined;
      await act(async () => {
        render(
          <AuthProvider>
            <TestComponent
              onAuthStateChange={(auth) => {
                authContext = auth;
              }}
            />
          </AuthProvider>
        );
      });

      await waitFor(() => {
        expect(authContext).toBeDefined();
      });

      if (!authContext) throw new Error('Auth context not initialized');
      await act(async () => {
        await authContext.signIn(validSignInData);
      });

      const extendedUser = authContext.user as ExtendedUser;
      expect(extendedUser.roles).toEqual(['user']);
      expect(extendedUser.profileRoles).toEqual(['basic']);
    });
  });

  it('should handle sign up successfully', async () => {
    mockServices.auth.createUserWithEmailAndPassword = jest.fn<Promise<UserCredential>, any[]>().mockResolvedValueOnce({ user: mockUser });

    const TestComponent = () => {
      const auth = useAuth();
      return (
        <button onClick={() => auth.signUp(validSignUpData)}>Sign Up</button>
      );
    };

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    fireEvent.click(screen.getByText('Sign Up'));

    await waitFor(() => {
      expect(mockServices.auth.createUserWithEmailAndPassword).toHaveBeenCalledWith(
        expect.anything(),
        validSignUpData.email,
        validSignUpData.password
      );
    });
  });

  it('should handle sign in successfully', async () => {
    (signInWithEmailAndPassword as jest.Mock).mockResolvedValueOnce({ user: mockUser });

    const TestComponent = () => {
      const auth = useAuth();
      return (
        <button onClick={() => auth.signIn(validSignInData)}>Sign In</button>
      );
    };

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    fireEvent.click(screen.getByText('Sign In'));

    await waitFor(() => {
      expect(signInWithEmailAndPassword).toHaveBeenCalledWith(
        expect.anything(),
        validSignInData.email,
        validSignInData.password
      );
    });
  });

  it('should handle sign up validation', async () => {
    const TestComponent = () => {
      const auth = useAuth();
      return (
        <button onClick={() => auth.signUp(invalidSignUpData)}>Sign Up</button>
      );
    };

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    fireEvent.click(screen.getByText('Sign Up'));

    await waitFor(() => {
      expect(mockServices.auth.createUserWithEmailAndPassword).not.toHaveBeenCalled();
    });
  });

  it('should handle sign in validation', async () => {
    const invalidSignInData: SignInFormData = {
      email: 'invalid-email',
      password: ''
    };

    const TestComponent = () => {
      const auth = useAuth();
      return (
        <button onClick={() => auth.signIn(invalidSignInData)}>Sign In</button>
      );
    };

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    fireEvent.click(screen.getByText('Sign In'));

    await waitFor(() => {
      expect(signInWithEmailAndPassword).not.toHaveBeenCalled();
    });
  });
}); 