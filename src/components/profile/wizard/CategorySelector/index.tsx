import React, { useCallback } from 'react';
import { Icon } from '@/components/ui/Icon';
import { LoadingState } from '@/components/ui/LoadingState';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { useQuestionCategories } from '@/hooks/useQuestionCategories';
import { CATEGORIES, QuestionCategory } from '@/types/questions';
import { CategoryCard } from './CategoryCard';
import { CategorySkeletonGrid } from './CategorySkeleton';
import { useToast } from '@/hooks/useToast';

interface CategorySelectorProps {
  orgId: string;
  profileId: string;
  onNext: () => void;
}

export const CategorySelector: React.FC<CategorySelectorProps> = ({
  orgId,
  profileId,
  onNext,
}) => {
  const {
    selectedCategories,
    isLoading,
    error,
    toggleCategory,
  } = useQuestionCategories({ orgId, profileId });
  const { showToast } = useToast();

  const handleToggleCategory = useCallback(async (categoryId: QuestionCategory) => {
    try {
      await toggleCategory(categoryId);
    } catch (error) {
      showToast({
        title: 'Error',
        description: 'Failed to save category selection. Retrying...',
        status: 'error'
      });
      // Retry after delay
      setTimeout(() => {
        toggleCategory(categoryId);
      }, 2000);
    }
  }, [toggleCategory, showToast]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold">Select Question Categories</h2>
          <p className="mt-1 text-gray-500">
            Choose 1-5 categories to customize the types of stories presented.
          </p>
        </div>
        <CategorySkeletonGrid />
      </div>
    );
  }

  if (error) {
    return (
      <Alert
        type="error"
        title="Failed to load categories"
        message={error.message}
        action={{
          label: 'Retry',
          onClick: () => window.location.reload(),
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Select Question Categories</h2>
        <p className="mt-1 text-gray-500">
          Choose 1-5 categories to customize the types of stories presented.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {CATEGORIES.map((category) => (
          <CategoryCard
            key={category.id}
            category={category}
            isSelected={selectedCategories.includes(category.id)}
            onToggle={handleToggleCategory}
          />
        ))}
      </div>

      {selectedCategories.length > 0 && (
        <div className="flex justify-end pt-6">
          <Button
            onClick={onNext}
            disabled={selectedCategories.length === 0}
          >
            Next Step
          </Button>
        </div>
      )}

      {selectedCategories.length === 0 && (
        <Alert type="info" message="Please select at least one category to continue." />
      )}
    </div>
  );
}; 