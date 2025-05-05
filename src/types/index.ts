export interface Organization {
  id: string;
  name: string;
  logoUrl?: string;
  theme?: {
    primaryColor?: string;
    secondaryColor?: string;
  };
  adminIds: string[];
  communityPageUrl: string;
  createdAt: Date;
}

export interface Profile {
  id: string;
  orgId: string;
  createdBy: string;
  name: string;
  dob?: Date;
  dod?: Date;
  locations?: {
    birth?: string;
    death?: string;
    lived?: Array<{ place: string; years: string }>;
  };
  education?: Array<{
    institution: string;
    degree?: string;
    years: string;
  }>;
  jobs?: Array<{
    company: string;
    position?: string;
    years: string;
  }>;
  events?: Array<{
    date: Date;
    title: string;
    description?: string;
    mediaUrls?: string[];
  }>;
  stories?: Array<{
    question: string;
    answer: string;
    authorId: string;
    createdAt: Date;
  }>;
  photos?: Array<{
    url: string;
    caption?: string;
    isHeader?: boolean;
    uploadedBy: string;
    uploadedAt: Date;
  }>;
  privacy: 'public' | 'private';
  invitedEmails: string[];
  shareableUrl: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  id: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  orgRoles: {
    [orgId: string]: 'admin' | 'family';
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface Candle {
  id: string;
  profileId: string;
  userId: string;
  message: string;
  photoUrl?: string;
  createdAt: Date;
} 