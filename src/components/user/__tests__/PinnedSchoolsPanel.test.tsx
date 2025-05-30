import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PinnedSchoolsPanel from '../PinnedSchoolsPanel';
import { usePinnedSchools } from '@/hooks/usePinnedSchools';

// Mock the usePinnedSchools hook
jest.mock('@/hooks/usePinnedSchools');

const mockSchools = [
  {
    orgId: 'school-1',
    name: 'Test University 1',
    logoUrl: '/logo1.png',
    pinnedAt: '2024-01-01T00:00:00.000Z'
  },
  {
    orgId: 'school-2',
    name: 'Test University 2',
    logoUrl: '/logo2.png',
    pinnedAt: '2024-01-02T00:00:00.000Z'
  }
];

describe('PinnedSchoolsPanel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows loading state', () => {
    (usePinnedSchools as jest.Mock).mockReturnValue({
      schools: [],
      isLoading: true,
      error: null,
      unpinSchool: jest.fn()
    });

    render(<PinnedSchoolsPanel />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('shows error state', () => {
    (usePinnedSchools as jest.Mock).mockReturnValue({
      schools: [],
      isLoading: false,
      error: new Error('Failed to load schools'),
      unpinSchool: jest.fn()
    });

    render(<PinnedSchoolsPanel />);
    expect(screen.getByText(/error loading pinned schools/i)).toBeInTheDocument();
  });

  it('shows empty state', () => {
    (usePinnedSchools as jest.Mock).mockReturnValue({
      schools: [],
      isLoading: false,
      error: null,
      unpinSchool: jest.fn()
    });

    render(<PinnedSchoolsPanel />);
    expect(screen.getByText(/no pinned schools yet/i)).toBeInTheDocument();
  });

  it('renders list of pinned schools', () => {
    (usePinnedSchools as jest.Mock).mockReturnValue({
      schools: mockSchools,
      isLoading: false,
      error: null,
      unpinSchool: jest.fn()
    });

    render(<PinnedSchoolsPanel />);
    
    expect(screen.getByText('Test University 1')).toBeInTheDocument();
    expect(screen.getByText('Test University 2')).toBeInTheDocument();
  });

  it('handles unpin action', async () => {
    const mockUnpinSchool = jest.fn();
    (usePinnedSchools as jest.Mock).mockReturnValue({
      schools: mockSchools,
      isLoading: false,
      error: null,
      unpinSchool: mockUnpinSchool
    });

    render(<PinnedSchoolsPanel />);
    
    const unpinButtons = screen.getAllByText('Unpin');
    fireEvent.click(unpinButtons[0]);

    await waitFor(() => {
      expect(mockUnpinSchool).toHaveBeenCalledWith('school-1');
    });
  });

  it('shows loading state during unpin', async () => {
    const mockUnpinSchool = jest.fn().mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
    (usePinnedSchools as jest.Mock).mockReturnValue({
      schools: mockSchools,
      isLoading: false,
      error: null,
      unpinSchool: mockUnpinSchool
    });

    render(<PinnedSchoolsPanel />);
    
    const unpinButtons = screen.getAllByText('Unpin');
    fireEvent.click(unpinButtons[0]);

    expect(screen.getByText('Unpinning...')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.getByText('Unpin')).toBeInTheDocument();
    });
  });
}); 