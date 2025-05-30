import { UserData } from './user';
import { Timestamp } from 'firebase/firestore';

export const ALLOWED_ROLES = ['admin', 'editor', 'contributor', 'viewer'] as const;
export type AllowedRole = typeof ALLOWED_ROLES[number];

export interface UserPermission {
  role: AllowedRole;
  grantedBy: string;
  grantedAt: Timestamp | Date;
  lastAccess?: Timestamp | Date;
}

export interface Permission {
  id: string;
  role: AllowedRole;
  user: {
    id: string;
    email: string;
  };
  grantedBy: string;
  grantedAt: Timestamp | Date;
  lastAccess?: Timestamp | Date;
}

export interface PermissionAuditLog {
  type: 'permission_change' | 'permission_revoked';
  profileId: string;
  userId: string;
  role?: AllowedRole;
  grantedBy?: string;
  revokedBy?: string;
  timestamp: Timestamp | Date;
}

export interface GrantRoleResponse {
  success: boolean;
  userId: string;
  isUpdate: boolean;
}

export interface RemoveRoleResponse {
  success: boolean;
} 