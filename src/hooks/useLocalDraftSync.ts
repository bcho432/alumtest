import { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from './useToast';
import { Profile, LocalDraft, Achievement } from '../types/profile';
import { Timestamp } from 'firebase/firestore';

const STORAGE_KEY_PREFIX = 'draft_profile_';
const AUTO_SAVE_INTERVAL = 10000; // 10 seconds

interface TimestampLike {
  toDate(): Date;
}

const isTimestamp = (val: unknown): val is TimestampLike => {
  return Boolean(val && typeof val === 'object' && 'toDate' in val && typeof (val as TimestampLike).toDate === 'function');
};

const convertToDate = (val: unknown): Date | null => {
  if (val instanceof Date) return val;
  if (isTimestamp(val)) return val.toDate();
  if (typeof val === 'string') return new Date(val);
  return null;
};

const convertToTimestamp = (val: unknown): Timestamp => {
  const date = convertToDate(val);
  return date ? Timestamp.fromDate(date) : Timestamp.now();
};

const getTimestamp = (val: unknown): number => {
  if (val instanceof Date) return val.getTime();
  if (isTimestamp(val)) return val.toDate().getTime();
  if (typeof val === 'string') return new Date(val).getTime();
  if (typeof val === 'number') return val;
  return 0;
};

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
        updatedBy: (data as any).updatedBy || '',
        isPublic: (data as any).isPublic ?? false,
        createdAt: convertToTimestamp((data as any).createdAt).toDate().toISOString(),
        updatedAt: convertToTimestamp((data as any).updatedAt).toDate().toISOString(),
        metadata: {
          tags: (data as any).metadata?.tags || [],
          categories: (data as any).metadata?.categories || [],
          lastModifiedBy: (data as any).metadata?.lastModifiedBy || '',
          lastModifiedAt: convertToTimestamp((data as any).metadata?.lastModifiedAt),
          version: (data as any).metadata?.version || 1,
        },
        basicInfo: (data as any).basicInfo ? {
          dateOfBirth: convertToDate((data as any).basicInfo.dateOfBirth),
          dateOfDeath: convertToDate((data as any).basicInfo.dateOfDeath),
          biography: (data as any).basicInfo.biography || '',
          photo: (data as any).basicInfo.photo || '',
          birthLocation: (data as any).basicInfo.birthLocation || '',
          deathLocation: (data as any).basicInfo.deathLocation || '',
        } : undefined,
        lifeStory: (data as any).lifeStory ? {
          content: (data as any).lifeStory.content || '',
          updatedAt: convertToDate((data as any).lifeStory.updatedAt) || new Date(),
        } : undefined,
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
              title: ach.title || '',
              description: ach.description || '',
              date: typeof ach.date === 'string' ? ach.date : new Date(ach.date).toISOString(),
            }))
          : [],
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
        // Convert string dates back to Date objects
        if (parsedData.basicInfo) {
          parsedData.basicInfo.dateOfBirth = parsedData.basicInfo.dateOfBirth ? new Date(parsedData.basicInfo.dateOfBirth) : null;
          parsedData.basicInfo.dateOfDeath = parsedData.basicInfo.dateOfDeath ? new Date(parsedData.basicInfo.dateOfDeath) : null;
        }
        if (parsedData.lifeStory) {
          parsedData.lifeStory.updatedAt = new Date(parsedData.lifeStory.updatedAt);
        }
        if (parsedData.achievements) {
          parsedData.achievements = parsedData.achievements.map(ach => ({
            ...ach,
            date: ach.date // Keep as string since Achievement interface expects string
          }));
        }
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
    const localTimestamp = getTimestamp('lastSaved' in local && local.lastSaved ? local.lastSaved : local.updatedAt);
    const remoteTimestamp = getTimestamp(remote.updatedAt);

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