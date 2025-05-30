import { Profile } from './index';
import { User } from 'firebase/auth';

export interface UseProfileResult {
  profile: Profile | null;
  loading: boolean;
  error: string | null;
}

export interface UseAuthResult {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<User>;
  signup: (email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
} 