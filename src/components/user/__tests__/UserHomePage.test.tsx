import { render, screen, waitFor } from '@testing-library/react';
import UserHomePage from '../UserHomePage';
import { useUserRoles } from '@/hooks/useUserRoles';

// Mock the useUserRoles hook
jest.mock('@/hooks/useUserRoles');

describe('UserHomePage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows loading spinner while fetching roles', () => {
    (useUserRoles as jest.Mock).mockReturnValue({
      universityAdminFor: [],
      isLoading: true,
      error: null
    });

    render(<UserHomePage />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('shows error message when role fetch fails', () => {
    (useUserRoles as jest.Mock).mockReturnValue({
      universityAdminFor: [],
      isLoading: false,
      error: new Error('Failed to fetch roles')
    });

    render(<UserHomePage />);
    expect(screen.getByText(/error loading user roles/i)).toBeInTheDocument();
  });

  it('shows dashboard link for admin users', async () => {
    (useUserRoles as jest.Mock).mockReturnValue({
      universityAdminFor: ['university-1'],
      isLoading: false,
      error: null
    });

    render(<UserHomePage />);
    
    await waitFor(() => {
      const dashboardLink = screen.getByText(/manage university dashboard/i);
      expect(dashboardLink).toBeInTheDocument();
      expect(dashboardLink).toHaveAttribute('href', '/admin/universities/university-1');
    });
  });

  it('does not show dashboard link for non-admin users', () => {
    (useUserRoles as jest.Mock).mockReturnValue({
      universityAdminFor: [],
      isLoading: false,
      error: null
    });

    render(<UserHomePage />);
    expect(screen.queryByText(/manage university dashboard/i)).not.toBeInTheDocument();
  });

  it('shows multiple dashboard links for multi-university admins', async () => {
    (useUserRoles as jest.Mock).mockReturnValue({
      universityAdminFor: ['university-1', 'university-2'],
      isLoading: false,
      error: null
    });

    render(<UserHomePage />);
    
    await waitFor(() => {
      const dashboardLinks = screen.getAllByText(/manage university dashboard/i);
      expect(dashboardLinks).toHaveLength(2);
      expect(dashboardLinks[0]).toHaveAttribute('href', '/admin/universities/university-1');
      expect(dashboardLinks[1]).toHaveAttribute('href', '/admin/universities/university-2');
    });
  });
}); 