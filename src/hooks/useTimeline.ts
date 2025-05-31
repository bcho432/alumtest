"use client";

import { useState, useCallback, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { collection, query, where, orderBy, limit, startAfter, getDocs, DocumentData } from 'firebase/firestore';
import { getFirebaseServices } from '@/lib/firebase';
import { TimelineEvent } from '@/types/profile';
import { useToast } from './useToast';
import { useAnalytics } from './useAnalytics';

interface UseTimelineOptions {
  orgId: string;
  profileId: string;
  pageSize?: number;
  initialEvents?: TimelineEvent[];
}

interface UseTimelineResult {
  events: TimelineEvent[];
  isLoading: boolean;
  error: Error | null;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
  isRefreshing: boolean;
}

const STALE_TIME = 5 * 60 * 1000; // 5 minutes
const DEFAULT_PAGE_SIZE = 20;

export function useTimeline({
  orgId,
  profileId,
  pageSize = DEFAULT_PAGE_SIZE,
  initialEvents = [],
}: UseTimelineOptions): UseTimelineResult {
  const [lastDoc, setLastDoc] = useState<DocumentData | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const { trackEvent } = useAnalytics();

  const fetchEvents = useCallback(async (lastDocument?: DocumentData) => {
    try {
      const { db } = await getFirebaseServices();
      const collectionPath = `universities/${orgId}/profiles/${profileId}/events`;
      const eventsRef = collection(db, collectionPath);
      
      let q = query(
        eventsRef,
        orderBy('startDate', 'desc'),
        limit(pageSize)
      );

      if (lastDocument) {
        q = query(
          eventsRef,
          orderBy('startDate', 'desc'),
          startAfter(lastDocument),
          limit(pageSize)
        );
      }

      const snapshot = await getDocs(q);
      const events = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as TimelineEvent[];

      setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
      setHasMore(snapshot.docs.length === pageSize);

      return events;
    } catch (error) {
      console.error('Error fetching timeline events:', error);
      throw error;
    }
  }, [orgId, profileId, pageSize]);

  const {
    data: events = initialEvents,
    isLoading,
    error,
    refetch
  } = useQuery<TimelineEvent[], Error>({
    queryKey: ['timeline-events', orgId, profileId],
    queryFn: () => fetchEvents(),
    staleTime: STALE_TIME,
    gcTime: STALE_TIME,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  const loadMore = useCallback(async () => {
    if (!hasMore || isLoading) return;

    try {
      const newEvents = await fetchEvents(lastDoc || undefined);
      queryClient.setQueryData<TimelineEvent[]>(
        ['timeline-events', orgId, profileId],
        (old = []) => [...old, ...newEvents]
      );
    } catch (error) {
      console.error('Error loading more events:', error);
      showToast({
        title: 'Error',
        description: 'Failed to load more events. Please try again.',
        status: 'error',
      });
    }
  }, [hasMore, isLoading, lastDoc, fetchEvents, queryClient, orgId, profileId, showToast]);

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await refetch();
      setLastDoc(null);
      setHasMore(true);
      showToast({
        title: 'Success',
        description: 'Timeline refreshed successfully',
        status: 'success',
      });
    } catch (error) {
      console.error('Error refreshing timeline:', error);
      showToast({
        title: 'Error',
        description: 'Failed to refresh timeline. Please try again.',
        status: 'error',
      });
    } finally {
      setIsRefreshing(false);
    }
  }, [refetch, showToast]);

  // Prefetch next page
  useEffect(() => {
    if (hasMore && !isLoading) {
      queryClient.prefetchQuery<TimelineEvent[], Error>({
        queryKey: ['timeline-events', orgId, profileId, 'next'],
        queryFn: () => fetchEvents(lastDoc || undefined),
      });
    }
  }, [hasMore, isLoading, lastDoc, fetchEvents, queryClient, orgId, profileId]);

  return {
    events,
    isLoading,
    error: error as Error | null,
    hasMore,
    loadMore,
    refresh,
    isRefreshing,
  };
} 