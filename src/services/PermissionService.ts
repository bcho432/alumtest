import { getDb } from '@/lib/firebase';
import { doc, getDoc, setDoc, deleteDoc, Timestamp, runTransaction } from 'firebase/firestore';
import { AppError } from '../utils/errors';
import { User } from '../types/profile';
import { AllowedRole, UserPermission } from '@/types/permission';
import { LRUCache } from 'lru-cache';
import { RateLimiter } from '@/lib/rateLimiter';
import { getAuth } from 'firebase/auth';
import { collection, getDocs, writeBatch } from 'firebase/firestore';
import { query, where } from 'firebase/firestore';

export class PermissionService {
  private static instance: PermissionService;
  private permissionCache: LRUCache<string, UserPermission>;
  private rateLimiter: RateLimiter;
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly MAX_REQUESTS_PER_MINUTE = 60;

  private constructor() {
    this.permissionCache = new LRUCache({
      max: 500,
      ttl: this.CACHE_TTL
    });
    this.rateLimiter = new RateLimiter(this.MAX_REQUESTS_PER_MINUTE);
  }

  public static getInstance(): PermissionService {
    if (!PermissionService.instance) {
      PermissionService.instance = new PermissionService();
    }
    return PermissionService.instance;
  }

  async canEditProfile(profileId: string): Promise<boolean> {
    try {
      await this.rateLimiter.checkLimit('canEditProfile');
      
      const cacheKey = `edit_profile:${profileId}`;
      const cachedPermission = this.permissionCache.get(cacheKey);
      if (cachedPermission) {
        return true;
      }

      const db = await getDb();
      const profileRef = doc(db, 'profiles', profileId);
      
      return await runTransaction(db, async (transaction) => {
        const profileDoc = await transaction.get(profileRef);
        
        if (!profileDoc.exists()) {
          throw new AppError('NOT_FOUND', 'Profile not found', 404);
        }

        const profile = profileDoc.data();
        const user = await this.getCurrentUser();

        if (!user) {
          return false;
        }

        // Check if user is the profile owner
        if (profile.createdBy === user.id) {
          this.permissionCache.set(cacheKey, { role: 'admin', grantedAt: new Date(), grantedBy: 'system' });
          return true;
        }

        // Check if user is an admin
        if (user.orgRoles?.[profile.orgId] === 'admin') {
          this.permissionCache.set(cacheKey, { role: 'admin', grantedAt: new Date(), grantedBy: 'system' });
          return true;
        }

        // Check if user is a family member
        if (user.orgRoles?.[profile.orgId] === 'family') {
          this.permissionCache.set(cacheKey, { role: 'editor', grantedAt: new Date(), grantedBy: 'system' });
          return true;
        }

        return false;
      });
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw AppError.fromFirebaseError(error as any);
    }
  }

  async getUserProfilePermission(userId: string, profileId: string): Promise<UserPermission | null> {
    try {
      await this.rateLimiter.checkLimit('getUserProfilePermission');
      
      const cacheKey = `profile_permission:${userId}:${profileId}`;
      const cachedPermission = this.permissionCache.get(cacheKey);
      if (cachedPermission) {
        return cachedPermission as UserPermission;
      }

      const db = await getDb();
      const permissionRef = doc(db, 'profiles', profileId, 'permissions', userId);
      const permissionDoc = await getDoc(permissionRef);

      if (!permissionDoc.exists()) {
        return null;
      }

      const permission = permissionDoc.data() as UserPermission;
      this.permissionCache.set(cacheKey, permission);
      return permission;
    } catch (error) {
      console.error('Error getting user profile permission:', error);
      throw new AppError('PERMISSION_ERROR', 'Failed to get user permission', 500);
    }
  }

  async setUserProfilePermission(
    userId: string, 
    profileId: string, 
    role: AllowedRole, 
    grantedBy: string
  ): Promise<void> {
    try {
      await this.rateLimiter.checkLimit('setUserProfilePermission');
      
      const db = await getDb();
      const permissionRef = doc(db, 'profiles', profileId, 'permissions', userId);
      
      await runTransaction(db, async (transaction) => {
        const permission: UserPermission = {
          role,
          grantedBy,
          grantedAt: Timestamp.now(),
          lastAccess: Timestamp.now()
        };

        await transaction.set(permissionRef, permission);
        
        // Update audit log
        const auditRef = doc(db, 'audit_logs', `${profileId}_${userId}_${Date.now()}`);
        await transaction.set(auditRef, {
          type: 'permission_change',
          profileId,
          userId,
          role,
          grantedBy,
          timestamp: Timestamp.now()
        });
      });

      // Invalidate cache
      this.permissionCache.delete(`profile_permission:${userId}:${profileId}`);
    } catch (error) {
      console.error('Error setting user profile permission:', error);
      throw new AppError('PERMISSION_ERROR', 'Failed to set user permission', 500);
    }
  }

  async revokeUserProfilePermission(userId: string, profileId: string, revokedBy: string): Promise<void> {
    try {
      await this.rateLimiter.checkLimit('revokeUserProfilePermission');
      
      const db = await getDb();
      const permissionRef = doc(db, 'profiles', profileId, 'permissions', userId);
      
      await runTransaction(db, async (transaction) => {
        const permissionDoc = await transaction.get(permissionRef);
        if (!permissionDoc.exists()) {
          throw new AppError('NOT_FOUND', 'Permission not found', 404);
        }

        await transaction.delete(permissionRef);
        
        // Update audit log
        const auditRef = doc(db, 'audit_logs', `${profileId}_${userId}_${Date.now()}`);
        await transaction.set(auditRef, {
          type: 'permission_revoked',
          profileId,
          userId,
          revokedBy,
          timestamp: Timestamp.now()
        });
      });

      // Invalidate cache
      this.permissionCache.delete(`profile_permission:${userId}:${profileId}`);
    } catch (error) {
      console.error('Error revoking user profile permission:', error);
      throw new AppError('PERMISSION_ERROR', 'Failed to revoke user permission', 500);
    }
  }

  private async getCurrentUser(): Promise<User | null> {
    try {
      const auth = await getAuth();
      if (!auth.currentUser) {
        return null;
      }

      const db = await getDb();
      const userRef = doc(db, 'users', auth.currentUser.uid);
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists()) {
        return null;
      }

      return userDoc.data() as User;
    } catch (error) {
      console.error('Error getting current user:', error);
      throw new AppError('AUTH_ERROR', 'Failed to get current user', 500);
    }
  }

  // Cleanup stale permissions
  async cleanupStalePermissions(): Promise<void> {
    try {
      const db = await getDb();
      const thirtyDaysAgo = Timestamp.fromDate(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
      
      const permissionsQuery = query(
        collection(db, 'profiles'),
        where('lastAccess', '<', thirtyDaysAgo)
      );

      const snapshot = await getDocs(permissionsQuery);
      
      const batch = writeBatch(db);
      snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });

      await batch.commit();
    } catch (error) {
      console.error('Error cleaning up stale permissions:', error);
      throw new AppError('CLEANUP_ERROR', 'Failed to cleanup stale permissions', 500);
    }
  }
} 