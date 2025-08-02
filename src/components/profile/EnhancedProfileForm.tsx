'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Tabs } from '@/components/ui/Tabs';
import { useToast } from '@/components/ui/toast';
import { supabase } from '@/lib/supabase';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/Dialog';
import { useParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/hooks/usePermissions';
import { validateProfile } from '@/types/profile';
import { debounce } from 'lodash';
import { BasicInfoTab } from './tabs/BasicInfoTab';
import { BiographyTab } from './tabs/BiographyTab';
import { LifeStoryTab } from './tabs/LifeStoryTab';

// Dynamically import the rich text editor to avoid SSR issues
const RichTextEditor = dynamic(() => import('@/components/ui/RichTextEditor').then(mod => mod.RichTextEditor), {
  ssr: false,
  loading: () => <div className="h-64 bg-gray-50 animate-pulse rounded-lg"></div>
});

interface ProfileFormData {
  full_name: string;
  type: 'personal' | 'memorial';
  description: string;
  image_url: string;
  basic_info: {
    date_of_birth: Date | string | null;
    date_of_death: Date | string | null;
    biography: string;
    photo: string;
    birth_location: string;
    death_location: string;
  };
  life_story: {
    content: string;
    updated_at: Date | string;
  };
  status: 'draft' | 'published';
  is_public: boolean;
  metadata: {
    tags: string[];
    categories: string[];
    last_modified_by: string;
    last_modified_at: string;
    version: number;
  };
}

interface EnhancedProfileFormProps {
  universityId: string;
  profileId?: string;
  onSuccess?: () => void;
}

const tabs = [
  { id: 'basic', label: 'Basic Info', icon: 'user' },
  { id: 'biography', label: 'Biography', icon: 'book' },
  { id: 'lifeStory', label: 'Life Story', icon: 'book-open' }
] as const;

type TabId = typeof tabs[number]['id'];

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

const toDate = (value: Date | string | null): Date | null => {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === 'string') return new Date(value);
  return null;
};

const validateDates = (birthDate: Date | string | null, deathDate: Date | string | null): string[] => {
  const errors: string[] = [];
  const now = new Date();
  
  if (birthDate) {
    const birth = toDate(birthDate);
    if (birth && birth > now) {
      errors.push('Birth date cannot be in the future');
    }
  }
  
  if (deathDate) {
    const death = toDate(deathDate);
    if (death && death > now) {
      errors.push('Death date cannot be in the future');
    }
    
    if (birthDate && death) {
      const birth = toDate(birthDate);
      if (birth && death < birth) {
        errors.push('Death date cannot be before birth date');
      }
    }
  }
  
  return errors;
};

