interface AnalyticsEvent {
  name: string;
  properties?: Record<string, any>;
}

export const trackEvent = jest.fn((event: AnalyticsEvent) => {
  console.log('Analytics event:', event);
});

export const trackError = jest.fn((error: Error, context?: Record<string, any>) => {
  console.error('Analytics error:', error, context);
});

export const trackPageView = jest.fn((url: string) => {
  console.log('Page view:', url);
}); 