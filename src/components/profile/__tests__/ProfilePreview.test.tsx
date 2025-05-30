import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ProfilePreview } from '../ProfilePreview';
import { useProfile } from '@/hooks/useProfile';
import { usePermissions } from '@/hooks/usePermissions';
import { useAnalytics } from '@/hooks/useAnalytics';

// Mock the hooks
jest.mock('@/hooks/useProfile');
jest.mock('@/hooks/usePermissions');
jest.mock('@/hooks/useAnalytics');

describe('ProfilePreview', () => {
  const mockProfile = {
    id: 'profile-1',
    orgId: 'org-1',
    name: 'John Doe',
    orgName: 'Test University',
    title: 'Professor',
    location: 'New York',
    status: 'draft',
  };

  const mockTrackEvent = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useAnalytics as jest.Mock).mockReturnValue({ trackEvent: mockTrackEvent });
  });

  const renderComponent = (profileId = 'profile-1') => {
    return render(
      <MemoryRouter initialEntries={[`/preview/${profileId}`]}>
        <Routes>
          <Route path="/preview/:profileId" element={<ProfilePreview />} />
        </Routes>
      </MemoryRouter>
    );
  };

  it('shows loading state while checking permissions and loading profile', () => {
    (useProfile as jest.Mock).mockReturnValue({
      profile: null,
      loading: true,
      error: null,
    });

    (usePermissions as jest.Mock).mockReturnValue({
      isEditor: jest.fn().mockResolvedValue(true),
    });

    renderComponent();
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('shows error state when profile loading fails', async () => {
    (useProfile as jest.Mock).mockReturnValue({
      profile: null,
      loading: false,
      error: 'Failed to load profile',
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Failed to load profile')).toBeInTheDocument();
    });
  });

  it('shows access denied for users without edit permission', async () => {
    (useProfile as jest.Mock).mockReturnValue({
      profile: mockProfile,
      loading: false,
      error: null,
    });

    (usePermissions as jest.Mock).mockReturnValue({
      isEditor: jest.fn().mockResolvedValue(false),
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('You do not have permission to preview this profile')).toBeInTheDocument();
    });

    expect(mockTrackEvent).toHaveBeenCalledWith('profile_preview_unauthorized', {
      profileId: 'profile-1',
      orgId: 'org-1',
    });
  });

  it('shows profile preview for users with edit permission', async () => {
    (useProfile as jest.Mock).mockReturnValue({
      profile: mockProfile,
      loading: false,
      error: null,
    });

    (usePermissions as jest.Mock).mockReturnValue({
      isEditor: jest.fn().mockResolvedValue(true),
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Profile Preview')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Test University')).toBeInTheDocument();
      expect(screen.getByText('Professor')).toBeInTheDocument();
      expect(screen.getByText('New York')).toBeInTheDocument();
    });
  });

  it('navigates to edit page when return button is clicked', async () => {
    (useProfile as jest.Mock).mockReturnValue({
      profile: mockProfile,
      loading: false,
      error: null,
    });

    (usePermissions as jest.Mock).mockReturnValue({
      isEditor: jest.fn().mockResolvedValue(true),
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Return to Edit')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Return to Edit'));

    expect(mockTrackEvent).toHaveBeenCalledWith('profile_preview_return_to_edit', {
      profileId: 'profile-1',
    });
  });

  it('shows error state when permission check fails', async () => {
    (useProfile as jest.Mock).mockReturnValue({
      profile: mockProfile,
      loading: false,
      error: null,
    });

    (usePermissions as jest.Mock).mockReturnValue({
      isEditor: jest.fn().mockRejectedValue(new Error('Permission check failed')),
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Failed to check permissions')).toBeInTheDocument();
    });

    expect(mockTrackEvent).toHaveBeenCalledWith('profile_preview_permission_error', {
      profileId: 'profile-1',
      error: 'Permission check failed',
    });
  });
}); 