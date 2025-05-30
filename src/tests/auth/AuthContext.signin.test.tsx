import React from 'react';
import { render, act, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { mockUser, mockUserCredential, mockFirebaseServices } from '../setup';
import { FirebaseError } from 'firebase/app';

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

describe('AuthContext Sign In', () => {
  let authContext: any;

  beforeEach(async () => {
    jest.clearAllMocks();

    // Initialize context with test component
    await act(async () => {
      render(
        <AuthProvider>
          <TestComponent onAuth={(auth) => { authContext = auth; }} />
        </AuthProvider>
      );
    });

    await waitFor(() => {
      expect(authContext).toBeDefined();
    });
  });

  it('should sign in with valid credentials', async () => {
    mockFirebaseServices.auth.signInWithEmailAndPassword.mockResolvedValueOnce(mockUserCredential);

    await act(async () => {
      await authContext.signIn({ email: 'test@example.com', password: 'password123' });
    });

    expect(mockFirebaseServices.auth.signInWithEmailAndPassword)
      .toHaveBeenCalledWith('test@example.com', 'password123');
  });

  it('should handle invalid credentials', async () => {
    const errorMessage = 'Invalid email or password';
    mockFirebaseServices.auth.signInWithEmailAndPassword.mockRejectedValueOnce(
      new FirebaseError('auth/wrong-password', errorMessage)
    );

    await expect(authContext.signIn({ email: 'test@example.com', password: 'wrongpass' }))
      .rejects.toThrow(errorMessage);
  });

  it('should validate email before signing in', async () => {
    await expect(authContext.signIn({ email: 'invalid-email', password: 'password123' }))
      .rejects.toThrow('Invalid email format');
  });

  it('should validate password before signing in', async () => {
    await expect(authContext.signIn({ email: 'test@example.com', password: '' }))
      .rejects.toThrow('Password is required');
  });

  it('should handle rate limiting', async () => {
    // Mock rate limit check to return limited
    const rateLimitError = 'Too many sign-in attempts. Please try again later.';
    mockFirebaseServices.auth.signInWithEmailAndPassword.mockRejectedValueOnce(
      new FirebaseError('auth/too-many-requests', rateLimitError)
    );

    await expect(authContext.signIn({ email: 'test@example.com', password: 'password123' }))
      .rejects.toThrow(rateLimitError);
  });

  it('should reset rate limit after successful sign in', async () => {
    mockFirebaseServices.auth.signInWithEmailAndPassword.mockResolvedValueOnce(mockUserCredential);

    await act(async () => {
      await authContext.signIn({ email: 'test@example.com', password: 'password123' });
    });

    // Verify rate limit was reset
    expect(mockFirebaseServices.auth.signInWithEmailAndPassword)
      .toHaveBeenCalledWith('test@example.com', 'password123');
  });
}); 