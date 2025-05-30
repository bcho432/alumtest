"use client";

import { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';
import { useToast } from './useToast';
import { useAnalytics } from './useAnalytics';
import { StoryAnswer } from '../types/profile';

interface UseStoryPromptsOptions {
  orgId: string;
  profileId: string;
}

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

export const useStoryPrompts = ({ orgId, profileId }: UseStoryPromptsOptions) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showToast } = useToast();
  const { trackEvent } = useAnalytics();

  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const updateStoryAnswers = async (answers: StoryAnswer[]) => {
    setIsSubmitting(true);
    let retryCount = 0;

    try {
      while (retryCount < MAX_RETRIES) {
        try {
          const db = await getDb();
          const profileRef = doc(db, 'organizations', orgId, 'profiles', profileId);
          await updateDoc(profileRef, {
            storyAnswers: answers,
            updatedAt: new Date().toISOString(),
          });

          showToast({
            title: 'Answers Saved',
            description: 'Your story prompt answers have been saved successfully.',
            status: 'success',
          });

          // Track analytics
          trackEvent('story_answers_updated', {
            answerCount: answers.length,
          });

          return; // Success, exit the function
        } catch (error) {
          retryCount++;
          
          if (retryCount === MAX_RETRIES) {
            // Last retry failed
            console.error('Error updating story answers after retries:', error);
            showToast({
              title: 'Error',
              description: error instanceof Error 
                ? `Failed to save answers: ${error.message}`
                : 'Failed to save answers. Please try again later.',
              status: 'error',
            });
            throw error;
          }

          // Show retry toast
          showToast({
            title: 'Retrying...',
            description: `Attempt ${retryCount} of ${MAX_RETRIES}. Please wait.`,
            status: 'info',
            duration: RETRY_DELAY,
          });

          // Wait before retrying
          await sleep(RETRY_DELAY);
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    updateStoryAnswers,
    isSubmitting,
  };
}; 