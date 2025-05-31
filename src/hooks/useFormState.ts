import { useState, useLayoutEffect, useCallback } from 'react';
import { useToast } from './useToast';

interface UseFormStateOptions<T> {
  initialData: T;
  storageKey?: string;
  autoSaveDelay?: number;
  onSave?: (data: T) => Promise<void>;
}

export function useFormState<T extends Record<string, any>>({
  initialData,
  storageKey,
  autoSaveDelay = 1000,
  onSave,
}: UseFormStateOptions<T>) {
  const [formData, setFormData] = useState<T>(() => {
    if (storageKey && typeof window !== 'undefined') {
      const saved = localStorage.getItem(storageKey);
      return saved ? JSON.parse(saved) : initialData;
    }
    return initialData;
  });
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { showToast } = useToast();

  // Auto-save effect
  useLayoutEffect(() => {
    if (!isDirty || !storageKey) return;

    const timeoutId = setTimeout(async () => {
      try {
        setIsSaving(true);
        if (onSave) {
          await onSave(formData);
        }
        localStorage.setItem(storageKey, JSON.stringify(formData));
        setIsDirty(false);
      } catch (error) {
        console.error('Auto-save failed:', error);
        showToast({
          title: 'Error',
          description: 'Failed to auto-save changes',
          status: 'error',
        });
      } finally {
        setIsSaving(false);
      }
    }, autoSaveDelay);

    return () => clearTimeout(timeoutId);
  }, [formData, isDirty, storageKey, autoSaveDelay, onSave, showToast]);

  const handleChange = useCallback((field: keyof T, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setIsDirty(true);
  }, []);

  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!isDirty) return;

    try {
      setIsSaving(true);
      if (onSave) {
        await onSave(formData);
      }
      if (storageKey) {
        localStorage.setItem(storageKey, JSON.stringify(formData));
      }
      setIsDirty(false);
      showToast({
        title: 'Success',
        description: 'Changes saved successfully',
        status: 'success',
      });
    } catch (error) {
      console.error('Save failed:', error);
      showToast({
        title: 'Error',
        description: 'Failed to save changes',
        status: 'error',
      });
      throw error;
    } finally {
      setIsSaving(false);
    }
  }, [formData, isDirty, storageKey, onSave, showToast]);

  const reset = useCallback(() => {
    setFormData(initialData);
    setIsDirty(false);
    if (storageKey) {
      localStorage.removeItem(storageKey);
    }
  }, [initialData, storageKey]);

  return {
    formData,
    isDirty,
    isSaving,
    handleChange,
    handleSubmit,
    reset,
    setFormData,
  };
} 