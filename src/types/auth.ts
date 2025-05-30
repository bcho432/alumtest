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
  user: FirebaseUser | null;
  loading: boolean;
  error: Error | null;
  isAdmin: boolean;
  signIn: (data: SignInFormData) => Promise<FirebaseUser>;
  signUp: (data: SignUpFormData) => Promise<FirebaseUser>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  updateEmail: (email: string) => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  userRoles: UserRoles;
} 