import React from 'react';
import { render, act, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { mockUser, mockFirebaseServices } from '../setup';

// Test component to access auth context
function TestComponent({ onAuth }: { onAuth: (auth: any) => void }) {
  const auth = useAuth();
  React.useEffect(() => {
    if (auth) {
      onAuth(auth);
    }
  }, [auth, onAuth]);
  return null;
}

describe('AuthContext Initialization', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with null user and loading state', async () => {
    let authContext: any;

    // Set initial auth state to null
    mockFirebaseServices.auth.onAuthStateChanged.mockImplementation((callback) => {
      callback(null);
      return () => {};
    });

    await act(async () => {
      render(
        <AuthProvider>
          <TestComponent onAuth={(auth) => { authContext = auth; }} />
        </AuthProvider>
      );
    });

    await waitFor(() => {
      expect(authContext.user).toBeNull();
      expect(authContext.loading).toBe(true);
      expect(authContext.userRoles).toBeNull();
    });
  });

  it('should update state when auth state changes', async () => {
    let authContext: any;

    // Set auth state to logged in user
    mockFirebaseServices.auth.onAuthStateChanged.mockImplementation((callback) => {
      callback(mockUser);
      return () => {};
    });

    await act(async () => {
      render(
        <AuthProvider>
          <TestComponent onAuth={(auth) => { authContext = auth; }} />
        </AuthProvider>
      );
    });

    await waitFor(() => {
      expect(authContext.user).toEqual(mockUser);
      expect(authContext.loading).toBe(false);
    });
  });

  it('should load user roles after authentication', async () => {
    let authContext: any;

    // Set auth state to logged in user
    mockFirebaseServices.auth.onAuthStateChanged.mockImplementation((callback) => {
      callback(mockUser);
      return () => {};
    });

    // Mock the roles document
    mockFirebaseServices.db.collection().doc().get.mockResolvedValue({
      exists: true,
      data: () => ({ isUniversityAdmin: true })
    });

    await act(async () => {
      render(
        <AuthProvider>
          <TestComponent onAuth={(auth) => { authContext = auth; }} />
        </AuthProvider>
      );
    });

    await waitFor(() => {
      expect(authContext.userRoles).toEqual({
        isUniversityAdmin: true,
        universityAdminFor: [mockUser.uid]
      });
    });
  });
}); 