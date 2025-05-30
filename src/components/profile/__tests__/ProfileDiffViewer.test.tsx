import { render, screen, waitFor } from '@testing-library/react';
import { ProfileDiffViewer } from '../ProfileDiffViewer';
import { usePermissions } from '@/hooks/usePermissions';
import { doc, getDoc } from 'firebase/firestore';
import { Profile } from '@/types/profile';

jest.mock('firebase/firestore');

// Mock the usePermissions hook
jest.mock('@/hooks/usePermissions', () => ({
  usePermissions: jest.fn(),
}));

// Mock the DiffSection component
jest.mock('../DiffSection', () => ({
  DiffSection: ({ title }: { title: string }) => (
    <div data-testid={`diff-section-${title.toLowerCase().replace(/\s+/g, '-')}`}>
      {title}
    </div>
  ),
}));

describe('ProfileDiffViewer', () => {
  const mockProfileId = 'test-profile-id';
  const mockPublishedProfile: Profile = {
    id: '1',
    name: 'John Doe',
    createdBy: 'user1',
    privacy: 'public',
    invitedEmails: [],
    shareableUrl: 'https://example.com/profile/1',
    orgId: 'org1',
    createdAt: '2020-01-01',
    updatedAt: '2020-01-01',
    status: 'published',
    isPublic: true,
    isVerified: true,
    events: [
      {
        id: '1',
        type: 'education',
        title: 'Graduation',
        startDate: '2020-05-15',
        createdAt: new Date('2020-01-01'),
        updatedAt: new Date('2020-01-01'),
      },
    ],
    stories: [
      {
        id: '1',
        question: 'What was your favorite class?',
        answer: 'Computer Science',
        authorId: 'user1',
        createdAt: '2020-01-01',
      },
    ],
  };

  const mockDraftProfile: Profile = {
    ...mockPublishedProfile,
    name: 'John A. Doe',
    status: 'draft',
    events: [
      {
        id: '1',
        type: 'education',
        title: 'Graduation',
        startDate: '2020-05-15',
        createdAt: new Date('2020-01-01'),
        updatedAt: new Date('2020-01-01'),
      },
      {
        id: '2',
        type: 'job',
        title: 'First Job',
        startDate: '2020-06-01',
        createdAt: new Date('2020-01-01'),
        updatedAt: new Date('2020-01-01'),
      },
    ],
    stories: [
      {
        id: '1',
        question: 'What was your favorite class?',
        answer: 'Advanced Computer Science',
        authorId: 'user1',
        createdAt: '2020-01-01',
      },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (usePermissions as jest.Mock).mockReturnValue({
      isAdmin: true,
      isLoading: false,
    });
  });

  it('should not render when user is not an admin', () => {
    (usePermissions as jest.Mock).mockReturnValue({
      isAdmin: false,
      isLoading: false,
    });

    const { container } = render(<ProfileDiffViewer profileId={mockProfileId} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('should show loading state while fetching profiles', () => {
    (getDoc as jest.Mock).mockImplementation(() => new Promise(() => {}));

    render(<ProfileDiffViewer profileId={mockProfileId} />);
    expect(screen.getByText('Loading changes...')).toBeInTheDocument();
  });

  it('should show error state when profile fetch fails', async () => {
    (getDoc as jest.Mock).mockRejectedValue(new Error('Failed to fetch'));

    render(<ProfileDiffViewer profileId={mockProfileId} />);
    
    await waitFor(() => {
      expect(screen.getByText('Failed to load changes')).toBeInTheDocument();
    });
  });

  it('should show no changes message when profiles are identical', async () => {
    (getDoc as jest.Mock)
      .mockResolvedValueOnce({ data: () => mockPublishedProfile })
      .mockResolvedValueOnce({ data: () => mockPublishedProfile });

    render(<ProfileDiffViewer profileId={mockProfileId} />);
    
    await waitFor(() => {
      expect(screen.getByText('No changes detected')).toBeInTheDocument();
    });
  });

  it('should display diff sections when changes are detected', async () => {
    (getDoc as jest.Mock)
      .mockResolvedValueOnce({ data: () => mockPublishedProfile })
      .mockResolvedValueOnce({ data: () => mockDraftProfile });

    render(<ProfileDiffViewer profileId={mockProfileId} />);
    
    await waitFor(() => {
      expect(screen.getByTestId('diff-section-profile-information')).toBeInTheDocument();
      expect(screen.getByTestId('diff-section-story-answers')).toBeInTheDocument();
    });
  });

  it('should handle missing published version', async () => {
    (getDoc as jest.Mock)
      .mockResolvedValueOnce({ data: () => null })
      .mockResolvedValueOnce({ data: () => mockDraftProfile });

    render(<ProfileDiffViewer profileId={mockProfileId} />);
    
    await waitFor(() => {
      expect(screen.getByText('No published version found')).toBeInTheDocument();
    });
  });

  it('should handle missing draft version', async () => {
    (getDoc as jest.Mock)
      .mockResolvedValueOnce({ data: () => mockPublishedProfile })
      .mockResolvedValueOnce({ data: () => null });

    render(<ProfileDiffViewer profileId={mockProfileId} />);
    
    await waitFor(() => {
      expect(screen.getByText('No draft version found')).toBeInTheDocument();
    });
  });
}); 