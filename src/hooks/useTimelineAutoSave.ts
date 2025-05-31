import { useState, useEffect, useCallback, useRef } from 'react';
import { doc, setDoc, collection, writeBatch, getDocs, DocumentData } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';
import { useAnalytics } from './useAnalytics';
import { useToast } from './useToast';
import { LifeEvent } from '@/types/profile';

interface UseTimelineAutoSaveProps {
  orgId: string;
  profileId: string;
  events: LifeEvent[];
}

const AUTO_SAVE_DELAY = 5000; // 5 seconds
const MAX_RETRIES = 3;
const RETRY_DELAYS = [1000, 2000, 4000]; // Exponential backoff

export const useTimelineAutoSave = ({
  orgId,
  profileId,
  events,
}: UseTimelineAutoSaveProps) => {
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout>();
  const retryCountRef = useRef(0);
  const { trackEvent } = useAnalytics();
  const { showToast } = useToast();

  const saveEvents = useCallback(async () => {
    if (isSaving) return;

    setIsSaving(true);
    try {
      const dbInstance = await getDb();
      const timelineRef = collection(dbInstance, 'profiles', profileId, 'timeline');
      
      // Use a batch write to ensure atomic updates
      const batch = writeBatch(dbInstance);
      
      // Delete existing events
      const existingEvents = await getDocs(timelineRef);
      existingEvents.docs.forEach((doc: DocumentData) => {
        batch.delete(doc.ref);
      });
      
      // Add new events
      events.forEach(event => {
        const newEventRef = doc(timelineRef);
        batch.set(newEventRef, {
          ...event,
          createdAt: event.createdAt || new Date(),
          updatedAt: new Date()
        });
      });
      
      await batch.commit();

      trackEvent('timeline_autosave_success', {
        eventCount: events.length,
        profileId,
      });

      showToast({
        title: 'Success',
        description: 'Changes saved',
        status: 'success',
      });

      setLastSavedAt(new Date());
      retryCountRef.current = 0;
    } catch (error) {
      trackEvent('timeline_autosave_failure', {
        error: error instanceof Error ? error.message : 'Unknown error',
        profileId,
      });

      if (retryCountRef.current < MAX_RETRIES) {
        const retryDelay = RETRY_DELAYS[retryCountRef.current];
        retryCountRef.current += 1;

        setTimeout(saveEvents, retryDelay);
      } else {
        showToast({
          title: 'Error',
          description: 'Failed to save changes. Please try again.',
          status: 'error',
        });
      }
    } finally {
      setIsSaving(false);
    }
  }, [events, isSaving, orgId, profileId, showToast, trackEvent]);

  // Auto-save on delay
  useEffect(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(saveEvents, AUTO_SAVE_DELAY);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [events, saveEvents]);

  // Save on window blur
  useEffect(() => {
    const handleBlur = () => {
      saveEvents();
    };

    window.addEventListener('blur', handleBlur);
    return () => {
      window.removeEventListener('blur', handleBlur);
    };
  }, [saveEvents]);

  return {
    isSaving,
    lastSavedAt,
  };
}; 