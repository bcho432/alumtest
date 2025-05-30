'use client';

interface RateLimitResult {
  allowed: boolean;
  message: string;
}

// Rate limiting configuration
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const MAX_ATTEMPTS = 5;

// Store for rate limiting
const rateLimitStore = new Map<string, { attempts: number; timestamp: number }>();

export const ORGANIZATION_TYPES = ['university', 'college', 'institute', 'memorial'] as const;
export type OrganizationType = typeof ORGANIZATION_TYPES[number];

export const USER_ROLES = ['admin', 'member'] as const;
export type UserRole = typeof USER_ROLES[number];

export function validateEmail(email: string): string | null {
  if (!email) {
    return 'Email is required';
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return 'Invalid email format';
  }
  
  return null;
}

export function validatePassword(password: string): string | null {
  if (!password) {
    return 'Password is required';
  }
  
  if (password.length < 8) {
    return 'Password must be at least 8 characters long';
  }
  
  if (!/[A-Z]/.test(password)) {
    return 'Password must contain at least one uppercase letter';
  }
  
  if (!/[a-z]/.test(password)) {
    return 'Password must contain at least one lowercase letter';
  }
  
  if (!/[0-9]/.test(password)) {
    return 'Password must contain at least one number';
  }
  
  if (!/[!@#$%^&*]/.test(password)) {
    return 'Password must contain at least one special character (!@#$%^&*)';
  }
  
  return null;
}

export function validateOrganizationName(name: string): string | null {
  if (!name) {
    return 'Organization name is required';
  }
  
  if (name.length < 2) {
    return 'Organization name must be at least 2 characters long';
  }
  
  if (name.length > 100) {
    return 'Organization name must be less than 100 characters';
  }
  
  return null;
}

export function validateOrganizationType(type: string): string | null {
  if (!ORGANIZATION_TYPES.includes(type as OrganizationType)) {
    return `Invalid organization type. Must be one of: ${ORGANIZATION_TYPES.join(', ')}`;
  }
  return null;
}

export function validateUserRole(role: string): string | null {
  if (!USER_ROLES.includes(role as UserRole)) {
    return `Invalid user role. Must be one of: ${USER_ROLES.join(', ')}`;
  }
  return null;
}

// Type guards
export function isOrganizationType(type: string): type is OrganizationType {
  return ORGANIZATION_TYPES.includes(type as OrganizationType);
}

export function isUserRole(role: string): role is UserRole {
  return USER_ROLES.includes(role as UserRole);
}

export function checkRateLimit(key: string): RateLimitResult {
  const now = Date.now();
  const record = rateLimitStore.get(key);
  
  if (!record) {
    rateLimitStore.set(key, { attempts: 1, timestamp: now });
    return { allowed: true, message: '' };
  }
  
  // Reset if window has passed
  if (now - record.timestamp > RATE_LIMIT_WINDOW) {
    rateLimitStore.set(key, { attempts: 1, timestamp: now });
    return { allowed: true, message: '' };
  }
  
  // Check if max attempts reached
  if (record.attempts >= MAX_ATTEMPTS) {
    const timeLeft = Math.ceil((RATE_LIMIT_WINDOW - (now - record.timestamp)) / 1000 / 60);
    return {
      allowed: false,
      message: `Too many attempts. Please try again in ${timeLeft} minutes.`
    };
  }
  
  // Increment attempts
  record.attempts++;
  rateLimitStore.set(key, record);
  return { allowed: true, message: '' };
}

export function resetRateLimit(key: string): void {
  rateLimitStore.delete(key);
} 