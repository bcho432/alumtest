import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { EventForm } from '../EventForm';
import { LifeEvent } from '@/types/profile';

describe('EventForm', () => {
  const mockOnSubmit = jest.fn();
  const mockOnCancel = jest.fn();
  const mockInitialData: LifeEvent = {
    id: '1',
    type: 'education',
    title: 'Bachelor Degree',
    startDate: '2018-09-01',
    endDate: '2022-06-30',
    description: 'Computer Science',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders form with initial data', () => {
    render(
      <EventForm
        initialData={mockInitialData}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByLabelText(/title/i)).toHaveValue('Bachelor Degree');
    expect(screen.getByLabelText(/description/i)).toHaveValue('Computer Science');
    expect(screen.getByLabelText(/start date/i)).toHaveValue('2018-09-01');
    expect(screen.getByLabelText(/end date/i)).toHaveValue('2022-06-30');
  });

  it('renders empty form when no initial data is provided', () => {
    render(
      <EventForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByLabelText(/title/i)).toHaveValue('');
    expect(screen.getByLabelText(/description/i)).toHaveValue('');
    expect(screen.getByLabelText(/start date/i)).toHaveValue('');
    expect(screen.getByLabelText(/end date/i)).toHaveValue('');
  });

  it('validates required fields', async () => {
    render(
      <EventForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => {
      expect(screen.getByText(/title is required/i)).toBeInTheDocument();
      expect(screen.getByText(/start date is required/i)).toBeInTheDocument();
    });

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('validates that end date must be after start date', async () => {
    render(
      <EventForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    fireEvent.change(screen.getByLabelText(/title/i), {
      target: { value: 'Test Event' },
    });
    fireEvent.change(screen.getByLabelText(/start date/i), {
      target: { value: '2022-01-01' },
    });
    fireEvent.change(screen.getByLabelText(/end date/i), {
      target: { value: '2021-12-31' },
    });

    fireEvent.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => {
      expect(screen.getByText(/end date must be after start date/i)).toBeInTheDocument();
    });

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('calls onSubmit with form data when valid', async () => {
    render(
      <EventForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    fireEvent.change(screen.getByLabelText(/title/i), {
      target: { value: 'Test Event' },
    });
    fireEvent.change(screen.getByLabelText(/description/i), {
      target: { value: 'Test Description' },
    });
    fireEvent.change(screen.getByLabelText(/start date/i), {
      target: { value: '2022-01-01' },
    });
    fireEvent.change(screen.getByLabelText(/end date/i), {
      target: { value: '2022-12-31' },
    });

    fireEvent.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        type: 'education',
        title: 'Test Event',
        description: 'Test Description',
        startDate: '2022-01-01',
        endDate: '2022-12-31',
      });
    });
  });

  it('calls onCancel when cancel button is clicked', () => {
    render(
      <EventForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));

    expect(mockOnCancel).toHaveBeenCalled();
  });
}); 