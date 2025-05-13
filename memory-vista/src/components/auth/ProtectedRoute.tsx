'use client';

import { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: ReactNode;
  redirectTo?: string;
  allowIfPublished?: boolean; // For memorial pages to allow public access if published
  resourceId?: string; // Used with allowIfPublished to check publication status
}

/**
 * A wrapper component that protects routes requiring authentication
 * Redirects unauthenticated users to the login page or specified route
 */
export default function ProtectedRoute({ 
  children, 
  redirectTo = '/login',
  allowIfPublished = false,
  resourceId
}: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Only redirect after auth state is confirmed and user is not authenticated
    if (!loading && !user) {
      // For memorial pages, we'd check if the memorial is public before redirecting
      // This would be handled in the page component, not here
      router.push(redirectTo);
    }
  }, [user, loading, redirectTo, router]);

  // Show nothing while checking auth state
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // After loading, if user is authenticated, render children
  // For pages that might be public, the page component would handle this differently
  if (user) {
    return <>{children}</>;
  }

  // If not authenticated and done loading, show nothing while redirecting
  return null;
} 