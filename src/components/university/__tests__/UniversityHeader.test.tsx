import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { UniversityHeader } from '../UniversityHeader';
import { useAuth } from '@/hooks/useAuth';
import { pinnedSchoolsService } from '@/services/pinnedSchools';

// Mock the hooks and services
jest.mock('@/hooks/useAuth');
jest.mock('@/services/pinnedSchools');

const mockUniversity = {
  id: 'test-university',
  name: 'Test University',
  logoUrl: '/logo.png',
  description: 'Test description',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z'
};

describe('UniversityHeader', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders university information', () => {
    (useAuth as jest.Mock).mockReturnValue({ user: { uid: 'test-user' } });

    render(<UniversityHeader university={mockUniversity} />);
    
    expect(screen.getByText('Test University')).toBeInTheDocument();
    expect(screen.getByAltText('Test University logo')).toBeInTheDocument();
  });

  it('shows pin button for authenticated users', () => {
    (useAuth as jest.Mock).mockReturnValue({ user: { uid: 'test-user' } });

    render(<UniversityHeader university={mockUniversity} />);
    
    expect(screen.getByRole('button', { name: 'Pin this school' })).toBeInTheDocument();
  });

  it('does not show pin button for unauthenticated users', () => {
    (useAuth as jest.Mock).mockReturnValue({ user: null });

    render(<UniversityHeader university={mockUniversity} />);
    
    expect(screen.queryByRole('button', { name: 'Pin this school' })).not.toBeInTheDocument();
  });

  it('handles pin action', async () => {
    const mockUser = { uid: 'test-user' };
    (useAuth as jest.Mock).mockReturnValue({ user: mockUser });
    (pinnedSchoolsService.pinSchool as jest.Mock).mockResolvedValue(undefined);

    render(<UniversityHeader university={mockUniversity} />);
    
    const pinButton = screen.getByRole('button', { name: 'Pin this school' });
    fireEvent.click(pinButton);

    expect(screen.getByRole('button', { name: 'Pinning...' })).toBeInTheDocument();
    
    await waitFor(() => {
      expect(pinnedSchoolsService.pinSchool).toHaveBeenCalledWith(
        mockUser.uid,
        {
          orgId: mockUniversity.id,
          name: mockUniversity.name,
          logoUrl: mockUniversity.logoUrl
        }
      );
    });
  });

  it('handles pin error', async () => {
    const mockUser = { uid: 'test-user' };
    (useAuth as jest.Mock).mockReturnValue({ user: mockUser });
    (pinnedSchoolsService.pinSchool as jest.Mock).mockRejectedValue(new Error('Failed to pin'));

    render(<UniversityHeader university={mockUniversity} />);
    
    const pinButton = screen.getByRole('button', { name: 'Pin this school' });
    fireEvent.click(pinButton);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Pin this school' })).toBeInTheDocument();
    });
  });
}); 