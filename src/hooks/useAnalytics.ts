import { useCallback } from 'react';

interface AnalyticsEvent {
  name: string;
  properties?: Record<string, any>;
}

export const useAnalytics = () => {
  const trackEvent = useCallback((name: string, properties?: Record<string, any>) => {
    // TODO: Replace with actual analytics implementation
    console.log('Analytics Event:', { name, properties });
  }, []);

  return {
    trackEvent,
  };
}; 