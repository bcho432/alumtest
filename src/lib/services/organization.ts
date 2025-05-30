import { getDb } from '@/lib/firebase';
import { collection, doc, setDoc, getDoc } from 'firebase/firestore';
import { AppError } from '@/lib/errors';
import type { Organization } from '@/types';

export async function createOrganization(
  userId: string,
  data: Pick<Organization, 'name'>
): Promise<Organization> {
  try {
    const db = await getDb();
    // Create document in universities collection with the user's ID as the document ID
    const universityRef = doc(db, 'universities', userId);
    const universityData = {
      id: userId,
      name: data.name,
      type: 'university' as const,
      description: '',
      location: '',
      logoUrl: '',
      theme: {
        primaryColor: '#4F46E5',
        secondaryColor: '#818CF8'
      },
      adminIds: [userId],
      memberIds: [],
      communityPageUrl: `/university/${userId}`,
      createdAt: new Date(),
      updatedAt: new Date(),
      settings: {
        allowMediaUpload: true,
        allowComments: true
      }
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
    const db = await getDb();
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