import { Timestamp } from 'firebase/firestore';

export interface MemorialBasicInfo {
  name: string;
  birthDate?: Date;
  deathDate?: Date;
  location?: string;
  description?: string;
}

export interface MemorialLifeStory {
  biography?: string;
  achievements?: string[];
  legacy?: string;
}

export interface MemorialPhoto {
  id: string;
  url: string;
  caption?: string;
  date?: Date;
}

export interface Memorial {
  id: string;
  universityId: string;
  status: 'draft' | 'published' | 'archived';
  basicInfo: MemorialBasicInfo;
  lifeStory?: MemorialLifeStory;
  photos?: MemorialPhoto[];
  createdAt: Timestamp;
  updatedAt?: Timestamp;
  creatorId?: string;
  collaboratorIds?: string[];
  universityApproved?: boolean;
  lastModifiedAt: Timestamp;
  lastModifiedBy: string;
  version: number;
  title: string;
  description?: string;
  content?: Record<string, any>;
  coverImage?: string;
  profileId?: string;
  timeline?: Array<{
    id: string;
    date: Date;
    title: string;
    description: string;
    type: string;
  }>;
  mediaFiles?: Array<{
    id: string;
    url: string;
    type: string;
    name: string;
  }>;
  visibility: 'public' | 'private' | 'university';
}

export interface MemorialPreview {
  id: string;
  title: string;
  description: string;
  coverImage: string;
  createdAt: Timestamp;
  createdBy: string;
  universityId: string;
  lastModifiedAt: Timestamp;
}

export function memorialToPreview(memorial: Memorial): MemorialPreview {
  return {
    id: memorial.id,
    title: memorial.basicInfo.name,
    description: memorial.lifeStory?.biography || '',
    coverImage: memorial.photos?.[0]?.url || '',
    createdAt: memorial.createdAt,
    createdBy: memorial.creatorId || '',
    universityId: memorial.universityId,
    lastModifiedAt: memorial.lastModifiedAt,
  };
} 