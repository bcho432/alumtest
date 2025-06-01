'use client';

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Icon } from '@/components/ui/Icon';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { MemorialProfile, MemorialProfileFormData, TimelineEvent, LifeEvent } from '@/types/profile';
import { toast } from 'react-hot-toast';
import { Badge } from '@/components/ui/Badge';
import { ImageUpload } from '@/components/ui/ImageUpload';
import { TabsRoot, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { Switch } from '@/components/ui/Switch';
import { Card } from '@/components/ui/Card';
import { Dialog } from '@/components/ui/Dialog';
import { TimelineMediaUpload } from '@/components/media/TimelineMediaUpload';
import { RichTextEditor } from '@/components/ui/RichTextEditor';
import { SimpleTimelineBuilder } from '@/components/timeline/SimpleTimelineBuilder';
import debounce from 'lodash/debounce';
import { Timestamp } from 'firebase/firestore';
import { LifeStoryEditor } from '@/components/profile/LifeStoryEditor';
import { Select } from '@/components/ui/Select';
import { TimelineBuilder } from '@/components/timeline/TimelineBuilder';
import { useAuth } from '@/contexts/AuthContext';
import { getFirebaseServices } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

interface MemorialProfileFormProps {
  profile?: MemorialProfile;
  onSubmit: (data: MemorialProfileFormData) => Promise<void>;
  onCancel: () => void;
  className?: string;
  universityId: string;
  memorialId: string;
  onSuccess: () => void;
}

interface FormErrors {
  name?: string;
  description?: string;
  dateOfBirth?: string;
  dateOfDeath?: string;
  biography?: string;
  lifeStory?: string;
  birthLocation?: string;
  deathLocation?: string;
}

interface ProfileLock {
  userId: string;
  timestamp: Date;
}

const timelineEventToLifeEvent = (event: any) => ({
  ...event,
  type: event.type === 'job' ? 'work' : event.type === 'event' ? 'other' : event.type,
});

export const MemorialProfileForm: React.FC<MemorialProfileFormProps> = ({
  profile,
  onSubmit,
  onCancel,
  className,
  universityId,
  memorialId,
  onSuccess
}) => {
  console.log('[MemorialProfileForm] Rendering form with profile:', profile?.id || 'new');

  const { user } = useAuth();
  const [isLocked, setIsLocked] = useState(false);
  const [lockError, setLockError] = useState<string | null>(null);
  const LOCK_TIMEOUT = 30 * 60 * 1000; // 30 minutes

  const [formData, setFormData] = useState<MemorialProfileFormData>(() => {
    console.log('[MemorialProfileForm] Initializing form data with profile:', profile);
    return {
      id: profile?.id || '',
      type: 'memorial',
      universityId: profile?.universityId || '',
      createdAt: profile?.createdAt || Timestamp.now(),
      updatedAt: profile?.updatedAt || Timestamp.now(),
      createdBy: profile?.createdBy || '',
      updatedBy: profile?.updatedBy || '',
      name: profile?.name || '',
      description: profile?.description || '',
      imageUrl: profile?.imageUrl || '',
      basicInfo: {
        dateOfBirth: profile?.basicInfo?.dateOfBirth || null,
        dateOfDeath: profile?.basicInfo?.dateOfDeath || null,
        biography: profile?.basicInfo?.biography || '',
        photo: profile?.basicInfo?.photo || '',
        birthLocation: profile?.basicInfo?.birthLocation || '',
        deathLocation: profile?.basicInfo?.deathLocation || ''
      },
      lifeStory: {
        content: profile?.lifeStory?.content || '',
        updatedAt: profile?.lifeStory?.updatedAt || new Date()
      },
      timeline: Array.isArray(profile?.timeline)
        ? profile.timeline.map(timelineEventToLifeEvent)
        : [],
      isPublic: profile?.isPublic || false,
      status: profile?.status || 'draft',
      metadata: {
        tags: profile?.metadata?.tags || [],
        categories: profile?.metadata?.categories || [],
        lastModifiedBy: profile?.metadata?.lastModifiedBy || '',
        lastModifiedAt: profile?.metadata?.lastModifiedAt || Timestamp.fromDate(new Date()),
        version: profile?.metadata?.version || 1
      }
    };
  });

  const [formState, setFormState] = useState({
    isSaving: false,
    isTabChanging: false,
    lastSaveError: null as string | null,
    lastSaved: null as Date | null,
    hasUnsavedChanges: false
  });

  const [loading, setLoading] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [activeTab, setActiveTab] = useState('basic');
  const [completionPercentage, setCompletionPercentage] = useState(0);
  const [errors, setErrors] = useState<FormErrors>({});

  // Check and acquire lock
  const checkAndAcquireLock = async () => {
    if (!profile?.id || !user?.uid) return;

    try {
      const { db } = await getFirebaseServices();
      if (!db) return;

      const profileRef = doc(db, `universities/${profile.universityId}/profiles`, profile.id);
      const profileDoc = await getDoc(profileRef);
      
      if (!profileDoc.exists()) return;

      const profileData = profileDoc.data() as MemorialProfile;
      const now = new Date();

      // Check if there's an existing lock
      if (profileData.lock) {
        const lockTime = new Date(profileData.lock.timestamp);
        const isLockExpired = now.getTime() - lockTime.getTime() > LOCK_TIMEOUT;

        if (!isLockExpired && profileData.lock.userId !== user.uid) {
          setIsLocked(true);
          setLockError('This profile is currently being edited by another user. Please try again later.');
          return false;
        }
      }

      // Create or update lock
      await updateDoc(profileRef, {
        lock: {
          userId: user.uid,
          timestamp: now
        }
      });

      setIsLocked(false);
      setLockError(null);
      return true;
    } catch (error) {
      console.error('Error acquiring lock:', error);
      setLockError('Failed to acquire edit lock. Please try again.');
      return false;
    }
  };

  // Release lock
  const releaseLock = async () => {
    if (!profile?.id || !user?.uid) return;

    try {
      const { db } = await getFirebaseServices();
      if (!db) return;

      const profileRef = doc(db, `universities/${profile.universityId}/profiles`, profile.id);
      await updateDoc(profileRef, {
        lock: null
      });
    } catch (error) {
      console.error('Error releasing lock:', error);
    }
  };

  // Check lock on mount
  useEffect(() => {
    if (profile?.id) {
      checkAndAcquireLock();
    }
    return () => {
      if (profile?.id) {
        releaseLock();
      }
    };
  }, [profile?.id]);

  // Memoize the debounced save function first
  const debouncedSave = useMemo(
    () => debounce(async (data: MemorialProfileFormData) => {
      if (formState.isSaving) return;
      
      try {
        setFormState(prev => ({ ...prev, isSaving: true, lastSaveError: null }));
        console.log('[MemorialProfileForm] Auto-saving draft...');
        
        const metadata = {
          tags: data.metadata?.tags || [],
          categories: data.metadata?.categories || [],
          lastModifiedBy: data.metadata?.lastModifiedBy || '',
          lastModifiedAt: Timestamp.fromDate(new Date()),
          version: (data.metadata?.version || 0) + 1
        };

        await onSubmit({
          ...data,
          status: 'draft',
          metadata
        });
        
        setFormState(prev => ({
          ...prev,
          isSaving: false,
          lastSaved: new Date(),
          hasUnsavedChanges: false
        }));
        console.log('[MemorialProfileForm] Auto-save completed successfully');
        toast.success('Changes saved successfully');
      } catch (error) {
        console.error('[MemorialProfileForm] Auto-save failed:', error);
        setFormState(prev => ({
          ...prev,
          isSaving: false,
          lastSaveError: 'Failed to auto-save changes'
        }));
        toast.error('Failed to auto-save changes');
      }
    }, 2000),
    [onSubmit]
  );

  // Update tab change handler
  const handleTabChange = useCallback((newTab: string) => {
    if (formState.isTabChanging) return;
    
    setFormState(prev => ({ ...prev, isTabChanging: true }));
    
    // Save in the background if needed
    if (formState.hasUnsavedChanges) {
      debouncedSave(formData);
    }
    
    setActiveTab(newTab);
    setFormState(prev => ({ ...prev, isTabChanging: false }));
  }, [formState.isTabChanging, formState.hasUnsavedChanges, debouncedSave, formData]);

  // Update form data handler with memoization
  const updateFormData = useCallback((updates: Partial<MemorialProfileFormData>): void => {
    const updateKeys = Object.keys(updates);
    const firstKey = updateKeys[0];
    const value = firstKey ? (updates as any)[firstKey] : undefined;
    
    console.log('[MemorialProfileForm] Updating form data:', {
      updateField: firstKey,
      updateValue: value,
      currentName: formData.name,
      currentDateOfBirth: formData.basicInfo?.dateOfBirth
    });
    
    const newData = { ...formData, ...updates };
    setFormData(newData);
    setFormState(prev => ({ ...prev, hasUnsavedChanges: true }));
    
    if (!formState.isSaving) {
      debouncedSave(newData);
    }
  }, [formData, formState.isSaving, debouncedSave]);

  // Validate form data
  const validateForm = (data: MemorialProfileFormData): boolean => {
    console.log('[MemorialProfileForm] Validating form data:', {
      name: data.name,
      dateOfBirth: data.basicInfo?.dateOfBirth,
      hasErrors: Object.keys(errors).length > 0
    });
    const newErrors: FormErrors = {};
    
    // Only validate required fields when saving/publishing
    if (!data.name?.trim()) {
      newErrors.name = 'Name is required';
    }
    if (!data.basicInfo?.dateOfBirth) {
      newErrors.dateOfBirth = 'Date of birth is required';
    }

    if (Object.keys(newErrors).length > 0) {
      console.log('[MemorialProfileForm] Validation errors:', newErrors);
      setErrors(newErrors);
      return false;
    }

    return true;
  };

  // Calculate completion percentage with validation
  useEffect(() => {
    console.log('[MemorialProfileForm] Calculating completion percentage:', {
      name: formData.name,
      description: formData.description,
      hasImage: !!formData.imageUrl,
      hasDateOfBirth: !!formData.basicInfo?.dateOfBirth,
      hasDateOfDeath: !!formData.basicInfo?.dateOfDeath,
      hasBiography: !!formData.basicInfo?.biography,
      hasLifeStory: !!formData.lifeStory?.content
    });

    const requiredFields = [
      formData.name,
      formData.description,
      formData.imageUrl,
      formData.basicInfo?.dateOfBirth,
      formData.basicInfo?.dateOfDeath,
      formData.basicInfo?.biography,
      formData.lifeStory?.content
    ];
    
    const completedFields = requiredFields.filter(field => 
      field && field.toString().trim() !== '' && 
      !Object.values(errors).some(error => error !== undefined)
    ).length;
    
    const percentage = Math.round((completedFields / requiredFields.length) * 100);
    setCompletionPercentage(percentage);
  }, [formData, errors]);

  const formatDate = (date: Date | Timestamp | null | undefined): string => {
    if (!date) return '';
    
    try {
      if (date instanceof Date) {
        return isNaN(date.getTime()) ? '' : date.toISOString().split('T')[0];
      }
      if (date instanceof Timestamp) {
        const dateObj = date.toDate();
        return isNaN(dateObj.getTime()) ? '' : dateObj.toISOString().split('T')[0];
      }
      return '';
    } catch (error) {
      console.error('Error formatting date:', error);
      return '';
    }
  };

  const validateDateInput = (value: string): boolean => {
    // Check if the input matches the date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(value)) return false;

    // Parse the date and check if it's valid
    const date = new Date(value);
    return !isNaN(date.getTime());
  };

  // Handle form submission
  const handleSubmit = async (status: 'draft' | 'published' = 'draft') => {
    if (formState.isSaving) return;

    try {
      setFormState(prev => ({ ...prev, isSaving: true }));
      
      // Validate form data before submitting
      if (status === 'published' && !validateForm(formData)) {
        toast.error('Please fill in all required fields before publishing');
        return;
      }

      // Prepare the data for submission
      const submitData = {
        ...formData,
        status,
        updatedAt: Timestamp.now(),
        updatedBy: user?.uid || 'system'
      };

      const submitDataRecord = submitData as Record<string, any>;
      Object.keys(submitDataRecord).forEach(key => {
        if (submitDataRecord[key] === undefined) {
          delete submitDataRecord[key];
        }
      });

      await onSubmit(submitDataRecord as MemorialProfileFormData);
      
      setFormState(prev => ({ 
        ...prev, 
        isSaving: false,
        hasUnsavedChanges: false,
        lastSaved: new Date()
      }));

      if (status === 'published') {
        toast.success('Memorial published successfully');
      } else {
        toast.success('Draft saved successfully');
      }

      // Redirect to the university admin management page
      window.location.href = `/admin/universities/${formData.universityId}/profiles`;
    } catch (error) {
      console.error('[MemorialProfileForm] Error submitting form:', error);
      setFormState(prev => ({ 
        ...prev, 
        isSaving: false,
        lastSaveError: 'Failed to save changes'
      }));
      toast.error('Failed to save changes');
    }
  };

  // Handle cancel
  const handleCancel = async () => {
    console.log('[MemorialProfileForm] Canceling form', {
      hasUnsavedChanges: formState.hasUnsavedChanges,
      name: formData.name,
      dateOfBirth: formData.basicInfo?.dateOfBirth
    });
    
    if (formState.hasUnsavedChanges) {
      if (window.confirm('You have unsaved changes. Are you sure you want to cancel?')) {
        await releaseLock();
        onCancel();
      }
    } else {
      await releaseLock();
      onCancel();
    }
  };

  const handleAddTag = () => {
    if (!newTag.trim()) return;
    if (formData.metadata?.tags?.includes(newTag.trim())) {
      toast.error('Tag already exists');
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      metadata: {
        tags: [...(prev.metadata?.tags || []), newTag.trim()],
        categories: prev.metadata?.categories || [],
        lastModifiedBy: prev.metadata?.lastModifiedBy || '',
        lastModifiedAt: Timestamp.fromDate(new Date()),
        version: (prev.metadata?.version || 0) + 1
      }
    }));
    setNewTag('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      metadata: {
        tags: (prev.metadata?.tags || []).filter(tag => tag !== tagToRemove),
        categories: prev.metadata?.categories || [],
        lastModifiedBy: prev.metadata?.lastModifiedBy || '',
        lastModifiedAt: Timestamp.fromDate(new Date()),
        version: (prev.metadata?.version || 0) + 1
      }
    }));
  };

  const handleImageUpload = (url: string) => {
    setFormData(prev => ({
      ...prev,
      imageUrl: url
    }));
  };

  // Update timeline handler with memoization
  const handleTimelineUpdate = useCallback((updatedEvents: LifeEvent[]) => {
    console.log('[MemorialProfileForm] Timeline update:', {
      eventCount: updatedEvents.length,
      firstEvent: updatedEvents[0]?.title,
      lastEvent: updatedEvents[updatedEvents.length - 1]?.title
    });
    
    const updatedData = {
      ...formData,
      timeline: updatedEvents.map(event => ({
        ...event,
        createdAt: event.createdAt || new Date(),
        updatedAt: new Date()
      })),
      updatedAt: Timestamp.now()
    };
    
    // Update form data which will trigger the debounced save
    updateFormData(updatedData);
  }, [formData, updateFormData]);

  useEffect(() => {
    console.log('[MemorialProfileForm] Timeline data updated:', {
      timelineLength: formData.timeline.length,
      profileTimelineLength: profile?.timeline?.length || 0
    });
  }, [formData.timeline, profile?.timeline]);

  // Cleanup effect
  useEffect(() => {
    return () => {
      debouncedSave.cancel();
    };
  }, [debouncedSave]);

  // Add a memoized handler for life story updates
  const handleLifeStoryChange = useCallback((content: string) => {
    if (formState.isSaving) return;
    
    updateFormData({
      lifeStory: {
        ...formData.lifeStory,
        content,
        updatedAt: new Date(),
      },
    });
  }, [formData.lifeStory, formState.isSaving, updateFormData]);

  // Show lock error if present
  if (lockError) {
    return (
      <div className="p-6 bg-red-50 rounded-lg">
        <div className="flex items-center">
          <Icon name="alert-circle" className="h-5 w-5 text-red-400 mr-2" />
          <p className="text-red-700">{lockError}</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`space-y-6 ${className}`}
    >
      {/* Header with auto-save status */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg p-6 text-white">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              {profile ? 'Edit Memorial' : 'Create New Memorial'}
            </h1>
            <p className="text-indigo-100">
              Honor and remember someone special by creating a lasting memorial.
            </p>
          </div>
          <div className="text-sm text-indigo-100">
            {formState.isSaving ? (
              <span className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Saving...
              </span>
            ) : formState.lastSaved ? (
              <span>Last saved: {formState.lastSaved.toLocaleTimeString()}</span>
            ) : null}
            {formState.lastSaveError && (
              <span className="text-red-200 ml-2">{formState.lastSaveError}</span>
            )}
          </div>
        </div>
        <div className="mt-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-indigo-100">Completion</span>
            <span className="text-sm font-medium">{completionPercentage}%</span>
          </div>
          <div className="mt-2 h-2 bg-white/20 rounded-full overflow-hidden">
            <div 
              className="h-full bg-white transition-all duration-300"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </div>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-6">
        <TabsRoot value={activeTab} onValueChange={handleTabChange} className="space-y-6">
          <TabsList className="grid grid-cols-5 gap-4 bg-gray-50 p-1 rounded-lg">
            <TabsTrigger value="basic" disabled={formState.isTabChanging} className="flex items-center gap-2">
              <Icon name="user" className="w-4 h-4" />
              Basic Info
            </TabsTrigger>
            <TabsTrigger value="life" disabled={formState.isTabChanging} className="flex items-center gap-2">
              <Icon name="book" className="w-4 h-4" />
              Life Story
            </TabsTrigger>
            <TabsTrigger value="timeline" disabled={formState.isTabChanging} className="flex items-center gap-2">
              <Icon name="clock" className="w-4 h-4" />
              Timeline
            </TabsTrigger>
            <TabsTrigger value="media" disabled={formState.isTabChanging} className="flex items-center gap-2">
              <Icon name="image" className="w-4 h-4" />
              Media
            </TabsTrigger>
            <TabsTrigger value="settings" disabled={formState.isTabChanging} className="flex items-center gap-2">
              <Icon name="settings" className="w-4 h-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-6">
            <Card className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
              <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                <div className="sm:col-span-4">
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => updateFormData({ name: e.target.value })}
                    className={`mt-1 ${errors.name ? 'border-red-500' : ''}`}
                    required
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                  )}
                </div>

                <div className="sm:col-span-6">
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => updateFormData({ description: e.target.value })}
                    className={`mt-1 ${errors.description ? 'border-red-500' : ''}`}
                    rows={3}
                  />
                  {errors.description && (
                    <p className="mt-1 text-sm text-red-600">{errors.description}</p>
                  )}
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Life Details</h3>
              <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                <div className="sm:col-span-3">
                  <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700">
                    Date of Birth <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    value={formatDate(formData.basicInfo?.dateOfBirth)}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (!value || validateDateInput(value)) {
                        const date = value ? new Date(value) : null;
                        if (!date || !isNaN(date.getTime())) {
                          updateFormData({
                            basicInfo: {
                              ...formData.basicInfo!,
                              dateOfBirth: date
                            }
                          });
                        }
                      }
                    }}
                    max={new Date().toISOString().split('T')[0]}
                    className={`mt-1 ${errors.dateOfBirth ? 'border-red-500' : ''}`}
                  />
                  {errors.dateOfBirth && (
                    <p className="mt-1 text-sm text-red-600">{errors.dateOfBirth}</p>
                  )}
                </div>

                <div className="sm:col-span-3">
                  <label htmlFor="dateOfDeath" className="block text-sm font-medium text-gray-700">
                    Date of Death
                  </label>
                  <Input
                    id="dateOfDeath"
                    type="date"
                    value={formatDate(formData.basicInfo?.dateOfDeath)}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (!value || validateDateInput(value)) {
                        const date = value ? new Date(value) : null;
                        if (!date || !isNaN(date.getTime())) {
                          updateFormData({
                            basicInfo: {
                              ...formData.basicInfo!,
                              dateOfDeath: date
                            }
                          });
                        }
                      }
                    }}
                    min={formData.basicInfo?.dateOfBirth ? formatDate(formData.basicInfo.dateOfBirth) : undefined}
                    max={new Date().toISOString().split('T')[0]}
                    className={`mt-1 ${errors.dateOfDeath ? 'border-red-500' : ''}`}
                  />
                  {errors.dateOfDeath && (
                    <p className="mt-1 text-sm text-red-600">{errors.dateOfDeath}</p>
                  )}
                </div>

                <div className="sm:col-span-3">
                  <label htmlFor="birthLocation" className="block text-sm font-medium text-gray-700">
                    Birth Location
                  </label>
                  <Input
                    id="birthLocation"
                    value={formData.basicInfo?.birthLocation}
                    onChange={(e) => updateFormData({
                      basicInfo: {
                        ...formData.basicInfo!,
                        birthLocation: e.target.value
                      }
                    })}
                    className={`mt-1 ${errors.birthLocation ? 'border-red-500' : ''}`}
                  />
                  {errors.birthLocation && (
                    <p className="mt-1 text-sm text-red-600">{errors.birthLocation}</p>
                  )}
                </div>

                <div className="sm:col-span-3">
                  <label htmlFor="deathLocation" className="block text-sm font-medium text-gray-700">
                    Death Location
                  </label>
                  <Input
                    id="deathLocation"
                    value={formData.basicInfo?.deathLocation}
                    onChange={(e) => updateFormData({
                      basicInfo: {
                        ...formData.basicInfo!,
                        deathLocation: e.target.value
                      }
                    })}
                    className={`mt-1 ${errors.deathLocation ? 'border-red-500' : ''}`}
                  />
                  {errors.deathLocation && (
                    <p className="mt-1 text-sm text-red-600">{errors.deathLocation}</p>
                  )}
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Profile Photo</h3>
              <div className="mt-4">
                <ImageUpload
                  onUpload={handleImageUpload}
                  currentImage={formData.imageUrl}
                />
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="life" className="space-y-6">
            <Card className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Life Story</h3>
              <div className="space-y-6">
                <LifeStoryEditor
                  value={formData.lifeStory?.content || ''}
                  onChange={handleLifeStoryChange}
                />
                {errors.lifeStory && (
                  <p className="mt-1 text-sm text-red-600">{errors.lifeStory}</p>
                )}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="timeline" className="space-y-6">
            <Card className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Life Timeline</h3>
              <div className="mt-4">
                <TimelineBuilder
                  initialEvents={formData.timeline}
                  onEventsChange={handleTimelineUpdate}
                  orgId={profile?.universityId || ''}
                  profileId={formData.id || ''}
                  isEditMode={true}
                  isPreview={false}
                />
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="media" className="space-y-6">
            <Card className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Media Gallery</h3>
              <div className="mt-4">
                <TimelineMediaUpload
                  eventId={formData.id || 'new'}
                  existingMedia={formData.mediaUrls || []}
                  onMediaChange={(urls) => {
                    setFormData((prev) => ({ ...prev, mediaUrls: urls }));
                  }}
                />
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Tags</h3>
              <div className="mt-4">
                <div className="flex flex-wrap gap-2 mb-4">
                  {formData.metadata?.tags?.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-1 text-gray-500 hover:text-gray-700"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="Add a tag"
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    onClick={handleAddTag}
                    variant="outline"
                  >
                    Add Tag
                  </Button>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Privacy Settings</h3>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">Public Memorial</h4>
                  <p className="text-sm text-gray-500">
                    Make this memorial visible to everyone
                  </p>
                </div>
                <Switch
                  checked={formData.isPublic || false}
                  onChange={(checked: boolean) => updateFormData({ isPublic: checked })}
                />
              </div>
            </Card>
          </TabsContent>
        </TabsRoot>

        {/* Form Actions */}
        <div className="flex justify-between items-center pt-6 border-t border-gray-200">
          <div className="flex items-center gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={formState.isSaving}
            >
              Cancel
            </Button>
          </div>
          <div className="flex items-center gap-4">
            {formState.hasUnsavedChanges && (
              <span className="text-sm text-gray-500">
                You have unsaved changes
              </span>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={() => handleSubmit('draft')}
              disabled={formState.isSaving}
            >
              {formState.isSaving ? 'Saving...' : 'Save as Draft'}
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={() => handleSubmit('published')}
              disabled={formState.isSaving || !validateForm(formData)}
            >
              {formState.isSaving ? 'Publishing...' : 'Publish Memorial'}
            </Button>
          </div>
        </div>
      </form>
    </motion.div>
  );
}; 