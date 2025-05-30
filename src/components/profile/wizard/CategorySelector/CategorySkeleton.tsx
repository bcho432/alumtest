import React from 'react';
import { Card } from '@/components/ui/Card';

export const CategorySkeleton: React.FC = () => (
  <Card variant="bordered" className="animate-pulse">
    <div className="flex items-start space-x-3">
      <div className="p-2 rounded-full bg-gray-200 w-10 h-10" />
      <div className="flex-1">
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-2" />
        <div className="h-3 bg-gray-200 rounded w-full" />
      </div>
    </div>
  </Card>
);

export const CategorySkeletonGrid: React.FC = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    {Array.from({ length: 6 }).map((_, index) => (
      <CategorySkeleton key={index} />
    ))}
  </div>
); 