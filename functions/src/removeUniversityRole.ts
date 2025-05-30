import { https } from 'firebase-functions';
import * as admin from 'firebase-admin';

interface RemoveRoleData {
  orgId: string;
  userId: string;
}

interface RemoveRoleResponse {
  success: boolean;
}

export const removeUniversityRole = https.onCall(async (data: RemoveRoleData, context) => {
  const { orgId, userId } = data;
  const adminUid = context.auth?.uid;
  if (!adminUid) throw new https.HttpsError('unauthenticated', 'Must be signed in');

  // 1. Check admin status
  const uniDoc = await admin.firestore().doc(`universities/${orgId}`).get();
  if (!uniDoc.exists || !uniDoc.data()?.adminIds?.includes(adminUid)) {
    throw new https.HttpsError('permission-denied', 'Not a university admin');
  }

  // 2. Check if user exists
  try {
    await admin.auth().getUser(userId);
  } catch {
    throw new https.HttpsError('not-found', 'User not found');
  }

  // 3. Check if permission exists
  const permRef = admin.firestore().doc(`universities/${orgId}/permissions/${userId}`);
  const existingPerm = await permRef.get();
  
  if (!existingPerm.exists) {
    throw new https.HttpsError('not-found', 'User does not have a role in this university');
  }

  // 4. Get the role before deletion for audit log
  const role = existingPerm.data()?.role;

  // 5. Delete the permission
  await permRef.delete();

  // 6. Audit log
  await admin.firestore().collection('audit_logs').add({
    action: 'role_removed',
    orgId,
    userId,
    role,
    removedBy: adminUid,
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
  });

  return { success: true };
}); 