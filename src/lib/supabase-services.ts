import { supabase } from './supabase';
import type { Profile, PersonalProfile, MemorialProfile } from '@/types/profile';
import type { University } from '@/types/university';

// Types for Supabase responses
export interface SupabaseProfile {
  id: string;
  universityId: string | null;
  userId: string | null;
  type: 'personal' | 'memorial' | 'university';
  status: 'draft' | 'published' | 'pending_review' | 'archived';
  visibility: 'public' | 'private' | 'restricted';
  fullName: string;
  bio: string | null;
  photoUrl: string | null;
  coverImageUrl: string | null;
  department: string | null;
  graduationYear: number | null;
  location: string | null;
  contact: any;
  dateOfBirth: string | null;
  dateOfDeath: string | null;
  birthLocation: string | null;
  deathLocation: string | null;
  tags: string[];
  metadata: any;
  isFeatured: boolean;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
  publishedBy: string | null;
}

export interface SupabaseUniversity {
  id: string;
  name: string;
  domain: string | null;
  logoUrl: string | null;
  description: string | null;
  location: string | null;
  website: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  settings: any;
  branding: any;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SupabaseTimelineEvent {
  id: string;
  profileId: string;
  type: 'education' | 'work' | 'event';
  title: string;
  description: string | null;
  startDate: string;
  endDate: string | null;
  location: string | null;
  institution: string | null;
  degree: string | null;
  fieldOfStudy: string | null;
  company: string | null;
  position: string | null;
  mediaUrls: string[];
  importance: 'high' | 'medium' | 'low';
  visibility: 'public' | 'private';
  tags: string[];
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
}

// Profile Services
export const profileService = {
  // Get all profiles for a university
  async getUniversityProfiles(universityId: string, options: {
    status?: string;
    visibility?: string;
    limit?: number;
    offset?: number;
    search?: string;
  } = {}) {
    let query = supabase
      .from('profiles')
      .select('*')
      .eq('universityId', universityId);

    if (options.status) {
      query = query.eq('status', options.status);
    }
    if (options.visibility) {
      query = query.eq('visibility', options.visibility);
    }
    if (options.search) {
      query = query.or(`fullName.ilike.%${options.search}%,bio.ilike.%${options.search}%,department.ilike.%${options.search}%`);
    }

    query = query.order('createdAt', { ascending: false });

    if (options.limit) {
      query = query.limit(options.limit);
    }
    if (options.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data as SupabaseProfile[];
  },

  // Get a single profile by ID
  async getProfile(profileId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', profileId)
      .single();

    if (error) throw error;
    return data as SupabaseProfile;
  },

  // Create a new profile
  async createProfile(profileData: Partial<SupabaseProfile>) {
    const { data, error } = await supabase
      .from('profiles')
      .insert([profileData])
      .select()
      .single();

    if (error) throw error;
    return data as SupabaseProfile;
  },

  // Update a profile
  async updateProfile(profileId: string, updates: Partial<SupabaseProfile>) {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', profileId)
      .select()
      .single();

    if (error) throw error;
    return data as SupabaseProfile;
  },

  // Delete a profile
  async deleteProfile(profileId: string) {
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', profileId);

    if (error) throw error;
  },

  // Search profiles
  async searchProfiles(searchTerm: string, universityId?: string) {
    let query = supabase
      .from('profiles')
      .select('*')
      .or(`fullName.ilike.%${searchTerm}%,bio.ilike.%${searchTerm}%,department.ilike.%${searchTerm}%`);

    if (universityId) {
      query = query.eq('universityId', universityId);
    }

    query = query.eq('status', 'published')
      .eq('visibility', 'public')
      .order('createdAt', { ascending: false });

    const { data, error } = await query;
    if (error) throw error;
    return data as SupabaseProfile[];
  }
};

// University Services
export const universityService = {
  // Get all universities
  async getUniversities() {
    const { data, error } = await supabase
      .from('universities')
      .select('*')
      .eq('isActive', true)
      .order('name');

    if (error) throw error;
    return data as SupabaseUniversity[];
  },

  // Get a single university by ID
  async getUniversity(universityId: string) {
    const { data, error } = await supabase
      .from('universities')
      .select('*')
      .eq('id', universityId)
      .single();

    if (error) throw error;
    return data as SupabaseUniversity;
  },

  // Get university by domain
  async getUniversityByDomain(domain: string) {
    const { data, error } = await supabase
      .from('universities')
      .select('*')
      .eq('domain', domain)
      .eq('isActive', true)
      .single();

    if (error) throw error;
    return data as SupabaseUniversity;
  },

  // Create a new university
  async createUniversity(universityData: Partial<SupabaseUniversity>) {
    const { data, error } = await supabase
      .from('universities')
      .insert([universityData])
      .select()
      .single();

    if (error) throw error;
    return data as SupabaseUniversity;
  },

  // Update a university
  async updateUniversity(universityId: string, updates: Partial<SupabaseUniversity>) {
    const { data, error } = await supabase
      .from('universities')
      .update(updates)
      .eq('id', universityId)
      .select()
      .single();

    if (error) throw error;
    return data as SupabaseUniversity;
  }
};

// Timeline Services
export const timelineService = {
  // Get timeline events for a profile
  async getProfileTimeline(profileId: string) {
    const { data, error } = await supabase
      .from('timeline_events')
      .select('*')
      .eq('profileId', profileId)
      .order('startDate', { ascending: true });

    if (error) throw error;
    return data as SupabaseTimelineEvent[];
  },

  // Create a timeline event
  async createTimelineEvent(eventData: Partial<SupabaseTimelineEvent>) {
    const { data, error } = await supabase
      .from('timeline_events')
      .insert([eventData])
      .select()
      .single();

    if (error) throw error;
    return data as SupabaseTimelineEvent;
  },

  // Update a timeline event
  async updateTimelineEvent(eventId: string, updates: Partial<SupabaseTimelineEvent>) {
    const { data, error } = await supabase
      .from('timeline_events')
      .update(updates)
      .eq('id', eventId)
      .select()
      .single();

    if (error) throw error;
    return data as SupabaseTimelineEvent;
  },

  // Delete a timeline event
  async deleteTimelineEvent(eventId: string) {
    const { error } = await supabase
      .from('timeline_events')
      .delete()
      .eq('id', eventId);

    if (error) throw error;
  }
};

// User Services
export const userService = {
  // Get current user
  async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return user;
  },

  // Get user profile
  async getUserProfile(userId: string) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data;
  },