export function EnhancedProfileForm({ universityId, profileId, onSuccess }: EnhancedProfileFormProps) {
  const { user } = useAuth();
  const { hasPermission } = usePermissions();
  const { toast } = useToast();
  const params = useParams();
  const [activeTab, setActiveTab] = useState<TabId>('basic');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'draft' | 'published'>('draft');
  const [formData, setFormData] = useState<ProfileFormData>({
    full_name: '',
    type: 'personal',
    description: '',
    image_url: '',
    basic_info: {
      date_of_birth: null,
      date_of_death: null,
      biography: '',
      photo: '',
      birth_location: '',
      death_location: ''
    },
    life_story: {
      content: '',
      updated_at: new Date().toISOString()
    },
    status: 'draft',
    is_public: false,
    metadata: {
      tags: [],
      categories: [],
      last_modified_by: user?.id || '',
      last_modified_at: new Date().toISOString(),
      version: 1
    }
  });

  const fetchProfile = async () => {
    if (!profileId) return;

    try {
      setLoading(true);
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', profileId)
        .single();

      if (error) {
        throw error;
      }

      if (profileData) {
        setFormData({
          full_name: profileData.full_name || '',
          type: profileData.type || 'personal',
          description: profileData.description || '',
          image_url: profileData.image_url || '',
          basic_info: {
            date_of_birth: profileData.basic_info?.date_of_birth || null,
            date_of_death: profileData.basic_info?.date_of_death || null,
            biography: profileData.basic_info?.biography || '',
            photo: profileData.basic_info?.photo || '',
            birth_location: profileData.basic_info?.birth_location || '',
            death_location: profileData.basic_info?.death_location || ''
          },
          life_story: {
            content: profileData.life_story?.content || '',
            updated_at: profileData.life_story?.updated_at || new Date().toISOString()
          },
          status: profileData.status || 'draft',
          is_public: profileData.is_public || false,
          metadata: profileData.metadata || {
            tags: [],
            categories: [],
            last_modified_by: user?.id || '',
            last_modified_at: new Date().toISOString(),
            version: 1
          }
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to load profile',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFileUpload = async (file: File) => {
    if (!user) return;

    if (file.size > MAX_FILE_SIZE) {
      toast({
        title: 'Error',
        description: 'File size must be less than 5MB',
        variant: 'destructive'
      });
      return;
    }

    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      toast({
        title: 'Error',
        description: 'Only JPEG, PNG, GIF, and WebP files are allowed',
        variant: 'destructive'
      });
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `profiles/${profileId || 'temp'}/${fileName}`;

      const { data, error } = await supabase.storage
        .from('media')
        .upload(filePath, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('media')
        .getPublicUrl(filePath);

      setFormData(prev => ({
        ...prev,
        image_url: publicUrl
      }));

      toast({
        title: 'Success',
        description: 'Image uploaded successfully',
        variant: 'default'
      });
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: 'Error',
        description: 'Failed to upload image',
        variant: 'destructive'
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDateChange = (field: 'date_of_birth' | 'date_of_death', value: Date | undefined) => {
    setFormData(prev => ({
      ...prev,
      basic_info: {
        ...prev.basic_info,
        [field]: value ? value.toISOString() : null
      }
    }));
  };

  const validateForm = (): string[] => {
    const errors: string[] = [];

    if (!formData.full_name.trim()) {
      errors.push('Name is required');
    }

    if (!formData.description.trim()) {
      errors.push('Description is required');
    }

    const dateErrors = validateDates(
      formData.basic_info.date_of_birth,
      formData.basic_info.date_of_death
    );
    errors.push(...dateErrors);

    return errors;
  };

  const handleSubmit = async (status: 'draft' | 'published') => {
    setSaveStatus(status);
    setShowSaveDialog(true);
  };

  const submitForm = async (status: 'draft' | 'published') => {
    const errors = validateForm();
    if (errors.length > 0) {
      toast({
        title: 'Validation Error',
        description: errors.join(', '),
        variant: 'destructive'
      });
      return;
    }

    setSaving(true);
    try {
      const updateData = {
        ...formData,
        status,
        updated_at: new Date().toISOString(),
        metadata: {
          ...formData.metadata,
          last_modified_by: user?.id || '',
          last_modified_at: new Date().toISOString()
        }
      };

      if (profileId) {
        // Update existing profile
        const { error } = await supabase
          .from('profiles')
          .update(updateData)
          .eq('id', profileId);

        if (error) throw error;
      } else {
        // Create new profile
        const { error } = await supabase
          .from('profiles')
          .insert([{
            ...updateData,
            university_id: universityId,
            created_by: user?.id || '',
            created_at: new Date().toISOString()
          }]);

        if (error) throw error;
      }

      toast({
        title: 'Success',
        description: `Profile ${status === 'published' ? 'published' : 'saved as draft'} successfully`,
        variant: 'default'
      });

      onSuccess?.();
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to save profile',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
      setShowSaveDialog(false);
    }
  };

  return (
    <div className="space-y-6">
      <Tabs
        tabs={tabs}
        activeTab={activeTab}
        onChange={(tabId) => setActiveTab(tabId as TabId)}
      />

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'basic' && (
            <BasicInfoTab
              formData={formData}
              onInputChange={handleInputChange}
              onDateChange={handleDateChange}
              onFileUpload={handleFileUpload}
              fieldErrors={fieldErrors}
              uploading={uploading}
            />
          )}

          {activeTab === 'biography' && (
            <BiographyTab
              formData={formData}
              onInputChange={handleInputChange}
            />
          )}

          {activeTab === 'lifeStory' && (
            <LifeStoryTab
              formData={formData}
              onInputChange={handleInputChange}
            />
          )}
        </motion.div>
      </AnimatePresence>

      <div className="flex justify-end gap-4 pt-6 border-t">
        <Button
          variant="outline"
          onClick={() => {
            if (window.history.length > 1) {
              window.history.back();
            } else {
              window.location.href = `/admin/universities/${universityId}/profiles`;
            }
          }}
        >
          Cancel
        </Button>
        <Button
          variant="outline"
          onClick={() => handleSubmit('draft')}
          disabled={loading}
        >
          {loading ? 'Saving...' : 'Save Draft'}
        </Button>
        <Button
          onClick={() => handleSubmit('published')}
          disabled={loading}
        >
          {loading ? 'Publishing...' : 'Publish'}
        </Button>
      </div>

      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Profile</DialogTitle>
            <DialogDescription>
              Are you sure you want to save this profile as a {saveStatus}?
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-4 mt-4">
            <Button
              variant="outline"
              onClick={() => setShowSaveDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                setShowSaveDialog(false);
                submitForm(saveStatus);
              }}
            >
              Save
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 