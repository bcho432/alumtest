import { renderHook, act } from '@testing-library/react';
import { useFormState } from '../useFormState';

describe('useFormState', () => {
  const initialData = { name: 'John', age: 30 };
  const mockOnSave = jest.fn();
  const mockShowToast = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('initializes with provided data', () => {
    const { result } = renderHook(() =>
      useFormState({
        initialData,
        onSave: mockOnSave,
      })
    );

    expect(result.current.formData).toEqual(initialData);
    expect(result.current.isDirty).toBe(false);
    expect(result.current.isSaving).toBe(false);
  });

  it('loads saved data from localStorage when storageKey is provided', () => {
    const savedData = { name: 'Jane', age: 25 };
    localStorage.setItem('test-form', JSON.stringify(savedData));

    const { result } = renderHook(() =>
      useFormState({
        initialData,
        storageKey: 'test-form',
        onSave: mockOnSave,
      })
    );

    expect(result.current.formData).toEqual(savedData);
  });

  it('marks form as dirty when data changes', () => {
    const { result } = renderHook(() =>
      useFormState({
        initialData,
        onSave: mockOnSave,
      })
    );

    act(() => {
      result.current.handleChange('name', 'Jane');
    });

    expect(result.current.isDirty).toBe(true);
    expect(result.current.formData).toEqual({ ...initialData, name: 'Jane' });
  });

  it('auto-saves changes after delay', async () => {
    const { result } = renderHook(() =>
      useFormState({
        initialData,
        storageKey: 'test-form',
        autoSaveDelay: 1000,
        onSave: mockOnSave,
      })
    );

    act(() => {
      result.current.handleChange('name', 'Jane');
    });

    expect(result.current.isDirty).toBe(true);

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    await act(async () => {
      await Promise.resolve(); // Wait for auto-save to complete
    });

    expect(mockOnSave).toHaveBeenCalledWith({ ...initialData, name: 'Jane' });
    expect(result.current.isDirty).toBe(false);
    expect(JSON.parse(localStorage.getItem('test-form')!)).toEqual({
      ...initialData,
      name: 'Jane',
    });
  });

  it('handles save errors during auto-save', async () => {
    const error = new Error('Save failed');
    mockOnSave.mockRejectedValueOnce(error);

    const { result } = renderHook(() =>
      useFormState({
        initialData,
        storageKey: 'test-form',
        autoSaveDelay: 1000,
        onSave: mockOnSave,
      })
    );

    act(() => {
      result.current.handleChange('name', 'Jane');
    });

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    await act(async () => {
      await Promise.resolve(); // Wait for auto-save to complete
    });

    expect(mockOnSave).toHaveBeenCalled();
    expect(result.current.isDirty).toBe(true); // Should remain dirty on error
  });

  it('saves changes manually when handleSubmit is called', async () => {
    const { result } = renderHook(() =>
      useFormState({
        initialData,
        storageKey: 'test-form',
        onSave: mockOnSave,
      })
    );

    act(() => {
      result.current.handleChange('name', 'Jane');
    });

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(mockOnSave).toHaveBeenCalledWith({ ...initialData, name: 'Jane' });
    expect(result.current.isDirty).toBe(false);
    expect(JSON.parse(localStorage.getItem('test-form')!)).toEqual({
      ...initialData,
      name: 'Jane',
    });
  });

  it('resets form to initial state', () => {
    const { result } = renderHook(() =>
      useFormState({
        initialData,
        storageKey: 'test-form',
        onSave: mockOnSave,
      })
    );

    act(() => {
      result.current.handleChange('name', 'Jane');
    });

    expect(result.current.isDirty).toBe(true);

    act(() => {
      result.current.reset();
    });

    expect(result.current.formData).toEqual(initialData);
    expect(result.current.isDirty).toBe(false);
    expect(localStorage.getItem('test-form')).toBeNull();
  });

  it('does not auto-save when no storageKey is provided', () => {
    const { result } = renderHook(() =>
      useFormState({
        initialData,
        autoSaveDelay: 1000,
        onSave: mockOnSave,
      })
    );

    act(() => {
      result.current.handleChange('name', 'Jane');
    });

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(mockOnSave).not.toHaveBeenCalled();
    expect(result.current.isDirty).toBe(true);
  });
}); 