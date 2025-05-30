import { useState, useEffect, useCallback } from 'react';
import { collection, doc, setDoc, getDocs, Timestamp } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';
import { useAnalytics } from './useAnalytics';
import { QuestionCategory, QuestionCategorySelection } from '@/types/questions';

interface UseQuestionCategoriesProps {
  orgId: string;
  profileId: string;
}

export const useQuestionCategories = ({ orgId, profileId }: UseQuestionCategoriesProps) => {
  const [selectedCategories, setSelectedCategories] = useState<QuestionCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { trackEvent } = useAnalytics();

  const loadCategories = useCallback(async () => {
    try {
      setIsLoading(true);
      const dbInstance = await getDb();
      const categoriesRef = collection(
        dbInstance,
        'universities',
        orgId,
        'profiles',
        profileId,
        'questionCategories'
      );
      const snapshot = await getDocs(categoriesRef);
      const categories = snapshot.docs.map(doc => doc.data().categoryId as QuestionCategory);
      setSelectedCategories(categories);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load categories'));
    } finally {
      setIsLoading(false);
    }
  }, [orgId, profileId]);

  const toggleCategory = useCallback(async (categoryId: QuestionCategory) => {
    try {
      const newCategories = selectedCategories.includes(categoryId)
        ? selectedCategories.filter(id => id !== categoryId)
        : [...selectedCategories, categoryId];

      if (newCategories.length > 5) {
        throw new Error('Maximum 5 categories allowed');
      }

      const dbInstance = await getDb();
      const categoryRef = doc(
        dbInstance,
        'universities',
        orgId,
        'profiles',
        profileId,
        'questionCategories',
        categoryId
      );

      const selection: QuestionCategorySelection = {
        categoryId,
        selectedAt: Timestamp.now(),
      };

      if (newCategories.includes(categoryId)) {
        await setDoc(categoryRef, selection);
        trackEvent('category_selected', { categoryId });
      } else {
        await setDoc(categoryRef, { selectedAt: null });
      }

      setSelectedCategories(newCategories);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to update category'));
    }
  }, [orgId, profileId, selectedCategories, trackEvent]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  return {
    selectedCategories,
    isLoading,
    error,
    toggleCategory,
    refetch: loadCategories,
  };
}; 