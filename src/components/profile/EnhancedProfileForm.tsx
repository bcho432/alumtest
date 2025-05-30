'use client';

import React, { useState, useEffect } from 'react';
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

// Dynamically import the rich text editor to avoid SSR issues
const RichTextEditor = dynamic(() => import('@/components/ui/RichTextEditor').then(mod => mod.RichTextEditor), {
  ssr: false,
  loading: () => <div className="h-64 bg-gray-50 animate-pulse rounded-lg"></div>
});

interface TimelineEvent {
  id: string;
  date: string;
  title: string;
  description: string;
  media?: string[];
}

interface ProfileFormData {
  name: string;
  type: 'memorial' | 'living';
  biography: string;
  photoURL: string;
  media: string[];
  timeline: TimelineEvent[];
  achievements: string[];
  stories: string[];
  status: 'draft' | 'published' | 'pending_review';
}

interface EnhancedProfileFormProps {
  universityId: string;
  profileId?: string;
  onSuccess?: () => void;
}

const tabs = [
  { id: 'basic', label: 'Basic Info', icon: 'user' },
  { id: 'biography', label: 'Biography', icon: 'book' },
  { id: 'timeline', label: 'Timeline', icon: 'clock' },
  { id: 'media', label: 'Media', icon: 'image' },
  { id: 'achievements', label: 'Achievements', icon: 'trophy' },
  { id: 'stories', label: 'Stories', icon: 'book-open' }
] as const;

type TabId = typeof tabs[number]['id'];

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

