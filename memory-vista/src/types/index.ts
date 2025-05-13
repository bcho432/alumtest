export interface User {
  uid: string;
  email: string | null;
  displayName?: string;
  photoURL?: string;
}

export interface Organization {
  id: string;
  name: string;
  adminIds: string[];
  communityPageUrl: string;
  createdAt: Date;
}

export interface Profile {
  id: string;
  orgId: string;
  fullName: string;
  dateOfBirth?: Date;
  dateOfDeath?: Date;
  biography?: string;
  photoUrl?: string;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface TimelineEvent {
  id: string;
  profileId: string;
  title: string;
  description?: string;
  date: Date;
  location?: string;
  mediaUrls?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface FamilyMember {
  id: string;
  profileId: string;
  relatedProfileId: string;
  relationship: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MemorialInvitation {
  id: string;
  universityId: string;
  token: string;
  status: 'pending' | 'accepted' | 'expired';
  email?: string;
  createdAt: Date;
  expiresAt: Date;
  memorialId?: string;
  acceptedBy?: string;
}

export interface UserUniversityAssociation {
  id: string;
  userId: string;
  universityId: string;
  role: 'admin' | 'contributor';
  memorialIds: string[];
  createdAt: Date;
} 