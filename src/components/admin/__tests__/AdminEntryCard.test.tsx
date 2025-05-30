import { render, screen, fireEvent } from '@testing-library/react';
import { AdminEntryCard } from '../AdminEntryCard';
import { useUserRoles } from '@/hooks/useUserRoles';
import { useRouter } from 'next/router';
import { analyticsService } from '@/services/analytics';

// Mock dependencies
jest.mock('@/hooks/useUserRoles');
jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}));
jest.mock('@/services/analytics', () => ({
  analyticsService: {
    logEvent: jest.fn(),
  },
}));

describe('AdminEntryCard', () => {
  const mockRouter = {
    push: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
  });

  it('does not render when user is not an admin', () => {
    (useUserRoles as jest.Mock).mockReturnValue({
      universityAdminFor: [],
      isLoading: false,
    });

    const { container } = render(<AdminEntryCard />);
    expect(container).toBeEmptyDOMElement();
  });

  it('does not render while loading', () => {
    (useUserRoles as jest.Mock).mockReturnValue({
      universityAdminFor: [],
      isLoading: true,
    });

    const { container } = render(<AdminEntryCard />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders for admin users', () => {
    (useUserRoles as jest.Mock).mockReturnValue({
      universityAdminFor: [{ id: 'univ-1', name: 'Test University' }],
      isLoading: false,
    });

    render(<AdminEntryCard />);
    expect(screen.getByText('University Administration')).toBeInTheDocument();
    expect(screen.getByText('Go to Dashboard')).toBeInTheDocument();
  });

  it('handles dashboard click correctly', () => {
    (useUserRoles as jest.Mock).mockReturnValue({
      universityAdminFor: [{ id: 'univ-1', name: 'Test University' }],
      isLoading: false,
    });

    render(<AdminEntryCard />);
    fireEvent.click(screen.getByText('Go to Dashboard'));

    expect(mockRouter.push).toHaveBeenCalledWith('/admin/universities/univ-1');
    expect(analyticsService.logEvent).toHaveBeenCalledWith(
      'admin_dashboard_entry_click',
      { universityId: 'univ-1' }
    );
  });

  it('shows correct text for multiple universities', () => {
    (useUserRoles as jest.Mock).mockReturnValue({
      universityAdminFor: [
        { id: 'univ-1', name: 'Test University 1' },
        { id: 'univ-2', name: 'Test University 2' },
      ],
      isLoading: false,
    });

    render(<AdminEntryCard />);
    expect(screen.getByText(/You have administrative access to 2 universities/)).toBeInTheDocument();
  });
}); 