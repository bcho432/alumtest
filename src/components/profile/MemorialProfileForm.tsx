import React, { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Icon } from '@/components/ui/Icon';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { MemorialProfile, MemorialProfileFormData, TimelineEvent } from '@/types/profile';
import { toast } from 'react-hot-toast';
import { Badge } from '@/components/ui/Badge';
import { ImageUpload } from '@/components/ui/ImageUpload';
import { TabsRoot, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { Switch } from '@/components/ui/Switch';
import { Card } from '@/components/ui/Card';
import { Dialog } from '@/components/ui/Dialog';
import debounce from 'lodash/debounce';
import { Timestamp } from 'firebase/firestore';

interface MemorialProfileFormProps {
  profile?: MemorialProfile;
  onSubmit: (data: MemorialProfileFormData) => Promise<void>;
  onCancel: () => void;
  className?: string;
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

export const MemorialProfileForm: React.FC<MemorialProfileFormProps> = ({
  profile,
  onSubmit,
  onCancel,
  className
}) => {
  const [formData, setFormData] = useState<MemorialProfileFormData>({
    id: '',
    type: 'memorial',
    universityId: '',
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
    createdBy: '',
    updatedBy: '',
    name: '',
    description: '',
    imageUrl: '',
    basicInfo: {
      dateOfBirth: new Date(),
      dateOfDeath: new Date(),
      biography: '',
      photo: '',
      birthLocation: '',
      deathLocation: ''
    },
    lifeStory: {
      content: '',
      updatedAt: new Date()
    },
    isPublic: false,
    status: 'draft',
    metadata: {
      tags: [],
      categories: [],
      lastModifiedBy: '',
      lastModifiedAt: Timestamp.fromDate(new Date()),
      version: 1
    }
  });

  const [loading, setLoading] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [activeTab, setActiveTab] = useState('basic');
  const [completionPercentage, setCompletionPercentage] = useState(0);
  const [errors, setErrors] = useState<FormErrors>({});
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Debounced auto-save
  const debouncedSave = useCallback(
    debounce(async (data: MemorialProfileFormData) => {
      try {
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
        setLastSaved(new Date());
        setHasUnsavedChanges(false);
      } catch (error) {
        console.error('Auto-save failed:', error);
      }
    }, 2000),
    [onSubmit]
  );

  // Validate form data
  const validateForm = (data: MemorialProfileFormData): FormErrors => {
    const newErrors: FormErrors = {};
    
    if (!data.name?.trim()) {
      newErrors.name = 'Name is required';
    } else if (data.name.length > 100) {
      newErrors.name = 'Name must be less than 100 characters';
    }

    if (data.description && data.description.length > 500) {
      newErrors.description = 'Description must be less than 500 characters';
    }

    if (data.basicInfo?.dateOfBirth && data.basicInfo?.dateOfDeath) {
      const birthDate = data.basicInfo.dateOfBirth instanceof Timestamp ? data.basicInfo.dateOfBirth.toDate() : new Date(data.basicInfo.dateOfBirth);
      const deathDate = data.basicInfo.dateOfDeath instanceof Timestamp ? data.basicInfo.dateOfDeath.toDate() : new Date(data.basicInfo.dateOfDeath);
      
      if (deathDate < birthDate) {
        newErrors.dateOfDeath = 'Death date must be after birth date';
      }
    }

    if (data.basicInfo?.biography && data.basicInfo.biography.length > 2000) {
      newErrors.biography = 'Biography must be less than 2000 characters';
    }

    if (data.lifeStory?.content && data.lifeStory.content.length > 10000) {
      newErrors.lifeStory = 'Life story must be less than 10000 characters';
    }

    return newErrors;
  };

  // Update form data with validation
  const updateFormData = (updates: Partial<MemorialProfileFormData>) => {
    const newData = { ...formData, ...updates };
    const newErrors = validateForm(newData);
    setErrors(newErrors);
    setFormData(newData);
    setHasUnsavedChanges(true);
    debouncedSave(newData);
  };

  // Calculate completion percentage with validation
  useEffect(() => {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validateForm(formData);
    
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      toast.error('Please fix the errors before publishing');
      return;
    }

    setLoading(true);
    try {
      const metadata = {
        tags: formData.metadata?.tags || [],
        categories: formData.metadata?.categories || [],
        lastModifiedBy: formData.metadata?.lastModifiedBy || '',
        lastModifiedAt: Timestamp.fromDate(new Date()),
        version: (formData.metadata?.version || 0) + 1
      };

      await onSubmit({
        ...formData,
        status: 'published',
        metadata
      });
      toast.success(profile ? 'Memorial updated successfully' : 'Memorial created successfully');
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Error saving memorial:', error);
      toast.error('Failed to save memorial');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDraft = async () => {
    setLoading(true);
    try {
      const metadata = {
        tags: formData.metadata?.tags || [],
        categories: formData.metadata?.categories || [],
        lastModifiedBy: formData.metadata?.lastModifiedBy || '',
        lastModifiedAt: Timestamp.fromDate(new Date()),
        version: (formData.metadata?.version || 0) + 1
      };

      await onSubmit({
        ...formData,
        status: 'draft',
        metadata
      });
      toast.success('Draft saved successfully');
    } catch (error) {
      console.error('Error saving draft:', error);
      toast.error('Failed to save draft');
    } finally {
      setLoading(false);
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

  const handleCancel = () => {
    if (hasUnsavedChanges) {
      setShowCancelDialog(true);
    } else {
      onCancel();
    }
  };

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
          {lastSaved && (
            <div className="text-sm text-indigo-100">
              Last saved: {lastSaved.toLocaleTimeString()}
            </div>
          )}
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

      <form onSubmit={handleSubmit} className="space-y-6">
        <TabsRoot value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-5 gap-4 bg-gray-50 p-1 rounded-lg">
            <TabsTrigger value="basic" className="flex items-center gap-2">
              <Icon name="user" className="w-4 h-4" />
              Basic Info
            </TabsTrigger>
            <TabsTrigger value="life" className="flex items-center gap-2">
              <Icon name="book" className="w-4 h-4" />
              Life Story
            </TabsTrigger>
            <TabsTrigger value="timeline" className="flex items-center gap-2">
              <Icon name="clock" className="w-4 h-4" />
              Timeline
            </TabsTrigger>
            <TabsTrigger value="media" className="flex items-center gap-2">
              <Icon name="image" className="w-4 h-4" />
              Media
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
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
                    Full Name
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
                    Date of Birth
                  </label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    value={
                      formData.basicInfo?.dateOfBirth
                        ? (formData.basicInfo.dateOfBirth instanceof Date
                            ? formData.basicInfo.dateOfBirth.toISOString().split('T')[0]
                            : formData.basicInfo.dateOfBirth instanceof Timestamp
                              ? formData.basicInfo.dateOfBirth.toDate().toISOString().split('T')[0]
                              : '')
                        : ''
                    }
                    onChange={(e) => updateFormData({
                      basicInfo: {
                        ...formData.basicInfo!,
                        dateOfBirth: new Date(e.target.value)
                      }
                    })}
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
                    value={
                      formData.basicInfo?.dateOfDeath
                        ? (formData.basicInfo.dateOfDeath instanceof Date
                            ? formData.basicInfo.dateOfDeath.toISOString().split('T')[0]
                            : formData.basicInfo.dateOfDeath instanceof Timestamp
                              ? formData.basicInfo.dateOfDeath.toDate().toISOString().split('T')[0]
                              : '')
                        : ''
                    }
                    onChange={(e) => updateFormData({
                      basicInfo: {
                        ...formData.basicInfo!,
                        dateOfDeath: new Date(e.target.value)
                      }
                    })}
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
              <h3 className="text-lg font-medium text-gray-900 mb-4">Biography & Life Story</h3>
              <div className="space-y-6">
                <div>
                  <label htmlFor="biography" className="block text-sm font-medium text-gray-700">
                    Biography
                  </label>
                  <Textarea
                    id="biography"
                    value={formData.basicInfo?.biography}
                    onChange={(e) => updateFormData({
                      basicInfo: {
                        ...formData.basicInfo!,
                        biography: e.target.value
                      }
                    })}
                    className={`mt-1 ${errors.biography ? 'border-red-500' : ''}`}
                    rows={4}
                  />
                  {errors.biography && (
                    <p className="mt-1 text-sm text-red-600">{errors.biography}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="lifeStory" className="block text-sm font-medium text-gray-700">
                    Life Story
                  </label>
                  <Textarea
                    id="lifeStory"
                    value={formData.lifeStory?.content}
                    onChange={(e) => updateFormData({
                      lifeStory: {
                        ...formData.lifeStory!,
                        content: e.target.value,
                        updatedAt: new Date()
                      }
                    })}
                    className={`mt-1 ${errors.lifeStory ? 'border-red-500' : ''}`}
                    rows={8}
                  />
                  {errors.lifeStory && (
                    <p className="mt-1 text-sm text-red-600">{errors.lifeStory}</p>
                  )}
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="timeline" className="space-y-6">
            <Card className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Life Timeline</h3>
              <div className="mt-4">
                {/* Timeline content removed */}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="media" className="space-y-6">
            <Card className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Media Gallery</h3>
              <div className="mt-4">
                {/* Media gallery content removed */}
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

        {/* Footer with unsaved changes warning */}
        <div className="flex items-center justify-between pt-6 border-t">
          <div className="flex items-center gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={handleSaveDraft}
              disabled={loading}
            >
              Save as Draft
            </Button>
          </div>
          <div className="flex items-center gap-4">
            {hasUnsavedChanges && (
              <span className="text-sm text-gray-500">
                You have unsaved changes
              </span>
            )}
            <Button
              type="submit"
              disabled={loading || completionPercentage < 100 || Object.keys(errors).length > 0}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Publishing...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Icon name="check" className="w-4 h-4" />
                  Publish Memorial
                </div>
              )}
            </Button>
          </div>
        </div>
      </form>

      {/* Cancel confirmation dialog */}
      <Dialog
        open={showCancelDialog}
        onOpenChange={setShowCancelDialog}
      >
        <div className="p-6">
          <h2 className="text-lg font-semibold mb-2">Unsaved Changes</h2>
          <p className="text-gray-600 mb-4">
            You have unsaved changes. Are you sure you want to cancel?
          </p>
          <div className="flex justify-end gap-4">
            <Button
              variant="outline"
              onClick={() => setShowCancelDialog(false)}
            >
              Continue Editing
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                setShowCancelDialog(false);
                onCancel();
              }}
            >
              Discard Changes
            </Button>
          </div>
        </div>
      </Dialog>
    </motion.div>
  );
}; 