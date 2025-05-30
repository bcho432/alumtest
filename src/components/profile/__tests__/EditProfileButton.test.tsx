import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { EditProfileButton } from '../EditProfileButton';
import { usePermissions } from '@/hooks/usePermissions';
import { useToast } from '@/hooks/useToast';
import { useRouter } from 'next/router';

// Mock dependencies
jest.mock('@/hooks/usePermissions');
jest.mock('@/hooks/useToast');
jest.mock('next/router');

describe('EditProfileButton', () => {
  const mockProfileId = 'test-profile';
  const mockOrgId = 'test-org';

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock usePermissions
    (usePermissions as jest.Mock).mockReturnValue({
      isAdmin: jest.fn(),
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
  });

  it('should show loading state while checking permissions', () => {
    (usePermissions as jest.Mock).mockReturnValue({
      isAdmin: jest.fn(),
      isLoading: true,
    });

    render(<EditProfileButton profileId={mockProfileId} orgId={mockOrgId} />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should navigate to edit page when user has permission', async () => {
    const mockIsAdmin = jest.fn().mockResolvedValue(true);
    (usePermissions as jest.Mock).mockReturnValue({
      isAdmin: mockIsAdmin,
      isLoading: false,
    });

    const mockPush = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });

    render(<EditProfileButton profileId={mockProfileId} orgId={mockOrgId} />);
    
    fireEvent.click(screen.getByText('Edit Profile'));

    await waitFor(() => {
      expect(mockIsAdmin).toHaveBeenCalledWith(mockOrgId);
      expect(mockPush).toHaveBeenCalledWith(`/profile/${mockProfileId}/edit?step=1`);
    });
  });

  it('should show error toast when user does not have permission', async () => {
    const mockIsAdmin = jest.fn().mockResolvedValue(false);
    (usePermissions as jest.Mock).mockReturnValue({
      isAdmin: mockIsAdmin,
      isLoading: false,
    });

    const mockShowToast = jest.fn();
    (useToast as jest.Mock).mockReturnValue({
      showToast: mockShowToast,
    });

    render(<EditProfileButton profileId={mockProfileId} orgId={mockOrgId} />);
    
    fireEvent.click(screen.getByText('Edit Profile'));

    await waitFor(() => {
      expect(mockIsAdmin).toHaveBeenCalledWith(mockOrgId);
      expect(mockShowToast).toHaveBeenCalledWith(
        'You do not have permission to edit this profile',
        'error'
      );
    });
  });

  it('should show error toast when permission check fails', async () => {
    const mockIsAdmin = jest.fn().mockRejectedValue(new Error('Permission check failed'));
    (usePermissions as jest.Mock).mockReturnValue({
      isAdmin: mockIsAdmin,
      isLoading: false,
    });

    const mockShowToast = jest.fn();
    (useToast as jest.Mock).mockReturnValue({
      showToast: mockShowToast,
    });

    render(<EditProfileButton profileId={mockProfileId} orgId={mockOrgId} />);
    
    fireEvent.click(screen.getByText('Edit Profile'));

    await waitFor(() => {
      expect(mockIsAdmin).toHaveBeenCalledWith(mockOrgId);
      expect(mockShowToast).toHaveBeenCalledWith(
        'Failed to check permissions',
        'error'
      );
    });
  });
}); 