  // Update user profile (creates if doesn't exist)
  async updateUserProfile(userId: string, updates: any) {
    const { data, error } = await supabase
      .from('users')
      .upsert([{ id: userId, ...updates }], { onConflict: 'id' })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Check if user is university admin
  async isUniversityAdmin(userId: string, universityId: string) {
    const { data, error } = await supabase
      .from('university_admins')
      .select('*')
      .eq('userId', userId)
      .eq('universityId', universityId)
      .single();

    if (error) return false;
    return !!data;
  }
};

// Media Services
export const mediaService = {
  // Upload file to Supabase Storage
  async uploadFile(file: File, bucket: string, path: string) {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file);

    if (error) throw error;
    return data;
  },

  // Get public URL for file
  getPublicUrl(bucket: string, path: string) {
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);

    return data.publicUrl;
  },

  // Delete file from storage
  async deleteFile(bucket: string, path: string) {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path]);

    if (error) throw error;
  }
};

// Comment Services
export const commentService = {
  // Get comments for a profile
  async getProfileComments(profileId: string) {
    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .eq('profileId', profileId)
      .eq('isApproved', true)
      .order('createdAt', { ascending: false });

    if (error) throw error;
    return data;
  },

  // Create a comment
  async createComment(commentData: any) {
    const { data, error } = await supabase
      .from('comments')
      .insert([commentData])
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};

// Support Services
export const supportService = {
  // Create support ticket
  async createTicket(ticketData: any) {
    const { data, error } = await supabase
      .from('support_tickets')
      .insert([ticketData])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Get support tickets (admin only)
  async getTickets() {
    const { data, error } = await supabase
      .from('support_tickets')
      .select('*')
      .order('createdAt', { ascending: false });

    if (error) throw error;
    return data;
  }
};

// Real-time subscriptions
export const realtimeService = {
  // Subscribe to profile changes
  subscribeToProfile(profileId: string, callback: (payload: any) => void) {
    return supabase
      .channel(`profile:${profileId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'profiles',
        filter: `id=eq.${profileId}`
      }, callback)
      .subscribe();
  },

  // Subscribe to university profiles
  subscribeToUniversityProfiles(universityId: string, callback: (payload: any) => void) {
    return supabase
      .channel(`university:${universityId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'profiles',
        filter: `universityId=eq.${universityId}`
      }, callback)
      .subscribe();
  }
}; 