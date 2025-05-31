import { Timestamp } from 'firebase/firestore';
import { QuestionCategory } from './questions';
import { z } from 'zod';

export type EventType = 'education' | 'work';

export interface LifeEvent {
  id: string;
  type: EventType;
  title: string;
  startDate: string;
  endDate?: string;
  description?: string;
  location?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface TimelineBuilderProps {
  initialEvents?: LifeEvent[];
  onEventsChange?: (events: LifeEvent[]) => void;
  onNext?: () => void;
}

export interface EventFormData {
  type: EventType;
  title: string;
  description?: string;
  startDate: string;
  endDate?: string;
  location?: string;
}

export interface EventCardProps {
  event: LifeEvent;
  onEdit: (event: LifeEvent) => void;
  onDelete: (id: string) => void;
  isDragging?: boolean;
}

export type ProfileStatus = 'draft' | 'published' | 'archived';

export const timelineEventSchema = z.object({
  id: z.string(),
  type: z.enum(['education', 'job', 'event']),
  title: z.string().min(1, 'Title is required'),
  institution: z.string().optional(),
  company: z.string().optional(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime().optional(),
  location: z.string().optional(),
  description: z.string().optional(),
  mediaUrls: z.array(z.string().url()).optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
  metadata: z.object({
    tags: z.array(z.string()).optional(),
    visibility: z.enum(['public', 'private']).optional(),
    importance: z.enum(['high', 'medium', 'low']).optional(),
  }).optional(),
});

export interface TimelineEventWithId extends TimelineEvent {
  id: string;
}

export interface TimelineEventCreateDTO extends Omit<TimelineEvent, 'id' | 'createdAt' | 'updatedAt'> {
  profileId: string;
}

export interface TimelineEventUpdateDTO extends Partial<Omit<TimelineEvent, 'id' | 'createdAt' | 'updatedAt'>> {
  profileId: string;
}

export interface TimelineEventFilters {
  searchTerm?: string;
  eventTypes?: TimelineEvent['type'][];
  dateRange?: {
    start?: string;
    end?: string;
  };
  tags?: string[];
  importance?: NonNullable<TimelineEvent['metadata']>['importance'];
  visibility?: NonNullable<TimelineEvent['metadata']>['visibility'];
}

export interface StoryAnswer {
  id: string;
  questionId: string;
  question: string;
  answer: string;
}

export interface StoryPrompt {
  id: string;
  category: 'professional' | 'academic' | 'philosophical' | 'personal' | 'fun';
  question: string;
}

export interface Video {
  id: string;
  url: string;
  thumbnailUrl: string;
  title: string;
  description?: string;
  duration: number;
  uploadedBy: string;
  uploadedAt: string;
  metadata?: {
    width?: number;
    height?: number;
    format?: string;
    size?: number;
  };
}

export interface BaseProfile {
  id: string;
  type: 'personal' | 'memorial';
  name: string;
  status: 'draft' | 'published';
  isPublic: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
  updatedBy: string;
  metadata: {
    tags: string[];
    categories: string[];
    lastModifiedBy: string;
    lastModifiedAt: Timestamp;
    version: number;
  };
}

export interface PersonalProfile extends BaseProfile {
  type: 'personal';
  bio: string;
  photoURL: string;
  location: string;
  department: string;
  graduationYear: string;
  contact: {
    email: string;
    phone: string;
    website: string;
  };
  education: Array<{
    institution: string;
    degree: string;
    field: string;
    startDate: Timestamp;
    endDate: Timestamp;
  }>;
  experience: Array<{
    company: string;
    position: string;
    startDate: Timestamp;
    endDate: Timestamp;
    description: string;
  }>;
  achievements: Array<{
    title: string;
    date: Timestamp;
    description: string;
  }>;
  lifeStory?: Record<string, string>;
}

export interface MemorialProfile extends BaseProfile {
  type: 'memorial';
  universityId: string;
  description: string;
  imageUrl: string;
  basicInfo: {
    dateOfBirth: Timestamp | null;
    dateOfDeath: Timestamp | null;
    biography: string;
    photo: string;
    birthLocation: string;
    deathLocation: string;
  };
  lifeStory: {
    content: string;
    updatedAt: Timestamp;
  };
}

export type Profile = PersonalProfile | MemorialProfile;

export interface LocalDraft {
  id: string;
  name: string;
  status: 'draft' | 'published';
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
  isPublic: boolean;
  metadata: {
    tags: string[];
    categories: string[];
    lastModifiedBy: string;
    lastModifiedAt: Timestamp;
    version: number;
  };
  lastSaved: string;
  type: 'personal' | 'memorial';
  // Personal profile fields
  email?: string;
  bio?: string;
  location?: string;
  photoURL?: string;
  coverImage?: string;
  department?: string;
  graduationYear?: string;
  contact?: {
    email?: string;
    phone?: string;
    website?: string;
  };
  education?: Education[];
  experience?: Experience[];
  achievements?: Achievement[];
  // Memorial profile fields
  universityId?: string;
  description?: string;
  imageUrl?: string;
  basicInfo?: {
    dateOfBirth: Date;
    dateOfDeath: Date;
    biography: string;
    photo: string;
    birthLocation: string;
    deathLocation: string;
  };
  lifeStory?: {
    content: string;
    updatedAt: Date;
  };
  timeline?: TimelineEvent[];
  media?: {
    photos: Photo[];
    videos: Video[];
  };
}

export interface ProfileReference {
  id: string;
  name: string;
  status: ProfileStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface AlumniProfile {
  id: string;
  universityId: string;
  status: 'draft' | 'published';
  createdAt: Timestamp;
  updatedAt: Timestamp;
  name: string;
  description: string;
  imageUrl: string;
  createdBy: string;
  updatedBy: string;
  isPublic: boolean;
  tags: string[];
  metadata: Record<string, any>;
}

export interface CreateProfileData {
  orgId: string;
  name?: string;
  bio?: string;
  location?: string;
}

export type TimelineEntryType = 'education' | 'job' | 'event';

export interface TimelineEntryBase {
  id: string;
  type: TimelineEntryType;
  createdAt: Date;
  updatedAt: Date;
}

export interface EducationEntry extends TimelineEntryBase {
  type: 'education';
  institution: string;
  degree: string;
  startDate: Date;
  endDate: Date;
}

export interface JobEntry extends TimelineEntryBase {
  type: 'job';
  title: string;
  company: string;
  startDate: Date;
  endDate: Date;
}

export interface EventEntry extends TimelineEntryBase {
  type: 'event';
  title: string;
  description?: string;
  date: Date;
}

export type TimelineEntry = EducationEntry | JobEntry | EventEntry; 

export interface User {
  id: string;
  email: string;
  name?: string;
  orgRoles?: Record<string, 'admin' | 'family' | 'member'>;
  createdAt: Date;
  updatedAt: Date;
}

// Base schemas for validation
export const locationSchema = z.object({
  place: z.string().min(1, 'Location is required'),
  years: z.string().min(1, 'Years are required'),
});

export const educationSchema = z.object({
  institution: z.string().min(1, 'Institution is required'),
  degree: z.string().optional(),
  years: z.string().min(1, 'Years are required'),
  description: z.string().optional(),
  location: z.string().optional(),
});

export const jobSchema = z.object({
  company: z.string().min(1, 'Company is required'),
  position: z.string().optional(),
  years: z.string().min(1, 'Years are required'),
  description: z.string().optional(),
  location: z.string().optional(),
});

export const eventSchema = z.object({
  date: z.string(),
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  location: z.string().optional(),
  mediaUrls: z.array(z.string().url()).optional(),
  type: z.enum(['education', 'job', 'event']),
  importance: z.enum(['high', 'medium', 'low']).optional(),
  tags: z.array(z.string()).optional(),
});

export const storySchema = z.object({
  question: z.string().min(1, 'Question is required'),
  answer: z.string().min(1, 'Answer is required'),
  authorId: z.string().min(1, 'Author ID is required'),
  createdAt: z.string(),
  updatedAt: z.string().optional(),
  isPrivate: z.boolean().optional(),
});

export const photoSchema = z.object({
  url: z.string().url(),
  caption: z.string().optional(),
  isHeader: z.boolean().optional(),
  uploadedBy: z.string().min(1, 'Uploader ID is required'),
  uploadedAt: z.string(),
  tags: z.array(z.string()).optional(),
  location: z.string().optional(),
  date: z.string().optional(),
  folderId: z.string().optional(),
  folderName: z.string().optional(),
});

// Core interfaces
export interface Location {
  place: string;
  years: string;
}

export interface Education {
  institution: string;
  degree?: string;
  years: string;
  description?: string;
  location?: string;
}

export interface Job {
  company: string;
  position?: string;
  years: string;
  description?: string;
  location?: string;
}

export interface Story {
  id: string;
  question: string;
  answer: string;
  authorId: string;
  createdAt: string;
  updatedAt?: string;
  isPrivate?: boolean;
}

export interface Photo {
  id: string;
  url: string;
  caption?: string;
  tags?: string[];
  folderId: string | null;
  uploadedBy: string;
  uploadedAt: string;
  fileType?: string;
  fileSize?: number;
  metadata?: {
    width?: number;
    height?: number;
    duration?: number;
    thumbnailUrl?: string;
  };
}

export interface TimelineEvent {
  id: string;
  type: 'education' | 'job' | 'event';
  title: string;
  description?: string;
  startDate: string;
  endDate?: string;
  location?: string;
  mediaUrls?: string[];
  createdAt: Date;
  updatedAt: Date;
  metadata?: {
    institution?: string;
    company?: string;
    degree?: string;
    position?: string;
    importance?: 'high' | 'medium' | 'low';
    visibility?: 'public' | 'private';
    tags?: string[];
  };
}

// Type guards
export const isTimelineEvent = (event: any): event is TimelineEvent => {
  return (
    event &&
    typeof event.id === 'string' &&
    typeof event.startDate === 'string' &&
    typeof event.title === 'string' &&
    ['education', 'job', 'event'].includes(event.type)
  );
};

export const isStory = (story: any): story is Story => {
  return (
    story &&
    typeof story.id === 'string' &&
    typeof story.question === 'string' &&
    typeof story.answer === 'string' &&
    typeof story.authorId === 'string' &&
    typeof story.createdAt === 'string'
  );
};

export const isPhoto = (photo: any): photo is Photo => {
  return (
    photo &&
    typeof photo.id === 'string' &&
    typeof photo.url === 'string' &&
    typeof photo.uploadedBy === 'string' &&
    typeof photo.uploadedAt === 'string'
  );
};

// Validation functions
export const validateProfile = (profile: Partial<Profile>): string[] => {
  const errors: string[] = [];

  if (!profile.name?.trim()) {
    errors.push('Name is required');
  }

  if (profile.type === 'memorial') {
    const memorial = profile as Partial<MemorialProfile>;
    
    if (!memorial.description?.trim()) {
      errors.push('Description is required for memorial profiles');
    }

    if (memorial.basicInfo?.dateOfBirth && memorial.basicInfo?.dateOfDeath) {
      const birthDate = memorial.basicInfo.dateOfBirth instanceof Timestamp 
        ? memorial.basicInfo.dateOfBirth.toDate() 
        : memorial.basicInfo.dateOfBirth;
      const deathDate = memorial.basicInfo.dateOfDeath instanceof Timestamp 
        ? memorial.basicInfo.dateOfDeath.toDate() 
        : memorial.basicInfo.dateOfDeath;

      if (birthDate > deathDate) {
        errors.push('Date of birth must be before date of death');
      }
    }

    if (!memorial.basicInfo?.biography?.trim()) {
      errors.push('Biography is required for memorial profiles');
    }

    if (!memorial.basicInfo?.birthLocation?.trim()) {
      errors.push('Birth location is required for memorial profiles');
    }

    if (!memorial.basicInfo?.deathLocation?.trim()) {
      errors.push('Death location is required for memorial profiles');
    }
  }

  if (profile.type === 'personal') {
    const personal = profile as Partial<PersonalProfile>;
    
    if (!personal.contact?.email?.trim()) {
      errors.push('Email is required for personal profiles');
    }

    if (!personal.bio?.trim()) {
      errors.push('Bio is required for personal profiles');
    }
  }

  return errors;
};

// Helper function to validate date strings
const isValidDate = (dateStr: string): boolean => {
  const date = new Date(dateStr);
  return date instanceof Date && !isNaN(date.getTime());
};

export interface MediaFolder {
  id: string;
  name: string;
  parentId?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  itemCount?: number;
  subfolders?: MediaFolder[];
  isFavorite?: boolean;
  order?: number;
  metadata?: {
    color?: string;
    description?: string;
    isPinned?: boolean;
    lastAccessed?: string;
  };
  sharedWith?: string[];
}

export interface UserProfile {
  id: string;
  name: string;
  email?: string;
  bio?: string;
  location?: string;
  status: 'draft' | 'published';
  isPublic: boolean;
  isVerified: boolean;
  photoURL?: string;
  coverImage?: string;
  department?: string;
  graduationYear?: string;
  orgId?: string;
  contact?: {
    email?: string;
    phone?: string;
    website?: string;
  };
  education?: Education[];
  experience?: Experience[];
  achievements?: Achievement[];
  pendingChanges?: PendingChange[];
  createdAt: string;
  updatedAt: string;
}

export interface Experience {
  company: string;
  position?: string;
  title: string;
  startDate: string;
  endDate?: string;
  description?: string;
  location?: string;
}

export interface Achievement {
  title: string;
  date: string;
  description?: string;
  category?: string;
  issuer?: string;
}

export interface PendingChange {
  id: string;
  field: string;
  oldValue: any;
  newValue: any;
  requestedAt: string;
  requestedBy: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedBy: string;
  submittedAt: string;
}

export interface ProfileFormData {
  name: string;
  type: 'personal' | 'memorial';
  description: string;
  imageUrl: string;
  basicInfo: {
    dateOfBirth: Date | null;
    dateOfDeath: Date | null;
    biography: string;
    photo: string;
    birthLocation: string;
    deathLocation: string;
  };
  lifeStory: {
    content: string;
    updatedAt: Date;
  };
  status: 'draft' | 'published';
  isPublic: boolean;
  metadata: {
    tags: string[];
    categories: string[];
    lastModifiedBy: string;
    lastModifiedAt: Timestamp;
    version: number;
  };
}

export interface MemorialProfileFormData extends Omit<MemorialProfile, 'basicInfo' | 'lifeStory'> {
  basicInfo: {
    dateOfBirth: Date | Timestamp | null;
    dateOfDeath: Date | Timestamp | null;
    biography: string;
    photo: string;
    birthLocation: string;
    deathLocation: string;
  };
  lifeStory?: {
    content: string;
    updatedAt: Date | Timestamp;
  };
  timelineEvents?: TimelineEvent[];
  mediaUrls?: string[];
} 