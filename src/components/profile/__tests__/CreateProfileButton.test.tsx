import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CreateProfileButton } from '../CreateProfileButton';
import { useCreateProfile } from '@/hooks/useCreateProfile';
import { usePermissions } from '@/hooks/usePermissions';
import { useRouter } from 'next/router';

// Mock dependencies
jest.mock('@/hooks/useCreateProfile');
jest.mock('@/hooks/usePermissions');
jest.mock('next/router');

describe('CreateProfileButton', () => {
  const mockOrgId = 'test-org';
  const mockProfileId = 'test-profile';

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock useCreateProfile
    (useCreateProfile as jest.Mock).mockReturnValue({
      createProfile: jest.fn(),
      isLoading: false,
    });

    // Mock usePermissions
    (usePermissions as jest.Mock).mockReturnValue({
      isAdmin: true,
      isLoading: false,
    });

    // Mock useRouter
    (useRouter as jest.Mock).mockReturnValue({
      push: jest.fn(),
    });
  });

  it('should show loading state while checking admin status', () => {
    // Setup
    (usePermissions as jest.Mock).mockReturnValue({
      isAdmin: false,
      isLoading: true,
    });

    // Execute
    render(<CreateProfileButton orgId={mockOrgId} />);

    // Verify
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('should not render button when user is not admin', () => {
    // Setup
    (usePermissions as jest.Mock).mockReturnValue({
      isAdmin: false,
      isLoading: false,
    });

    // Execute
    render(<CreateProfileButton orgId={mockOrgId} />);

    // Verify
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('should render button when user is admin', () => {
    // Execute
    render(<CreateProfileButton orgId={mockOrgId} />);

    // Verify
    expect(screen.getByRole('button')).toBeInTheDocument();
    expect(screen.getByText('Create New Profile')).toBeInTheDocument();
  });

  it('should create profile and navigate to edit page when clicked', async () => {
    // Setup
    const mockCreateProfile = jest.fn().mockResolvedValue(mockProfileId);
    (useCreateProfile as jest.Mock).mockReturnValue({
      createProfile: mockCreateProfile,
      isLoading: false,
    });

    const mockPush = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });

    // Execute
    render(<CreateProfileButton orgId={mockOrgId} />);
    fireEvent.click(screen.getByRole('button'));

    // Verify
    await waitFor(() => {
      expect(mockCreateProfile).toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith(
        `/organizations/${mockOrgId}/profiles/${mockProfileId}/edit`
      );
    });
  });

  it('should show creating state while profile is being created', () => {
    // Setup
    (useCreateProfile as jest.Mock).mockReturnValue({
      createProfile: jest.fn(),
      isLoading: true,
    });

    // Execute
    render(<CreateProfileButton orgId={mockOrgId} />);

    // Verify
    expect(screen.getByText('Creating Profile...')).toBeInTheDocument();
  });

  it('should handle errors during profile creation', async () => {
    // Setup
    const mockError = new Error('Failed to create profile');
    const mockCreateProfile = jest.fn().mockRejectedValue(mockError);
    (useCreateProfile as jest.Mock).mockReturnValue({
      createProfile: mockCreateProfile,
      isLoading: false,
    });

    // Execute
    render(<CreateProfileButton orgId={mockOrgId} />);
    fireEvent.click(screen.getByRole('button'));

    // Verify
    await waitFor(() => {
      expect(mockCreateProfile).toHaveBeenCalled();
      expect(screen.getByText('Create New Profile')).toBeInTheDocument();
    });
  });
}); 