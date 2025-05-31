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
import { getFirebaseServices } from '@/lib/firebase';
import { collection, doc, setDoc, updateDoc, getDoc } from 'firebase/firestore';
import { storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/Dialog';
import { useParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/hooks/usePermissions';
import { validateProfile } from '@/types/profile';
import { debounce } from 'lodash';

// Dynamically import the rich text editor to avoid SSR issues
const RichTextEditor = dynamic(() => import('@/components/ui/RichTextEditor').then(mod => mod.RichTextEditor), {
  ssr: false,
  loading: () => <div className="h-64 bg-gray-50 animate-pulse rounded-lg"></div>
});

interface ProfileFormData {
  name: string;
  type: 'personal' | 'memorial';
  description: string;
  imageUrl: string;
  basicInfo: {
    dateOfBirth: Date;
    dateOfDeath?: Date;
    biography: string;
    photo: string;
    birthLocation?: string;
    deathLocation?: string;
  };
  lifeStory: {
    content: string;
    updatedAt: Date;
  };
  status: 'draft' | 'published';
  isPublic: boolean;
  metadata: {
    tags: string[];
    categories: string[];
    lastModifiedBy: string;
    lastModifiedAt: string;
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

export function EnhancedProfileForm({ universityId, profileId, onSuccess }: EnhancedProfileFormProps) {
  const { user } = useAuth();
  const { isAdmin, isEditor } = usePermissions();
  const [activeTab, setActiveTab] = useState<TabId>('basic');
  const { toast } = useToast();
  const [showPublishDialog, setShowPublishDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState<ProfileFormData>({
    name: '',
    type: 'personal',
    description: '',
    imageUrl: '',
    basicInfo: {
      dateOfBirth: new Date(),
      biography: '',
      photo: '',
    },
    lifeStory: {
      content: '',
      updatedAt: new Date(),
    },
    status: 'draft',
    isPublic: false,
    metadata: {
      tags: [],
      categories: [],
      lastModifiedBy: '',
      lastModifiedAt: new Date().toISOString(),
      version: 1,
    },
  });

  // Autosave functionality
  const debouncedSave = useCallback(
    debounce(async (data: ProfileFormData) => {
      try {
        const { db } = await getFirebaseServices();
        if (!db || !profileId) return;

        const profileRef = doc(db, `universities/${universityId}/profiles/${profileId}`);
        await updateDoc(profileRef, {
          ...data,
          updatedAt: new Date().toISOString(),
          updatedBy: user?.uid || 'system'
        });

        console.log('Autosave successful');
      } catch (error) {
        console.error('Autosave failed:', error);
        toast({
          title: 'Warning',
          description: 'Failed to autosave changes',
          variant: 'destructive'
        });
      }
    }, 30000),
    [universityId, profileId, user?.uid]
  );

  // Save form data to localStorage and trigger autosave
  useEffect(() => {
    localStorage.setItem(`profile-form-${universityId}-${profileId || 'new'}`, JSON.stringify(formData));
    if (profileId) {
      debouncedSave(formData);
    }
  }, [formData, universityId, profileId, debouncedSave]);

  useEffect(() => {
    if (profileId) {
      fetchProfile();
    }
  }, [profileId]);

  const fetchProfile = async () => {
    try {
      const { db } = await getFirebaseServices();
      if (!db) return;

      const profileRef = doc(db, `universities/${universityId}/profiles/${profileId}`);
      const profileDoc = await getDoc(profileRef);
      
      if (profileDoc.exists()) {
        setFormData(profileDoc.data() as ProfileFormData);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch profile data',
        variant: 'destructive'
      });
    }
  };

  const handleInputChange = (field: keyof ProfileFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = async (file: File) => {
    try {
      // Validate file type
      if (!ALLOWED_FILE_TYPES.includes(file.type)) {
        toast({
          title: 'Error',
          description: 'Invalid file type. Please upload a JPEG, PNG, GIF, or WebP image.',
          variant: 'destructive'
        });
        return;
      }

      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        toast({
          title: 'Error',
          description: 'File is too large. Maximum size is 5MB.',
          variant: 'destructive'
        });
        return;
      }

      // Validate image dimensions
      const img = new Image();
      const imgPromise = new Promise((resolve, reject) => {
        img.onload = () => resolve(img);
        img.onerror = reject;
      });
      img.src = URL.createObjectURL(file);
      
      const loadedImg = await imgPromise as HTMLImageElement;
      if (loadedImg.width < 200 || loadedImg.height < 200) {
        toast({
          title: 'Error',
          description: 'Image dimensions must be at least 200x200 pixels.',
          variant: 'destructive'
        });
        return;
      }

      setUploading(true);
      const { storage } = await getFirebaseServices();
      if (!storage) {
        toast({
          title: 'Error',
          description: 'Storage service is not available',
          variant: 'destructive'
        });
        return;
      }

      const path = `universities/${universityId}/profiles/${profileId || 'new'}/photo/${file.name}`;
      const storageRef = ref(storage, path);
      
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);

      handleInputChange('basicInfo', {
        ...formData.basicInfo,
        photo: downloadURL
      });

      toast({
        title: 'Success',
        description: 'Photo uploaded successfully'
      });
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: 'Error',
        description: 'Failed to upload file. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setUploading(false);
    }
  };

  const validateForm = (): string[] => {
    const errors: string[] = [];

    // Basic validation
    if (!formData.name.trim()) {
      errors.push('Name is required');
    }

    if (!formData.basicInfo.biography.trim()) {
      errors.push('Biography is required');
    }

    if (!formData.basicInfo.photo) {
      errors.push('Profile photo is required');
    }

    // Date validation
    if (formData.basicInfo.dateOfDeath && 
        formData.basicInfo.dateOfBirth && 
        formData.basicInfo.dateOfDeath < formData.basicInfo.dateOfBirth) {
      errors.push('Date of death must be after date of birth');
    }

    // Memorial-specific validation
    if (formData.type === 'memorial') {
      if (!formData.basicInfo.dateOfDeath) {
        errors.push('Date of death is required for memorial profiles');
      }
      if (!formData.basicInfo.birthLocation?.trim()) {
        errors.push('Birth location is required for memorial profiles');
      }
      if (!formData.basicInfo.deathLocation?.trim()) {
        errors.push('Death location is required for memorial profiles');
      }
    }

    return errors;
  };

  const handleSubmit = async (status: 'draft' | 'published') => {
    const errors = validateForm();
    if (errors.length > 0) {
      toast({
        title: 'Validation Error',
        description: errors.join('\n'),
        variant: 'destructive'
      });
      return;
    }

    // Check permissions
    if (status === 'published') {
      const hasPermission = await isAdmin(universityId);
      if (!hasPermission) {
        toast({
          title: 'Permission Denied',
          description: 'Only admins can publish profiles',
          variant: 'destructive'
        });
        return;
      }
      setShowPublishDialog(true);
      return;
    }

    await submitForm(status);
  };

  const submitForm = async (status: 'draft' | 'published') => {
    try {
      setLoading(true);
      const { db } = await getFirebaseServices();
      if (!db) return;

      const profileData = {
        ...formData,
        status,
        updatedAt: new Date().toISOString(),
        updatedBy: user?.uid || 'system',
        metadata: {
          ...formData.metadata,
          lastModifiedBy: user?.uid || 'system',
          lastModifiedAt: new Date().toISOString(),
          version: (formData.metadata.version || 0) + 1
        }
      };

      if (profileId) {
        const profileRef = doc(db, `universities/${universityId}/profiles/${profileId}`);
        await updateDoc(profileRef, profileData);
      } else {
        const newProfileRef = doc(collection(db, `universities/${universityId}/profiles`));
        await setDoc(newProfileRef, {
          ...profileData,
          id: newProfileRef.id,
          createdAt: new Date().toISOString(),
          createdBy: user?.uid || 'system'
        });
      }

      // Clear saved form data after successful submission
      localStorage.removeItem(`profile-form-${universityId}-${profileId || 'new'}`);

      toast({
        title: 'Success',
        description: `Profile ${status === 'published' ? 'published' : 'saved as draft'} successfully`
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
      setLoading(false);
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
            <Card className="p-6">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  <Input
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Enter name"
                    className="mt-1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Type</label>
                  <Select
                    value={formData.type}
                    onChange={(value) => handleInputChange('type', value)}
                    options={[
                      { value: 'memorial', label: 'Memorial' },
                      { value: 'personal', label: 'Personal' }
                    ]}
                    className="mt-1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
                  <Input
                    type="date"
                    value={formData.basicInfo.dateOfBirth.toISOString().split('T')[0]}
                    onChange={(e) => handleInputChange('basicInfo', {
                      ...formData.basicInfo,
                      dateOfBirth: new Date(e.target.value)
                    })}
                    className="mt-1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Date of Death</label>
                  <Input
                    type="date"
                    value={formData.basicInfo.dateOfDeath?.toISOString().split('T')[0]}
                    onChange={(e) => handleInputChange('basicInfo', {
                      ...formData.basicInfo,
                      dateOfDeath: e.target.value ? new Date(e.target.value) : undefined
                    })}
                    className="mt-1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Birth Location</label>
                  <Input
                    value={formData.basicInfo.birthLocation}
                    onChange={(e) => handleInputChange('basicInfo', {
                      ...formData.basicInfo,
                      birthLocation: e.target.value
                    })}
                    placeholder="Enter birth location"
                    className="mt-1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Death Location</label>
                  <Input
                    value={formData.basicInfo.deathLocation}
                    onChange={(e) => handleInputChange('basicInfo', {
                      ...formData.basicInfo,
                      deathLocation: e.target.value
                    })}
                    placeholder="Enter death location"
                    className="mt-1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Profile Photo</label>
                  <div className="mt-1 flex items-center space-x-4">
                    {formData.basicInfo.photo && (
                      <img
                        src={formData.basicInfo.photo}
                        alt="Profile"
                        className="h-20 w-20 rounded-full object-cover"
                      />
                    )}
                    <Button
                      variant="outline"
                      onClick={() => document.getElementById('photo-upload')?.click()}
                      disabled={uploading}
                    >
                      {uploading ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                      ) : (
                        <Icon name="upload" className="h-4 w-4 mr-2" />
                      )}
                      Upload Photo
                    </Button>
                    <input
                      id="photo-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                    />
                  </div>
                </div>
              </div>
            </Card>
          )}

          {activeTab === 'biography' && (
            <Card className="p-6">
              <div className="space-y-4">
                <label className="block text-sm font-medium text-gray-700">Biography</label>
                <RichTextEditor
                  value={formData.basicInfo.biography}
                  onChange={(value: string) => handleInputChange('basicInfo', {
                    ...formData.basicInfo,
                    biography: value
                  })}
                  placeholder="Write a detailed biography..."
                />
              </div>
            </Card>
          )}

          {activeTab === 'lifeStory' && (
            <Card className="p-6">
              <div className="space-y-4">
                <label className="block text-sm font-medium text-gray-700">Life Story</label>
                <RichTextEditor
                  value={formData.lifeStory.content}
                  onChange={(value: string) => handleInputChange('lifeStory', {
                    ...formData.lifeStory,
                    content: value,
                    updatedAt: new Date()
                  })}
                  placeholder="Write a detailed life story..."
                />
              </div>
            </Card>
          )}
        </motion.div>
      </AnimatePresence>

      <div className="flex justify-end space-x-3">
        <Button
          variant="outline"
          onClick={() => handleSubmit('draft')}
          disabled={loading}
        >
          Save as Draft
        </Button>
        <Button
          onClick={() => handleSubmit('published')}
          disabled={loading}
        >
          {loading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
          ) : (
            <Icon name="check" className="h-4 w-4 mr-2" />
          )}
          Publish
        </Button>
      </div>

      <Dialog open={showPublishDialog} onOpenChange={setShowPublishDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Publish Profile</DialogTitle>
            <DialogDescription>
              Are you sure you want to publish this profile? Once published, it will be visible to all users.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-3 mt-4">
            <Button
              variant="outline"
              onClick={() => setShowPublishDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                setShowPublishDialog(false);
                submitForm('published');
              }}
            >
              Publish
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 