import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Icon } from '@/components/ui/Icon';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Profile, PersonalProfile, MemorialProfile } from '@/types/profile';
import { toast } from 'react-hot-toast';
import { Badge } from '@/components/ui/Badge';
import { Timestamp } from 'firebase/firestore';

interface ProfileFormProps {
  profile?: Profile;
  onSubmit: (data: Partial<Profile>) => Promise<void>;
  onCancel: () => void;
  className?: string;
}

export const ProfileForm: React.FC<ProfileFormProps> = ({
  profile,
  onSubmit,
  onCancel,
  className
}) => {
  const [formData, setFormData] = useState<Profile>(() => {
    if (profile) {
      return profile;
    }
    
    // Default to personal profile if no type is specified
    return {
      id: '',
      name: '',
      type: 'personal',
      status: 'draft',
      isPublic: false,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      createdBy: '',
      updatedBy: '',
      metadata: {
        tags: [],
        categories: [],
        lastModifiedBy: '',
        lastModifiedAt: Timestamp.now(),
        version: 0
      },
      bio: '',
      photoURL: '',
      location: '',
      department: '',
      graduationYear: '',
      contact: {
        email: '',
        phone: '',
        website: ''
      },
      education: [],
      experience: [],
      achievements: []
    } as PersonalProfile;
  });

  const [loading, setLoading] = useState(false);
  const [newTag, setNewTag] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await onSubmit(formData);
      toast.success(profile ? 'Profile updated successfully' : 'Profile created successfully');
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('Failed to save profile');
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
        ...prev.metadata,
        tags: [...(prev.metadata?.tags || []), newTag.trim()]
      }
    }));
    setNewTag('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      metadata: {
        ...prev.metadata,
        tags: prev.metadata?.tags?.filter(tag => tag !== tagToRemove)
      }
    }));
  };

  const isMemorialProfile = formData.type === 'memorial';

  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      onSubmit={handleSubmit}
      className={className}
    >
      <div className="space-y-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Name
          </label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="mt-1"
          />
        </div>

        <div>
          <label htmlFor="type" className="block text-sm font-medium text-gray-700">
            Profile Type
          </label>
          <Select
            id="type"
            value={formData.type}
            onChange={(value) => {
              if (value === 'memorial') {
                setFormData({
                  ...formData,
                  type: 'memorial',
                  universityId: '',
                  description: '',
                  imageUrl: '',
                  basicInfo: {
                    dateOfBirth: null,
                    dateOfDeath: null,
                    biography: '',
                    photo: '',
                    birthLocation: '',
                    deathLocation: ''
                  },
                  lifeStory: {
                    content: '',
                    updatedAt: Timestamp.now()
                  }
                } as MemorialProfile);
              } else {
                setFormData({
                  ...formData,
                  type: 'personal',
                  bio: '',
                  location: '',
                  photoURL: '',
                  department: '',
                  graduationYear: '',
                  contact: {
                    email: '',
                    phone: '',
                    website: ''
                  },
                  education: [],
                  experience: [],
                  achievements: []
                } as PersonalProfile);
              }
            }}
            className="mt-1"
            options={[
              { value: 'personal', label: 'Personal' },
              { value: 'memorial', label: 'Memorial' }
            ]}
          />
        </div>

        {isMemorialProfile ? (
          <>
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <Textarea
                id="description"
                value={(formData as MemorialProfile).description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <label htmlFor="biography" className="block text-sm font-medium text-gray-700">
                Biography
              </label>
              <Textarea
                id="biography"
                value={(formData as MemorialProfile).basicInfo?.biography}
                onChange={(e) => setFormData({
                  ...formData,
                  basicInfo: {
                    ...(formData as MemorialProfile).basicInfo,
                    biography: e.target.value
                  }
                })}
                className="mt-1"
              />
            </div>
          </>
        ) : (
          <>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <Input
                id="email"
                type="email"
                value={(formData as PersonalProfile).contact.email}
                onChange={(e) => setFormData({
                  ...formData,
                  contact: {
                    ...(formData as PersonalProfile).contact,
                    email: e.target.value
                  }
                })}
                className="mt-1"
              />
            </div>
            <div>
              <label htmlFor="bio" className="block text-sm font-medium text-gray-700">
                Bio
              </label>
              <Textarea
                id="bio"
                value={(formData as PersonalProfile).bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                className="mt-1"
              />
            </div>
          </>
        )}

        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700">
            Status
          </label>
          <Select
            id="status"
            value={formData.status}
            onChange={(value) => setFormData({ ...formData, status: value as Profile['status'] })}
            className="mt-1"
            options={[
              { value: 'draft', label: 'Draft' },
              { value: 'published', label: 'Published' }
            ]}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Tags</label>
          <div className="mt-1 flex flex-wrap gap-2">
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
          <div className="mt-2 flex gap-2">
            <Input
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              placeholder="Add a tag"
              className="flex-1"
            />
            <Button
              type="button"
              variant="secondary"
              onClick={handleAddTag}
              disabled={!newTag.trim()}
            >
              Add
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="isPublic"
            checked={formData.isPublic}
            onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
          />
          <label htmlFor="isPublic" className="text-sm font-medium text-gray-700">
            Public Profile
          </label>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={loading}
          >
            {loading ? (
              <>
                <Icon name="loader" className="animate-spin -ml-1 mr-2 h-4 w-4" />
                Saving...
              </>
            ) : (
              'Save Profile'
            )}
          </Button>
        </div>
      </div>
    </motion.form>
  );
}; 