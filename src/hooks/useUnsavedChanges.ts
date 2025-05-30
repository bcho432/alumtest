import { useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import { useBeforeUnload } from 'react-use';

interface UseUnsavedChangesOptions {
  isDirty: boolean;
  onDiscard?: () => void;
}

export const useUnsavedChanges = ({ isDirty, onDiscard }: UseUnsavedChangesOptions) => {
  const router = useRouter();

  // Handle browser back/forward/refresh
  useBeforeUnload(isDirty, 'You have unsaved changes. Are you sure you want to leave?');

  // Handle Next.js route changes
  const handleRouteChange = useCallback(
    (url: string) => {
      if (isDirty) {
        if (window.confirm('You have unsaved changes. Are you sure you want to leave?')) {
          onDiscard?.();
          return true;
        }
        router.events.emit('routeChangeError');
        // Throwing an error prevents the route change
        throw new Error('Route change aborted due to unsaved changes');
      }
      return true;
    },
    [isDirty, onDiscard, router]
  );

  useEffect(() => {
    router.events.on('routeChangeStart', handleRouteChange);
    return () => {
      router.events.off('routeChangeStart', handleRouteChange);
    };
  }, [router, handleRouteChange]);

  return {
    isDirty,
  };
}; 