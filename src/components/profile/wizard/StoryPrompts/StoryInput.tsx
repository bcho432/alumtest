import React, { useState, useEffect } from 'react';
import { LoadingState } from '@/components/ui/LoadingState';
import { cn } from '@/lib/utils';

interface StoryInputProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
  isSaving: boolean;
  hasError: boolean;
  onRetry: () => void;
}

export const StoryInput: React.FC<StoryInputProps> = ({
  id,
  value,
  onChange,
  placeholder,
  maxLength = 2000,
  isSaving,
  hasError,
  onRetry,
}) => {
  const [localValue, setLocalValue] = useState(value);
  const [showSaved, setShowSaved] = useState(false);

  // Sync local value with prop value
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  // Handle local changes
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    onChange(newValue);
  };

  // Show saved indicator
  useEffect(() => {
    if (!isSaving && !hasError) {
      setShowSaved(true);
      const timer = setTimeout(() => {
        setShowSaved(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isSaving, hasError]);

  return (
    <div className="space-y-2">
      <div className="relative">
        <textarea
          id={id}
          value={localValue}
          onChange={handleChange}
          placeholder={placeholder}
          maxLength={maxLength}
          rows={4}
          className={cn(
            'block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm',
            isSaving && 'opacity-50',
            hasError && 'border-red-300 focus:border-red-500 focus:ring-red-500'
          )}
        />
        {isSaving && (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-50">
            <LoadingState size="sm" />
          </div>
        )}
      </div>
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-500">
          {localValue.length} / {maxLength} characters
        </p>
        <div className="flex items-center space-x-2">
          {showSaved && (
            <span className="text-xs text-green-600 flex items-center">
              <svg
                className="w-4 h-4 mr-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              Saved
            </span>
          )}
          {hasError && (
            <button
              onClick={onRetry}
              className="text-xs text-red-600 hover:text-red-700 flex items-center"
            >
              <svg
                className="w-4 h-4 mr-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Retry
            </button>
          )}
        </div>
      </div>
    </div>
  );
}; 