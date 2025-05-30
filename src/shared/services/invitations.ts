import { collection, doc, setDoc, getDoc, getDocs, query, where, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';
import { MemorialInvitation, UserUniversityAssociation } from '@/types';
import { v4 as uuidv4 } from 'uuid';

/**
 * Generate a unique invitation token
 */
function generateToken(): string {
  return uuidv4();
}

/**
 * Create a new invitation for someone to create a memorial
 * @param universityId The ID of the university creating the invitation
 * @param email Optional email to associate with the invitation
 * @param expiresInDays Number of days until the invitation expires
 */
export async function createInvitation(
  universityId: string,
  email?: string,
  expiresInDays: number = 7
): Promise<MemorialInvitation> {
  if (!universityId) {
    throw new Error('University ID is required');
  }
  
  try {
    const db = await getDb();
    const invitationRef = doc(collection(db, 'invitations'));
    const token = generateToken();
    const now = new Date();
    const expiresAt = new Date();
    expiresAt.setDate(now.getDate() + expiresInDays);
    
    const invitation: MemorialInvitation = {
      id: invitationRef.id,
      universityId,
      token,
      status: 'pending',
      email,
      createdAt: now,
      expiresAt,
    };
    
    await setDoc(invitationRef, {
      ...invitation,
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
    });
    
    return invitation;
  } catch (error) {
    console.error('Error creating invitation:', error);
    if (error instanceof Error) {
      throw new Error(`Failed to create invitation: ${error.message}`);
    }
    throw new Error('Failed to create invitation');
  }
}

/**
 * Get an invitation by its token
 */
export async function getInvitationByToken(token: string): Promise<MemorialInvitation | null> {
  if (!token) {
    throw new Error('Token is required');
  }
  
  try {
    console.log('Getting invitation by token:', token);
    const db = await getDb();
    const invitationsCollection = collection(db, 'invitations');
    const q = query(invitationsCollection, where('token', '==', token));
    
    console.log('Attempting to execute Firestore query');
    const querySnapshot = await getDocs(q);
    console.log('Query executed successfully');
    
    if (querySnapshot.empty) {
      console.log('No invitation found with token:', token);
      return null;
    }
    
    const doc = querySnapshot.docs[0];
    const data = doc.data();
    console.log('Raw invitation data:', data);
    
    // Handle date conversion more robustly
    let createdAt = new Date();
    let expiresAt = new Date();
    
    try {
      if (data.createdAt) {
        if (typeof data.createdAt === 'object' && typeof data.createdAt.toDate === 'function') {
          createdAt = data.createdAt.toDate();
        } else if (typeof data.createdAt === 'string') {
          createdAt = new Date(data.createdAt);
        } else if (data.createdAt instanceof Date) {
          createdAt = data.createdAt;
        }
      }
      
      if (data.expiresAt) {
        if (typeof data.expiresAt === 'object' && typeof data.expiresAt.toDate === 'function') {
          expiresAt = data.expiresAt.toDate();
        } else if (typeof data.expiresAt === 'string') {
          expiresAt = new Date(data.expiresAt);
        } else if (data.expiresAt instanceof Date) {
          expiresAt = data.expiresAt;
        }
      }
    } catch (dateError) {
      console.error('Error parsing dates:', dateError);
    }
    
    const invitation = {
      ...data,
      id: doc.id,
      createdAt,
      expiresAt,
    } as MemorialInvitation;
    
    console.log('Processed invitation:', invitation);
    return invitation;
  } catch (error) {
    console.error('Error getting invitation by token:', error);
    // Log specific Firebase errors
    if (error instanceof Error) {
      console.error('Error type:', error.name);
      console.error('Error message:', error.message);
      
      // Check for Firebase permission errors
      if (error.name === 'FirebaseError' && error.message.includes('permission')) {
        console.error('Firebase permissions error detected. Check Firestore security rules.');
      }
    }
    
    throw error;
  }
}

/**
 * Accept an invitation and create a UserUniversityAssociation
 */
export async function acceptInvitation(
  token: string, 
  userId: string
): Promise<{ invitation: MemorialInvitation, association: UserUniversityAssociation }> {
  if (!token) {
    throw new Error('Token is required');
  }
  
  if (!userId) {
    throw new Error('User ID is required');
  }
  
  try {
    const invitation = await getInvitationByToken(token);
    
    if (!invitation) {
      throw new Error('Invitation not found');
    }
    
    if (invitation.status !== 'pending') {
      throw new Error(`Invitation is already ${invitation.status}`);
    }
    
    if (invitation.expiresAt < new Date()) {
      throw new Error('Invitation has expired');
    }
    
    const db = await getDb();
    const invitationRef = doc(db, 'invitations', invitation.id);
    
    // Update invitation status
    const updatedInvitation: Partial<MemorialInvitation> = {
      status: 'accepted',
      acceptedBy: userId,
    };
    
    await updateDoc(invitationRef, updatedInvitation);
    
    // Create UserUniversityAssociation
    const associationRef = doc(collection(db, 'userUniversityAssociations'));
    const now = new Date();
    
    const association: UserUniversityAssociation = {
      id: associationRef.id,
      userId,
      universityId: invitation.universityId,
      role: 'contributor',
      memorialIds: [], // This will be updated when a memorial is created
      createdAt: now,
    };
    
    await setDoc(associationRef, {
      ...association,
      createdAt: now.toISOString(),
    });
    
    console.log(`User ${userId} accepted invitation ${invitation.id} for university ${invitation.universityId}`);
    console.log(`Created association: ${associationRef.id}`);
    
    return {
      invitation: { ...invitation, ...updatedInvitation } as MemorialInvitation,
      association,
    };
  } catch (error) {
    console.error('Error accepting invitation:', error);
    if (error instanceof Error) {
      throw new Error(`Failed to accept invitation: ${error.message}`);
    }
    throw new Error('Failed to accept invitation');
  }
}

/**
 * Get all invitations for a university
 */
export async function getUniversityInvitations(universityId: string): Promise<MemorialInvitation[]> {
  if (!universityId) {
    throw new Error('University ID is required');
  }
  
  try {
    const db = await getDb();
    const invitationsCollection = collection(db, 'invitations');
    const q = query(invitationsCollection, where('universityId', '==', universityId));
    const querySnapshot = await getDocs(q);
    
    const invitations: MemorialInvitation[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      
      // Handle date conversion
      let createdAt = new Date();
      let expiresAt = new Date();
      
      if (data.createdAt) {
        if (typeof data.createdAt.toDate === 'function') {
          createdAt = data.createdAt.toDate();
        } else if (typeof data.createdAt === 'string') {
          createdAt = new Date(data.createdAt);
        }
      }
      
      if (data.expiresAt) {
        if (typeof data.expiresAt.toDate === 'function') {
          expiresAt = data.expiresAt.toDate();
        } else if (typeof data.expiresAt === 'string') {
          expiresAt = new Date(data.expiresAt);
        }
      }
      
      invitations.push({
        ...data,
        id: doc.id,
        createdAt,
        expiresAt,
      } as MemorialInvitation);
    });
    
    return invitations;
  } catch (error) {
    console.error('Error getting university invitations:', error);
    if (error instanceof Error) {
      throw new Error(`Failed to get invitations: ${error.message}`);
    }
    throw new Error('Failed to get invitations');
  }
}

