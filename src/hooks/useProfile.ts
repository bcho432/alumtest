"use client";

import { useState, useEffect } from 'react';
import { Profile } from '@/types/profile';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';

export const useProfile = (profileId?: string) => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const { user } = useAuth();
  const { showToast } = useToast();

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.userData?.id && !profileId) {
        setProfile(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await fetch(`/api/profiles/${profileId || user?.userData?.id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch profile');
        }
        const data = await response.json();
        setProfile(data);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch profile'));
        showToast({
          title: 'Error',
          description: 'Failed to load profile. Please try again.',
          status: 'error',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user, profileId, showToast]);

  const updateProfile = async (updatedProfile: Profile) => {
    if (!user?.userData?.id) {
      throw new Error('User must be authenticated to update profile');
    }

    try {
      setIsUpdating(true);
      const response = await fetch(`/api/profiles/${user.userData.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedProfile),
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      const data = await response.json();
      setProfile(data);
      return data;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to update profile');
      setError(error);
      showToast({
        title: 'Error',
        description: 'Failed to update profile. Please try again.',
        status: 'error',
      });
      throw error;
    } finally {
      setIsUpdating(false);
    }
  };

  return {
    profile,
    loading,
    error,
    isUpdating,
    updateProfile,
  };
}; 