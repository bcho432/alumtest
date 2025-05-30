import { renderHook, act } from '@testing-library/react';
import { useAutoSave } from '../useAutoSave';

describe('useAutoSave', () => {
  const mockSaveFn = jest.fn();
  const initialData = { text: 'initial' };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should initialize with provided data', () => {
    const { result } = renderHook(() =>
      useAutoSave({
        saveFn: mockSaveFn,
        initialData,
      })
    );

    expect(result.current.data).toEqual(initialData);
    expect(result.current.isSaving).toBe(false);
    expect(result.current.hasError).toBe(false);
    expect(result.current.retryCount).toBe(0);
  });

  it('should debounce save operations', async () => {
    const { result } = renderHook(() =>
      useAutoSave({
        saveFn: mockSaveFn,
        initialData,
        debounceMs: 1000,
      })
    );

    // Update data multiple times
    act(() => {
      result.current.updateData({ text: 'update 1' });
      result.current.updateData({ text: 'update 2' });
      result.current.updateData({ text: 'update 3' });
    });

    // Should not have called saveFn yet
    expect(mockSaveFn).not.toHaveBeenCalled();

    // Fast forward time
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    // Should have called saveFn once with the latest data
    expect(mockSaveFn).toHaveBeenCalledTimes(1);
    expect(mockSaveFn).toHaveBeenCalledWith({ text: 'update 3' });
  });

  it('should handle save errors and retry', async () => {
    const error = new Error('Save failed');
    mockSaveFn
      .mockRejectedValueOnce(error)
      .mockRejectedValueOnce(error)
      .mockResolvedValueOnce(undefined);

    const { result } = renderHook(() =>
      useAutoSave({
        saveFn: mockSaveFn,
        initialData,
        maxRetries: 3,
      })
    );

    // Trigger a save
    await act(async () => {
      result.current.updateData({ text: 'new value' });
      jest.advanceTimersByTime(5000);
    });

    // Should show error state
    expect(result.current.hasError).toBe(true);
    expect(result.current.retryCount).toBe(1);

    // Retry the save
    await act(async () => {
      result.current.retry();
    });

    // Should show error state again
    expect(result.current.hasError).toBe(true);
    expect(result.current.retryCount).toBe(2);

    // Retry one more time
    await act(async () => {
      result.current.retry();
    });

    // Should succeed
    expect(result.current.hasError).toBe(false);
    expect(result.current.retryCount).toBe(0);
    expect(mockSaveFn).toHaveBeenCalledTimes(3);
  });

  it('should not retry after max retries', async () => {
    const error = new Error('Save failed');
    mockSaveFn.mockRejectedValue(error);

    const { result } = renderHook(() =>
      useAutoSave({
        saveFn: mockSaveFn,
        initialData,
        maxRetries: 2,
      })
    );

    // Trigger a save
    await act(async () => {
      result.current.updateData({ text: 'new value' });
      jest.advanceTimersByTime(5000);
    });

    // First retry
    await act(async () => {
      result.current.retry();
    });

    // Second retry
    await act(async () => {
      result.current.retry();
    });

    // Try to retry again
    await act(async () => {
      result.current.retry();
    });

    // Should not have called saveFn again
    expect(mockSaveFn).toHaveBeenCalledTimes(3);
    expect(result.current.retryCount).toBe(2);
  });
}); 