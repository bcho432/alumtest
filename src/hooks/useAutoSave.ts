import { useState, useCallback, useRef } from 'react';
import { debounce } from '@/lib/utils';

interface UseAutoSaveProps<T> {
  saveFn: (data: T) => Promise<void>;
  initialData: T;
  debounceMs?: number;
  maxRetries?: number;
}

interface AutoSaveState {
  isSaving: boolean;
  hasError: boolean;
  retryCount: number;
}

export function useAutoSave<T>({
  saveFn,
  initialData,
  debounceMs = 5000,
  maxRetries = 3,
}: UseAutoSaveProps<T>) {
  const [data, setData] = useState<T>(initialData);
  const [state, setState] = useState<AutoSaveState>({
    isSaving: false,
    hasError: false,
    retryCount: 0,
  });

  const saveAttemptRef = useRef<number>(0);

  const save = useCallback(async (newData: T) => {
    const attempt = ++saveAttemptRef.current;
    setState(prev => ({ ...prev, isSaving: true, hasError: false }));

    try {
      await saveFn(newData);
      if (attempt === saveAttemptRef.current) {
        setState(prev => ({
          ...prev,
          isSaving: false,
          hasError: false,
          retryCount: 0,
        }));
      }
    } catch (error) {
      if (attempt === saveAttemptRef.current) {
        setState(prev => ({
          ...prev,
          isSaving: false,
          hasError: true,
          retryCount: prev.retryCount + 1,
        }));
      }
      throw error;
    }
  }, [saveFn]);

  const debouncedSave = useCallback(
    debounce((newData: T) => {
      save(newData).catch(() => {
        // Error is handled in the save function
      });
    }, debounceMs),
    [save, debounceMs]
  );

  const updateData = useCallback((newData: T) => {
    setData(newData);
    debouncedSave(newData);
  }, [debouncedSave]);

  const retry = useCallback(() => {
    if (state.retryCount < maxRetries) {
      save(data);
    }
  }, [save, data, state.retryCount, maxRetries]);

  return {
    data,
    updateData,
    retry,
    isSaving: state.isSaving,
    hasError: state.hasError,
    retryCount: state.retryCount,
  };
} 