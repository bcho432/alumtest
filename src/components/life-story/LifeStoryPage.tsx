import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/useToast';
import { useProfile } from '@/hooks/useProfile';
import { Button } from '@/components/ui/Button';
import { LifeStoryPrompts } from './LifeStoryPrompts';
import { motion, AnimatePresence } from 'framer-motion';
import { Profile, MemorialProfile, PersonalProfile } from '@/types/profile';
import { Timestamp } from 'firebase/firestore';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { z } from 'zod';

// Validation schemas
const memorialLifeStorySchema = z.object({
  content: z.string(),
  updatedAt: z.instanceof(Timestamp)
});

const personalLifeStorySchema = z.record(z.string());

function hasLifeStory(profile: any): profile is MemorialProfile | PersonalProfile {
  return (
    (profile.type === 'memorial' && 'lifeStory' in profile) ||
    (profile.type === 'personal' && 'lifeStory' in profile)
  );
}

export const LifeStoryPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { profile, updateProfile, loading } = useProfile();
  const [isSaving, setIsSaving] = useState(false);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [localResponses, setLocalResponses] = useLocalStorage('lifeStoryResponses', {});
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 3;

  // Load initial responses with validation
  useEffect(() => {
    if (profile && hasLifeStory(profile)) {
      try {
        if (profile.type === 'memorial') {
          const memorialProfile = profile as MemorialProfile;
          if (memorialProfile.lifeStory && memorialProfile.lifeStory.content) {
            // Validate the life story structure
            memorialLifeStorySchema.parse(memorialProfile.lifeStory);
            const parsedResponses = JSON.parse(memorialProfile.lifeStory.content);
            // Validate the parsed content
            personalLifeStorySchema.parse(parsedResponses);
            setResponses(parsedResponses);
            setLocalResponses(parsedResponses);
          }
        } else if (profile.type === 'personal') {
          const personalProfile = profile as PersonalProfile;
          // Validate the life story structure
          personalLifeStorySchema.parse(personalProfile.lifeStory || {});
          setResponses(personalProfile.lifeStory || {});
          setLocalResponses(personalProfile.lifeStory || {});
        }
        setError(null);
      } catch (err) {
        console.error('Error parsing life story:', err);
        setError('Failed to load your life story. Please try again.');
        // Fallback to local storage if available and valid
        try {
          if (Object.keys(localResponses).length > 0) {
            personalLifeStorySchema.parse(localResponses);
            setResponses(localResponses);
          }
        } catch (localErr) {
          console.error('Error parsing local storage:', localErr);
          // Clear invalid local storage
          setLocalResponses({});
        }
      }
    }
  }, [profile, setLocalResponses, localResponses]);

  const handleResponsesChange = useCallback(async (newResponses: Record<string, string>) => {
    try {
      // Validate responses before updating
      personalLifeStorySchema.parse(newResponses);
      setResponses(newResponses);
      setLocalResponses(newResponses);
      setError(null);
    } catch (err) {
      console.error('Invalid response format:', err);
      setError('Invalid response format. Please try again.');
    }
  }, [setLocalResponses]);

  const handleSave = async () => {
    if (!profile) return;

    setIsSaving(true);
    setError(null);

    try {
      // Validate responses before saving
      personalLifeStorySchema.parse(responses);

      let updatedProfile: MemorialProfile | PersonalProfile;
      if (profile.type === 'memorial') {
        updatedProfile = {
          ...profile as unknown as MemorialProfile,
          lifeStory: {
            content: JSON.stringify(responses),
            updatedAt: Timestamp.now()
          }
        };
        memorialLifeStorySchema.parse((updatedProfile as MemorialProfile).lifeStory);
      } else {
        updatedProfile = {
          ...profile as unknown as PersonalProfile,
          lifeStory: responses
        };
        personalLifeStorySchema.parse((updatedProfile as PersonalProfile).lifeStory);
      }

      await updateProfile(updatedProfile as any);
      setRetryCount(0);

      showToast({
        title: 'Success',
        description: 'Your life story has been saved.',
        status: 'success',
      });

      navigate('/profile');
    } catch (error) {
      console.error('Error saving life story:', error);
      
      if (retryCount < MAX_RETRIES) {
        setRetryCount(prev => prev + 1);
        // Retry with exponential backoff
        setTimeout(() => {
          handleSave();
        }, 1000 * Math.pow(2, retryCount));
      } else {
        setError('Failed to save your life story. Please try again.');
        showToast({
          title: 'Error',
          description: 'Failed to save your life story. Please try again.',
          status: 'error',
        });
      }
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="container mx-auto px-4 py-8 max-w-4xl lg:max-w-6xl"
    >
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Your Life Story</h1>
        <p className="text-gray-600">
          Share your story by answering these prompts. Select the categories and questions that resonate with you.
        </p>
      </div>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative"
            role="alert"
          >
            <span className="block sm:inline">{error}</span>
            {retryCount > 0 && (
              <span className="block sm:inline mt-1">
                Retrying... (Attempt {retryCount} of {MAX_RETRIES})
              </span>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 mb-8">
        <LifeStoryPrompts 
          onResponsesChange={handleResponsesChange}
          initialResponses={responses}
        />
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
        <Button
          variant="outline"
          onClick={() => navigate('/profile')}
          className="w-full sm:w-auto px-6"
        >
          Back
        </Button>
        <Button
          onClick={handleSave}
          isLoading={isSaving}
          className="w-full sm:w-auto px-6"
        >
          {isSaving ? `Saving${'.'.repeat(retryCount + 1)}` : 'Save Story'}
        </Button>
      </div>
    </motion.div>
  );
}; 