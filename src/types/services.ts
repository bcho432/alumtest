import type { Profile } from './index';

export interface ProfileService {
  getProfile(profileId: string): Promise<Profile>;
  getProfilesByOrganization(organizationId: string): Promise<Profile[]>;
  createProfile(data: Omit<Profile, 'id'>): Promise<Profile>;
  updateProfile(profileId: string, data: Partial<Profile>): Promise<Profile>;
  deleteProfile(profileId: string): Promise<void>;
  getProfilesByUniversity(universityId: string): Promise<Profile[]>;
  listProfiles(): Promise<Profile[]>;
} 