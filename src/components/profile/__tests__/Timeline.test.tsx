import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Timeline } from '../Timeline';
import { TimelineService } from '@/services/TimelineService';
import { showToast } from '@/components/common/Toast';

// Mock the TimelineService
jest.mock('@/services/TimelineService');
jest.mock('@/components/common/Toast');

describe('Timeline', () => {
  const mockEntries = [
    {
      id: '1',
      type: 'education' as const,
      institution: 'Test University',
      degree: 'Bachelor of Science',
      startDate: new Date('2020-01-01'),
      endDate: new Date('2024-01-01'),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: '2',
      type: 'job' as const,
      title: 'Software Engineer',
      company: 'Test Company',
      startDate: new Date('2024-02-01'),
      endDate: new Date('2024-05-01'),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders timeline entries', () => {
    render(<Timeline entries={mockEntries} profileId="test-profile" />);

    expect(screen.getByText('Bachelor of Science at Test University')).toBeInTheDocument();
    expect(screen.getByText('Software Engineer at Test Company')).toBeInTheDocument();
  });

  it('shows empty state when no entries', () => {
    render(<Timeline entries={[]} profileId="test-profile" />);

    expect(screen.getByText('No timeline entries yet')).toBeInTheDocument();
  });

  it('shows delete button when isEditor is true', () => {
    render(<Timeline entries={mockEntries} profileId="test-profile" isEditor={true} />);

    const deleteButtons = screen.getAllByText('Delete');
    expect(deleteButtons).toHaveLength(2);
  });

  it('hides delete button when isEditor is false', () => {
    render(<Timeline entries={mockEntries} profileId="test-profile" isEditor={false} />);

    const deleteButtons = screen.queryAllByText('Delete');
    expect(deleteButtons).toHaveLength(0);
  });

  it('shows confirmation dialog when delete is clicked', () => {
    render(<Timeline entries={mockEntries} profileId="test-profile" isEditor={true} />);

    const deleteButton = screen.getAllByText('Delete')[0];
    fireEvent.click(deleteButton);

    expect(screen.getByText('Delete Entry')).toBeInTheDocument();
    expect(screen.getByText('Are you sure you want to delete this entry? This action cannot be undone.')).toBeInTheDocument();
  });

  it('calls onEntryDeleted when deletion is confirmed', async () => {
    const mockOnEntryDeleted = jest.fn();
    const mockDeleteTimelineEvent = jest.fn().mockResolvedValue(undefined);
    (TimelineService as jest.Mock).mockImplementation(() => ({
      deleteTimelineEvent: mockDeleteTimelineEvent,
    }));

    render(
      <Timeline
        entries={mockEntries}
        profileId="test-profile"
        isEditor={true}
        onEntryDeleted={mockOnEntryDeleted}
      />
    );

    const deleteButton = screen.getAllByText('Delete')[0];
    fireEvent.click(deleteButton);

    const confirmButton = screen.getByText('Delete');
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(mockDeleteTimelineEvent).toHaveBeenCalledWith('test-profile', '1');
      expect(mockOnEntryDeleted).toHaveBeenCalledWith('1');
      expect(showToast).toHaveBeenCalledWith({
        message: 'Entry deleted successfully',
        type: 'success',
        position: 'bottom-left',
      });
    });
  });

  it('shows error toast when deletion fails', async () => {
    const mockDeleteTimelineEvent = jest.fn().mockRejectedValue(new Error('Delete failed'));
    (TimelineService as jest.Mock).mockImplementation(() => ({
      deleteTimelineEvent: mockDeleteTimelineEvent,
    }));

    render(
      <Timeline
        entries={mockEntries}
        profileId="test-profile"
        isEditor={true}
      />
    );

    const deleteButton = screen.getAllByText('Delete')[0];
    fireEvent.click(deleteButton);

    const confirmButton = screen.getByText('Delete');
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(showToast).toHaveBeenCalledWith({
        message: 'Failed to delete entry. Please try again.',
        type: 'error',
        position: 'bottom-left',
      });
    });
  });
}); 