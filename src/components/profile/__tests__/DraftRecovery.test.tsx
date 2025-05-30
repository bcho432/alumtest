import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DraftRecoveryPrompt } from '../DraftRecoveryPrompt';
import { useLocalDraftSync } from '@/hooks/useLocalDraftSync';
import { Profile, ProfileStatus } from '@/types/profile';

// Mock dependencies
jest.mock('@/hooks/useLocalDraftSync');

describe('Draft Recovery Flow', () => {
  const mockProfileId = 'test-profile';
  const mockRemoteProfile: Profile = {
    id: mockProfileId,
    name: 'Remote Profile',
    status: 'draft' as ProfileStatus,
    orgId: 'test-org',
    createdBy: 'test-user',
    editors: ['test-user'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const mockLocalDraft: Profile = {
    ...mockRemoteProfile,
    name: 'Local Changes',
    lastSaved: new Date(Date.now() + 1000).toISOString(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useLocalDraftSync as jest.Mock).mockReturnValue({
      localDraft: mockLocalDraft,
      mergeDrafts: (local: any, remote: any) => ({
        ...remote,
        name: local.name,
      }),
      clearLocalDraft: jest.fn(),
    });
  });

  it('should show recovery prompt when local draft exists', () => {
    render(
      <DraftRecoveryPrompt
        profileId={mockProfileId}
        remoteProfile={mockRemoteProfile}
        onRecover={jest.fn()}
        onDiscard={jest.fn()}
      />
    );

    expect(screen.getByText('Recover your previous draft?')).toBeInTheDocument();
    expect(screen.getByText(/We found unsaved changes/)).toBeInTheDocument();
  });

  it('should handle draft recovery', async () => {
    const onRecover = jest.fn();
    const onDiscard = jest.fn();

    render(
      <DraftRecoveryPrompt
        profileId={mockProfileId}
        remoteProfile={mockRemoteProfile}
        onRecover={onRecover}
        onDiscard={onDiscard}
      />
    );

    // Click recover button
    fireEvent.click(screen.getByText('Recover'));

    // Verify recovery callback
    await waitFor(() => {
      expect(onRecover).toHaveBeenCalledWith({
        ...mockRemoteProfile,
        name: 'Local Changes',
      });
    });

    // Verify prompt is closed
    expect(screen.queryByText('Recover your previous draft?')).not.toBeInTheDocument();
  });

  it('should handle draft discard', async () => {
    const onRecover = jest.fn();
    const onDiscard = jest.fn();

    render(
      <DraftRecoveryPrompt
        profileId={mockProfileId}
        remoteProfile={mockRemoteProfile}
        onRecover={onRecover}
        onDiscard={onDiscard}
      />
    );

    // Click discard button
    fireEvent.click(screen.getByText('Discard'));

    // Verify discard callback
    await waitFor(() => {
      expect(onDiscard).toHaveBeenCalled();
    });

    // Verify prompt is closed
    expect(screen.queryByText('Recover your previous draft?')).not.toBeInTheDocument();
  });

  it('should not show prompt when no local draft exists', () => {
    (useLocalDraftSync as jest.Mock).mockReturnValue({
      localDraft: null,
      mergeDrafts: jest.fn(),
      clearLocalDraft: jest.fn(),
    });

    render(
      <DraftRecoveryPrompt
        profileId={mockProfileId}
        remoteProfile={mockRemoteProfile}
        onRecover={jest.fn()}
        onDiscard={jest.fn()}
      />
    );

    expect(screen.queryByText('Recover your previous draft?')).not.toBeInTheDocument();
  });
}); 