'use client';

import React from 'react';
import { Icon } from '@/components/ui/Icon';

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
  className?: string;
}

/**
 * A consistent error message component for use throughout the application
 */
export function ErrorMessage({ message, onRetry, className = '' }: ErrorMessageProps) {
  return (
    <div className={`rounded-md bg-red-50 p-4 ${className}`}>
      <div className="flex">
        <div className="flex-shrink-0">
          <Icon name="error" className="h-5 w-5 text-red-400" />
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-red-800">Error</h3>
          <div className="mt-2 text-sm text-red-700">
            <p>{message}</p>
          </div>
          {onRetry && (
            <div className="mt-4">
              <button
                type="button"
                onClick={onRetry}
                className="inline-flex items-center rounded-md bg-red-50 px-2 py-1 text-sm font-medium text-red-800 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2"
              >
                Try again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * A consistent success message component
 */
export function SuccessMessage({ message, className = '' }: { message: string; className?: string }) {
  return (
    <div className={`rounded-md bg-green-50 p-4 ${className}`}>
      <div className="flex">
        <div className="flex-shrink-0">
          <Icon name="check-circle" className="h-5 w-5 text-green-400" />
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-green-800">Success</h3>
          <div className="mt-2 text-sm text-green-700">
            <p>{message}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * A consistent warning message component
 */
export function WarningMessage({ message, className = '' }: { message: string; className?: string }) {
  return (
    <div className={`rounded-md bg-yellow-50 p-4 ${className}`}>
      <div className="flex">
        <div className="flex-shrink-0">
          <Icon name="warning" className="h-5 w-5 text-yellow-400" />
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-yellow-800">Warning</h3>
          <div className="mt-2 text-sm text-yellow-700">
            <p>{message}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * A consistent info message component
 */
export function InfoMessage({ message, className = '' }: { message: string; className?: string }) {
  return (
    <div className={`rounded-md bg-blue-50 p-4 ${className}`}>
      <div className="flex">
        <div className="flex-shrink-0">
          <Icon name="info" className="h-5 w-5 text-blue-400" />
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-blue-800">Information</h3>
          <div className="mt-2 text-sm text-blue-700">
            <p>{message}</p>
          </div>
        </div>
      </div>
    </div>
  );
} 