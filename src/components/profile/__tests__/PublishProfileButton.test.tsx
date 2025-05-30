import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PublishProfileButton } from '../PublishProfileButton';
import { useProfileStatus } from '@/hooks/useProfileStatus';
import { usePermissions } from '@/hooks/usePermissions';
import { useToast } from '@/hooks/useToast';
import { useProfileCompleteness } from '@/hooks/useProfileCompleteness';

// Mock the hooks
jest.mock('@/hooks/useProfileStatus');
jest.mock('@/hooks/usePermissions');
jest.mock('@/hooks/useToast');
jest.mock('@/hooks/useProfileCompleteness');
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}));

describe('PublishProfileButton', () => {
  const mockPublishProfile = jest.fn();
  const mockShowToast = jest.fn();
  const mockOnPublish = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useProfileStatus as jest.Mock).mockReturnValue({
      publishProfile: mockPublishProfile,
      isPublishing: false,
    });
    (usePermissions as jest.Mock).mockReturnValue({
      isAdmin: true,
    });
    (useToast as jest.Mock).mockReturnValue({
      showToast: mockShowToast,
    });
    (useProfileCompleteness as jest.Mock).mockReturnValue({
      completeness: {
        required: 9,
        completed: 7,
      },
    });
  });

  it('renders nothing for non-admin users', () => {
    (usePermissions as jest.Mock).mockReturnValue({
      isAdmin: false,
    });

    const { container } = render(
      <PublishProfileButton profileId="test-profile" onPublish={mockOnPublish} />
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('shows confirmation dialog when clicked', () => {
    render(
      <PublishProfileButton profileId="test-profile" onPublish={mockOnPublish} />
    );

    fireEvent.click(screen.getByText('Approve and Publish'));

    expect(screen.getByText('Publish Profile')).toBeInTheDocument();
    expect(screen.getByText('Profile Completeness')).toBeInTheDocument();
    expect(screen.getByText('78%')).toBeInTheDocument();
  });

  it('handles successful profile publishing', async () => {
    mockPublishProfile.mockResolvedValueOnce(undefined);

    render(
      <PublishProfileButton profileId="test-profile" onPublish={mockOnPublish} />
    );

    fireEvent.click(screen.getByText('Approve and Publish'));
    fireEvent.click(screen.getByText('Confirm Publish'));

    await waitFor(() => {
      expect(mockPublishProfile).toHaveBeenCalled();
      expect(mockShowToast).toHaveBeenCalledWith(
        'Profile published successfully',
        'success'
      );
      expect(mockOnPublish).toHaveBeenCalled();
    });
  });

  it('handles failed profile publishing', async () => {
    const error = new Error('Publishing failed');
    mockPublishProfile.mockRejectedValueOnce(error);

    render(
      <PublishProfileButton profileId="test-profile" onPublish={mockOnPublish} />
    );

    fireEvent.click(screen.getByText('Approve and Publish'));
    fireEvent.click(screen.getByText('Confirm Publish'));

    await waitFor(() => {
      expect(mockPublishProfile).toHaveBeenCalled();
      expect(mockShowToast).toHaveBeenCalledWith(
        'Failed to publish profile',
        'error'
      );
      expect(mockOnPublish).not.toHaveBeenCalled();
    });
  });

  it('shows warning for incomplete profiles', () => {
    (useProfileCompleteness as jest.Mock).mockReturnValue({
      completeness: {
        required: 9,
        completed: 4,
      },
    });

    render(
      <PublishProfileButton profileId="test-profile" onPublish={mockOnPublish} />
    );

    fireEvent.click(screen.getByText('Approve and Publish'));

    expect(screen.getByText('This profile is not complete.')).toBeInTheDocument();
    expect(screen.getByText('44%')).toBeInTheDocument();
  });

  it('disables buttons during publishing', () => {
    (useProfileStatus as jest.Mock).mockReturnValue({
      publishProfile: mockPublishProfile,
      isPublishing: true,
    });

    render(
      <PublishProfileButton profileId="test-profile" onPublish={mockOnPublish} />
    );

    const button = screen.getByText('Publishing...');
    expect(button).toBeDisabled();
  });
}); 