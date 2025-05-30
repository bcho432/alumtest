import { useState } from 'react';

export function useFormState<T extends Record<string, any>>({
  initialData,
  storageKey,
  autoSaveDelay,
  onSave,
}: {
  initialData: T;
  storageKey?: string;
  autoSaveDelay?: number;
  onSave?: (data: T) => Promise<void>;
}) {
  const [formData, setFormData] = useState<T>(initialData);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleChange = (field: keyof T, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setIsDirty(true);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
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
    } catch (error) {
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  const reset = () => {
    setFormData(initialData);
    setIsDirty(false);
    if (storageKey) {
      localStorage.removeItem(storageKey);
    }
  };

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