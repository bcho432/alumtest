import { useState, useEffect, useCallback } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';
import { useToast } from './useToast';
import { useAnalytics } from './useAnalytics';
import { QuestionCategory, STORY_QUESTIONS } from '@/types/questions';
import { debounce } from '@/lib/utils';

export interface UseStoryAnswersProps {
  orgId: string;
  profileId: string;
  selectedCategories?: QuestionCategory[];
}

interface Progress {
  answeredCount: number;
  totalQuestions: number;
  percentage: number;
}

export function useStoryAnswers({ orgId, profileId, selectedCategories }: UseStoryAnswersProps) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const { showToast } = useToast();
  const { trackEvent } = useAnalytics();

  const loadAnswers = useCallback(async () => {
    if (!orgId || !profileId) return;

    try {
      setIsLoading(true);
      setError(null);

      const dbInstance = await getDb();
      const profileRef = doc(dbInstance, 'universities', orgId, 'profiles', profileId);
      const profileDoc = await getDoc(profileRef);

      if (!profileDoc.exists()) {
        throw new Error('Profile not found');
      }

      const profileData = profileDoc.data();
      setAnswers(profileData.answers || {});
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load answers'));
      showToast({
        title: 'Error',
        description: 'Failed to load story answers. Please try again.',
        status: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  }, [orgId, profileId, showToast]);

  const validateResponse = (response: string): boolean => {
    if (!response.trim()) {
      showToast({
        title: 'Warning',
        description: 'Please provide a response before saving.',
        status: 'warning',
      });
      return false;
    }
    return true;
  };

  const saveAnswer = useCallback(async (questionId: string, response: string) => {
    if (!orgId || !profileId) return;

    if (!validateResponse(response)) {
      return;
    }

    try {
      setIsSaving(true);
      setError(null);

      const dbInstance = await getDb();
      const profileRef = doc(dbInstance, 'universities', orgId, 'profiles', profileId);
      await updateDoc(profileRef, {
        [`answers.${questionId}`]: response,
        updatedAt: new Date(),
      });

      setAnswers((prev) => ({
        ...prev,
        [questionId]: response,
      }));

      trackEvent('story_answer_saved', {
        profileId,
        questionId,
        hasResponse: !!response,
      });
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to save answer'));
      showToast({
        title: 'Error',
        description: 'Failed to save your answer. Please try again.',
        status: 'error',
      });
    } finally {
      setIsSaving(false);
    }
  }, [orgId, profileId, showToast, trackEvent]);

  const debouncedSaveAnswer = useCallback(
    debounce((questionId: string, response: string) => {
      saveAnswer(questionId, response);
    }, 1000),
    [saveAnswer]
  );

  const updateAnswer = useCallback(
    (questionId: string, response: string) => {
      setAnswers((prev) => ({
        ...prev,
        [questionId]: response,
      }));
      debouncedSaveAnswer(questionId, response);
    },
    [debouncedSaveAnswer]
  );

  const progress: Progress = {
    answeredCount: Object.keys(answers).length,
    totalQuestions: selectedCategories
      ? Object.values(selectedCategories).reduce(
          (count, category) => count + (STORY_QUESTIONS[category]?.length || 0),
          0
        )
      : Object.values(STORY_QUESTIONS).flat().length,
    percentage: 0,
  };

  progress.percentage = Math.round(
    (progress.answeredCount / progress.totalQuestions) * 100
  );

  useEffect(() => {
    loadAnswers();
  }, [loadAnswers]);

  return {
    answers,
    isLoading,
    error,
    isSaving,
    updateAnswer,
    refetch: loadAnswers,
    progress,
  };
} 