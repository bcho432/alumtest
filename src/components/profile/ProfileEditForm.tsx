import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Icon } from '@/components/ui/Icon';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { useProfileEditOriginal } from '@/hooks/useProfileEdit';
import { ProfileExperienceForm } from './ProfileExperienceForm';
import { cn } from '@/lib/utils';

interface ProfileEditFormProps {
  profileId: string;
  initialData: {
    displayName: string;
    bio: string;
    avatar?: string;
    socialLinks?: {
      twitter?: string;
      linkedin?: string;
      github?: string;
    };
    skills?: string[];
    experience?: Array<{
      title: string;
      company: string;
      startDate: string;
      endDate?: string;
      description?: string;
    }>;
    education?: Array<{
      institution: string;
      degree: string;
      field: string;
      startDate: string;
      endDate?: string;
    }>;
  };
  className?: string;
}

export const ProfileEditForm: React.FC<ProfileEditFormProps> = ({
  profileId,
  initialData,
  className
}) => {
  const [formData, setFormData] = useState(initialData);
  const [newSkill, setNewSkill] = useState('');
  const { isSaving, isUploading, saveProfile, uploadAvatar } = useProfileEditOriginal({
    profileId,
    onSuccess: () => {
      // Handle success (e.g., show success message)
    }
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSocialLinkChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      socialLinks: {
        ...prev.socialLinks,
        [name]: value
      }
    }));
  };

  const handleAvatarChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const avatarUrl = await uploadAvatar(file);
      if (avatarUrl) {
        setFormData((prev) => ({
          ...prev,
          avatar: avatarUrl
        }));
      }
    } catch (error) {
      console.error('Error uploading avatar:', error);
    }
  };

  const handleAddSkill = () => {
    if (!newSkill.trim() || formData.skills?.includes(newSkill.trim())) {
      return;
    }

    setFormData((prev) => ({
      ...prev,
      skills: [...(prev.skills || []), newSkill.trim()]
    }));
    setNewSkill('');
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      skills: prev.skills?.filter((skill) => skill !== skillToRemove)
    }));
  };

  const handleExperienceChange = (data: {
    experience?: Array<{
      title: string;
      company: string;
      startDate: string;
      endDate?: string;
      description?: string;
    }>;
    education?: Array<{
      institution: string;
      degree: string;
      field: string;
      startDate: string;
      endDate?: string;
    }>;
  }) => {
    setFormData((prev) => ({
      ...prev,
      ...data
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveProfile(formData);
  };

  return (
    <form onSubmit={handleSubmit} className={cn('space-y-8', className)}>
      {/* Avatar Upload */}
      <div className="flex items-center space-x-6">
        <div className="relative h-24 w-24">
          <img
            src={formData.avatar || '/default-avatar.png'}
            alt="Profile"
            className="h-full w-full rounded-full object-cover"
          />
          <label
            htmlFor="avatar-upload"
            className="absolute inset-0 flex cursor-pointer items-center justify-center rounded-full bg-black bg-opacity-50 opacity-0 transition-opacity hover:opacity-100"
          >
            <Icon name="camera" className="h-6 w-6 text-white" />
          </label>
          <input
            id="avatar-upload"
            type="file"
            accept="image/*"
            onChange={handleAvatarChange}
            className="hidden"
            disabled={isUploading}
          />
        </div>
        <div>
          <h3 className="text-lg font-medium">Profile Picture</h3>
          <p className="text-sm text-gray-500">
            Upload a new profile picture
          </p>
        </div>
      </div>

      {/* Basic Info */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Basic Information</h3>
        <div>
          <label
            htmlFor="displayName"
            className="block text-sm font-medium text-gray-700"
          >
            Display Name
          </label>
          <Input
            id="displayName"
            name="displayName"
            value={formData.displayName}
            onChange={handleInputChange}
            className="mt-1"
            required
          />
        </div>
        <div>
          <label
            htmlFor="bio"
            className="block text-sm font-medium text-gray-700"
          >
            Bio
          </label>
          <Textarea
            id="bio"
            name="bio"
            value={formData.bio}
            onChange={handleInputChange}
            rows={4}
            className="mt-1"
          />
        </div>
      </div>

      {/* Social Links */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Social Links</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label
              htmlFor="twitter"
              className="block text-sm font-medium text-gray-700"
            >
              Twitter
            </label>
            <Input
              id="twitter"
              name="twitter"
              value={formData.socialLinks?.twitter || ''}
              onChange={handleSocialLinkChange}
              className="mt-1"
              placeholder="https://twitter.com/username"
            />
          </div>
          <div>
            <label
              htmlFor="linkedin"
              className="block text-sm font-medium text-gray-700"
            >
              LinkedIn
            </label>
            <Input
              id="linkedin"
              name="linkedin"
              value={formData.socialLinks?.linkedin || ''}
              onChange={handleSocialLinkChange}
              className="mt-1"
              placeholder="https://linkedin.com/in/username"
            />
          </div>
          <div>
            <label
              htmlFor="github"
              className="block text-sm font-medium text-gray-700"
            >
              GitHub
            </label>
            <Input
              id="github"
              name="github"
              value={formData.socialLinks?.github || ''}
              onChange={handleSocialLinkChange}
              className="mt-1"
              placeholder="https://github.com/username"
            />
          </div>
        </div>
      </div>

      {/* Skills */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Skills</h3>
        <div className="flex flex-wrap gap-2">
          {formData.skills?.map((skill) => (
            <motion.span
              key={skill}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary"
            >
              {skill}
              <button
                type="button"
                onClick={() => handleRemoveSkill(skill)}
                className="ml-2 text-primary hover:text-primary/80"
              >
                <Icon name="x" className="h-4 w-4" />
              </button>
            </motion.span>
          ))}
        </div>
        <div className="flex space-x-2">
          <Input
            value={newSkill}
            onChange={(e) => setNewSkill(e.target.value)}
            placeholder="Add a skill"
            className="flex-1"
          />
          <Button
            type="button"
            variant="outline"
            onClick={handleAddSkill}
            disabled={!newSkill.trim() || formData.skills?.includes(newSkill.trim())}
          >
            Add
          </Button>
        </div>
      </div>

      {/* Experience & Education */}
      <ProfileExperienceForm
        experience={formData.experience}
        education={formData.education}
        onChange={handleExperienceChange}
      />

      {/* Submit Button */}
      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={isSaving}
          className="min-w-[120px]"
        >
          {isSaving ? (
            <>
              <Icon name="loader" className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            'Save Changes'
          )}
        </Button>
      </div>
    </form>
  );
}; 