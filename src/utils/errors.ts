import { FirebaseError } from 'firebase/app';

export class AppError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number = 500,
    public details?: any
  ) {
    super(message);
    this.name = 'AppError';
  }
  
  static fromFirebaseError(error: any): AppError {
    const errorMap: Record<string, { code: string; message: string; status: number }> = {
      'permission-denied': {
        code: 'PERMISSION_DENIED',
        message: 'You do not have permission to perform this action',
        status: 403
      },
      'not-found': {
        code: 'NOT_FOUND',
        message: 'The requested resource was not found',
        status: 404
      },
      'already-exists': {
        code: 'ALREADY_EXISTS',
        message: 'The resource already exists',
        status: 409
      },
      'invalid-argument': {
        code: 'INVALID_ARGUMENT',
        message: 'Invalid argument provided',
        status: 400
      },
      'unauthenticated': {
        code: 'UNAUTHENTICATED',
        message: 'You must be authenticated to perform this action',
        status: 401
      },
      'failed-precondition': {
        code: 'FAILED_PRECONDITION',
        message: 'The operation cannot be executed in the current system state',
        status: 400
      },
      'aborted': {
        code: 'ABORTED',
        message: 'The operation was aborted',
        status: 409
      },
      'out-of-range': {
        code: 'OUT_OF_RANGE',
        message: 'The operation was attempted past the valid range',
        status: 400
      },
      'unimplemented': {
        code: 'UNIMPLEMENTED',
        message: 'The operation is not implemented or not supported',
        status: 501
      },
      'internal': {
        code: 'INTERNAL',
        message: 'An internal error occurred',
        status: 500
      },
      'unavailable': {
        code: 'UNAVAILABLE',
        message: 'The service is currently unavailable',
        status: 503
      },
      'data-loss': {
        code: 'DATA_LOSS',
        message: 'Unrecoverable data loss or corruption',
        status: 500
      }
    };

    const errorInfo = errorMap[error.code] || {
      code: 'UNKNOWN_ERROR',
      message: 'An unknown error occurred',
      status: 500
    };

    return new AppError(
      errorInfo.code,
      errorInfo.message,
      errorInfo.status,
      error
    );
  }
} 