'use client';

import React from 'react';
import { ErrorBoundary as ReactErrorBoundary } from 'react-error-boundary';
import { Icon } from '@/components/ui/Icon';

interface ErrorFallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
}

function ErrorFallback({ error, resetErrorBoundary }: ErrorFallbackProps) {
  // Log the error to some error reporting service
  console.error('Application error:', error);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="rounded-lg bg-white p-8 shadow-md max-w-md w-full">
        <div className="flex flex-col items-center">
          <div className="flex items-center justify-center h-12 w-12 rounded-md bg-red-100">
            <Icon name="error" className="h-8 w-8 text-red-600" />
          </div>
          <h2 className="mt-4 text-xl font-medium text-gray-900">Something went wrong</h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            We're sorry, but an unexpected error occurred. Our team has been notified.
          </p>
          <div className="mt-4 w-full bg-gray-100 rounded-md p-4 text-sm text-gray-700 font-mono overflow-auto">
            {error.message}
          </div>
          <div className="mt-6">
            <button
              onClick={resetErrorBoundary}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface GlobalErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<ErrorFallbackProps>;
}

/**
 * A global error boundary component to catch and handle unexpected errors
 */
export function GlobalErrorBoundary({
  children,
  fallback = ErrorFallback,
}: GlobalErrorBoundaryProps) {
  const handleError = (error: Error) => {
    // Report error to an error tracking service like Sentry
    console.error('Caught by GlobalErrorBoundary:', error);
  };

  return (
    <ReactErrorBoundary
      FallbackComponent={fallback}
      onError={handleError}
      onReset={() => {
        // Reset application state if needed
        window.location.href = '/';
      }}
    >
      {children}
    </ReactErrorBoundary>
  );
} 