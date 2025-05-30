"use client";

import { useState, useCallback, useMemo } from 'react';
import { TimelineEvent } from '../types/profile';
import { useToast } from './useToast';
import { useAnalytics } from './useAnalytics';

interface UseTimelineOptions {
  initialEvents?: TimelineEvent[];
  onEventsChange?: (events: TimelineEvent[]) => void;
}

interface TimelineFilters {
  searchTerm?: string;
  eventTypes?: ('education' | 'job' | 'event')[];
  dateRange?: {
    start?: string;
    end?: string;
  };
}

export const useTimeline = ({ initialEvents = [], onEventsChange }: UseTimelineOptions = {}) => {
  const [events, setEvents] = useState<TimelineEvent[]>(initialEvents);
  const [filters, setFilters] = useState<TimelineFilters>({});
  const [isLoading, setIsLoading] = useState(false);
  const { showToast } = useToast();
  const { trackEvent } = useAnalytics();

  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      // Apply search term filter
      if (filters.searchTerm) {
        const searchLower = filters.searchTerm.toLowerCase();
        const matchesSearch =
          event.title.toLowerCase().includes(searchLower) ||
          event.description?.toLowerCase().includes(searchLower) ||
          event.location?.toLowerCase().includes(searchLower) ||
          (event.metadata?.institution && event.metadata.institution.toLowerCase().includes(searchLower)) ||
          (event.metadata?.company && event.metadata.company.toLowerCase().includes(searchLower));
        if (!matchesSearch) return false;
      }

      // Apply event type filter
      if (filters.eventTypes?.length) {
        if (!filters.eventTypes.includes(event.type)) return false;
      }

      // Apply date range filter
      if (filters.dateRange?.start || filters.dateRange?.end) {
        const eventDate = new Date(event.startDate);
        if (filters.dateRange.start && eventDate < new Date(filters.dateRange.start)) return false;
        if (filters.dateRange.end && eventDate > new Date(filters.dateRange.end)) return false;
      }

      return true;
    });
  }, [events, filters]);

  const addEvent = useCallback(
    async (newEvent: Omit<TimelineEvent, 'id'>) => {
      try {
        setIsLoading(true);
        const event: TimelineEvent = {
          id: crypto.randomUUID(),
          ...newEvent,
        };

        const updatedEvents = [...events, event];
        setEvents(updatedEvents);
        onEventsChange?.(updatedEvents);

        trackEvent('timeline_event_added', {
          eventType: event.type,
          hasLocation: !!event.location,
          hasDescription: !!event.description,
        });

        showToast({
          title: 'Event Added',
          description: 'The timeline event has been added successfully.',
          status: 'success',
        });

        return event;
      } catch (error) {
        console.error('Error adding timeline event:', error);
        showToast({
          title: 'Error',
          description: error instanceof Error ? error.message : 'Failed to add timeline event.',
          status: 'error',
        });
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [events, onEventsChange, showToast, trackEvent]
  );

  const updateEvent = useCallback(
    async (eventId: string, updates: Partial<TimelineEvent>) => {
      try {
        setIsLoading(true);
        const updatedEvents = events.map((event) =>
          event.id === eventId ? { ...event, ...updates } : event
        );
        setEvents(updatedEvents);
        onEventsChange?.(updatedEvents);

        trackEvent('timeline_event_updated', {
          eventId,
          updateFields: Object.keys(updates),
        });

        showToast({
          title: 'Event Updated',
          description: 'The timeline event has been updated successfully.',
          status: 'success',
        });
      } catch (error) {
        console.error('Error updating timeline event:', error);
        showToast({
          title: 'Error',
          description: error instanceof Error ? error.message : 'Failed to update timeline event.',
          status: 'error',
        });
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [events, onEventsChange, showToast, trackEvent]
  );

  const deleteEvent = useCallback(
    async (eventId: string) => {
      try {
        setIsLoading(true);
        const updatedEvents = events.filter((event) => event.id !== eventId);
        setEvents(updatedEvents);
        onEventsChange?.(updatedEvents);

        trackEvent('timeline_event_deleted', {
          eventId,
          remainingEvents: updatedEvents.length,
        });

        showToast({
          title: 'Event Deleted',
          description: 'The timeline event has been deleted successfully.',
          status: 'success',
        });
      } catch (error) {
        console.error('Error deleting timeline event:', error);
        showToast({
          title: 'Error',
          description: error instanceof Error ? error.message : 'Failed to delete timeline event.',
          status: 'error',
        });
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [events, onEventsChange, showToast, trackEvent]
  );

  const reorderEvents = useCallback(
    async (reorderedEvents: TimelineEvent[]) => {
      try {
        setIsLoading(true);
        setEvents(reorderedEvents);
        onEventsChange?.(reorderedEvents);

        trackEvent('timeline_events_reordered', {
          eventCount: reorderedEvents.length,
        });

        showToast({
          title: 'Timeline Updated',
          description: 'The timeline events have been reordered successfully.',
          status: 'success',
        });
      } catch (error) {
        console.error('Error reordering timeline events:', error);
        showToast({
          title: 'Error',
          description: error instanceof Error ? error.message : 'Failed to reorder timeline events.',
          status: 'error',
        });
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [onEventsChange, showToast, trackEvent]
  );

  const applyFilters = useCallback(
    (newFilters: TimelineFilters) => {
      setFilters(newFilters);
      trackEvent('timeline_filter_applied', {
        filterCount: Object.keys(newFilters).length,
        eventTypes: newFilters.eventTypes,
        hasDateRange: !!(newFilters.dateRange?.start || newFilters.dateRange?.end),
      });
    },
    [trackEvent]
  );

  const clearFilters = useCallback(() => {
    setFilters({});
    trackEvent('timeline_filters_cleared');
  }, [trackEvent]);

  return {
    events: filteredEvents,
    isLoading,
    addEvent,
    updateEvent,
    deleteEvent,
    reorderEvents,
    applyFilters,
    clearFilters,
    currentFilters: filters,
  };
}; 