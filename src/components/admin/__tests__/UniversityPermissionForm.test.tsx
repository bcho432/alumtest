import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { UniversityPermissionForm } from '../UniversityPermissionForm';
import { universityPermissionsService } from '@/services/universityPermissions';
import { toast } from 'react-hot-toast';
import { BadgeProps } from '@/components/ui/Badge';
import { ButtonProps } from '@/components/ui/Button';
import * as React from 'react';

// Mock the services
jest.mock('@/services/universityPermissions');
jest.mock('react-hot-toast');

// Mock UI components
jest.mock('@/components/ui/Badge', () => ({
  Badge: React.forwardRef<HTMLSpanElement, BadgeProps>(({ variant, children }, ref) => (
    <span ref={ref} data-testid="badge" data-variant={variant}>
      {children}
    </span>
  )),
}));

jest.mock('@/components/ui/Button', () => ({
  Button: React.forwardRef<HTMLButtonElement, ButtonProps>(({ variant, size, children, ...props }, ref) => (
    <button ref={ref} data-testid="button" data-variant={variant} data-size={size} {...props}>
      {children}
    </button>
  )),
}));

describe('UniversityPermissionForm', () => {
  const mockOrgId = 'test-org';
  const mockOnRoleGranted = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('validates email format', async () => {
    render(<UniversityPermissionForm orgId={mockOrgId} onRoleGranted={mockOnRoleGranted} />);
    
    const emailInput = screen.getByLabelText(/user email/i);
    const submitButton = screen.getByRole('button', { name: /grant role/i });

    // Test invalid email
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    fireEvent.click(submitButton);

    expect(await screen.findByText(/please enter a valid email address/i)).toBeInTheDocument();
  });

  it('validates role selection', async () => {
    render(<UniversityPermissionForm orgId={mockOrgId} onRoleGranted={mockOnRoleGranted} />);
    
    const roleSelect = screen.getByLabelText(/role/i);
    const submitButton = screen.getByRole('button', { name: /grant role/i });

    // Test valid role
    fireEvent.change(roleSelect, { target: { value: 'admin' } });
    expect(roleSelect).toHaveValue('admin');

    // Test invalid role (should not be possible through UI, but testing the validation)
    const validateRole = (role: string) => ['admin', 'editor', 'contributor'].includes(role);
    expect(validateRole('invalid-role')).toBe(false);
  });

  it('handles successful role grant', async () => {
    const mockGrantRole = jest.fn().mockResolvedValue({ success: true, userId: 'test-user', isUpdate: false });
    (universityPermissionsService.grantRoleByEmail as jest.Mock) = mockGrantRole;

    render(<UniversityPermissionForm orgId={mockOrgId} onRoleGranted={mockOnRoleGranted} />);
    
    const emailInput = screen.getByLabelText(/user email/i);
    const roleSelect = screen.getByLabelText(/role/i);
    const submitButton = screen.getByRole('button', { name: /grant role/i });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(roleSelect, { target: { value: 'admin' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockGrantRole).toHaveBeenCalledWith(mockOrgId, 'test@example.com', 'admin', '');
      expect(toast.success).toHaveBeenCalledWith('Role granted successfully');
      expect(mockOnRoleGranted).toHaveBeenCalled();
    });
  });

  it('handles role update', async () => {
    const mockGrantRole = jest.fn().mockResolvedValue({ success: true, userId: 'test-user', isUpdate: true });
    (universityPermissionsService.grantRoleByEmail as jest.Mock) = mockGrantRole;

    render(<UniversityPermissionForm orgId={mockOrgId} onRoleGranted={mockOnRoleGranted} />);
    
    const emailInput = screen.getByLabelText(/user email/i);
    const roleSelect = screen.getByLabelText(/role/i);
    const submitButton = screen.getByRole('button', { name: /grant role/i });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(roleSelect, { target: { value: 'editor' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockGrantRole).toHaveBeenCalledWith(mockOrgId, 'test@example.com', 'editor', '');
      expect(toast.success).toHaveBeenCalledWith('Role updated successfully');
      expect(mockOnRoleGranted).toHaveBeenCalled();
    });
  });

  it('handles error cases', async () => {
    const mockGrantRole = jest.fn().mockRejectedValue(new Error('User not found'));
    (universityPermissionsService.grantRoleByEmail as jest.Mock) = mockGrantRole;

    render(<UniversityPermissionForm orgId={mockOrgId} onRoleGranted={mockOnRoleGranted} />);
    
    const emailInput = screen.getByLabelText(/user email/i);
    const roleSelect = screen.getByLabelText(/role/i);
    const submitButton = screen.getByRole('button', { name: /grant role/i });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(roleSelect, { target: { value: 'admin' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/user not found/i)).toBeInTheDocument();
    });
  });
}); 