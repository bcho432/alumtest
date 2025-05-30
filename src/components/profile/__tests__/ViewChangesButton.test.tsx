import { render, screen, fireEvent } from '@testing-library/react';
import { ViewChangesButton } from '../ViewChangesButton';
import { usePermissions } from '@/hooks/usePermissions';

// Mock the usePermissions hook
jest.mock('@/hooks/usePermissions', () => ({
  usePermissions: jest.fn(),
}));

// Mock the ProfileDiffViewer component
jest.mock('../ProfileDiffViewer', () => ({
  ProfileDiffViewer: () => <div data-testid="profile-diff-viewer">Profile Diff Viewer</div>,
}));

describe('ViewChangesButton', () => {
  const mockProfileId = 'test-profile-id';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should not render when user is not an admin', () => {
    (usePermissions as jest.Mock).mockReturnValue({
      isAdmin: false,
      isLoading: false,
    });

    const { container } = render(<ViewChangesButton profileId={mockProfileId} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('should not render while permissions are loading', () => {
    (usePermissions as jest.Mock).mockReturnValue({
      isAdmin: true,
      isLoading: true,
    });

    const { container } = render(<ViewChangesButton profileId={mockProfileId} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('should render button when user is admin', () => {
    (usePermissions as jest.Mock).mockReturnValue({
      isAdmin: true,
      isLoading: false,
    });

    render(<ViewChangesButton profileId={mockProfileId} />);
    expect(screen.getByText('View Changes')).toBeInTheDocument();
  });

  it('should open modal when button is clicked', () => {
    (usePermissions as jest.Mock).mockReturnValue({
      isAdmin: true,
      isLoading: false,
    });

    render(<ViewChangesButton profileId={mockProfileId} />);
    
    // Click the button
    fireEvent.click(screen.getByText('View Changes'));

    // Check if modal is opened
    expect(screen.getByText('Profile Changes')).toBeInTheDocument();
    expect(screen.getByTestId('profile-diff-viewer')).toBeInTheDocument();
  });

  it('should close modal when close button is clicked', () => {
    (usePermissions as jest.Mock).mockReturnValue({
      isAdmin: true,
      isLoading: false,
    });

    render(<ViewChangesButton profileId={mockProfileId} />);
    
    // Open modal
    fireEvent.click(screen.getByText('View Changes'));
    
    // Close modal
    fireEvent.click(screen.getByText('Close'));

    // Check if modal is closed
    expect(screen.queryByText('Profile Changes')).not.toBeInTheDocument();
    expect(screen.queryByTestId('profile-diff-viewer')).not.toBeInTheDocument();
  });

  it('should apply custom className to button', () => {
    (usePermissions as jest.Mock).mockReturnValue({
      isAdmin: true,
      isLoading: false,
    });

    const customClass = 'custom-class';
    render(<ViewChangesButton profileId={mockProfileId} className={customClass} />);
    
    const button = screen.getByText('View Changes');
    expect(button).toHaveClass(customClass);
  });
}); 