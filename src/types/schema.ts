import { Timestamp } from 'firebase/firestore';

export interface University {
  name: string;
  branding: {
    logoUrl: string;
    primaryColor: string;
  };
  createdBy: string;
  createdAt: Timestamp;
  admins: string[];
  isActive: boolean;
}

export interface User {
  username: string;
  email: string;
  createdAt: Timestamp;
  pinnedSchools: string[];
}

export interface Profile {
  name: string;
  universityId: string;
  createdBy: string;
  isDeceased: boolean;
  status: 'draft' | 'published';
  createdAt: Timestamp;
}

export interface Permission {
  role: 'admin' | 'editor' | 'contributor';
  profileId: string;
  grantedBy: string;
  grantedAt: Timestamp;
}

// Collection paths
export const COLLECTIONS = {
  UNIVERSITIES: 'universities',
  USERS: 'users',
  PROFILES: 'profiles',
  PERMISSIONS: 'permissions',
} as const; 