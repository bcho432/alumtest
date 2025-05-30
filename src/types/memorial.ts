export interface MemorialBasicInfo {
  name: string;
  dateOfBirth?: string;
  birthLocation?: string;
  dateOfDeath?: string;
  deathLocation?: string;
}

export interface MemorialLifeStory {
  education?: string;
  notableAchievements?: string;
  jobs?: string;
  majorLifeEvents?: string;
  hobbies?: string;
  personalStories?: string;
  memorableQuotes?: string;
  communityInvolvement?: string;
}

export interface MemorialPhoto {
  url: string;
  caption?: string;
}

export interface Memorial {
  id: string;
  universityId: string;
  status: 'draft' | 'published';
  basicInfo: MemorialBasicInfo;
  lifeStory?: MemorialLifeStory;
  photos?: MemorialPhoto[];
  createdAt: Date | string;
  updatedAt: Date | string;
  creatorId?: string;
  collaboratorIds?: string[];
  universityApproved?: boolean;
}

export interface MemorialPreview {
  id: string;
  title: string;
  description: string;
  coverImage: string;
  createdAt: Date | string;
  createdBy: string;
  universityId: string;
}

export function memorialToPreview(memorial: Memorial): MemorialPreview {
  return {
    id: memorial.id,
    title: memorial.basicInfo.name,
    description: memorial.lifeStory?.personalStories || '',
    coverImage: memorial.photos?.[0]?.url || '',
    createdAt: memorial.createdAt,
    createdBy: memorial.creatorId || '',
    universityId: memorial.universityId
  };
} 