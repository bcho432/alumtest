import { getFunctions, httpsCallable } from 'firebase/functions';
import { AllowedRole, UserPermission } from '@/types/permission';
import { analytics } from './analytics';
import { getFirebaseServices } from '@/lib/firebase';

interface GetUserRoleResponse {
  role: AllowedRole | null;
}

export const permissionsService = {
  /**
   * Get a user's permission for a university
   */
  async getUserUniversityPermission(userId: string, universityId: string): Promise<UserPermission | null> {
    const services = await getFirebaseServices();
    const functions = getFunctions(services.app);
    const getRole = httpsCallable<{ profileId: string }, GetUserRoleResponse>(functions, 'getUserRole');
    const result = await getRole({ profileId: universityId });
    return result.data.role ? {
      role: result.data.role,
      grantedAt: new Date(),
      grantedBy: services.auth.currentUser?.uid || 'system'
    } : null;
  },

  /**
   * Get a user's permission for a profile
   */
  async getUserProfilePermission(userId: string, profileId: string): Promise<UserPermission | null> {
    const services = await getFirebaseServices();
    const functions = getFunctions(services.app);
    const getRole = httpsCallable<{ profileId: string }, GetUserRoleResponse>(functions, 'getUserRole');
    const result = await getRole({ profileId });
    return result.data.role ? {
      role: result.data.role,
      grantedAt: new Date(),
      grantedBy: services.auth.currentUser?.uid || 'system'
    } : null;
  },

  /**
   * Get all permissions for a profile
   */
  async getProfilePermissions(profileId: string): Promise<Record<string, UserPermission>> {
    const services = await getFirebaseServices();
    const functions = getFunctions(services.app);
    const getRole = httpsCallable<{ profileId: string }, GetUserRoleResponse>(functions, 'getUserRole');
    const result = await getRole({ profileId });
    return result.data.role ? {
      [services.auth.currentUser?.uid || '']: {
        role: result.data.role,
        grantedAt: new Date(),
        grantedBy: services.auth.currentUser?.uid || 'system'
      }
    } : {};
  },

  /**
   * Set a user's permission for a university
   */
  async setUserUniversityPermission(userId: string, universityId: string, role: AllowedRole): Promise<void> {
    const services = await getFirebaseServices();
    const functions = getFunctions(services.app);
    const grantRole = httpsCallable<{
      email: string;
      role: AllowedRole;
      profileId: string;
      universityId: string;
    }, { success: boolean }>(functions, 'grantRole');
    
    await grantRole({
      email: userId,
      role,
      profileId: universityId,
      universityId
    });
    
    analytics.trackEvent({
      name: 'university_permission_granted',
      properties: { universityId, userId, role }
    });
  },

  /**
   * Set a user's permission for a profile
   */
  async setUserProfilePermission(userId: string, profileId: string, role: AllowedRole): Promise<void> {
    const services = await getFirebaseServices();
    const functions = getFunctions(services.app);
    const grantRole = httpsCallable<{
      email: string;
      role: AllowedRole;
      profileId: string;
      universityId: string;
    }, { success: boolean }>(functions, 'grantRole');
    
    await grantRole({
      email: userId,
      role,
      profileId,
      universityId: profileId // This will be updated when we implement university context
    });
    
    analytics.trackEvent({
      name: 'profile_permission_granted',
      properties: { profileId, userId, role }
    });
  },

  /**
   * Remove a user's permission for a university
   */
  async removeUserUniversityPermission(userId: string, universityId: string): Promise<void> {
    const services = await getFirebaseServices();
    const functions = getFunctions(services.app);
    const revokeRole = httpsCallable<{
      email: string;
      profileId: string;
      universityId: string;
    }, { success: boolean }>(functions, 'revokeRole');
    
    await revokeRole({
      email: userId,
      profileId: universityId,
      universityId
    });
    
    analytics.trackEvent({
      name: 'university_permission_revoked',
      properties: { universityId, userId }
    });
  },

  /**
   * Remove a user's permission for a profile
   */
  async removeUserProfilePermission(userId: string, profileId: string): Promise<void> {
    const services = await getFirebaseServices();
    const functions = getFunctions(services.app);
    const revokeRole = httpsCallable<{
      email: string;
      profileId: string;
      universityId: string;
    }, { success: boolean }>(functions, 'revokeRole');
    
    await revokeRole({
      email: userId,
      profileId,
      universityId: profileId // This will be updated when we implement university context
    });
    
    analytics.trackEvent({
      name: 'profile_permission_revoked',
      properties: { profileId, userId }
    });
  }
}; 