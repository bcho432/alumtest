import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'react-hot-toast';
import { db, storage } from '@/lib/firebase';
import { doc, updateDoc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getDb } from '@/lib/firebase';
import { Profile } from '@/types/profile';

interface UseProfileEditProps {
  profileId: string;
  onSuccess?: () => void;
}

interface ProfileData {
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
}

interface UseProfileEditResult {
  isEditing: boolean;
  error: string | null;
  editProfile: (data: Partial<Profile>) => Promise<void>;
  publishProfile: (data: Partial<Profile>) => Promise<void>;
}

export const useProfileEdit = (profileId: string): UseProfileEditResult => {
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const editProfile = async (data: Partial<Profile>) => {
    setIsEditing(true);
    setError(null);

    try {
      const db = await getDb();
      const profileRef = doc(db, 'profiles', `${profileId}_draft`);
      await setDoc(profileRef, {
        ...data,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    } catch (err) {
      setError('Failed to save changes');
      console.error('Error saving profile changes:', err);
    } finally {
      setIsEditing(false);
    }
  };

  const publishProfile = async (data: Partial<Profile>) => {
    setIsEditing(true);
    setError(null);

    try {
      const db = await getDb();
      const profileRef = doc(db, 'profiles', profileId);
      await updateDoc(profileRef, {
        ...data,
        updatedAt: new Date().toISOString()
      });
    } catch (err) {
      setError('Failed to publish changes');
      console.error('Error publishing profile changes:', err);
    } finally {
      setIsEditing(false);
    }
  };

  return {
    isEditing,
    error,
    editProfile,
    publishProfile
  };
};

export const useProfileEditOriginal = ({ profileId, onSuccess }: UseProfileEditProps) => {
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const { user } = useAuth();

  const saveProfile = async (data: ProfileData) => {
    if (!user) {
      toast.error('You must be logged in to edit your profile');
      return;
    }

    setIsSaving(true);

    try {
      const dbInstance = await getDb();
      const profileRef = doc(dbInstance, 'profiles', profileId);
      await updateDoc(profileRef, {
        ...data,
        updatedAt: new Date().toISOString()
      });

      toast.success('Profile updated successfully');
      onSuccess?.();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const uploadAvatar = async (file: File): Promise<string | null> => {
    if (!user) {
      toast.error('You must be logged in to upload an avatar');
      return null;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return null;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return null;
    }

    setIsUploading(true);

    try {
      const storageRef = ref(storage, `avatars/${profileId}/${file.name}`);
      await uploadBytes(storageRef, file);
      const downloadUrl = await getDownloadURL(storageRef);

      toast.success('Avatar uploaded successfully');
      return downloadUrl;
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error('Failed to upload avatar. Please try again.');
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  return {
    isSaving,
    isUploading,
    saveProfile,
    uploadAvatar
  };
}; 