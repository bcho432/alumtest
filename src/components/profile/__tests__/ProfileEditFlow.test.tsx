import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { renderHook, act } from '@testing-library/react-hooks';
import { EditProfileButton } from '../EditProfileButton';
import { useProfileEdit } from '@/hooks/useProfileEdit';
import { usePermissions } from '@/hooks/usePermissions';
import { useToast } from '@/hooks/useToast';
import { useRouter } from 'next/router';
import { doc, getDoc } from 'firebase/firestore';

// Mock dependencies
jest.mock('@/hooks/usePermissions');
jest.mock('@/hooks/useToast');
jest.mock('next/router');
jest.mock('firebase/firestore');

describe('Profile Edit Flow', () => {
  const mockProfileId = 'test-profile';
  const mockOrgId = 'test-org';
  const mockProfile = {
    id: mockProfileId,
    name: 'Test Profile',
    status: 'draft',
    orgId: mockOrgId,
    createdBy: 'test-user',
    editors: ['test-user'],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock usePermissions
    (usePermissions as jest.Mock).mockReturnValue({
      isAdmin: jest.fn().mockResolvedValue(true),
      isLoading: false,
    });

    // Mock useToast
    (useToast as jest.Mock).mockReturnValue({
      showToast: jest.fn(),
    });

    // Mock useRouter
    (useRouter as jest.Mock).mockReturnValue({
      push: jest.fn(),
    });

    // Mock Firestore
    (getDoc as jest.Mock).mockResolvedValue({
      exists: () => true,
      data: () => mockProfile,
    });
  });

  it('should complete the full edit flow', async () => {
    // 1. Render EditProfileButton
    render(<EditProfileButton profileId={mockProfileId} orgId={mockOrgId} />);

    // 2. Click edit button
    fireEvent.click(screen.getByText('Edit Profile'));

    // 3. Verify navigation to edit page
    await waitFor(() => {
      expect(useRouter().push).toHaveBeenCalledWith(
        `/profile/${mockProfileId}/edit?step=1`
      );
    });

    // 4. Verify profile data is loaded
    const { result } = renderHook(() => useProfileEdit(mockProfileId));
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
      expect(result.current.profile).toEqual(mockProfile);
    });

    // 5. Navigate to next step
    act(() => {
      result.current.navigateToStep(2);
    });

    // 6. Verify step navigation
    expect(useRouter().push).toHaveBeenCalledWith({
      pathname: `/profile/${mockProfileId}/edit`,
      query: { step: 2 },
    });
  });

  it('should handle permission errors', async () => {
    // Setup permission error
    (usePermissions as jest.Mock).mockReturnValue({
      isAdmin: jest.fn().mockResolvedValue(false),
      isLoading: false,
    });

    const mockShowToast = jest.fn();
    (useToast as jest.Mock).mockReturnValue({
      showToast: mockShowToast,
    });

    // Render and click
    render(<EditProfileButton profileId={mockProfileId} orgId={mockOrgId} />);
    fireEvent.click(screen.getByText('Edit Profile'));

    // Verify error handling
    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith(
        'You do not have permission to edit this profile',
        'error'
      );
    });
  });

  it('should handle profile load errors', async () => {
    // Setup Firestore error
    (getDoc as jest.Mock).mockRejectedValue(new Error('Firestore error'));

    const { result } = renderHook(() => useProfileEdit(mockProfileId));

    // Verify error handling
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.profile).toBe(null);
    });

    // Verify retry functionality
    act(() => {
      result.current.retry();
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(true);
    });
  });
}); 