/**
 * Delete an invitation
 */
export async function deleteInvitation(invitationId: string): Promise<void> {
  if (!invitationId) {
    throw new Error('Invitation ID is required');
  }
  
  try {
    const db = await getDb();
    const invitationRef = doc(db, 'invitations', invitationId);
    await deleteDoc(invitationRef);
  } catch (error) {
    console.error('Error deleting invitation:', error);
    if (error instanceof Error) {
      throw new Error(`Failed to delete invitation: ${error.message}`);
    }
    throw new Error('Failed to delete invitation');
  }
}

/**
 * Get all university associations for a user
 */
export async function getUserUniversityAssociations(userId: string): Promise<UserUniversityAssociation[]> {
  if (!userId) {
    throw new Error('User ID is required');
  }
  try {
    const db = await getDb();
    const associationsCollection = collection(db, 'userUniversityAssociations');
    const userIdStr = String(userId);
    const q = query(associationsCollection, where('userId', '==', userIdStr));
    const querySnapshot = await getDocs(q);
    const associations: Record<string, UserUniversityAssociation & { universityName?: string }> = {};
    // Process regular associations
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      let createdAt = new Date();
      if (data.createdAt) {
        if (typeof data.createdAt.toDate === 'function') {
          createdAt = data.createdAt.toDate();
        } else if (typeof data.createdAt === 'string') {
          createdAt = new Date(data.createdAt);
        }
      }
      const memorialIds = Array.isArray(data.memorialIds) ? data.memorialIds : [];
      associations[data.universityId] = {
        id: doc.id,
        userId: data.userId || userIdStr,
        universityId: data.universityId,
        role: data.role || 'contributor',
        createdAt,
        memorialIds,
        universityName: data.universityName, // will be overwritten below if needed
      };
    });
    // Check for admin roles in the permissions collection and adminIds array
    const universitiesCollection = collection(db, 'universities');
    const universitiesSnapshot = await getDocs(universitiesCollection);
    for (const universityDoc of universitiesSnapshot.docs) {
      const universityId = universityDoc.id;
      const universityData = universityDoc.data();
      const universityName = universityData.name || universityId;
      // Check adminIds array
      const adminIds = universityData.adminIds || [];
      if (adminIds.includes(userIdStr)) {
        if (!associations[universityId] || associations[universityId].role !== 'admin') {
          associations[universityId] = {
            id: `admin-${universityId}`,
            userId: userIdStr,
            universityId,
            role: 'admin',
            memorialIds: [],
            createdAt: new Date(),
            universityName,
          };
        } else {
          associations[universityId].role = 'admin';
        }
      }
      // Check permissions subcollection
      const permissionRef = doc(db, 'universities', universityId, 'permissions', userIdStr);
      const permissionDoc = await getDoc(permissionRef);
      if (permissionDoc.exists()) {
        const permissionData = permissionDoc.data();
        if (permissionData.role === 'admin') {
          if (!associations[universityId] || associations[universityId].role !== 'admin') {
            associations[universityId] = {
              id: `admin-${universityId}`,
              userId: userIdStr,
              universityId,
              role: 'admin',
              memorialIds: [],
              createdAt: new Date(),
              universityName,
            };
          } else {
            associations[universityId].role = 'admin';
          }
        }
      }
      // Always attach universityName for dashboard display
      if (associations[universityId]) {
        associations[universityId].universityName = universityName;
      }
    }
    // Return deduplicated associations as an array
    return Object.values(associations);
  } catch (error) {
    console.error('Error getting user university associations:', error);
    if (error instanceof Error) {
      throw new Error(`Failed to get associations: ${error.message}`);
    }
    throw new Error('Failed to get associations');
  }
} 