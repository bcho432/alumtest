import React from 'react';
import { Spinner } from './Spinner';
import { cn } from '@/lib/utils';

export interface LoadingStateProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading...',
  size = 'md',
  className,
}) => {
  return (
    <div className={cn('flex items-center space-x-2', className)}>
      <Spinner size={size} />
      <span className="text-sm text-gray-500">{message}</span>
    </div>
  );
}; 