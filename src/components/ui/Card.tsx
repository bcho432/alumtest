import React from 'react';
import { cn } from '@/lib/utils';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'bordered' | 'elevated';
}

const variantStyles = {
  default: 'bg-white',
  bordered: 'bg-white border',
  elevated: 'bg-white shadow-md',
};

export const Card: React.FC<CardProps> = ({
  variant = 'default',
  className,
  ...props
}) => {
  return (
    <div
      className={cn(
        'rounded-lg p-4',
        variantStyles[variant],
        className
      )}
      {...props}
    />
  );
}; 