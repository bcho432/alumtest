import { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';
import { LifeEvent } from '@/types/profile';
import { useAuth } from '@/hooks/useAuth';
import { useAnalytics } from '@/hooks/useAnalytics';

interface UseTimelineEventsProps {
  orgId: string;
  profileId: string;
}

export const useTimelineEvents = ({ orgId, profileId }: UseTimelineEventsProps) => {
  const [events, setEvents] = useState<LifeEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { user } = useAuth();
  const { trackEvent } = useAnalytics();

  const fetchEvents = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      setError(null);

      const dbInstance = await getDb();
      const eventsRef = collection(
        dbInstance,
        'profiles',
        profileId,
        'timeline'
      );

      const q = query(
        eventsRef,
        orderBy('createdAt', 'desc'),
        limit(100)
      );

      const snapshot = await getDocs(q);
      const fetchedEvents = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as LifeEvent[];

      setEvents(fetchedEvents);
      trackEvent('timeline_loaded', {
        eventCount: fetchedEvents.length,
        profileId
      });
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch timeline events');
      setError(error);
      trackEvent('timeline_load_failed', {
        error: error.message,
        profileId
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [orgId, profileId, user]);

  return {
    events,
    isLoading,
    error,
    refetch: fetchEvents
  };
}; 