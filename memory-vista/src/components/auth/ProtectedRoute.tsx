'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { isMemorialPublished } from '@/lib/permissions';

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
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
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