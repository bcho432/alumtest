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
        return new AppError('Email is already in use', 'EMAIL_IN_USE', 400);
      case 'auth/weak-password':
        return new AppError('Password is too weak', 'WEAK_PASSWORD', 400);
      case 'auth/invalid-email':
        return new AppError('Invalid email address', 'INVALID_EMAIL', 400);
      case 'auth/operation-not-allowed':
        return new AppError('Operation not allowed', 'OPERATION_NOT_ALLOWED', 403);
      case 'auth/too-many-requests':
        return new AppError('Too many attempts, please try again later', 'TOO_MANY_REQUESTS', 429);
      default:
        return new AppError('An unexpected error occurred', 'UNKNOWN_ERROR', 500);
    }
  }

  if (error instanceof Error) {
    return new AppError(error.message, 'UNKNOWN_ERROR', 500);
  }

  return new AppError('An unexpected error occurred', 'UNKNOWN_ERROR', 500);
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof AppError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unexpected error occurred';
}

/**
 * Handle API errors consistently
 * @param error Error object
 * @param defaultMessage Default message to show
 * @returns Error message
 */
export function handleApiError(error: unknown, defaultMessage = 'An unexpected error occurred'): string {
  if (error instanceof AppError) {
    return error.message;
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  return defaultMessage;
}

/**
 * Handle fetch errors from Firestore consistently
 * @param error Error from Firestore
 * @param operation Description of the operation that failed
 * @param defaultMessage Default message to return
 * @returns Formatted error message
 */
export function handleFirestoreError(
  error: unknown, 
  operation = 'database operation', 
  defaultMessage = 'Failed to perform operation'
): string {
  console.error(`Error in ${operation}:`, error);
  
  if (error instanceof AppError) {
    return error.message;
  }
  
  if (error instanceof Error) {
    return `${defaultMessage}: ${error.message}`;
  }
  
  return defaultMessage;
} 