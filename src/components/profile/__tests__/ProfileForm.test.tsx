import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ProfileForm } from '../ProfileForm';
import { useUnsavedChanges } from '../../../hooks/useUnsavedChanges';

// Mock hooks
jest.mock('../../../hooks/useUnsavedChanges');
jest.mock('../../../hooks/useFormState');

describe('ProfileForm', () => {
  const mockInitialData = {
    name: 'John Doe',
    bio: 'Software Engineer',
    location: 'San Francisco',
  };

  const mockOnSave = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  it('renders form with initial data', () => {
    render(<ProfileForm initialData={mockInitialData} onSave={mockOnSave} />);

    expect(screen.getByLabelText(/name/i)).toHaveValue(mockInitialData.name);
    expect(screen.getByLabelText(/bio/i)).toHaveValue(mockInitialData.bio);
    expect(screen.getByLabelText(/location/i)).toHaveValue(mockInitialData.location);
  });

  it('shows character count for name field', () => {
    render(<ProfileForm initialData={mockInitialData} onSave={mockOnSave} />);
    
    expect(screen.getByText(`${mockInitialData.name.length}/100`)).toBeInTheDocument();
  });

  it('updates character count when name changes', () => {
    render(<ProfileForm initialData={mockInitialData} onSave={mockOnSave} />);
    
    const nameInput = screen.getByLabelText(/name/i);
    fireEvent.change(nameInput, { target: { value: 'Jane' } });
    
    expect(screen.getByText('4/100')).toBeInTheDocument();
  });

  it('shows validation error when name exceeds 100 characters', async () => {
    render(<ProfileForm initialData={mockInitialData} onSave={mockOnSave} />);
    
    const nameInput = screen.getByLabelText(/name/i);
    const longName = 'a'.repeat(101);
    fireEvent.change(nameInput, { target: { value: longName } });
    
    const submitButton = screen.getByRole('button', { name: /save changes/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Name must be 100 characters or less')).toBeInTheDocument();
    });
  });

  it('disables save button when validation error exists', async () => {
    render(<ProfileForm initialData={mockInitialData} onSave={mockOnSave} />);
    
    const nameInput = screen.getByLabelText(/name/i);
    const longName = 'a'.repeat(101);
    fireEvent.change(nameInput, { target: { value: longName } });
    
    const submitButton = screen.getByRole('button', { name: /save changes/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(submitButton).toBeDisabled();
    });
  });

  it('clears validation error when user starts typing again', async () => {
    render(<ProfileForm initialData={mockInitialData} onSave={mockOnSave} />);
    
    const nameInput = screen.getByLabelText(/name/i);
    const longName = 'a'.repeat(101);
    fireEvent.change(nameInput, { target: { value: longName } });
    
    const submitButton = screen.getByRole('button', { name: /save changes/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Name must be 100 characters or less')).toBeInTheDocument();
    });
    
    fireEvent.change(nameInput, { target: { value: 'Valid Name' } });
    
    await waitFor(() => {
      expect(screen.queryByText('Name must be 100 characters or less')).not.toBeInTheDocument();
    });
  });

  it('handles form submission', async () => {
    render(<ProfileForm initialData={mockInitialData} onSave={mockOnSave} />);

    const nameInput = screen.getByLabelText(/name/i);
    fireEvent.change(nameInput, { target: { value: 'Jane Doe' } });

    const submitButton = screen.getByRole('button', { name: /save changes/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith({
        ...mockInitialData,
        name: 'Jane Doe',
      });
    });
  });

  it('shows unsaved changes dialog when canceling with changes', () => {
    render(<ProfileForm initialData={mockInitialData} onSave={mockOnSave} />);

    const nameInput = screen.getByLabelText(/name/i);
    fireEvent.change(nameInput, { target: { value: 'Jane Doe' } });

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelButton);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/unsaved changes/i)).toBeInTheDocument();
  });

  it('handles save from dialog', async () => {
    render(<ProfileForm initialData={mockInitialData} onSave={mockOnSave} />);

    const nameInput = screen.getByLabelText(/name/i);
    fireEvent.change(nameInput, { target: { value: 'Jane Doe' } });

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelButton);

    const saveButton = screen.getByRole('button', { name: /save changes/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith({
        ...mockInitialData,
        name: 'Jane Doe',
      });
    });
  });

  it('handles discard from dialog', () => {
    render(<ProfileForm initialData={mockInitialData} onSave={mockOnSave} />);

    const nameInput = screen.getByLabelText(/name/i);
    fireEvent.change(nameInput, { target: { value: 'Jane Doe' } });

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelButton);

    const discardButton = screen.getByRole('button', { name: /discard changes/i });
    fireEvent.click(discardButton);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(nameInput).toHaveValue(mockInitialData.name);
  });

  it('displays error message when save fails', async () => {
    const error = new Error('Save failed');
    mockOnSave.mockRejectedValueOnce(error);

    render(<ProfileForm initialData={mockInitialData} onSave={mockOnSave} />);

    const nameInput = screen.getByLabelText(/name/i);
    fireEvent.change(nameInput, { target: { value: 'Jane Doe' } });

    const submitButton = screen.getByRole('button', { name: /save changes/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Save failed')).toBeInTheDocument();
    });
  });

  it('disables buttons while saving', async () => {
    mockOnSave.mockImplementationOnce(() => new Promise(resolve => setTimeout(resolve, 100)));

    render(<ProfileForm initialData={mockInitialData} onSave={mockOnSave} />);

    const nameInput = screen.getByLabelText(/name/i);
    fireEvent.change(nameInput, { target: { value: 'Jane Doe' } });

    const submitButton = screen.getByRole('button', { name: /save changes/i });
    fireEvent.click(submitButton);

    expect(submitButton).toBeDisabled();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeDisabled();
    expect(screen.getByText('Saving...')).toBeInTheDocument();
  });

  it('handles unsaved changes warning on navigation', () => {
    const mockOnDiscard = jest.fn();
    (useUnsavedChanges as jest.Mock).mockReturnValue({ isDirty: true });

    render(<ProfileForm initialData={mockInitialData} onSave={mockOnSave} />);

    const nameInput = screen.getByLabelText(/name/i);
    fireEvent.change(nameInput, { target: { value: 'Jane Doe' } });

    // Simulate navigation attempt
    window.dispatchEvent(new Event('beforeunload'));

    expect(window.onbeforeunload).toBeTruthy();
  });
}); 