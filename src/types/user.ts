import { AllowedRole } from './permission';
import { Timestamp } from 'firebase/firestore';

export interface UserData {
  uid: string;
  displayName?: string;
  email?: string;
}

export type UserRole = 'admin' | 'editor' | 'viewer';

export interface Permission {
  role: string;
  grantedAt: any;
}

export interface UserProfile {
  displayName?: string;
  photoURL?: string;
  email?: string;
  phoneNumber?: string;
  bio?: string;
  location?: string;
  website?: string;
  socialLinks?: {
    twitter?: string;
    linkedin?: string;
    github?: string;
  };
}

export interface UserSettings {
  emailNotifications?: boolean;
  pushNotifications?: boolean;
  theme?: 'light' | 'dark' | 'system';
  language?: string;
}

export interface User {
  id: string;
  profile?: UserProfile;
  settings?: UserSettings;
  organizationRoles?: Record<string, UserRole>;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  isActive?: boolean;
  isBlocked: boolean;
  blockedReason?: string;
  blockedAt?: Timestamp;
  blockedBy?: string;
  lastLoginAt?: Timestamp;
  lastActivityAt?: Timestamp;
} 