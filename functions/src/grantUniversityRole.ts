import { https } from 'firebase-functions';
import * as admin from 'firebase-admin';

interface GrantRoleData {
  orgId: string;
  email: string;
  role: string;
}

interface GrantRoleResponse {
  success: boolean;
  message: string;
}

const allowedRoles = ['admin', 'editor', 'contributor'];

export const grantUniversityRole = https.onCall(async (data: GrantRoleData, context) => {
  const { orgId, email, role } = data;
  const adminUid = context.auth?.uid;
  if (!adminUid) throw new https.HttpsError('unauthenticated', 'Must be signed in');

  // Verify admin has permission for this organization
  const adminDoc = await admin.firestore().collection('users').doc(adminUid).get();
  const adminData = adminDoc.data();
  if (!adminData?.organizations?.includes(orgId)) {
    throw new https.HttpsError('permission-denied', 'Not authorized for this organization');
  }

  // Validate role
  if (!allowedRoles.includes(role)) {
    throw new https.HttpsError('invalid-argument', 'Invalid role specified');
  }

  try {
    // Get user by email
    const userRecord = await admin.auth().getUserByEmail(email);
    const userId = userRecord.uid;

    // Update user's organization roles
    const userRef = admin.firestore().collection('users').doc(userId);
    await userRef.update({
      [`organizations.${orgId}`]: role
    });

    return {
      success: true,
      message: `Successfully granted ${role} role to ${email}`
    };
  } catch (error) {
    console.error('Error granting role:', error);
    throw new https.HttpsError('internal', 'Failed to grant role');
  }
}); 