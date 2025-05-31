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
import { collection, doc, setDoc, updateDoc, getDoc, Timestamp } from 'firebase/firestore';
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
    dateOfBirth: Date | Timestamp | null;
    dateOfDeath: Date | Timestamp | null;
    biography: string;
    photo: string;
    birthLocation: string;
    deathLocation: string;
  };
  lifeStory: {
    content: string;
    updatedAt: Date | Timestamp;
  };
  status: 'draft' | 'published';
  isPublic: boolean;
  metadata: {
    tags: string[];
    categories: string[];
    lastModifiedBy: string;
    lastModifiedAt: Timestamp;
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

// Add type guard functions at the top of the file
const isTimestamp = (value: unknown): value is Timestamp => {
  return value instanceof Timestamp;
};

const isDate = (value: unknown): value is Date => {
  return value instanceof Date;
};

const toDate = (value: Date | Timestamp | null): Date | null => {
  if (!value) return null;
  if (isTimestamp(value)) return value.toDate();
  if (isDate(value)) return value;
  return null;
};

const validateDates = (birthDate: Date | Timestamp | null, deathDate: Date | Timestamp | null): string[] => {
  const errors: string[] = [];
  const now = new Date();
  
  if (birthDate) {
    const birth = birthDate instanceof Timestamp ? birthDate.toDate() : birthDate;
    if (birth > now) {
      errors.push('Date of birth must be in the past');
    }
    if (deathDate) {
      const death = deathDate instanceof Timestamp ? deathDate.toDate() : deathDate;
      if (birth > death) {
        errors.push('Date of birth must be before date of death');
      }
    }
  }
  
  if (deathDate) {
    const death = deathDate instanceof Timestamp ? deathDate.toDate() : deathDate;
    if (death > now) {
      errors.push('Date of death must be in the past');
    }
    if (birthDate) {
      const birth = birthDate instanceof Timestamp ? birthDate.toDate() : birthDate;
      if (death < birth) {
        errors.push('Date of death must be after date of birth');
      }
    }
  }
  
  return errors;
};

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
      dateOfBirth: null,
      dateOfDeath: null,
      biography: '',
      photo: '',
      birthLocation: '',
      deathLocation: '',
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
      lastModifiedAt: Timestamp.fromDate(new Date()),
      version: 1,
    },
  });
  const [fieldErrors, setFieldErrors] = useState<{
    dateOfBirth?: string;
    dateOfDeath?: string;
  }>({});

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

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => {
      const newData = { ...prev };
      if (field === 'basicInfo') {
        newData.basicInfo = {
          ...prev.basicInfo,
          ...value,
          dateOfBirth: value.dateOfBirth instanceof Date ? value.dateOfBirth : null,
          dateOfDeath: value.dateOfDeath instanceof Date ? value.dateOfDeath : null
        };
      } else {
        (newData as any)[field] = value;
      }
      return newData;
    });
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

  const handleDateChange = (field: 'dateOfBirth' | 'dateOfDeath', value: Date | undefined) => {
    const dateValue = value || null;
    const newBasicInfo = {
      ...formData.basicInfo,
      [field]: dateValue
    };
    
    // Validate dates
    const errors = validateDates(
      field === 'dateOfBirth' ? dateValue : formData.basicInfo.dateOfBirth,
      field === 'dateOfDeath' ? dateValue : formData.basicInfo.dateOfDeath
    );
    
    // Update form data and errors
    handleInputChange('basicInfo', newBasicInfo);
    setFieldErrors(prev => ({
      ...prev,
      [field]: errors.find(error => error.includes(field === 'dateOfBirth' ? 'birth' : 'death'))
    }));
  };

  const validateForm = (): string[] => {
    const errors: string[] = [];
    
    // Validate required fields
    if (!formData.name?.trim()) {
      errors.push('Name is required');
    }
    
    // Validate dates
    errors.push(...validateDates(formData.basicInfo.dateOfBirth, formData.basicInfo.dateOfDeath));
    
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

      // Convert dates to Timestamps before saving
      const profileData = {
        ...formData,
        status,
        updatedAt: Timestamp.now(),
        updatedBy: user?.uid || 'system',
        basicInfo: {
          ...formData.basicInfo,
          dateOfBirth: formData.basicInfo.dateOfBirth 
            ? (formData.basicInfo.dateOfBirth instanceof Timestamp 
              ? formData.basicInfo.dateOfBirth 
              : Timestamp.fromDate(formData.basicInfo.dateOfBirth))
            : null,
          dateOfDeath: formData.basicInfo.dateOfDeath
            ? (formData.basicInfo.dateOfDeath instanceof Timestamp
              ? formData.basicInfo.dateOfDeath
              : Timestamp.fromDate(formData.basicInfo.dateOfDeath))
            : null
        },
        lifeStory: {
          ...formData.lifeStory,
          updatedAt: formData.lifeStory.updatedAt instanceof Timestamp 
            ? formData.lifeStory.updatedAt 
            : Timestamp.fromDate(formData.lifeStory.updatedAt)
        },
        metadata: {
          ...formData.metadata,
          lastModifiedBy: user?.uid || 'system',
          lastModifiedAt: Timestamp.now(),
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
          createdAt: Timestamp.now(),
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
                    value={formData.basicInfo.dateOfBirth instanceof Date 
                      ? formData.basicInfo.dateOfBirth.toISOString().split('T')[0]
                      : formData.basicInfo.dateOfBirth instanceof Timestamp
                        ? formData.basicInfo.dateOfBirth.toDate().toISOString().split('T')[0]
                        : ''}
                    onChange={(e) => {
                      const newDate = e.target.value ? new Date(e.target.value) : undefined;
                      handleDateChange('dateOfBirth', newDate);
                    }}
                    max={new Date().toISOString().split('T')[0]}
                    className={`mt-1 ${fieldErrors.dateOfBirth ? 'border-red-500' : ''}`}
                  />
                  {fieldErrors.dateOfBirth && (
                    <p className="mt-1 text-sm text-red-600">{fieldErrors.dateOfBirth}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Date of Death</label>
                  <Input
                    type="date"
                    value={formData.basicInfo.dateOfDeath instanceof Date 
                      ? formData.basicInfo.dateOfDeath.toISOString().split('T')[0]
                      : formData.basicInfo.dateOfDeath instanceof Timestamp
                        ? formData.basicInfo.dateOfDeath.toDate().toISOString().split('T')[0]
                        : ''}
                    onChange={(e) => {
                      const newDate = e.target.value ? new Date(e.target.value) : undefined;
                      handleDateChange('dateOfDeath', newDate);
                    }}
                    min={formData.basicInfo.dateOfBirth 
                      ? (formData.basicInfo.dateOfBirth instanceof Date 
                        ? formData.basicInfo.dateOfBirth.toISOString().split('T')[0]
                        : formData.basicInfo.dateOfBirth instanceof Timestamp
                          ? formData.basicInfo.dateOfBirth.toDate().toISOString().split('T')[0]
                          : undefined)
                      : undefined}
                    max={new Date().toISOString().split('T')[0]}
                    className={`mt-1 ${fieldErrors.dateOfDeath ? 'border-red-500' : ''}`}
                  />
                  {fieldErrors.dateOfDeath && (
                    <p className="mt-1 text-sm text-red-600">{fieldErrors.dateOfDeath}</p>
                  )}
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