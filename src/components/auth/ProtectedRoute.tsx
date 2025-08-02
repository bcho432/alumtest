'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { isMemorialPublished } from '@/lib/permissions';
import { Spinner } from '@/components/ui/Spinner';

interface ProtectedRouteProps {
  children: ReactNode;
  redirectTo?: string;
  allowIfPublished?: boolean; // For memorial pages to allow public access if published
  resourceId?: string; // Used with allowIfPublished to check publication status
}

/**
 * A wrapper component that protects routes requiring authentication
 * Redirects unauthenticated users to the login page or specified route
 * Allows public access to published resources if allowIfPublished is true
 */
export default function ProtectedRoute({ 
  children, 
  redirectTo = '/login',
  allowIfPublished = false,
  resourceId
}: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [checkingPublication, setCheckingPublication] = useState(false);
  const [isPublished, setIsPublished] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if resource is published when allowIfPublished is true
  useEffect(() => {
    async function checkPublicationStatus() {
      if (allowIfPublished && resourceId) {
        setCheckingPublication(true);
        try {
          const published = await isMemorialPublished(resourceId);
          setIsPublished(published);
        } catch (error) {
          console.error('Error checking if resource is published:', error);
          setError('Failed to check publication status');
          setIsPublished(false);
        } finally {
          setCheckingPublication(false);
        }
      }
    }

    checkPublicationStatus();
  }, [allowIfPublished, resourceId]);

  // Handle redirection
  useEffect(() => {
    // Only redirect after auth state is confirmed and checks are completed
    if (!loading && !checkingPublication && !user) {
      // If the resource is published and allowIfPublished is true, don't redirect
      if (allowIfPublished && isPublished) {
        return;
      }
      // Otherwise redirect to login
      router.push(redirectTo);
    }
  }, [user, loading, redirectTo, router, allowIfPublished, isPublished, checkingPublication]);

  // Show loading while checking auth state or publication status
  if (loading || (allowIfPublished && checkingPublication)) {
    return <Spinner size="lg" variant="primary" fullScreen />;
  }

  // Show error if publication check failed
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">{error}</p>
          <button
            onClick={() => router.reload()}
            className="mt-4 text-indigo-600 hover:text-indigo-500"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  // After loading, if user is authenticated or resource is published and allowIfPublished is true, render children
  if (user || (allowIfPublished && isPublished)) {
    return <>{children}</>;
  }

  // If not authenticated and done loading, show nothing while redirecting
  return null;
} 