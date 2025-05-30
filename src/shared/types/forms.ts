export interface SignInFormData {
  email: string;
  password: string;
}

export interface SignUpFormData {
  organization: string;
  email: string;
  password: string;
}

export interface ProfileFormData {
  fullName: string;
  dateOfBirth?: string;
  dateOfDeath?: string;
  biography?: string;
  photo?: File;
  isPublic: boolean;
}

export interface TimelineEventFormData {
  title: string;
  description?: string;
  date: string;
  location?: string;
  media?: File[];
}

export interface FamilyMemberFormData {
  relatedProfileId: string;
  relationship: string;
} 