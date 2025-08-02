import { Timestamp } from 'firebase/firestore';
import { User as FirebaseUser } from 'firebase/auth';
import { AllowedRole } from './permission';

export interface UserPermission {
  role: AllowedRole;
  grantedAt: string;
  grantedBy: string;
}

export interface UserRoles {
  isAdmin: boolean;
  profileRoles: Record<string, ProfileRole>;
  isLoading: boolean;
  error: Error | null;
}

export interface UserProfile {
  id: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  id: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  roles: {
    admin: boolean;
    editor: boolean;
    viewer: boolean;
  };
  profileRoles: {
    [profileId: string]: ProfileRole;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface ProfileRole {
  role: AllowedRole;
  grantedAt: Date;
  grantedBy: string;
}

export interface SignUpFormData {
  email: string;
  password: string;
  confirmPassword: string;
}

export interface SignInFormData {
  email: string;
  password: string;
}

export interface AuthError {
  code: string;
  message: string;
}

export interface AuthContextType {
  user: any; // Changed from FirebaseUser to any for Supabase compatibility
  session: any; // Add session for Supabase
  loading: boolean;
  initializing: boolean; // Add initializing state
  lastError: Error | null; // Changed from error to lastError
  isAdmin: boolean;
  userProfile: any; // Add userProfile from users table
  userRoles: UserRoles;
  signIn: (data: SignInFormData) => Promise<{ success: boolean; error?: string }>;
  signUp: (data: SignUpFormData) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  updatePassword: (password: string) => Promise<{ success: boolean; error?: string }>;
  updateEmail: (email: string) => Promise<{ success: boolean; error?: string }>;
  updateProfile: (data: Partial<UserProfile>) => Promise<{ success: boolean; error?: string }>;
} 