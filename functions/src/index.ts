import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin
admin.initializeApp();

// Types
type UserRole = 'admin' | 'editor' | 'contributor' | 'viewer';

interface GrantRoleData {
  email: string;
  role: UserRole;
  profileId: string;
  universityId: string;
}

interface RevokeRoleData {
  email: string;
  profileId: string;
  universityId: string;
}

// Helper function to check if user is an admin
async function isUserAdmin(userId: string, universityId: string): Promise<boolean> {
  const adminPermission = await admin.firestore()
    .doc(`universities/${universityId}/permissions/${userId}`)
    .get();

  return adminPermission.exists && adminPermission.data()?.role === 'admin';
}

// Helper function to log audit events
async function logAuditEvent(
  action: string,
  data: Record<string, any>,
  userId: string
): Promise<void> {
  await admin.firestore()
    .collection('audit_logs')
    .add({
      action,
      ...data,
      performedBy: userId,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });
}

// Grant role to user
export const grantRole = functions.https.onCall(async (data: GrantRoleData, context) => {
  // Validate request
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'User must be logged in'
    );
  }

  const { email, role, profileId, universityId } = data;
  const adminUid = context.auth.uid;

  try {
    // Verify admin status
    const isAdmin = await isUserAdmin(adminUid, universityId);
    if (!isAdmin) {
      throw new functions.https.HttpsError(
        'permission-denied',
        'User must be an admin'
      );
    }

    // Create or update permission
    const permissionRef = admin.firestore()
      .doc(`profiles/${profileId}/permissions/${email}`);

    await permissionRef.set({
      role,
      grantedAt: admin.firestore.FieldValue.serverTimestamp(),
      grantedBy: adminUid
    });

    // Log the action
    await logAuditEvent('role_granted', {
      profileId,
      universityId,
      email,
      role
    }, adminUid);

    return { success: true };
  } catch (error) {
    console.error('Error granting role:', error);
    throw new functions.https.HttpsError(
      'internal',
      'Failed to grant role'
    );
  }
});

// Revoke role from user
export const revokeRole = functions.https.onCall(async (data: RevokeRoleData, context) => {
  // Validate request
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'User must be logged in'
    );
  }

  const { email, profileId, universityId } = data;
  const adminUid = context.auth.uid;

  try {
    // Verify admin status
    const isAdmin = await isUserAdmin(adminUid, universityId);
    if (!isAdmin) {
      throw new functions.https.HttpsError(
        'permission-denied',
        'User must be an admin'
      );
    }

    // Remove permission
    const permissionRef = admin.firestore()
      .doc(`profiles/${profileId}/permissions/${email}`);

    await permissionRef.delete();

    // Log the action
    await logAuditEvent('role_revoked', {
      profileId,
      universityId,
      email
    }, adminUid);

    return { success: true };
  } catch (error) {
    console.error('Error revoking role:', error);
    throw new functions.https.HttpsError(
      'internal',
      'Failed to revoke role'
    );
  }
});

// Get user's role for a profile
export const getUserRole = functions.https.onCall(async (data: { profileId: string }, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'User must be logged in'
    );
  }

  const { profileId } = data;
  const userId = context.auth.uid;

  try {
    const permissionRef = admin.firestore()
      .doc(`profiles/${profileId}/permissions/${userId}`);
    
    const permissionDoc = await permissionRef.get();
    
    if (!permissionDoc.exists) {
      return { role: null };
    }

    return { role: permissionDoc.data()?.role };
  } catch (error) {
    console.error('Error getting user role:', error);
    throw new functions.https.HttpsError(
      'internal',
      'Failed to get user role'
    );
  }
});

export * from './grantUniversityRole'; 