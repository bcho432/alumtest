export interface RoleError extends Error {
  code: 'invalid-role' | 'unauthorized' | 'already-exists';
  message: string;
}

export interface ValidationError extends Error {
  code: 'validation-error';
  field: string;
  message: string;
} 