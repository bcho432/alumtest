import { Timestamp } from 'firebase/firestore';

export type OrganizationType = 'university' | 'college' | 'institute' | 'memorial';

export interface OrganizationTheme {
  primaryColor?: string;
  secondaryColor?: string;
  fontFamily?: string;
}

export interface OrganizationSettings {
  allowMediaUpload?: boolean;
  allowComments?: boolean;
}

export interface Organization {
  id: string;
  name: string;
  type: OrganizationType;
  logoUrl?: string;
  description: string;
  location: string;
  theme?: OrganizationTheme;
  adminIds?: string[];
  memberIds?: string[];
  communityPageUrl?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  settings?: OrganizationSettings;
} 