import { renderHook } from '@testing-library/react';
import { useUnsavedChanges } from '../useUnsavedChanges';
import { useRouter } from 'next/router';

// Mock next/router
jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}));

// Mock window.confirm
const mockConfirm = jest.fn();
window.confirm = mockConfirm;

describe('useUnsavedChanges', () => {
  const mockRouter = {
    events: {
      on: jest.fn(),
      off: jest.fn(),
      emit: jest.fn(),
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
  });

  it('should not show warning when there are no unsaved changes', () => {
    const { result } = renderHook(() =>
      useUnsavedChanges({ isDirty: false })
    );

    expect(result.current.isDirty).toBe(false);
    expect(mockRouter.events.on).toHaveBeenCalledWith(
      'routeChangeStart',
      expect.any(Function)
    );
  });

  it('should show warning when navigating with unsaved changes', () => {
    mockConfirm.mockReturnValueOnce(false);

    const { result } = renderHook(() =>
      useUnsavedChanges({ isDirty: true })
    );

    const routeChangeHandler = mockRouter.events.on.mock.calls[0][1];
    expect(() => routeChangeHandler('/new-route')).toThrow(
      'Route change aborted due to unsaved changes'
    );
    expect(mockConfirm).toHaveBeenCalledWith(
      'You have unsaved changes. Are you sure you want to leave?'
    );
  });

  it('should allow navigation when user confirms', () => {
    mockConfirm.mockReturnValueOnce(true);
    const onDiscard = jest.fn();

    const { result } = renderHook(() =>
      useUnsavedChanges({ isDirty: true, onDiscard })
    );

    const routeChangeHandler = mockRouter.events.on.mock.calls[0][1];
    routeChangeHandler('/new-route');

    expect(mockConfirm).toHaveBeenCalled();
    expect(onDiscard).toHaveBeenCalled();
  });

  it('should clean up event listeners on unmount', () => {
    const { unmount } = renderHook(() =>
      useUnsavedChanges({ isDirty: true })
    );

    unmount();

    expect(mockRouter.events.off).toHaveBeenCalledWith(
      'routeChangeStart',
      expect.any(Function)
    );
  });
}); 