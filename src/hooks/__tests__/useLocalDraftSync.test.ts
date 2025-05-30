import { renderHook, act } from '@testing-library/react-hooks';
import { useLocalDraftSync } from '../useLocalDraftSync';
import { useToast } from '../useToast';

// Mock dependencies
jest.mock('../useToast');

describe('useLocalDraftSync', () => {
  const mockProfileId = 'test-profile';
  const mockProfile = {
    id: mockProfileId,
    name: 'Test Profile',
    status: 'draft',
    orgId: 'test-org',
    createdBy: 'test-user',
    editors: ['test-user'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    (useToast as jest.Mock).mockReturnValue({
      showToast: jest.fn(),
    });
  });

  it('should save and load draft from localStorage', () => {
    const { result } = renderHook(() => useLocalDraftSync(mockProfileId));

    // Save draft
    act(() => {
      result.current.saveToLocalStorage(mockProfile);
    });

    // Verify draft was saved
    expect(result.current.hasLocalDraft).toBe(true);
    expect(result.current.localDraft).toEqual({
      ...mockProfile,
      lastSaved: expect.any(String),
    });

    // Clear state
    act(() => {
      result.current.clearLocalDraft();
    });

    // Verify draft was cleared
    expect(result.current.hasLocalDraft).toBe(false);
    expect(result.current.localDraft).toBe(null);
  });

  it('should handle localStorage errors gracefully', () => {
    // Mock localStorage error
    const mockError = new Error('Storage error');
    jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw mockError;
    });

    const { result } = renderHook(() => useLocalDraftSync(mockProfileId));
    const mockShowToast = jest.fn();
    (useToast as jest.Mock).mockReturnValue({
      showToast: mockShowToast,
    });

    // Attempt to save draft
    act(() => {
      result.current.saveToLocalStorage(mockProfile);
    });

    // Verify error was handled
    expect(mockShowToast).toHaveBeenCalledWith(
      'Failed to save draft locally',
      'error'
    );
  });

  it('should merge drafts correctly', () => {
    const { result } = renderHook(() => useLocalDraftSync(mockProfileId));

    const localDraft = {
      ...mockProfile,
      name: 'Updated Name',
      lastSaved: new Date(Date.now() + 1000).toISOString(), // Newer
    };

    const remoteDraft = {
      ...mockProfile,
      status: 'published',
      updatedAt: new Date().toISOString(), // Older
    };

    // Merge drafts
    const merged = result.current.mergeDrafts(localDraft, remoteDraft);

    // Verify merge logic
    expect(merged.name).toBe('Updated Name'); // Local change preserved
    expect(merged.status).toBe('published'); // Remote change preserved
    expect(merged.id).toBe(mockProfile.id); // Metadata preserved
  });

  it('should handle missing local draft', () => {
    const { result } = renderHook(() => useLocalDraftSync(mockProfileId));

    // Load non-existent draft
    const loaded = result.current.loadFromLocalStorage();

    // Verify null is returned
    expect(loaded).toBe(null);
    expect(result.current.hasLocalDraft).toBe(false);
  });
}); 