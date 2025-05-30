import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ProfileStatus } from '../ProfileStatus';
import { useProfileStatus } from '@/hooks/useProfileStatus';
import { usePermissions } from '@/hooks/usePermissions';

// Mock the hooks
jest.mock('@/hooks/useProfileStatus');
jest.mock('@/hooks/usePermissions');

describe('ProfileStatus', () => {
  const mockProps = {
    orgId: 'org-1',
    profileId: 'profile-1',
    initialStatus: 'draft' as const,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows loading state while checking permissions', () => {
    (usePermissions as jest.Mock).mockReturnValue({
      canPublish: jest.fn().mockResolvedValue(true),
    });

    (useProfileStatus as jest.Mock).mockReturnValue({
      status: 'draft',
      isUpdating: false,
      updateStatus: jest.fn(),
    });

    render(<ProfileStatus {...mockProps} />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('shows error state when permission check fails', async () => {
    (usePermissions as jest.Mock).mockReturnValue({
      canPublish: jest.fn().mockRejectedValue(new Error('Permission check failed')),
    });

    (useProfileStatus as jest.Mock).mockReturnValue({
      status: 'draft',
      isUpdating: false,
      updateStatus: jest.fn(),
    });

    render(<ProfileStatus {...mockProps} />);
    
    await waitFor(() => {
      expect(screen.getByText('Failed to check permissions')).toBeInTheDocument();
    });
  });

  it('shows read-only view for users without publish permission', async () => {
    (usePermissions as jest.Mock).mockReturnValue({
      canPublish: jest.fn().mockResolvedValue(false),
    });

    (useProfileStatus as jest.Mock).mockReturnValue({
      status: 'draft',
      isUpdating: false,
      updateStatus: jest.fn(),
    });

    render(<ProfileStatus {...mockProps} />);

    await waitFor(() => {
      expect(screen.getByText('Status:')).toBeInTheDocument();
      expect(screen.getByText('Draft')).toBeInTheDocument();
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });
  });

  it('allows status change for users with publish permission', async () => {
    const mockUpdateStatus = jest.fn();
    (usePermissions as jest.Mock).mockReturnValue({
      canPublish: jest.fn().mockResolvedValue(true),
    });

    (useProfileStatus as jest.Mock).mockReturnValue({
      status: 'draft',
      isUpdating: false,
      updateStatus: mockUpdateStatus,
    });

    render(<ProfileStatus {...mockProps} />);

    await waitFor(() => {
      expect(screen.getByText('Publish')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Publish'));
    expect(mockUpdateStatus).toHaveBeenCalledWith('published');
  });

  it('shows error state when status update fails', async () => {
    const mockUpdateStatus = jest.fn().mockRejectedValue(new Error('Update failed'));
    (usePermissions as jest.Mock).mockReturnValue({
      canPublish: jest.fn().mockResolvedValue(true),
    });

    (useProfileStatus as jest.Mock).mockReturnValue({
      status: 'draft',
      isUpdating: false,
      updateStatus: mockUpdateStatus,
    });

    render(<ProfileStatus {...mockProps} />);

    await waitFor(() => {
      expect(screen.getByText('Publish')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Publish'));

    await waitFor(() => {
      expect(screen.getByText('Update failed')).toBeInTheDocument();
    });

    // Test error dismissal
    fireEvent.click(screen.getByText('Dismiss'));
    expect(screen.queryByText('Update failed')).not.toBeInTheDocument();
  });

  it('shows loading state during status update', async () => {
    (usePermissions as jest.Mock).mockReturnValue({
      canPublish: jest.fn().mockResolvedValue(true),
    });

    (useProfileStatus as jest.Mock).mockReturnValue({
      status: 'draft',
      isUpdating: true,
      updateStatus: jest.fn(),
    });

    render(<ProfileStatus {...mockProps} />);

    await waitFor(() => {
      expect(screen.getByRole('status')).toBeInTheDocument();
    });
  });
}); 