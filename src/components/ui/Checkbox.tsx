import React from 'react';
import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  onCheckedChange?: (checked: boolean) => void;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, onCheckedChange, label, error, ...props }, ref) => {
    return (
      <div className="flex items-start">
        <div className="flex items-center h-5">
          <input
            type="checkbox"
            ref={ref}
            className={`h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded ${error ? 'border-red-500' : ''} ${className}`}
            onChange={e => onCheckedChange?.(e.target.checked)}
            {...props}
          />
        </div>
        {label && (
          <div className="ml-3 text-sm">
            <label htmlFor={props.id} className="font-medium text-gray-700">
              {label}
            </label>
            {error && (
              <p className="mt-1 text-sm text-red-600">{error}</p>
            )}
          </div>
        )}
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox'; 