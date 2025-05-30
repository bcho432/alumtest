export interface University {
  id: string;
  name: string;
  logoUrl?: string;
  description?: string;
  location?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UniversityProfile extends Omit<University, 'id'> {
  id: string;
  branding?: {
    logoUrl: string;
    primaryColor: string;
  };
  adminIds?: string[];
  isActive?: boolean;
  logo?: string;
  website?: string;
  location?: string;
  contact?: {
    email?: string;
    phone?: string;
    website?: string;
  };
} 