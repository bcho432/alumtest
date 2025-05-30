import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LoginPage } from '../LoginPage';
import { useAuth } from '@/hooks/useAuth';
import { useUserRoles } from '@/hooks/useUserRoles';
import { useRouter } from 'next/router';

// Mock the hooks and router
jest.mock('@/hooks/useAuth');
jest.mock('@/hooks/useUserRoles');
jest.mock('next/router', () => ({
  useRouter: jest.fn()
}));

describe('LoginPage', () => {
  const mockRouter = {
    push: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
  });

  it('renders login form', () => {
    (useAuth as jest.Mock).mockReturnValue({
      signInWithEmailAndPassword: jest.fn()
    });
    (useUserRoles as jest.Mock).mockReturnValue({
      universityAdminFor: [],
      editableProfiles: [],
      isLoading: false
    });

    render(<LoginPage />);
    
    expect(screen.getByPlaceholderText('Email address')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('handles successful login and redirects to admin dashboard', async () => {
    const mockSignIn = jest.fn().mockResolvedValue(undefined);
    (useAuth as jest.Mock).mockReturnValue({
      signInWithEmailAndPassword: mockSignIn
    });
    (useUserRoles as jest.Mock).mockReturnValue({
      universityAdminFor: [{ id: 'univ-1', name: 'Test University' }],
      editableProfiles: [],
      isLoading: false
    });

    render(<LoginPage />);
    
    fireEvent.change(screen.getByPlaceholderText('Email address'), {
      target: { value: 'test@example.com' }
    });
    fireEvent.change(screen.getByPlaceholderText('Password'), {
      target: { value: 'password123' }
    });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith('test@example.com', 'password123');
      expect(mockRouter.push).toHaveBeenCalledWith('/admin/universities/univ-1');
    });
  });

  it('handles successful login and redirects to editor dashboard', async () => {
    const mockSignIn = jest.fn().mockResolvedValue(undefined);
    (useAuth as jest.Mock).mockReturnValue({
      signInWithEmailAndPassword: mockSignIn
    });
    (useUserRoles as jest.Mock).mockReturnValue({
      universityAdminFor: [],
      editableProfiles: ['univ-1'],
      isLoading: false
    });

    render(<LoginPage />);
    
    fireEvent.change(screen.getByPlaceholderText('Email address'), {
      target: { value: 'test@example.com' }
    });
    fireEvent.change(screen.getByPlaceholderText('Password'), {
      target: { value: 'password123' }
    });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith('test@example.com', 'password123');
      expect(mockRouter.push).toHaveBeenCalledWith('/dashboard/profiles');
    });
  });

  it('handles successful login and redirects to home', async () => {
    const mockSignIn = jest.fn().mockResolvedValue(undefined);
    (useAuth as jest.Mock).mockReturnValue({
      signInWithEmailAndPassword: mockSignIn
    });
    (useUserRoles as jest.Mock).mockReturnValue({
      universityAdminFor: [],
      editableProfiles: [],
      isLoading: false
    });

    render(<LoginPage />);
    
    fireEvent.change(screen.getByPlaceholderText('Email address'), {
      target: { value: 'test@example.com' }
    });
    fireEvent.change(screen.getByPlaceholderText('Password'), {
      target: { value: 'password123' }
    });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith('test@example.com', 'password123');
      expect(mockRouter.push).toHaveBeenCalledWith('/home');
    });
  });

  it('handles login error', async () => {
    const mockSignIn = jest.fn().mockRejectedValue(new Error('Invalid credentials'));
    (useAuth as jest.Mock).mockReturnValue({
      signInWithEmailAndPassword: mockSignIn
    });
    (useUserRoles as jest.Mock).mockReturnValue({
      universityAdminFor: [],
      editableProfiles: [],
      isLoading: false
    });

    render(<LoginPage />);
    
    fireEvent.change(screen.getByPlaceholderText('Email address'), {
      target: { value: 'test@example.com' }
    });
    fireEvent.change(screen.getByPlaceholderText('Password'), {
      target: { value: 'wrong-password' }
    });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText('Invalid email or password')).toBeInTheDocument();
    });
  });
}); 