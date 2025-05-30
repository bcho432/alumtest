import { getDb } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, Timestamp } from 'firebase/firestore';

export type RoleChangeType = 'role_added' | 'role_removed';

export interface RoleChangeLog {
  type: RoleChangeType;
  orgId: string;
  actedBy: string;
  targetUserId: string;
  role: string;
  timestamp: Timestamp;
}

class AuditLogService {
  private readonly logsCollection = 'logs/permissions';

  async logRoleChange(
    type: RoleChangeType,
    orgId: string,
    actedBy: string,
    targetUserId: string,
    role: string
  ): Promise<void> {
    try {
      const db = await getDb();
      await addDoc(collection(db, this.logsCollection), {
        type,
        orgId,
        actedBy,
        targetUserId,
        role,
        timestamp: serverTimestamp(),
      });
    } catch (error) {
      // Fallback to console log in development
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to write audit log:', error);
        console.log('Role change:', {
          type,
          orgId,
          actedBy,
          targetUserId,
          role,
          timestamp: new Date().toISOString(),
        });
      }
      throw error;
    }
  }

  async logRoleAdded(
    orgId: string,
    actedBy: string,
    targetUserId: string,
    role: string
  ): Promise<void> {
    return this.logRoleChange('role_added', orgId, actedBy, targetUserId, role);
  }

  async logRoleRemoved(
    orgId: string,
    actedBy: string,
    targetUserId: string,
    role: string
  ): Promise<void> {
    return this.logRoleChange('role_removed', orgId, actedBy, targetUserId, role);
  }
}

export const auditLogService = new AuditLogService(); 