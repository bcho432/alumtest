import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { UnsavedChangesDialog } from '../UnsavedChangesDialog';

describe('UnsavedChangesDialog', () => {
  const mockOnClose = jest.fn();
  const mockOnDiscard = jest.fn();
  const mockOnSave = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders nothing when not open', () => {
    const { container } = render(
      <UnsavedChangesDialog
        isOpen={false}
        onClose={mockOnClose}
        onDiscard={mockOnDiscard}
        onSave={mockOnSave}
      />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('displays dialog when open', () => {
    render(
      <UnsavedChangesDialog
        isOpen={true}
        onClose={mockOnClose}
        onDiscard={mockOnDiscard}
        onSave={mockOnSave}
      />
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Unsaved Changes')).toBeInTheDocument();
    expect(screen.getByText(/You have unsaved changes/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Discard Changes/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Save Changes/i })).toBeInTheDocument();
  });

  it('calls onDiscard when discard button is clicked', () => {
    render(
      <UnsavedChangesDialog
        isOpen={true}
        onClose={mockOnClose}
        onDiscard={mockOnDiscard}
        onSave={mockOnSave}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /Discard Changes/i }));
    expect(mockOnDiscard).toHaveBeenCalled();
  });

  it('calls onSave and onClose when save is successful', async () => {
    mockOnSave.mockResolvedValueOnce(undefined);
    
    render(
      <UnsavedChangesDialog
        isOpen={true}
        onClose={mockOnClose}
        onDiscard={mockOnDiscard}
        onSave={mockOnSave}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /Save Changes/i }));
    
    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalled();
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it('handles save errors without closing dialog', async () => {
    const error = new Error('Save failed');
    mockOnSave.mockRejectedValueOnce(error);
    
    render(
      <UnsavedChangesDialog
        isOpen={true}
        onClose={mockOnClose}
        onDiscard={mockOnDiscard}
        onSave={mockOnSave}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /Save Changes/i }));
    
    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalled();
      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });

  it('displays error message when provided', () => {
    const errorMessage = 'Failed to save changes';
    render(
      <UnsavedChangesDialog
        isOpen={true}
        onClose={mockOnClose}
        onDiscard={mockOnDiscard}
        onSave={mockOnSave}
        error={errorMessage}
      />
    );

    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  it('shows loading state when saving', () => {
    render(
      <UnsavedChangesDialog
        isOpen={true}
        onClose={mockOnClose}
        onDiscard={mockOnDiscard}
        onSave={mockOnSave}
        isSaving={true}
      />
    );

    expect(screen.getByText('Saving...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Save Changes/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /Discard Changes/i })).toBeDisabled();
  });

  it('closes dialog when clicking outside', () => {
    render(
      <UnsavedChangesDialog
        isOpen={true}
        onClose={mockOnClose}
        onDiscard={mockOnDiscard}
        onSave={mockOnSave}
      />
    );

    fireEvent.click(screen.getByRole('presentation'));
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('closes dialog when pressing escape key', () => {
    render(
      <UnsavedChangesDialog
        isOpen={true}
        onClose={mockOnClose}
        onDiscard={mockOnDiscard}
        onSave={mockOnSave}
      />
    );

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('maintains focus within dialog', () => {
    render(
      <UnsavedChangesDialog
        isOpen={true}
        onClose={mockOnClose}
        onDiscard={mockOnDiscard}
        onSave={mockOnSave}
      />
    );

    const saveButton = screen.getByRole('button', { name: /Save Changes/i });
    const discardButton = screen.getByRole('button', { name: /Discard Changes/i });

    // Focus should start on save button
    expect(document.activeElement).toBe(saveButton);

    // Tab should move focus to discard button
    fireEvent.keyDown(saveButton, { key: 'Tab' });
    expect(document.activeElement).toBe(discardButton);

    // Tab should wrap back to save button
    fireEvent.keyDown(discardButton, { key: 'Tab' });
    expect(document.activeElement).toBe(saveButton);

    // Shift+Tab should move focus back to discard button
    fireEvent.keyDown(saveButton, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(discardButton);
  });
}); 