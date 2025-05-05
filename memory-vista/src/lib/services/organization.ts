import { getDb } from '@/lib/firebase';
import { collection, doc, setDoc, getDoc } from 'firebase/firestore';
import { AppError } from '@/lib/errors';
import type { Organization } from '@/types';

export async function createOrganization(
  userId: string,
  data: Pick<Organization, 'name'>
): Promise<Organization> {
  try {
    const db = getDb();
    // Create document in universities collection with the user's ID as the document ID
    const universityRef = doc(db, 'universities', userId);
    const universityData = {
      id: userId,
      name: data.name,
      adminIds: [userId],
      communityPageUrl: `/university/${userId}`,
      createdAt: new Date(),
    };

    await setDoc(universityRef, universityData);
    return universityData;
  } catch (error) {
    throw new AppError(
      'Failed to create university account',
      'UNIVERSITY_CREATION_FAILED',
      500
    );
  }
}

export async function getOrganization(orgId: string): Promise<Organization> {
  try {
    const db = getDb();
    const orgRef = doc(db, 'organizations', orgId);
    const orgDoc = await getDoc(orgRef);

    if (!orgDoc.exists()) {
      throw new AppError(
        'Organization not found',
        'ORG_NOT_FOUND',
        404
      );
    }

    return orgDoc.data() as Organization;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(
      'Failed to fetch organization',
      'ORG_FETCH_FAILED',
      500
    );
  }
}

export async function isUserAdmin(orgId: string, userId: string): Promise<boolean> {
  try {
    const org = await getOrganization(orgId);
    return org.adminIds.includes(userId);
  } catch (error) {
    if (error instanceof AppError && error.code === 'ORG_NOT_FOUND') {
      return false;
    }
    throw error;
  }
} 