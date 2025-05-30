import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { EventCard } from '../EventCard';
import { LifeEvent } from '../../../../../types/profile';

describe('EventCard', () => {
  const mockEvent: LifeEvent = {
    id: '1',
    type: 'education',
    title: 'Bachelor Degree',
    description: 'Computer Science',
    startDate: '2018-08-01',
    endDate: '2022-06-30',
    location: 'University of Technology',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockOnEdit = jest.fn();
  const mockOnDelete = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders event details correctly', () => {
    render(<EventCard event={mockEvent} onEdit={mockOnEdit} onDelete={mockOnDelete} />);

    expect(screen.getByText('Bachelor Degree')).toBeInTheDocument();
    expect(screen.getByText('Computer Science')).toBeInTheDocument();
    expect(screen.getByText('University of Technology')).toBeInTheDocument();
    expect(screen.getByText('Aug 2018 - Jun 2022')).toBeInTheDocument();
  });

  it('calls onEdit when edit button is clicked', () => {
    render(<EventCard event={mockEvent} onEdit={mockOnEdit} onDelete={mockOnDelete} />);

    fireEvent.click(screen.getByText('Edit'));
    expect(mockOnEdit).toHaveBeenCalledWith(mockEvent);
  });

  it('calls onDelete when delete button is clicked', () => {
    render(<EventCard event={mockEvent} onEdit={mockOnEdit} onDelete={mockOnDelete} />);

    fireEvent.click(screen.getByText('Delete'));
    expect(mockOnDelete).toHaveBeenCalledWith(mockEvent.id);
  });

  it('renders event with only start date when end date is not provided', () => {
    const eventWithoutEndDate: LifeEvent = {
      ...mockEvent,
      endDate: undefined,
    };

    render(<EventCard event={eventWithoutEndDate} onEdit={mockOnEdit} onDelete={mockOnDelete} />);

    expect(screen.getByText('Aug 2018 - Present')).toBeInTheDocument();
  });
}); 