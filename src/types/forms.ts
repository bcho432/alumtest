export interface SignUpFormData {
  organization: string;
  email: string;
  password: string;
}

export interface SignInFormData {
  email: string;
  password: string;
}

export interface ProfileFormData {
  name: string;
  dob: string;
  dod: string;
  bio: string;
  photo?: File;
  privacy: 'public' | 'private';
}

export interface EventFormData {
  date: string;
  title: string;
  description?: string;
  mediaUrls?: string[];
}

export interface StoryFormData {
  question: string;
  answer: string;
}

export interface PhotoFormData {
  file: File;
  caption?: string;
  isHeader?: boolean;
} 