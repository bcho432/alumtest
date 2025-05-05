import { FirebaseError } from 'firebase/app';

export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public status: number = 400
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function handleFirebaseError(error: unknown): AppError {
  if (error instanceof FirebaseError) {
    switch (error.code) {
      case 'auth/user-not-found':
      case 'auth/wrong-password':
        return new AppError('Invalid email or password', 'INVALID_CREDENTIALS', 401);
      case 'auth/email-already-in-use':
        return new AppError('Email already in use', 'EMAIL_IN_USE', 400);
      case 'auth/weak-password':
        return new AppError('Password is too weak', 'WEAK_PASSWORD', 400);
      case 'auth/invalid-email':
        return new AppError('Invalid email address', 'INVALID_EMAIL', 400);
      default:
        return new AppError('An error occurred', 'UNKNOWN_ERROR', 500);
    }
  }
  
  if (error instanceof AppError) {
    return error;
  }

  return new AppError('An unexpected error occurred', 'UNKNOWN_ERROR', 500);
} 