export function EnhancedProfileForm({ universityId, profileId, onSuccess }: EnhancedProfileFormProps) {
  const [activeTab, setActiveTab] = useState<TabId>('basic');
  const [formData, setFormData] = useState<ProfileFormData>(() => {
    // Try to load from localStorage first
    const savedData = localStorage.getItem(`profile-form-${universityId}-${profileId || 'new'}`);
    if (savedData) {
      try {
        return JSON.parse(savedData);
      } catch (e) {
        console.error('Error parsing saved form data:', e);
      }
    }
    // Default state if no saved data
    return {
      name: '',
      type: 'memorial',
      biography: '',
      photoURL: '',
      media: [],
      timeline: [],
      achievements: [],
      stories: [],
      status: 'draft'
    };
  });
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [newTimelineEvent, setNewTimelineEvent] = useState<Partial<TimelineEvent>>({});
  const { toast } = useToast();
  const [showPublishDialog, setShowPublishDialog] = useState(false);

  // Save form data to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(`profile-form-${universityId}-${profileId || 'new'}`, JSON.stringify(formData));
  }, [formData, universityId, profileId]);

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

  const handleFileUpload = async (file: File, type: 'photo' | 'media') => {
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

      const path = `universities/${universityId}/profiles/${profileId || 'new'}/${type}/${file.name}`;
      const storageRef = ref(storage, path);
      
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);

      if (type === 'photo') {
        handleInputChange('photoURL', downloadURL);
      } else {
        handleInputChange('media', [...formData.media, downloadURL]);
      }

      toast({
        title: 'Success',
        description: 'File uploaded successfully'
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

  const handleTimelineEventAdd = () => {
    // Validate required fields
    if (!newTimelineEvent.date || !newTimelineEvent.title) {
      toast({
        title: 'Error',
        description: 'Date and title are required',
        variant: 'destructive'
      });
      return;
    }

    // Validate date format
    const date = new Date(newTimelineEvent.date);
    if (isNaN(date.getTime())) {
      toast({
        title: 'Error',
        description: 'Invalid date format',
        variant: 'destructive'
      });
      return;
    }

    // Check for duplicate dates
    const hasDuplicateDate = formData.timeline.some(
      event => new Date(event.date).getTime() === date.getTime()
    );
    if (hasDuplicateDate) {
      toast({
        title: 'Error',
        description: 'An event already exists for this date',
        variant: 'destructive'
      });
      return;
    }

    // Validate title length
    if (newTimelineEvent.title.length > 100) {
      toast({
        title: 'Error',
        description: 'Title must be less than 100 characters',
        variant: 'destructive'
      });
      return;
    }

    const event: TimelineEvent = {
      id: Date.now().toString(),
      date: newTimelineEvent.date!,
      title: newTimelineEvent.title!,
      description: newTimelineEvent.description || '',
      media: newTimelineEvent.media || []
    };

    // Sort timeline events by date
    const updatedTimeline = [...formData.timeline, event].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    handleInputChange('timeline', updatedTimeline);
    setNewTimelineEvent({});
  };

  const validateForm = (): string[] => {
    const errors: string[] = [];

    if (!formData.name.trim()) {
      errors.push('Name is required');
    }

    if (!formData.biography.trim()) {
      errors.push('Biography is required');
    }

    if (!formData.photoURL) {
      errors.push('Profile photo is required');
    }

    if (formData.timeline.length === 0) {
      errors.push('At least one timeline event is required');
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

    if (status === 'published') {
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
        updatedAt: new Date(),
        updatedBy: 'current-user-id' // TODO: Get from auth context
      };

      if (profileId) {
        const profileRef = doc(db, `universities/${universityId}/profiles/${profileId}`);
        await updateDoc(profileRef, profileData);
      } else {
        const newProfileRef = doc(collection(db, `universities/${universityId}/profiles`));
        await setDoc(newProfileRef, {
          ...profileData,
          id: newProfileRef.id,
          createdAt: new Date(),
          createdBy: 'current-user-id' // TODO: Get from auth context
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
                      { value: 'living', label: 'Living' }
                    ]}
                    className="mt-1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Profile Photo</label>
                  <div className="mt-1 flex items-center space-x-4">
                    {formData.photoURL && (
                      <img
                        src={formData.photoURL}
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
                      onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'photo')}
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
                  value={formData.biography}
                  onChange={(value: string) => handleInputChange('biography', value)}
                  placeholder="Write a detailed biography..."
                />
              </div>
            </Card>
          )}

          {activeTab === 'timeline' && (
            <Card className="p-6">
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Date</label>
                    <Input
                      type="date"
                      value={newTimelineEvent.date || ''}
                      onChange={(e) => setNewTimelineEvent(prev => ({ ...prev, date: e.target.value }))}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Title</label>
                    <Input
                      value={newTimelineEvent.title || ''}
                      onChange={(e) => setNewTimelineEvent(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Event title"
                      className="mt-1"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <Textarea
                    value={newTimelineEvent.description || ''}
                    onChange={(e) => setNewTimelineEvent(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Event description"
                    className="mt-1"
                  />
                </div>
                <Button onClick={handleTimelineEventAdd}>
                  <Icon name="plus" className="h-4 w-4 mr-2" />
                  Add Event
                </Button>

                <div className="mt-6 space-y-4">
                  {formData.timeline.map((event) => (
                    <div key={event.id} className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                      <div className="flex-shrink-0">
                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                          <Icon name="calendar" className="h-6 w-6 text-primary" />
                        </div>
                      </div>
                      <div className="flex-grow">
                        <div className="text-sm font-medium text-gray-900">{event.title}</div>
                        <div className="text-sm text-gray-500">{new Date(event.date).toLocaleDateString()}</div>
                        <div className="mt-1 text-sm text-gray-600">{event.description}</div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleInputChange('timeline', formData.timeline.filter(e => e.id !== event.id))}
                      >
                        <Icon name="trash" className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          )}

          {activeTab === 'media' && (
            <Card className="p-6">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Upload Media</label>
                  <div className="mt-1">
                    <Button
                      variant="outline"
                      onClick={() => document.getElementById('media-upload')?.click()}
                      disabled={uploading}
                    >
                      {uploading ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                      ) : (
                        <Icon name="upload" className="h-4 w-4 mr-2" />
                      )}
                      Upload Media
                    </Button>
                    <input
                      id="media-upload"
                      type="file"
                      accept="image/*,video/*"
                      multiple
                      className="hidden"
                      onChange={(e) => {
                        Array.from(e.target.files || []).forEach(file => handleFileUpload(file, 'media'));
                      }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {formData.media.map((url, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={url}
                        alt={`Media ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleInputChange('media', formData.media.filter((_, i) => i !== index))}
                      >
                        <Icon name="trash" className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          )}

          {activeTab === 'achievements' && (
            <Card className="p-6">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Add Achievement</label>
                  <div className="mt-1 flex space-x-2">
                    <Input
                      placeholder="Enter achievement"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && e.currentTarget.value) {
                          handleInputChange('achievements', [...formData.achievements, e.currentTarget.value]);
                          e.currentTarget.value = '';
                        }
                      }}
                    />
                    <Button
                      onClick={(e) => {
                        const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                        if (input.value) {
                          handleInputChange('achievements', [...formData.achievements, input.value]);
                          input.value = '';
                        }
                      }}
                    >
                      Add
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  {formData.achievements.map((achievement, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Icon name="trophy" className="h-5 w-5 text-yellow-500" />
                        <span>{achievement}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleInputChange('achievements', formData.achievements.filter((_, i) => i !== index))}
                      >
                        <Icon name="trash" className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          )}

          {activeTab === 'stories' && (
            <Card className="p-6">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Add Story</label>
                  <div className="mt-1">
                    <RichTextEditor
                      value=""
                      onChange={(value: string) => {
                        if (value) {
                          handleInputChange('stories', [...formData.stories, value]);
                        }
                      }}
                      placeholder="Write a story..."
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  {formData.stories.map((story, index) => (
                    <div key={index} className="p-4 bg-gray-50 rounded-lg">
                      <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: story }} />
                      <div className="mt-2 flex justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleInputChange('stories', formData.stories.filter((_, i) => i !== index))}
                        >
                          <Icon name="trash" className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
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