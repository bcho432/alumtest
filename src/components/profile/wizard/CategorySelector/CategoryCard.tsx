import React from 'react';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';
import { QuestionCategory } from '@/types/questions';
import { cn } from '@/lib/utils';

interface CategoryCardProps {
  category: {
    id: QuestionCategory;
    label: string;
    description: string;
    icon: string;
  };
  isSelected: boolean;
  onToggle: (categoryId: QuestionCategory) => void;
}

export const CategoryCard = React.memo<CategoryCardProps>(({
  category,
  isSelected,
  onToggle,
}) => {
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onToggle(category.id);
    }
  };

  return (
    <Card
      variant="bordered"
      role="checkbox"
      aria-checked={isSelected}
      aria-label={`Select ${category.label} category`}
      tabIndex={0}
      className={cn(
        'cursor-pointer transition-colors hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
        isSelected && 'border-blue-500 bg-blue-50'
      )}
      onClick={() => onToggle(category.id)}
      onKeyPress={handleKeyPress}
    >
      <div className="flex items-start space-x-3">
        <div
          className={cn(
            'p-2 rounded-full',
            isSelected
              ? 'bg-blue-100 text-blue-600'
              : 'bg-gray-100 text-gray-600'
          )}
          aria-hidden="true"
        >
          <Icon name={category.icon} className="w-6 h-6" />
        </div>
        <div>
          <h3 className="font-medium">{category.label}</h3>
          <p className="mt-1 text-sm text-gray-600">
            {category.description}
          </p>
        </div>
      </div>
    </Card>
  );
});

CategoryCard.displayName = 'CategoryCard'; 