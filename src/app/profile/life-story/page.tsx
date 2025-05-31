"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/useToast';
import { useAnalytics } from '@/hooks/useAnalytics';
import { LifeStoryPrompts } from '@/components/profile/LifeStoryPrompts';
import { useProfile } from '@/hooks/useProfile';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { Timestamp } from 'firebase/firestore';
import { Profile, PersonalProfile, MemorialProfile } from '@/types/profile';

export default function LifeStoryPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const { trackEvent } = useAnalytics();
  const { profile, updateProfile, isUpdating, loading, error } = useProfile();
  const [isNavigating, setIsNavigating] = useState(false);

  // Handle loading state
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl flex items-center justify-center">
        <div className="text-center">
          <Icon name="spinner" className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading your profile...</p>
        </div>
      </div>
    );
  }

  // Handle error state
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h2 className="text-red-800 font-medium mb-2">Error Loading Profile</h2>
          <p className="text-red-600 mb-4">{error.message}</p>
          <Button
            onClick={() => window.location.reload()}
            variant="outline"
            className="text-red-600 border-red-200 hover:bg-red-50"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  // Handle missing profile
  if (!profile) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h2 className="text-yellow-800 font-medium mb-2">Profile Not Found</h2>
          <p className="text-yellow-600 mb-4">Please complete your profile setup first.</p>
          <Button
            onClick={() => router.push('/profile/setup')}
            variant="outline"
            className="text-yellow-600 border-yellow-200 hover:bg-yellow-50"
          >
            Complete Profile Setup
          </Button>
        </div>
      </div>
    );
  }

  const handleSave = async (responses: Record<string, string>) => {
    try {
      let updatedProfile: Profile;

      if (profile.type === 'memorial') {
        updatedProfile = {
          ...profile as MemorialProfile,
          lifeStory: {
            content: JSON.stringify(responses),
            updatedAt: Timestamp.now(),
          },
        };
      } else {
        updatedProfile = {
          ...profile as PersonalProfile,
          lifeStory: responses,
        };
      }

      await updateProfile(updatedProfile);

      showToast({
        title: 'Success',
        description: 'Your life story has been saved',
        status: 'success',
      });

      trackEvent('life_story_updated', {
        response_count: Object.keys(responses).length,
        profile_type: profile.type,
      });

      setIsNavigating(true);
      router.push('/profile');
    } catch (error) {
      console.error('Error saving life story:', error);
      showToast({
        title: 'Error',
        description: 'Failed to save your life story. Please try again.',
        status: 'error',
      });
    }
  };

  // Get initial responses based on profile type
  const getInitialResponses = () => {
    if (!profile.lifeStory) return {};
    
    if (profile.type === 'memorial') {
      try {
        return JSON.parse((profile as MemorialProfile).lifeStory.content);
      } catch {
        return {};
      }
    }
    
    return (profile as PersonalProfile).lifeStory || {};
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
        <Button
          onClick={() => router.back()}
          variant="ghost"
          className="text-gray-600 hover:text-gray-900"
        >
          <Icon name="arrow-left" className="w-4 h-4 mr-2" />
          Back to Profile
        </Button>
      </div>

      <LifeStoryPrompts
        onSave={handleSave}
        initialResponses={getInitialResponses()}
        isSubmitting={isUpdating || isNavigating}
      />
    </div>
  );
} 