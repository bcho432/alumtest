import { AllowedRole } from './permission';

export interface Organization {
  id: string;
  name: string;
  logoUrl?: string;
  theme?: {
    primaryColor?: string;
    secondaryColor?: string;
  };
  adminIds: string[];
  communityPageUrl: string;
  createdAt: Date;
}

export interface Profile {
  id: string;
  name: string;
  isDeceased: boolean;
  createdBy: string;
  status: 'draft' | 'published' | 'archived';
  createdAt: Date;
  universityId: string;
  basicInfo: {
    dateOfBirth: Date;
    dateOfDeath: Date;
    biography: string;
    photo: string;
    birthLocation: string;
    deathLocation: string;
  };
  lifeStory: {
    content: string;
    updatedAt: Date;
  };
}

export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

export interface Candle {
  id: string;
  profileId: string;
  userId: string;
  message: string;
  photoUrl?: string;
  createdAt: Date;
}

export interface University {
  id: string;
  name: string;
  createdAt: Date;
  createdBy: string; // UID
  admins: string[];
  isActive: boolean;
  updatedAt?: Date;
}

export type UserRole = 'admin' | 'editor' | 'contributor' | 'viewer';

export interface UserPermission {
  role: AllowedRole;
  grantedAt: string;
  grantedBy: string;
}

export type { MemorialInvitation, UserUniversityAssociation } from '../shared/types/index'; 