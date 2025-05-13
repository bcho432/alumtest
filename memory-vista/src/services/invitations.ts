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
    const db = getDb();
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
    const db = getDb();
    const invitationsCollection = collection(db, 'invitations');
    const q = query(invitationsCollection, where('token', '==', token));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return null;
    }
    
    const doc = querySnapshot.docs[0];
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
    
    return {
      ...data,
      id: doc.id,
      createdAt,
      expiresAt,
    } as MemorialInvitation;
  } catch (error) {
    console.error('Error getting invitation by token:', error);
    if (error instanceof Error) {
      throw new Error(`Failed to get invitation: ${error.message}`);
    }
    throw new Error('Failed to get invitation');
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
    
    const db = getDb();
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
      memorialIds: [],
      createdAt: now,
    };
    
    await setDoc(associationRef, {
      ...association,
      createdAt: now.toISOString(),
    });
    
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
    const db = getDb();
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
    const db = getDb();
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
    const db = getDb();
    const associationsCollection = collection(db, 'userUniversityAssociations');
    const q = query(associationsCollection, where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    
    const associations: UserUniversityAssociation[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      
      // Handle date conversion
      let createdAt = new Date();
      
      if (data.createdAt) {
        if (typeof data.createdAt.toDate === 'function') {
          createdAt = data.createdAt.toDate();
        } else if (typeof data.createdAt === 'string') {
          createdAt = new Date(data.createdAt);
        }
      }
      
      associations.push({
        ...data,
        id: doc.id,
        createdAt,
      } as UserUniversityAssociation);
    });
    
    return associations;
  } catch (error) {
    console.error('Error getting user university associations:', error);
    if (error instanceof Error) {
      throw new Error(`Failed to get associations: ${error.message}`);
    }
    throw new Error('Failed to get associations');
  }
} 