import { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from './useToast';
import { Profile, LocalDraft } from '../types/profile';

const STORAGE_KEY_PREFIX = 'draft_profile_';
const AUTO_SAVE_INTERVAL = 10000; // 10 seconds

export const useLocalDraftSync = (profileId: string) => {
  const [hasLocalDraft, setHasLocalDraft] = useState(false);
  const [localDraft, setLocalDraft] = useState<LocalDraft | null>(null);
  const { showToast } = useToast();
  const autoSaveInterval = useRef<NodeJS.Timeout>();

  const getStorageKey = useCallback(() => {
    return `${STORAGE_KEY_PREFIX}${profileId}`;
  }, [profileId]);

  const saveToLocalStorage = useCallback((data: LocalDraft | Profile) => {
    try {
      const storageKey = getStorageKey();
      const dataToStore: LocalDraft = {
        ...data,
        lastSaved: new Date().toISOString(),
      };
      localStorage.setItem(storageKey, JSON.stringify(dataToStore));
      setLocalDraft(dataToStore);
      setHasLocalDraft(true);
    } catch (error) {
      console.error('Failed to save draft to localStorage:', error);
      showToast({
        title: 'Error',
        description: 'Failed to save draft locally',
        status: 'error',
      });
    }
  }, [getStorageKey, showToast]);

  const loadFromLocalStorage = useCallback(() => {
    try {
      const storageKey = getStorageKey();
      const storedData = localStorage.getItem(storageKey);
      if (storedData) {
        const parsedData = JSON.parse(storedData) as LocalDraft;
        setLocalDraft(parsedData);
        setHasLocalDraft(true);
        return parsedData;
      }
    } catch (error) {
      console.error('Failed to load draft from localStorage:', error);
      showToast({
        title: 'Error',
        description: 'Failed to load local draft',
        status: 'error',
      });
    }
    return null;
  }, [getStorageKey, showToast]);

  const clearLocalDraft = useCallback(() => {
    try {
      const storageKey = getStorageKey();
      localStorage.removeItem(storageKey);
      setLocalDraft(null);
      setHasLocalDraft(false);
    } catch (error) {
      console.error('Failed to clear local draft:', error);
      showToast({
        title: 'Error',
        description: 'Failed to clear local draft',
        status: 'error',
      });
    }
  }, [getStorageKey, showToast]);

  const mergeDrafts = useCallback((local: LocalDraft | Profile, remote: Profile): Profile => {
    const localTimestamp = new Date('lastSaved' in local && local.lastSaved ? local.lastSaved : local.updatedAt).getTime();
    const remoteTimestamp = new Date(remote.updatedAt).getTime();

    // If local is newer, merge remote into local
    if (localTimestamp > remoteTimestamp) {
      // Ensure the type matches
      if (remote.type === 'memorial') {
        return {
          ...(remote as any),
          ...(local as any),
          id: remote.id,
          createdBy: remote.createdBy,
          createdAt: remote.createdAt,
          type: 'memorial',
        };
      } else {
        return {
          ...(remote as any),
          ...(local as any),
          id: remote.id,
          createdBy: remote.createdBy,
          createdAt: remote.createdAt,
          type: 'personal',
        };
      }
    }

    // If remote is newer, merge local into remote
    return {
      ...remote,
      ...Object.entries(local).reduce((acc, [key, value]) => {
        if (key !== 'lastSaved' && value !== remote[key as keyof Profile]) {
          acc[key as keyof Profile] = value;
        }
        return acc;
      }, {} as Partial<Profile>),
    } as Profile;
  }, []);

  // Start auto-save interval when localDraft changes
  useEffect(() => {
    if (localDraft) {
      autoSaveInterval.current = setInterval(() => {
        saveToLocalStorage(localDraft);
      }, AUTO_SAVE_INTERVAL);
    }

    return () => {
      if (autoSaveInterval.current) {
        clearInterval(autoSaveInterval.current);
      }
    };
  }, [localDraft, saveToLocalStorage]);

  // Check for local draft on mount
  useEffect(() => {
    loadFromLocalStorage();
  }, [loadFromLocalStorage]);

  return {
    hasLocalDraft,
    localDraft,
    saveToLocalStorage,
    loadFromLocalStorage,
    clearLocalDraft,
    mergeDrafts,
  };
}; 