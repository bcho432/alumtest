import { Profile } from './index';
import { User } from 'firebase/auth';

export interface ProfileService {
  getProfile(id: string): Promise<Profile | null>;
  createProfile(profileData: Omit<Profile, 'id' | 'createdAt' | 'updatedAt'>): Promise<string>;
  updateProfile(id: string, profileData: Partial<Profile>): Promise<void>;
  deleteProfile(id: string): Promise<void>;
  getProfilesByUniversity(universityId: string): Promise<Profile[]>;
  listProfiles(): Promise<Profile[]>;
}

export interface AuthService {
  login(data: { email: string; password: string }): Promise<User>;
  signup(data: { email: string; password: string }): Promise<User>;
  logout(): Promise<void>;
  getCurrentUser(): Promise<User | null>;
} 