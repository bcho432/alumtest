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
        createdAt: (data as any).createdAt instanceof Date ? (data as any).createdAt.toISOString() : (data as any).createdAt instanceof Object && typeof (data as any).createdAt.toDate === 'function' ? (data as any).createdAt.toDate().toISOString() : (data as any).createdAt,
        updatedAt: (data as any).updatedAt instanceof Date ? (data as any).updatedAt.toISOString() : (data as any).updatedAt instanceof Object && typeof (data as any).updatedAt.toDate === 'function' ? (data as any).updatedAt.toDate().toISOString() : (data as any).updatedAt,
        metadata: {
          ...data.metadata,
          lastModifiedAt: (data as any).metadata?.lastModifiedAt instanceof Date ? (data as any).metadata.lastModifiedAt.toISOString() : (data as any).metadata?.lastModifiedAt instanceof Object && typeof (data as any).metadata.lastModifiedAt.toDate === 'function' ? (data as any).metadata.lastModifiedAt.toDate().toISOString() : (data as any).metadata?.lastModifiedAt,
        },
        education: Array.isArray((data as any).education)
          ? (data as any).education.map((ed: any) => ({
              ...ed,
              years: ed.years || '',
            }))
          : [],
        experience: Array.isArray((data as any).experience)
          ? (data as any).experience.map((ex: any) => ({
              ...ex,
              title: ex.title || '',
            }))
          : [],
        achievements: Array.isArray((data as any).achievements)
          ? (data as any).achievements.map((ach: any) => ({
              ...ach,
              date: ach.date instanceof Date ? ach.date.toISOString() : ach.date instanceof Object && typeof ach.date.toDate === 'function' ? ach.date.toDate().toISOString() : ach.date,
            }))
          : [],
        basicInfo: (data as any).basicInfo
          ? {
              ...((data as any).basicInfo),
              dateOfBirth: ((data as any).basicInfo.dateOfBirth instanceof Date)
                ? (data as any).basicInfo.dateOfBirth.toISOString()
                : ((data as any).basicInfo.dateOfBirth instanceof Object && typeof (data as any).basicInfo.dateOfBirth.toDate === 'function')
                  ? (data as any).basicInfo.dateOfBirth.toDate().toISOString()
                  : (data as any).basicInfo.dateOfBirth,
              dateOfDeath: ((data as any).basicInfo.dateOfDeath instanceof Date)
                ? (data as any).basicInfo.dateOfDeath.toISOString()
                : ((data as any).basicInfo.dateOfDeath instanceof Object && typeof (data as any).basicInfo.dateOfDeath.toDate === 'function')
                  ? (data as any).basicInfo.dateOfDeath.toDate().toISOString()
                  : (data as any).basicInfo.dateOfDeath,
            }
          : undefined,
        lifeStory: (data as any).lifeStory
          ? {
              ...((data as any).lifeStory),
              updatedAt: ((data as any).lifeStory.updatedAt instanceof Date)
                ? (data as any).lifeStory.updatedAt.toISOString()
                : ((data as any).lifeStory.updatedAt instanceof Object && typeof (data as any).lifeStory.updatedAt.toDate === 'function')
                  ? (data as any).lifeStory.updatedAt.toDate().toISOString()
                  : (data as any).lifeStory.updatedAt,
            }
          : undefined,
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
    const localTimestamp = (() => {
      const val = 'lastSaved' in local && local.lastSaved ? local.lastSaved : local.updatedAt;
      if (val instanceof Date) return val.getTime();
      if (val && typeof val === 'object' && typeof val.toDate === 'function') return val.toDate().getTime();
      if (typeof val === 'string' || typeof val === 'number') return new Date(val).getTime();
      return 0;
    })();
    const remoteTimestamp = (() => {
      const val = remote.updatedAt;
      if (val instanceof Date) return val.getTime();
      if (val && typeof val === 'object' && typeof val.toDate === 'function') return val.toDate().getTime();
      if (typeof val === 'string' || typeof val === 'number') return new Date(val).getTime();
      return 0;
    })();

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